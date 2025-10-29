# syntax=docker/dockerfile:1.6

############################
# FASE: deps (com devDeps)
# - Gera package-lock dentro do container
# - Instala deps + devDeps (precisamos do Vite no build)
############################
FROM node:20-alpine AS deps
WORKDIR /app

# invalida cache quando o SHA mudar (EasyPanel já passa --build-arg GIT_SHA=...)
ARG GIT_SHA
ENV GIT_SHA=$GIT_SHA

# NÃO defina NODE_ENV=production aqui, senão devDeps (vite) não entram
# Cache do npm para builds mais rápidos
RUN --mount=type=cache,target=/root/.npm true

# Use somente o package.json para gerar o lock "fresco"
COPY package.json ./

# 1) gera package-lock
RUN --mount=type=cache,target=/root/.npm npm install --package-lock-only

# 2) instala TAMBÉM devDependencies
RUN --mount=type=cache,target=/root/.npm npm ci --include=dev

############################
# FASE: build
# - Copia node_modules (com devDeps)
# - Copia código e compila com Vite
############################
FROM node:20-alpine AS build
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package-lock.json ./package-lock.json
COPY . .

# Diagnóstico útil
RUN node -v && npm -v && npm ls vite || true

# Build da SPA (vite está em devDependencies)
RUN npm run build

############################
# FASE: runtime (Nginx)
# - Serve conteúdo estático
# - SPA fallback +
