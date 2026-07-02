FROM --platform=linux/amd64 node:20-slim

# Install FFmpeg for ABR transcoding support
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./

RUN npm ci --production

COPY . .

EXPOSE 8080

CMD ["node", "index.js"]
