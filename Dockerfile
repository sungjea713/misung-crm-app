# Dockerfile for Render.com deployment
FROM oven/bun:1

WORKDIR /app

# Copy package files
COPY package.json bun.lockb* ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build frontend (optional, can be done at runtime)
# RUN bun build src/frontend/index.tsx --outdir=dist --target=browser

# Expose port
EXPOSE 3001

# Start server
CMD ["bun", "run", "src/server/index.ts"]
