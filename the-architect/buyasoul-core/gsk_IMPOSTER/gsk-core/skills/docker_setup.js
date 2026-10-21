'use strict';

const fs = require('fs');
const path = require('path');

const PLT_AFFINITY = { profit: 0.6, love: 0.1, tax: 0.3 };

function skill_docker_setup(input) {
    const project = input.project || 'app';
    const language = input.language || 'node';
    const port = input.port || 3000;

    const templates = {
        node: `FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE ${port}
CMD ["node", "index.js"]`,
        python: `FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE ${port}
CMD ["python", "app.py"]`,
        go: `FROM golang:1.21-alpine
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o main .
EXPOSE ${port}
CMD ["./main"]`,
    };

    return Promise.resolve({
        skill: 'docker_setup',
        plt_affinity: PLT_AFFINITY,
        files: {
            Dockerfile: templates[language] || templates.node,
            'docker-compose.yml': `version: '3.8'
services:
  app:
    build: .
    ports:
      - "${port}:${port}"
    restart: unless-stopped`,
        },
        instructions: [`docker build -t ${project} .`, `docker-compose up`, `docker-compose down`],
        timestamp: Date.now(),
    });
}

module.exports = { skill_docker_setup };