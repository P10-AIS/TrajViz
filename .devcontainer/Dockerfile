ARG VARIANT="3.11-bookworm"
FROM mcr.microsoft.com/vscode/devcontainers/python:${VARIANT}

# Install Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_lts.x | bash - \
    && apt-get install -y nodejs

RUN apt-get update \
    && export DEBIAN_FRONTEND=noninteractive \
    && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /workspaces/Crowsnest

COPY server/requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt

COPY client/package.json client/package-lock.json ./client/
RUN cd client && npm ci

ENV SHELL=/bin/bash