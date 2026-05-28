# Use Node 20 Alpine (lightweight)
FROM node:20-alpine

WORKDIR /app

# Copy package files first (for caching)
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the app
COPY . .

# Expose Vite's dev port
EXPOSE 5173

# Start the dev server, accessible from outside the container
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]