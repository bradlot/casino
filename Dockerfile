# Build stage
FROM node:20-slim AS builder

# Install build dependencies for better-sqlite3
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

# Runtime stage
FROM node:20-slim

WORKDIR /usr/src/app

# Copy built node_modules and source
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app .

# Create data directory for sqlite
RUN mkdir -p casino/data

CMD ["node", "casino/src/index.js"]
