# Base image for code execution
FROM ubuntu:22.04

# Avoid interactive prompts
ENV DEBIAN_FRONTEND=noninteractive

# Install languages and tools
RUN apt-get update && apt-get install -y \
    # Python
    python3 \
    python3-pip \
    # Node.js
    nodejs \
    npm \
    # C/C++
    gcc \
    g++ \
    # Java
    default-jdk \
    # Core utils (includes timeout command)
    coreutils \
    # Clean up
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user for code execution
RUN useradd -m -u 1001 -s /bin/bash coderunner

# Create workspace
RUN mkdir -p /workspace && chown coderunner:coderunner /workspace

# Set working directory
WORKDIR /workspace

# Copy execution script
COPY runner.sh /usr/local/bin/runner.sh
RUN chmod +x /usr/local/bin/runner.sh

# Switch to non-root user
USER coderunner

# Default command
CMD ["/bin/bash"]
