# Docker Setup for Cookbook Project

This project uses a lightweight Docker setup that pre-installs all dependencies without including source code.

## Files

- `Dockerfile.deps` - Dependency-only container (Node.js 22 + pnpm + all npm dependencies)
- `docker-compose.yml` - Development and build services
- `test-container.sh` - Test script to validate container setup

## Quick Start

### Option 1: Using Make (recommended)
```bash
# Build the dependencies container
make build-deps

# Start development server (with hot reload)
make start

# Build production site
make build

# Open interactive shell
make shell
```

### Option 2: Using Docker Compose
```bash
# Start development server
docker-compose up cookbook-dev

# Build production site
docker-compose run --rm cookbook-build
```

### Option 3: Manual Docker Commands
```bash
# Build the container
docker build -f Dockerfile.deps -t cookbook-deps .

# Run development server
docker run -p 3000:3000 -v $(pwd):/home/node cookbook-deps pnpm --filter @cookbook/app start --host 0.0.0.0

# Build production site
docker run -v $(pwd):/home/node cookbook-deps pnpm run build
```

## Container Details

- **Base Image**: `node:22-alpine` (lightweight)
- **User**: `node` (non-root for security)
- **Working Directory**: `/home/node`
- **Pre-installed**: Node.js 22, pnpm, all workspace dependencies
- **Size**: ~200MB (vs ~500MB+ with full setup)

## Benefits

1. **Fast CI/CD**: Dependencies are pre-installed, builds start immediately
2. **Consistent Environment**: Same Node.js/pnpm versions everywhere
3. **No Puppeteer**: Lightweight setup focused only on building source code
4. **Security**: Runs as non-root user
5. **Cache Friendly**: Container only rebuilds when dependencies change

## GitHub Actions Integration

The container is automatically built and published to GitHub Container Registry:
- Image: `ghcr.io/[your-repo]/cookbook-deps:latest`
- Rebuilds only when dependencies change
- Used in all CI/CD workflows for fast builds

## Development Workflow

1. Make source code changes locally
2. Container automatically picks up changes via volume mounts
3. Dependencies are already installed, so builds are fast
4. Hot reload works for development server

## Troubleshooting

- **Container won't start**: Run `./test-container.sh` to validate setup
- **Dependencies out of sync**: Rebuild container with `make build-deps`
- **Permission issues**: Container runs as `node` user (UID 1000)