# Build Stage
FROM node:20-slim AS builder

# Install openssl for Prisma
RUN apt-get update && apt-get install -y openssl

WORKDIR /app

# Copy package files first for better caching
COPY package.json ./
COPY frontend/package.json ./frontend/
COPY backend/package.json ./backend/

# Install dependencies (only production for backend, all for frontend build)
RUN npm install
RUN npm install --prefix frontend

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

# Copy package files and production node_modules from builder
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/backend ./backend

# Copy built frontend from builder
COPY --from=builder /app/frontend/dist ./frontend/dist

# Ensure we are in the backend for the start command
WORKDIR /app/backend

EXPOSE 5000

# Start command
CMD ["node", "src/server.js"]
