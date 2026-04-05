# Use a lightweight Node.js image
FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install --production

# Copy application source
COPY . .

# Expose the port the app listens on
EXPOSE 3000

# Use production mode by default
ENV NODE_ENV=production

# Start the server
CMD ["npm", "start"]
