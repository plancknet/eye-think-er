# syntax=docker/dockerfile:1.6

############################
# FASE: deps
# - Gera package-lock.json dentro do container
# - Instala deps com npm ci usando o lock recém-gerado
############################
FROM node:20-alpine AS deps
WORKDIR /app

# Derruba cache da camada de deps quando o SHA do commit mudar (EasyPanel já passa --build-arg GIT_SHA=...)
ARG GIT_SHA
ENV GIT_SHA=$GIT_SHA
ENV NODE_ENV=production

# Cache do npm para builds mais rápidos
RUN --mount=type=cache,target=/root/.npm true

# Copiamos apenas o package.json para evitar desencontro com um lock antigo do repositório
COPY package.json ./

# 1) Gera um package-lock.json compatível SEM instalar módulos na pasta (apenas resolve versões)
RUN --mount=type=cache,target=/root/.npm npm install --package-lock-only

# 2) Instala exatamente o que está no lock gerado acima
RUN --mount=type=cache,target=/root/.npm npm ci

############################
# FASE: build
# - Copia node_modules resolvidos
# - Copia código-fonte
# - Compila com Vite
############################
FROM node:20-alpine AS build
WORKDIR /app
ENV NODE_ENV=production

# Usa os módulos já instalados na fase deps
COPY --from=deps /app/node_modules ./node_modules

# Copia o restante do projeto (inclui src, vite.config, tsconfig, public, etc.)
COPY . .

# Diagnóstico (não falha o build se o pacote não aparecer, mas ajuda a depurar)
RUN node -v && npm -v && npm ls @mediapipe/tasks-vision || true

# Build da SPA
RUN npm run build

############################
# FASE: runtime (Nginx)
# - Sobe conteúdo estático de /dist
# - SPA fallback (try_files)
# - COOP/COEP para WASM com threads (se não precisar, remova os add_header)
############################
FROM nginx:1.27-alpine AS runtime

# Copia o build final
COPY --from=build /app/dist /usr/share/nginx/html

# Substitui a config padrão por uma com SPA fallback e headers úteis ao WASM
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
