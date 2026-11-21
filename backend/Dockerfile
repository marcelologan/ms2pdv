# ==============================================================================
# Multi-stage Dockerfile para Produção (Node.js + Express + TypeScript + bcrypt)
# Base Image: Debian slim (node:22-slim) garante compatibilidade binária com bcrypt
# ==============================================================================

# ------------------------------------------------------------------------------
# Estágio 1: Builder (Compilação do TypeScript)
# ------------------------------------------------------------------------------
FROM node:22-slim AS builder

WORKDIR /app

# Copia manifestos de dependências
COPY package*.json ./

# Instala todas as dependências de forma reproduzível (incluindo devDependencies)
RUN npm ci

# Copia código-fonte e arquivos de configuração
COPY . .

# Executa o build de produção (TypeScript -> JavaScript em /app/dist)
RUN npm run build

# ------------------------------------------------------------------------------
# Estágio 2: Production (Imagem enxuta e segura para execução)
# ------------------------------------------------------------------------------
FROM node:22-slim AS production

WORKDIR /app

ENV NODE_ENV=production

# Copia manifestos de dependências
COPY package*.json ./

# Instala apenas dependências necessárias para tempo de execução
RUN npm ci --omit=dev

# Copia o código compilado do estágio builder
COPY --from=builder /app/dist ./dist

# Garante permissões adequadas e executa com usuário não-root
USER node

# Porta padrão exposta
EXPOSE 3000

# Comando de inicialização do servidor em produção
CMD ["node", "dist/server.js"]
