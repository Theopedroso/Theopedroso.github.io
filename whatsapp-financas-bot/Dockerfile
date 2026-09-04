FROM node:20-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src ./src

VOLUME ["/app/data"]

CMD ["node", "src/index.js"]
