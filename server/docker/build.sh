#!/bin/bash

# Build the Docker image for code execution

echo "🐳 Building Docker image for code execution sandbox..."

cd "$(dirname "$0")"

docker build -t code-judge:latest .

if [ $? -eq 0 ]; then
    echo "✅ Docker image built successfully!"
    echo ""
    echo "Image: code-judge:latest"
    echo ""
    echo "To test the image:"
    echo "docker run --rm -it code-judge:latest bash"
else
    echo "❌ Failed to build Docker image"
    exit 1
fi
