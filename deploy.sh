#!/bin/bash

# Build the React app
echo "Building React app..."
cd client
npm install
npm run build
cd ..

# Start the server
echo "Starting server..."
npm start 