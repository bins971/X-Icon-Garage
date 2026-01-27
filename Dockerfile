# Build Stage
FROM node:20-slim AS builder

# Install openssl for Prisma
RUN apt-get update && apt-get install -y openssl

WORKDIR /app

# Copy package files first for better caching
COPY package.json ./
COPY frontend/package.json ./frontend/
COPY backend/package.json ./backend/

# Install all dependencies
ENV PRISMA_SKIP_POSTINSTALL_GENERATE=1
RUN npm install
RUN npm install --prefix frontend

# Copy source code
COPY frontend ./frontend
COPY backend ./backend

# Build frontend
RUN npm run build --prefix frontend

# Generate Prisma client
WORKDIR /app/backend
# Install devDeps for prisma.config.ts support
RUN npm install
RUN npx prisma generate --schema=prisma/schema.prisma

# Final Stage
FROM node:20-slim
WORKDIR /app

# Install libatomic1 (required by Prisma)
RUN apt-get update && apt-get install -y libatomic1 && rm -rf /var/lib/apt/lists/*

# Copy built app from builder
COPY --from=builder /app /app

# Ensure we are in the backend for the start command to find .env files
WORKDIR /app/backend

EXPOSE 5000

# Start command
CMD ["node", "src/server.js"]
