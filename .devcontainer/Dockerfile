ARG VARIANT="3.11-bookworm"
FROM mcr.microsoft.com/vscode/devcontainers/python:${VARIANT}

RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
    build-essential \
    curl

ENV SHELL /bin/bash