FROM node:20-slim

# Instalar Python, make y g++ necesarios para compilar node-sqlite3 si es necesario
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar archivos de dependencias del frontend
COPY package*.json ./

# Instalar dependencias del frontend
RUN npm ci

# Copiar código fuente del frontend y compilar
COPY src/ ./src/
COPY public/ ./public/
COPY index.html vite.config.js ./
RUN npm run build

# Instalar dependencias del backend (separado para aprovechar la caché de Docker)
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm ci

# Copiar el resto del código fuente del backend
WORKDIR /app
COPY server/ ./server/

# Crear el directorio para montar el volumen persistente de SQLite
RUN mkdir -p /data

# Volver a la raíz del proyecto
WORKDIR /app

# Configurar variables de entorno por defecto
ENV PORT=8080
ENV NODE_ENV=production
ENV DATABASE_PATH=/data/database.sqlite

EXPOSE 8080

# Ejecutar el servidor unificado
CMD ["node", "server/server.js"]
