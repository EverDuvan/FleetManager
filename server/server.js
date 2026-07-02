import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const csvPath = path.join(__dirname, '../public/data/schB - Consolidado.csv');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Simple CSV parser that handles quoted columns
function parseConsolidadoCSV(csvText) {
  const rawLines = csvText.split(/\r?\n/);
  const rows = rawLines.map(line => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  });

  // Find Section 1: Contracts/Terminals
  let contractsHeaderIndex = -1;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (row.length > 3 && row[0].toLowerCase() === 'terminal' && row[3].toLowerCase() === 'empresa') {
      contractsHeaderIndex = i;
      break;
    }
  }

  // Find Section 2: Vehicles
  let vehiclesHeaderIndex = -1;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (row.length > 2 && (row[1] || '').toLowerCase() === 'unit no.' && (row[2] || '').toLowerCase() === 'vehicle make') {
      vehiclesHeaderIndex = i;
      break;
    }
  }

  const contracts = [];
  if (contractsHeaderIndex !== -1) {
    let idx = contractsHeaderIndex + 1;
    while (idx < rows.length) {
      const row = rows[idx];
      if (idx === vehiclesHeaderIndex || !row || row.length === 0 || (row[0] === '' && row[1] === '' && row[2] === '' && row[3] === '')) {
        break;
      }
      if (row[0] || row[3]) {
        contracts.push({
          terminal: row[0] || 'N/A',
          ciudad: row[1] || 'Sin Ciudad',
          entityId: row[2] || 'N/A',
          empresa: row[3] || 'Sin Empresa',
          contractNumber: row[4] || 'N/A',
          cantidad: parseInt(row[5], 10) || 0,
          contratoViejo: row[6] || ''
        });
      }
      idx++;
    }
  }

  const vehicles = [];
  if (vehiclesHeaderIndex !== -1) {
    let idx = vehiclesHeaderIndex + 1;
    while (idx < rows.length) {
      const row = rows[idx];
      if (!row || row.length < 3 || (row[1] === '' && row[2] === '')) {
        idx++;
        continue;
      }
      
      const contractNum = row[8] || '';
      const entityId = row[9] || '';
      
      let empresa = 'No asociado';
      let terminal = 'N/A';
      
      if (contractNum && contractNum !== 'No encontrado') {
        const found = contracts.find(c => c.contractNumber === contractNum);
        if (found) {
          empresa = found.empresa;
          terminal = found.terminal;
        }
      }
      if (empresa === 'No asociado' && entityId && entityId !== 'No encontrado') {
        const found = contracts.find(c => c.entityId === entityId);
        if (found) {
          empresa = found.empresa;
          terminal = found.terminal;
        }
      }

      vehicles.push({
        unitNo: row[1] || 'N/A',
        make: row[2] || 'N/A',
        year: parseInt(row[3], 10) || null,
        bodyType: row[4] || 'N/A',
        vin: row[5] || 'N/A',
        tag: row[6] || 'N/A',
        city: row[7] || 'Sin Ciudad',
        contract: contractNum || 'No encontrado',
        entityId: entityId || 'No encontrado',
        empresa,
        terminal,
        status: 'Activo'
      });
      idx++;
    }
  }

  return {
    contractsRaw: contracts,
    vehiclesRaw: vehicles
  };
}

let db;

async function initDB() {
  db = await open({
    filename: path.join(__dirname, 'database.sqlite'),
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      username TEXT PRIMARY KEY,
      password TEXT NOT NULL,
      role TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS contracts (
      contractNumber TEXT PRIMARY KEY,
      terminal TEXT,
      ciudad TEXT,
      entityId TEXT,
      empresa TEXT,
      cantidad INTEGER,
      contratoViejo TEXT
    );

    CREATE TABLE IF NOT EXISTS vehicles (
      vin TEXT PRIMARY KEY,
      unitNo TEXT,
      make TEXT,
      year INTEGER,
      bodyType TEXT,
      tag TEXT,
      city TEXT,
      contract TEXT,
      entityId TEXT,
      empresa TEXT,
      terminal TEXT,
      status TEXT DEFAULT 'Activo'
    );

    CREATE TABLE IF NOT EXISTS movements (
      id TEXT PRIMARY KEY,
      timestamp TEXT,
      user TEXT,
      action TEXT,
      entityType TEXT,
      entityId TEXT,
      description TEXT,
      changes TEXT
    );
  `);

  // Seed default users if empty
  const userCount = await db.get('SELECT COUNT(*) as count FROM users');
  if (userCount.count === 0) {
    const DEFAULT_USERS = [
      { username: 'admin', password: 'admin123', role: 'admin' },
      { username: 'operator', password: 'operator123', role: 'operator' },
      { username: 'viewer', password: 'viewer123', role: 'viewer' }
    ];
    for (const u of DEFAULT_USERS) {
      await db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [u.username, u.password, u.role]);
    }
    console.log('Default users seeded.');
  }

  // Seed contracts and vehicles from CSV if database is empty
  const contractCount = await db.get('SELECT COUNT(*) as count FROM contracts');
  const vehicleCount = await db.get('SELECT COUNT(*) as count FROM vehicles');
  if (contractCount.count === 0 && vehicleCount.count === 0) {
    console.log('Database tables are empty. Loading data from CSV...');
    try {
      const csvText = await fs.readFile(csvPath, 'utf8');
      const parsed = parseConsolidadoCSV(csvText);

      // Seed contracts
      for (const c of parsed.contractsRaw) {
        await db.run(
          `INSERT OR IGNORE INTO contracts (contractNumber, terminal, ciudad, entityId, empresa, cantidad, contratoViejo)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [c.contractNumber, c.terminal, c.ciudad, c.entityId, c.empresa, c.cantidad, c.contratoViejo]
        );
      }

      // Seed vehicles
      for (const v of parsed.vehiclesRaw) {
        await db.run(
          `INSERT OR IGNORE INTO vehicles (vin, unitNo, make, year, bodyType, tag, city, contract, entityId, empresa, terminal, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [v.vin, v.unitNo, v.make, v.year, v.bodyType, v.tag, v.city, v.contract, v.entityId, v.empresa, v.terminal, v.status]
        );
      }
      console.log(`Seeded ${parsed.contractsRaw.length} contracts and ${parsed.vehiclesRaw.length} vehicles from CSV.`);
    } catch (err) {
      console.error('Failed to read or parse CSV:', err);
    }
  }
}

// REST API Endpoints

// BULK GET DATA
app.get('/api/data', async (req, res) => {
  try {
    const contractsRaw = await db.all('SELECT * FROM contracts');
    const vehiclesRaw = await db.all('SELECT * FROM vehicles');
    const users = await db.all('SELECT * FROM users');
    const movements = await db.all('SELECT * FROM movements ORDER BY timestamp DESC');
    res.json({ contractsRaw, vehiclesRaw, users, movements });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// VEHICLES CRUD
app.post('/api/vehicles', async (req, res) => {
  const { vin, unitNo, make, year, bodyType, tag, city, contract, entityId, empresa, terminal, status } = req.body;
  try {
    await db.run(
      `INSERT INTO vehicles (vin, unitNo, make, year, bodyType, tag, city, contract, entityId, empresa, terminal, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [vin, unitNo, make, year, bodyType, tag, city, contract, entityId, empresa, terminal, status || 'Activo']
    );
    const newVehicle = await db.get('SELECT * FROM vehicles WHERE vin = ?', [vin]);
    res.status(201).json(newVehicle);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/vehicles/:vin', async (req, res) => {
  const oldVin = req.params.vin;
  const { vin, unitNo, make, year, bodyType, tag, city, contract, entityId, empresa, terminal, status } = req.body;
  try {
    await db.run(
      `UPDATE vehicles SET vin = ?, unitNo = ?, make = ?, year = ?, bodyType = ?, tag = ?, city = ?, contract = ?, entityId = ?, empresa = ?, terminal = ?, status = ?
       WHERE vin = ?`,
      [vin, unitNo, make, year, bodyType, tag, city, contract, entityId, empresa, terminal, status, oldVin]
    );
    const updated = await db.get('SELECT * FROM vehicles WHERE vin = ?', [vin]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/vehicles/:vin', async (req, res) => {
  const vin = req.params.vin;
  const { status } = req.body;
  const newStatus = status || 'Fuera de servicio';
  try {
    await db.run('UPDATE vehicles SET status = ? WHERE vin = ?', [newStatus, vin]);
    const updated = await db.get('SELECT * FROM vehicles WHERE vin = ?', [vin]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CONTRACTS CRUD
app.post('/api/contracts', async (req, res) => {
  const { contractNumber, terminal, ciudad, entityId, empresa, cantidad, contratoViejo } = req.body;
  try {
    await db.run(
      `INSERT INTO contracts (contractNumber, terminal, ciudad, entityId, empresa, cantidad, contratoViejo)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [contractNumber, terminal, ciudad, entityId, empresa, cantidad, contratoViejo]
    );
    const newContract = await db.get('SELECT * FROM contracts WHERE contractNumber = ?', [contractNumber]);
    res.status(201).json(newContract);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/contracts/:contractNumber', async (req, res) => {
  const oldContractNumber = req.params.contractNumber;
  const { contractNumber, terminal, ciudad, entityId, empresa, cantidad, contratoViejo } = req.body;
  try {
    await db.run('BEGIN TRANSACTION');
    await db.run(
      `UPDATE contracts SET contractNumber = ?, terminal = ?, ciudad = ?, entityId = ?, empresa = ?, cantidad = ?, contratoViejo = ?
       WHERE contractNumber = ?`,
      [contractNumber, terminal, ciudad, entityId, empresa, cantidad, contratoViejo, oldContractNumber]
    );
    if (contractNumber !== oldContractNumber) {
      await db.run(
        `UPDATE vehicles SET contract = ? WHERE contract = ?`,
        [contractNumber, oldContractNumber]
      );
    }
    await db.run('COMMIT');
    const updated = await db.get('SELECT * FROM contracts WHERE contractNumber = ?', [contractNumber]);
    res.json(updated);
  } catch (err) {
    await db.run('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/contracts/:contractNumber', async (req, res) => {
  const contractNumber = req.params.contractNumber;
  try {
    await db.run('BEGIN TRANSACTION');
    await db.run('DELETE FROM contracts WHERE contractNumber = ?', [contractNumber]);
    await db.run(
      `UPDATE vehicles SET contract = 'No encontrado', entityId = 'No encontrado', empresa = 'No asociado', terminal = 'N/A'
       WHERE contract = ?`,
      [contractNumber]
    );
    await db.run('COMMIT');
    res.json({ message: `Contract ${contractNumber} deleted and associated vehicles unlinked.` });
  } catch (err) {
    await db.run('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

// COMPANIES CASCADING
app.put('/api/companies/:entityId', async (req, res) => {
  const entityId = req.params.entityId;
  const { newName } = req.body;
  try {
    await db.run('BEGIN TRANSACTION');
    await db.run(`UPDATE contracts SET empresa = ? WHERE entityId = ?`, [newName, entityId]);
    await db.run(`UPDATE vehicles SET empresa = ? WHERE entityId = ?`, [newName, entityId]);
    await db.run('COMMIT');
    res.json({ message: `Company entityId ${entityId} renamed to ${newName}.` });
  } catch (err) {
    await db.run('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/companies/:entityId', async (req, res) => {
  const entityId = req.params.entityId;
  try {
    await db.run('BEGIN TRANSACTION');
    const relatedContracts = await db.all('SELECT contractNumber FROM contracts WHERE entityId = ?', [entityId]);
    const contractNums = relatedContracts.map(c => c.contractNumber);

    await db.run('DELETE FROM contracts WHERE entityId = ?', [entityId]);
    await db.run(
      `UPDATE vehicles SET contract = 'No encontrado', entityId = 'No encontrado', empresa = 'No asociado', terminal = 'N/A'
       WHERE entityId = ?`,
      [entityId]
    );
    if (contractNums.length > 0) {
      const placeholders = contractNums.map(() => '?').join(',');
      await db.run(
        `UPDATE vehicles SET contract = 'No encontrado', entityId = 'No encontrado', empresa = 'No asociado', terminal = 'N/A'
         WHERE contract IN (${placeholders})`,
        contractNums
      );
    }
    await db.run('COMMIT');
    res.json({ message: `Company entityId ${entityId} and associated contracts/vehicles unlinked.` });
  } catch (err) {
    await db.run('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

// CITIES CASCADING
app.put('/api/cities/:name', async (req, res) => {
  const oldName = req.params.name;
  const { newName } = req.body;
  try {
    await db.run('BEGIN TRANSACTION');
    await db.run(`UPDATE contracts SET ciudad = ? WHERE LOWER(ciudad) = LOWER(?)`, [newName, oldName]);
    await db.run(`UPDATE vehicles SET city = ? WHERE LOWER(city) = LOWER(?)`, [newName, oldName]);
    await db.run('COMMIT');
    res.json({ message: `City "${oldName}" updated to "${newName}".` });
  } catch (err) {
    await db.run('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/cities/:name', async (req, res) => {
  const name = req.params.name;
  try {
    await db.run('BEGIN TRANSACTION');
    await db.run(`UPDATE contracts SET ciudad = 'Sin Ciudad' WHERE LOWER(ciudad) = LOWER(?)`, [name]);
    await db.run(`UPDATE vehicles SET city = 'Sin Ciudad' WHERE LOWER(city) = LOWER(?)`, [name]);
    await db.run('COMMIT');
    res.json({ message: `City "${name}" unlinked.` });
  } catch (err) {
    await db.run('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

// TERMINALS CASCADING
app.put('/api/terminals/:oldCode/:cityName', async (req, res) => {
  const { oldCode, cityName } = req.params;
  const { newCode } = req.body;
  try {
    await db.run('BEGIN TRANSACTION');
    await db.run(
      `UPDATE contracts SET terminal = ? WHERE terminal = ? AND LOWER(ciudad) = LOWER(?)`,
      [newCode, oldCode, cityName]
    );
    await db.run(
      `UPDATE vehicles SET terminal = ? WHERE terminal = ? AND LOWER(city) = LOWER(?)`,
      [newCode, oldCode, cityName]
    );
    await db.run('COMMIT');
    res.json({ message: `Terminal "${oldCode}" in "${cityName}" updated to "${newCode}".` });
  } catch (err) {
    await db.run('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/terminals/:terminalCode/:cityName', async (req, res) => {
  const { terminalCode, cityName } = req.params;
  try {
    await db.run('BEGIN TRANSACTION');
    await db.run(
      `DELETE FROM contracts WHERE terminal = ? AND LOWER(ciudad) = LOWER(?)`,
      [terminalCode, cityName]
    );
    await db.run(
      `UPDATE vehicles SET terminal = 'N/A' WHERE terminal = ? AND LOWER(city) = LOWER(?)`,
      [terminalCode, cityName]
    );
    await db.run('COMMIT');
    res.json({ message: `Terminal "${terminalCode}" in "${cityName}" deleted.` });
  } catch (err) {
    await db.run('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

// USERS CRUD
app.post('/api/users', async (req, res) => {
  const { username, password, role } = req.body;
  try {
    await db.run(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      [username, password, role]
    );
    const newUser = await db.get('SELECT * FROM users WHERE username = ?', [username]);
    res.status(201).json(newUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/:username', async (req, res) => {
  const oldUsername = req.params.username;
  const { username, password, role } = req.body;
  try {
    await db.run(
      'UPDATE users SET username = ?, password = ?, role = ? WHERE username = ?',
      [username, password, role, oldUsername]
    );
    const updatedUser = await db.get('SELECT * FROM users WHERE username = ?', [username]);
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/users/:username', async (req, res) => {
  const username = req.params.username;
  try {
    await db.run('DELETE FROM users WHERE username = ?', [username]);
    res.json({ message: `User ${username} deleted.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// MOVEMENTS / HISTORY
app.post('/api/movements', async (req, res) => {
  const { id, timestamp, user, action, entityType, entityId, description, changes } = req.body;
  try {
    await db.run(
      `INSERT INTO movements (id, timestamp, user, action, entityType, entityId, description, changes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, timestamp, user, action, entityType, entityId, description, typeof changes === 'string' ? changes : JSON.stringify(changes)]
    );
    const newMovement = await db.get('SELECT * FROM movements WHERE id = ?', [id]);
    res.status(201).json(newMovement);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/movements/clear', async (req, res) => {
  try {
    await db.run('DELETE FROM movements');
    res.json({ message: 'Audit history cleared.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start Express App
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
});
