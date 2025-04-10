# Base image
FROM node:23-slim

# Install dependencies required for audio processing
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./

RUN npm install

COPY . .

RUN npm run build

# Copy Prisma schema to dist and generate the client in the dist directory
COPY /src/prisma ./dist/prisma/
RUN cd dist && npx prisma generate

# Run prisma db push at runtime
RUN echo '#!/bin/sh \n\
    cd dist && npx prisma db push \n\
    node index.js' > /app/start.sh && chmod +x /app/start.sh

CMD ["/app/start.sh"]