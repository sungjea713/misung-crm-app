# Dockerfile for Render.com deployment
FROM oven/bun:1

WORKDIR /app

# Copy package files
COPY package.json bun.lockb* ./

# Install ALL dependencies (including devDependencies for build)
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build frontend with Vite
RUN bun run build

# Set production environment
ENV NODE_ENV=production

# Use PORT from environment variable (Render provides this)
ENV PORT=${PORT:-10000}

# Start server with production settings
CMD ["bun", "run", "start"]
