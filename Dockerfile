# ============================================================
# Stage 1: Build frontend
# ============================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar dependencias del frontend
COPY package*.json ./
RUN npm ci

# Copiar fuentes y compilar
COPY src/ ./src/
COPY public/ ./public/
COPY index.html vite.config.js ./

# Asegurar que el CSV de seed esté donde el servidor lo espera
# El archivo fuente está en la raíz, el servidor lo busca en public/data/
RUN mkdir -p public/data
COPY "schB - Consolidado.csv" ./public/data/

RUN npm run build

# ============================================================
# Stage 2: Production image (solo backend + dist compilado)
# ============================================================
FROM node:20-alpine AS production

# Instalar dependencias nativas para sqlite3 (python3, make, g++)
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copiar e instalar dependencias del backend
COPY server/package*.json ./server/
RUN cd server && npm ci --omit=dev

# Copiar código del backend
COPY server/server.js ./server/

# Copiar el CSV de seed para que esté disponible en el contenedor
RUN mkdir -p public/data
COPY "schB - Consolidado.csv" ./public/data/

# Copiar el frontend compilado desde la etapa anterior
COPY --from=builder /app/dist ./dist

# Crear usuario no-root por seguridad
RUN addgroup -S fleetapp && adduser -S fleetapp -G fleetapp

# Crear directorios con permisos correctos ANTES de cambiar de usuario
# Los volúmenes Docker se montan sobre estos directorios en runtime;
# el modo 777 asegura que el usuario no-root pueda escribir en ellos.
RUN mkdir -p /data /app/server/uploads \
    && chmod 777 /data /app/server/uploads \
    && chown -R fleetapp:fleetapp /app

USER fleetapp

# Variables de entorno por defecto
ENV PORT=8080 \
    NODE_ENV=production \
    DATABASE_PATH=/data/database.sqlite

EXPOSE 8080

# Healthcheck: verifica que el servidor responde
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD wget -qO- http://localhost:8080/api/data > /dev/null || exit 1

CMD ["node", "server/server.js"]
