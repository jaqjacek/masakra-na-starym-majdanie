# Stage 1: Build the frontend
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files and install all dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy source and config files
COPY . .

# Build the frontend (Vite)
RUN npm run build

# Stage 2: Production environment
FROM node:20-alpine

WORKDIR /app

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm install --omit=dev --legacy-peer-deps

# Copy the built frontend from Stage 1
COPY --from=build /app/dist ./dist

# Copy documentation
COPY API_DOCS.md GAME_RULES.md ./
COPY server/openapi.json ./server/

# Copy the backend code and server configs
COPY server/ ./server/
COPY server_config.json ./
COPY server_config.json ./server/configs/

# Create persistent storage directories for the server
RUN mkdir -p server/games server/sets server/configs

# Expose the port (must match process.env.PORT or 3001)
EXPOSE 3001

# Entry point
CMD ["node", "server/server.js"]
