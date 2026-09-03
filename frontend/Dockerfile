FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* ./

# Install dependencies in a clean, isolated build step.
RUN npm ci --no-audit --no-fund

COPY . .

RUN npm run build

FROM node:20-alpine AS runtime

WORKDIR /app

# Serve the built frontend.
RUN npm i -g serve@14 --no-audit --no-fund

COPY --from=build /app/dist ./dist

EXPOSE 8080

# Railway provides $PORT; keep a safe default for local runs.
CMD sh -c "serve -s dist -l ${PORT:-8080}"

