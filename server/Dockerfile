# =============================================================================
# server/Dockerfile
# Builds the full server container:
#   - Python venv + Flask backend
#   - Node.js frontend build (Vite -> /frontend/dist)
#   - Gunicorn serves the app
# =============================================================================

FROM ubuntu:24.04

# Prevent interactive tzdata config
ARG DEBIAN_FRONTEND=noninteractive

# ---------------------------------------------------------------------------
# System basics
# ---------------------------------------------------------------------------
RUN apt-get update && apt-get install -y \
    ca-certificates \
    bash \
    sudo \
    build-essential \
    locales \
    curl \
    && rm -rf /var/lib/apt/lists/*

# ---------------------------------------------------------------------------
# Python
# ---------------------------------------------------------------------------
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv && \
    rm -rf /var/lib/apt/lists/*

RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install --no-cache-dir --upgrade pip setuptools wheel

# ---------------------------------------------------------------------------
# Backend setup
# ---------------------------------------------------------------------------
WORKDIR /backend
COPY ./backend /backend
RUN pip install --no-cache-dir -r /backend/requirements.txt
ENV PYTHONPATH=/backend

# ---------------------------------------------------------------------------
# Node.js + Frontend build
# ---------------------------------------------------------------------------
RUN apt-get update && apt-get install -y --no-install-recommends \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /frontend
COPY ./frontend /frontend
RUN npm install && npm run build

# ---------------------------------------------------------------------------
# Final workdir — Gunicorn runs from here
# ---------------------------------------------------------------------------
WORKDIR /backend





