# Stage 1: Build frontend
FROM node:22-alpine AS frontend-build
WORKDIR /app/frontend
COPY package*.json ./
RUN npm ci --ignore-scripts
COPY . ./
RUN npm run build

# Stage 2: Python runtime
FROM python:3.12-slim
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*
RUN useradd --create-home --shell /bin/bash appuser

WORKDIR /app
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ ./backend/
COPY --from=frontend-build /app/frontend/dist ./static/

RUN mkdir -p /data/uploads && chown -R appuser:appuser /data

ENV UPLOAD_DIR=/data/uploads
ENV DATABASE_URL=sqlite+aiosqlite:////data/support.db
ENV STATIC_DIR=/app/static

USER appuser
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/api/health || exit 1

CMD ["uvicorn", "backend.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
