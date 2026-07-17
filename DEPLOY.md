# 🚀 Guía de Despliegue — FleetManager

## Arquitectura

```
┌─────────────────────────────────────────┐
│           Contenedor Docker             │
│                                         │
│  Puerto 8080                            │
│  ├── GET /           → React SPA        │
│  ├── GET /api/*      → Express REST API │
│  └── POST /api/*     → Express REST API │
│                                         │
│  Volúmenes persistentes:                │
│  ├── /data/database.sqlite              │
│  └── /app/server/uploads/              │
└─────────────────────────────────────────┘
```

> La app corre como un **único contenedor** que sirve el frontend estático y la API REST desde el mismo proceso Node.js en el puerto **8080**.

---

## Endpoints de la API REST

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/data` | Obtiene todos los datos (vehículos, contratos, usuarios, movimientos) |
| POST | `/api/vehicles` | Crear vehículo |
| PUT | `/api/vehicles/:vin` | Actualizar vehículo |
| DELETE | `/api/vehicles/:vin` | Dar de baja vehículo |
| POST | `/api/contracts` | Crear contrato |
| PUT | `/api/contracts/:contractNumber` | Actualizar contrato |
| DELETE | `/api/contracts/:contractNumber` | Eliminar contrato |
| PUT | `/api/companies/:entityId` | Renombrar empresa (cascada) |
| DELETE | `/api/companies/:entityId` | Eliminar empresa (cascada) |
| PUT | `/api/cities/:name` | Renombrar ciudad (cascada) |
| DELETE | `/api/cities/:name` | Eliminar ciudad (cascada) |
| PUT | `/api/terminals/:code/:city` | Actualizar terminal (cascada) |
| DELETE | `/api/terminals/:code/:city` | Eliminar terminal (cascada) |
| POST | `/api/users` | Crear usuario |
| PUT | `/api/users/:username` | Actualizar usuario |
| DELETE | `/api/users/:username` | Eliminar usuario |
| POST | `/api/movements` | Registrar movimiento de auditoría |
| POST | `/api/movements/clear` | Limpiar historial de auditoría |
| POST | `/api/documents/upload` | Subir documento (binario) |
| GET | `/api/documents/vin/:vin` | Listar documentos de un vehículo |
| GET | `/api/documents/counts` | Conteo de documentos por VIN |
| GET | `/api/documents/file/:id` | Visualizar documento |
| GET | `/api/documents/download/:id` | Descargar documento |
| DELETE | `/api/documents/:id` | Eliminar documento |

---

## Requisitos previos

- **Docker** 24+ y **Docker Compose** v2+ instalados en el servidor
- Puerto **8080** abierto en el firewall / Security Group
- (Opcional) Un dominio apuntando a la IP del servidor

---

## Opción A — AWS EC2

### 1. Lanzar una instancia EC2

- **AMI**: Amazon Linux 2023 o Ubuntu 24.04 LTS
- **Tipo**: `t3.micro` (free tier) o superior
- **Almacenamiento**: 20 GB GP3 (suficiente para SQLite + uploads)
- **Security Group** — abrir los puertos:
  | Puerto | Protocolo | Origen |
  |--------|-----------|--------|
  | 22 | TCP | Tu IP |
  | 80 | TCP | 0.0.0.0/0 |
  | 443 | TCP | 0.0.0.0/0 |
  | 8080 | TCP | 0.0.0.0/0 |

### 2. Instalar Docker en Amazon Linux 2023

```bash
sudo dnf update -y
sudo dnf install -y docker
sudo systemctl enable --now docker
sudo usermod -aG docker ec2-user
# Cerrar sesión y volver a conectar para que el grupo tome efecto

# Docker Compose v2
sudo mkdir -p /usr/local/lib/docker/cli-plugins
sudo curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
```

### 3. Instalar Docker en Ubuntu 24.04

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu
newgrp docker
```

---

## Opción B — Oracle Cloud Free Tier (OCI)

### 1. Crear una VM Compute

- **Shape**: `VM.Standard.E2.1.Micro` (Always Free)
- **OS**: Ubuntu 22.04 o Oracle Linux 8
- Asignar una **IP Pública** reservada

### 2. Abrir puertos en el firewall de OCI

En **Networking → Virtual Cloud Networks → Security Lists**, agregar reglas de entrada:
- Puerto 80 TCP
- Puerto 443 TCP
- Puerto 8080 TCP

También configurar el firewall del SO:

```bash
# Ubuntu
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 8080/tcp
sudo ufw enable

# Oracle Linux
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --permanent --add-port=8080/tcp
sudo firewall-cmd --reload
```

### 3. Instalar Docker

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
newgrp docker
```

---

## Despliegue (igual para AWS y Oracle)

### Opción 1 — Build en el servidor (más simple)

```bash
# 1. Subir el código al servidor
git clone <URL_DE_TU_REPO> /opt/fleetmanager
# O copiar con scp:
scp -r . ec2-user@<IP_DEL_SERVIDOR>:/opt/fleetmanager

# 2. Entrar al directorio
cd /opt/fleetmanager

# 3. Construir y levantar
docker compose up -d --build

# 4. Verificar que está corriendo
docker compose ps
docker compose logs -f
```

### Opción 2 — Docker Hub / Registry (recomendada para CI/CD)

```bash
# En tu máquina local: construir y subir la imagen
docker build -t TU_USUARIO/fleetmanager:latest .
docker push TU_USUARIO/fleetmanager:latest

# En el servidor: actualizar docker-compose.yml con tu imagen
# image: TU_USUARIO/fleetmanager:latest

docker compose pull
docker compose up -d
```

### Acceder a la aplicación

- **Sin dominio**: `http://<IP_DEL_SERVIDOR>:8080`
- **Con dominio**: ver sección Nginx más abajo

---

## Nginx como Reverse Proxy (recomendado para dominio + HTTPS)

Si quieres usar el puerto 80/443 y un dominio propio:

```bash
# Instalar Nginx y Certbot
sudo apt install -y nginx certbot python3-certbot-nginx  # Ubuntu
# o
sudo dnf install -y nginx certbot python3-certbot-nginx  # Amazon Linux / Oracle Linux

# Configurar Nginx
sudo nano /etc/nginx/conf.d/fleetmanager.conf
```

Contenido del archivo de configuración:

```nginx
server {
    listen 80;
    server_name tu-dominio.com www.tu-dominio.com;

    # Tamaño máximo de upload (documentos PDF)
    client_max_body_size 25M;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
    }
}
```

```bash
# Probar configuración e iniciar Nginx
sudo nginx -t
sudo systemctl enable --now nginx

# Obtener certificado SSL gratuito con Let's Encrypt
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com
```

---

## Mantenimiento y operación

### Ver logs en tiempo real
```bash
docker compose logs -f fleetmanager
```

### Actualizar la aplicación
```bash
# Con código nuevo en el servidor
docker compose down
docker compose up -d --build

# Con imagen desde registry
docker compose pull && docker compose up -d
```

### Backup de la base de datos
```bash
# La DB está en el volumen Docker 'fleetmanager_data'
docker run --rm \
  -v fleetmanager_fleetmanager_data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/fleetmanager_backup_$(date +%Y%m%d).tar.gz /data
```

### Restaurar backup
```bash
docker compose down
docker run --rm \
  -v fleetmanager_fleetmanager_data:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/fleetmanager_backup_YYYYMMDD.tar.gz -C /
docker compose up -d
```

### Reiniciar el contenedor
```bash
docker compose restart fleetmanager
```

### Inspeccionar el estado de salud
```bash
docker inspect --format='{{.State.Health.Status}}' fleetmanager
```

---

## Variables de entorno

| Variable | Valor por defecto | Descripción |
|----------|------------------|-------------|
| `PORT` | `8080` | Puerto del servidor Express |
| `NODE_ENV` | `production` | Entorno Node.js |
| `DATABASE_PATH` | `/data/database.sqlite` | Ruta a la BD SQLite |

---

## Usuarios por defecto

> [!WARNING]
> Cambiar estas contraseñas inmediatamente después del primer despliegue desde el panel de administración de la app.

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| `admin` | `admin123` | Administrador |
| `operator` | `operator123` | Operador |
| `viewer` | `viewer123` | Solo lectura |

---

## Solución de problemas comunes

| Síntoma | Causa probable | Solución |
|---------|---------------|----------|
| Contenedor no inicia | Error al compilar sqlite3 | Verificar que Python3/make/g++ estén disponibles en build |
| Los datos no persisten | Volúmenes no montados | Verificar `docker compose ps` y que los volúmenes estén definidos |
| Puerto 8080 no accesible | Firewall / Security Group | Abrir el puerto en AWS Console o OCI VCN |
| CSV no se importa | Archivo CSV no en la imagen | Verificar que `schB - Consolidado.csv` está en la raíz del proyecto al hacer build |
| Uploads se pierden | Directorio no montado | Asegurarse de que el volumen `fleetmanager_uploads` está montado en `/app/server/uploads` |
