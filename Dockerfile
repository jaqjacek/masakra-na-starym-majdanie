# Stage 1: Build the frontend
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files and install all dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy source and config files
COPY . .

# Fallback: vite.config.js czyta ./server_config.json z cwd (/app).
# Jeśli prawdziwego configu nie ma (jest w .gitignore), użyj .example.
# Jeśli nie ma ani jednego, przerwij build z jasnym komunikatem.
RUN if [ ! -f server_config.json ]; then \
        if [ -f server_config.json_example ]; then \
            cp server_config.json_example server_config.json; \
        else \
            echo "ERROR: brak server_config.json oraz server_config.json_example w kontekście builda" >&2; \
            exit 1; \
        fi; \
    fi

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
COPY docs/ ./docs/

# Copy the backend code, shared logic, source strategies/constants, and server configs
COPY server/ ./server/
COPY shared/ ./shared/
COPY src/ ./src/

# Użyj wildcarda – build nie padnie, gdy server_config.json jest w .gitignore.
# Skopiuje się wtedy tylko server_config.json_example (oraz prawdziwy plik, jeśli istnieje).
COPY server_config.json* ./server/configs/
COPY server_config.json* ./

# Utwórz katalogi trwałe + fallback: jeśli brak configu, użyj .example
RUN mkdir -p server/games server/sets server/configs && \
    if [ ! -f server/configs/server_config.json ]; then \
        if [ -f server/configs/server_config.json_example ]; then \
            cp server/configs/server_config.json_example server/configs/server_config.json; \
        else \
            echo "ERROR: brak server/configs/server_config.json oraz .example" >&2; \
            exit 1; \
        fi; \
    fi && \
    if [ ! -f server_config.json ]; then \
        if [ -f server_config.json_example ]; then \
            cp server_config.json_example server_config.json; \
        else \
            echo "ERROR: brak server_config.json oraz .example w /app" >&2; \
            exit 1; \
        fi; \
    fi

# Expose the port (must match process.env.PORT or 3001)
EXPOSE 3001

# Entry point
CMD ["node", "server/server.js"]