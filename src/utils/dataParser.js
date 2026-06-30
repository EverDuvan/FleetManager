/**
 * Parser for the "schB - Consolidado.csv" file.
 * Automatically splits and processes the two main sections of the CSV:
 * 1. Contracts & Terminals
 * 2. Vehicles
 */

export function parseConsolidadoCSV(csvText) {
  // Split lines by newline and filter out completely empty lines
  const rawLines = csvText.split(/\r?\n/);
  
  // Parse rows (comma separated, accounting for potential quotes)
  const rows = rawLines.map(line => {
    // Simple CSV parser that handles quotes
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

  // Parse Contracts/Terminals
  const contracts = [];
  if (contractsHeaderIndex !== -1) {
    let idx = contractsHeaderIndex + 1;
    while (idx < rows.length) {
      const row = rows[idx];
      // End of contracts section is marked by a blank line or the beginning of vehicles section
      if (idx === vehiclesHeaderIndex || !row || row.length === 0 || (row[0] === '' && row[1] === '' && row[2] === '' && row[3] === '')) {
        break;
      }
      if (row[0] || row[3]) { // Ensure it's not a filler empty row
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

  // Parse Vehicles
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
      
      // Attempt to look up the company (empresa) associated with this vehicle
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
        index: parseInt(row[0], 10) || vehicles.length + 1,
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
        terminal
      });
      idx++;
    }
  }

  return {
    contractsRaw: contracts,
    vehiclesRaw: vehicles,
    ...deriveAggregates(contracts, vehicles)
  };
}

export function deriveAggregates(contracts, vehicles) {
  // Generate aggregate entities
  
  // 1. Unique Companies (Empresas)
  const companiesMap = {};
  contracts.forEach(c => {
    if (!companiesMap[c.entityId]) {
      companiesMap[c.entityId] = {
        entityId: c.entityId,
        empresa: c.empresa,
        contractsCount: 0,
        contractsList: [],
        plannedVehicles: 0,
        actualVehicles: 0
      };
    }
    companiesMap[c.entityId].contractsCount++;
    if (!companiesMap[c.entityId].contractsList.includes(c.contractNumber)) {
      companiesMap[c.entityId].contractsList.push(c.contractNumber);
    }
    companiesMap[c.entityId].plannedVehicles += c.cantidad;
  });

  // Count vehicles per company
  vehicles.forEach(v => {
    if (v.entityId && companiesMap[v.entityId]) {
      companiesMap[v.entityId].actualVehicles++;
    } else if (v.empresa !== 'No asociado') {
      const foundComp = Object.values(companiesMap).find(c => c.empresa === v.empresa);
      if (foundComp) {
        foundComp.actualVehicles++;
      }
    }
  });
  
  const empresas = Object.values(companiesMap);

  // 2. Unique Contracts
  const contratos = contracts.map(c => {
    const actualCount = vehicles.filter(v => v.contract === c.contractNumber).length;
    return {
      contractNumber: c.contractNumber,
      empresa: c.empresa,
      entityId: c.entityId,
      terminal: c.terminal,
      ciudad: c.ciudad,
      cantidad: c.cantidad,
      contratoViejo: c.contratoViejo,
      actualCount
    };
  });

  // 3. Unique Cities
  const citiesMap = {};
  contracts.forEach(c => {
    if (!citiesMap[c.ciudad]) {
      citiesMap[c.ciudad] = {
        name: c.ciudad,
        terminals: new Set(),
        contracts: new Set(),
        companies: new Set(),
        plannedVehicles: 0,
        actualVehicles: 0
      };
    }
    citiesMap[c.ciudad].terminals.add(c.terminal);
    citiesMap[c.ciudad].contracts.add(c.contractNumber);
    citiesMap[c.ciudad].companies.add(c.empresa);
    citiesMap[c.ciudad].plannedVehicles += c.cantidad;
  });

  vehicles.forEach(v => {
    const cityName = v.city || 'Sin Ciudad';
    if (cityName && cityName !== 'Sin Ciudad' && cityName !== 'No encontrado') {
      let foundCityKey = Object.keys(citiesMap).find(key => key.toLowerCase() === cityName.toLowerCase());
      if (!foundCityKey) {
        citiesMap[cityName] = {
          name: cityName,
          terminals: new Set(),
          contracts: new Set(),
          companies: new Set(),
          plannedVehicles: 0,
          actualVehicles: 0
        };
        foundCityKey = cityName;
      }
      citiesMap[foundCityKey].actualVehicles++;
      if (v.terminal && v.terminal !== 'N/A') {
        citiesMap[foundCityKey].terminals.add(v.terminal);
      }
      if (v.contract && v.contract !== 'No encontrado') {
        citiesMap[foundCityKey].contracts.add(v.contract);
      }
      if (v.empresa && v.empresa !== 'No asociado') {
        citiesMap[foundCityKey].companies.add(v.empresa);
      }
    }
  });

  const ciudades = Object.values(citiesMap).map(c => ({
    name: c.name,
    terminalsCount: c.terminals.size,
    terminalsList: Array.from(c.terminals).join(', '),
    contractsCount: c.contracts.size,
    companiesCount: c.companies.size,
    plannedVehicles: c.plannedVehicles,
    actualVehicles: c.actualVehicles
  }));

  // 4. Unique Terminals
  const terminalsMap = {};
  contracts.forEach(c => {
    const key = `${c.terminal}-${c.ciudad}`;
    if (!terminalsMap[key]) {
      terminalsMap[key] = {
        id: key,
        terminal: c.terminal,
        ciudad: c.ciudad,
        empresa: c.empresa,
        contractNumber: c.contractNumber,
        planned: c.cantidad,
        actual: 0
      };
    }
  });

  vehicles.forEach(v => {
    let foundTerm = Object.values(terminalsMap).find(t => t.terminal === v.terminal);
    if (!foundTerm && v.city) {
      foundTerm = Object.values(terminalsMap).find(t => t.ciudad.toLowerCase() === v.city.toLowerCase());
    }
    if (foundTerm) {
      foundTerm.actual++;
    }
  });

  const terminales = Object.values(terminalsMap);

  return {
    empresas,
    contratos,
    ciudades,
    terminales,
    vehicles
  };
}
