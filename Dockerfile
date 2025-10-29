# syntax=docker/dockerfile:1.6

#############################
# FASE: deps (gera lock e instala deps + devDeps)
############################
FROM node:20-alpine AS deps
WORKDIR /app

# invalida cache quando o SHA mudar (EasyPanel já passa --build-arg GIT_SHA=...)
ARG GIT_SHA
ENV GIT_SHA=$GIT_SHA

# Garante que devDependencies serão instaladas
ENV NPM_CONFIG_PRODUCTION=false

# Cache do npm
RUN --mount=type=cache,target=/root/.npm true

# Usa só o package.json para gerar um lock "fresco"
COPY package.json ./

# 1) Gera package-lock.json sem instalar na árvore
RUN --mount=type=cache,target=/root/.npm npm install --package-lock-only

# 2) Instala exatamente conforme o lock, incluindo devDeps
RUN --mount=type=cache,target=/root/.npm npm ci --include=dev

############################
# FASE: build (compila com Vite)
############################
FROM node:20-alpine AS build
WORKDIR /app

# Mantém devDeps disponíveis para o build
ENV NPM_CONFIG_PRODUCTION=false

# Node modules e lock vindos da fase deps
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package-lock.json ./package-lock.json

# Resto do projeto
COPY . .

# Diagnóstico opcional
RUN node -v && npm -v && npm ls vite || true

# Build da SPA
RUN npm run build

############################
# FASE: runtime (Nginx estático + SPA fallback)
############################
FROM nginx:1.27-alpine AS runtime

# Entrega /dist
COPY --from=build /app/dist /usr/share/nginx/html

# Nginx com fallback e headers úteis ao WASM
RUN printf 'server {\n\
  listen 80;\n\
  server_name _;\n\
  root /usr/share/nginx/html;\n\
  include /etc/nginx/mime.types;\n\
  add_header Cross-Origin-Opener-Policy same-origin;\n\
  add_header Cross-Origin-Embedder-Policy require-corp;\n\
  location / {\n\
    try_files $uri $uri/ /index.html;\n\
  }\n\
  location ~* \\.(wasm|wasm.gz)$ {\n\
    types { application/wasm wasm; }\n\
    default_type application/wasm;\n\
    add_header Cross-Origin-Resource-Policy cross-origin;\n\
  }\n\
}\n' > /etc/nginx/conf.d/default.conf
