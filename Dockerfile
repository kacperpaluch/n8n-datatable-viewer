FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci
COPY frontend/ .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY backend/package.json backend/package-lock.json* ./
RUN npm ci --omit=dev
COPY backend/server.js .
COPY --from=frontend-builder /app/frontend/dist ./public

ENV PORT=3000
EXPOSE 3000

USER node
CMD ["node", "server.js"]
