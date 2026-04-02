FROM node:20-alpine

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
RUN npm install

# Copy the rest of your Express/Socket.io code
COPY . .

# Match this to the port in your Express app (usually 3000)
EXPOSE 3000

CMD ["node", "src/server.js"]