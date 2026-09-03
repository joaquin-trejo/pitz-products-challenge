FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app

# Serve the built frontend.
RUN npm i -g serve@14 --no-audit --no-fund
COPY --from=build /app/dist ./dist

EXPOSE 8080

# Railway injects $PORT. `serve` expects the listen argument to include a scheme.
CMD sh -c "serve -s dist -l http://0.0.0.0:${PORT:-8080}"

