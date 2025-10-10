#!/bin/bash

echo "🚀 Configurando ambiente para OnRender..."

# Instalar dependências do Node.js
echo "📦 Instalando dependências do Node.js..."
npm install

# Verificar se estamos no OnRender
if [ "$RENDER" = "true" ] || [ -n "$RENDER_SERVICE_ID" ]; then
    echo "🔧 Detectado ambiente OnRender - configurando Chrome..."
    
    # Atualizar lista de pacotes
    sudo apt-get update -y
    
    # Instalar dependências básicas
    sudo apt-get install -y wget gnupg software-properties-common
    
    # Adicionar repositório do Google Chrome
    wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
    echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" | sudo tee /etc/apt/sources.list.d/google-chrome.list
    
    # Atualizar novamente e instalar Chrome
    sudo apt-get update -y
    sudo apt-get install -y google-chrome-stable
    
    # Instalar dependências adicionais para Selenium
    sudo apt-get install -y \
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
        libxss1 \
        libgconf-2-4 \
        libxtst6 \
        libxrandr2 \
        libasound2 \
        libpangocairo-1.0-0 \
        libatk1.0-0 \
        libcairo-gobject2 \
        libgtk-3-0 \
        libgdk-pixbuf2.0-0
    
    echo "✅ Chrome e dependências instalados com sucesso!"
    
    # Verificar instalação
    google-chrome-stable --version
else
    echo "🏠 Ambiente local detectado - Chrome deve estar instalado manualmente"
fi

echo "🎉 Build concluído!"