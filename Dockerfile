# Use uma imagem base do Node.js com Chrome pré-instalado
FROM node:18-slim

# Instalar dependências do sistema necessárias para Chrome
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    procps \
    libxss1 \
    && rm -rf /var/lib/apt/lists/*

# Adicionar repositório do Google Chrome
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list'

# Instalar Google Chrome
RUN apt-get update && apt-get install -y \
    google-chrome-stable \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# Criar usuário não-root
RUN groupadd -r pptruser && useradd -r -g pptruser -G audio,video pptruser \
    && mkdir -p /home/pptruser/Downloads \
    && chown -R pptruser:pptruser /home/pptruser

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências do Node.js
RUN npm ci --only=production && npm cache clean --force

# Copiar código da aplicação
COPY . .

# Definir variáveis de ambiente
ENV NODE_ENV=production
ENV RENDER=true
ENV CHROME_BIN=/usr/bin/google-chrome-stable
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Mudar para usuário não-root
USER pptruser

# Expor porta
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["npm", "start"]