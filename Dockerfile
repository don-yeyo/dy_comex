# Stage 1: Build client
FROM node:20-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Stage 2: Setup server
FROM node:20-alpine
WORKDIR /app
COPY server/package*.json ./server/
RUN npm install --prefix server
COPY server/ ./server/
COPY --from=client-builder /app/client/dist ./client/dist

# Copiar configuración general del monorepo
COPY package*.json ./
COPY .env.template ./

EXPOSE 5000
CMD ["npm", "start", "--prefix", "server"]
