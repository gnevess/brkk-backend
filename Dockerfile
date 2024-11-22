# Use the official Node.js image as the base image
FROM node:20.13.1-bullseye-slim

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install the application dependencies
RUN apt-get update && apt-get install -y curl

RUN npm install --no-audit --legacy-peer-deps

# Copy the rest of the application files
COPY . .

# Install prisma
RUN npm install -g prisma

# Generate the Prisma client
RUN npx prisma generate

# Build the NestJS application
RUN npm run build

# Expose the application port
EXPOSE 3000

CMD ["node", "dist/src/main"]
