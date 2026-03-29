# Build Stage
FROM node:20-slim AS builder

# Install openssl for Prisma
RUN apt-get update && apt-get install -y openssl

WORKDIR /app

# Copy package files first
COPY package.json ./
COPY frontend/package.json ./frontend/
COPY backend/package.json ./backend/

# Install dependencies in subfolders
RUN npm install --prefix frontend
RUN npm install --prefix backend

# Copy source code
COPY frontend ./frontend
COPY backend ./backend

# Build frontend
RUN npm run build --prefix frontend

# Generate Prisma client
WORKDIR /app/backend
RUN npx prisma generate --schema=prisma/schema.prisma

# Final Stage (Production)
FROM node:20-slim
WORKDIR /app

# Install libatomic1 (required by Prisma)
RUN apt-get update && apt-get install -y libatomic1 && rm -rf /var/lib/apt/lists/*

# Copy backend (includes its node_modules from builder)
COPY --from=builder /app/backend ./backend

# Copy built frontend
COPY --from=builder /app/frontend/dist ./frontend/dist

# Ensure we are in the backend for the start command
WORKDIR /app/backend

EXPOSE 8080

# Start command
CMD ["node", "src/server.js"]
