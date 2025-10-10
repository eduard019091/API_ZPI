# WhatsApp Bot - Node.js Version

Aplicação de automação para WhatsApp Web **100% migrada** de Python para Node.js.

## 🎉 Migração Completa!

✅ **Todos os arquivos Python removidos**  
✅ **Backend totalmente em Node.js**  
✅ **Banco SQLite mantido**  
✅ **Interface web preservada**  
✅ **Funcionalidades idênticas**

## 🚀 Funcionalidades

- ✅ Bot WhatsApp Web automatizado
- ✅ Interface web moderna
- ✅ Envio de mensagens em massa
- ✅ Gerenciamento de instâncias
- ✅ Banco de dados SQLite
- ✅ API REST completa

## 📋 Pré-requisitos

- Node.js >= 16.0.0
- npm ou yarn
- Google Chrome instalado
- WhatsApp Web configurado

## 🛠️ Instalação

1. **Clone ou baixe o projeto**
2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Execute a aplicação:**
   ```bash
   npm start
   ```

4. **Para desenvolvimento (com auto-reload):**
   ```bash
   npm run dev
   ```

## 🌐 Acesso

Após iniciar, acesse: `http://localhost:3000`

## 📁 Estrutura do Projeto

```
├── server.js              # Servidor Express.js principal
├── whatsapp-bot.js        # Classe do bot WhatsApp
├── package.json           # Dependências e scripts npm
├── app_new.db            # Banco de dados SQLite (mantido)
├── dashboard.html         # Interface principal
├── grupos.html           # Página de grupos com bot
├── instancias.html       # Página de instâncias
├── style.css             # Estilos CSS
├── script.js             # JavaScript do frontend
├── diagnose.js           # Script de diagnóstico
├── test-bot.js           # Script de teste do bot
├── start.bat             # Script de inicialização (Windows)
├── start.sh              # Script de inicialização (Linux/Mac)
└── README.md             # Este arquivo
```

## 🔧 Configuração

### Primeira Execução

1. Execute `npm start`
2. Abra o navegador em `http://localhost:5000`
3. O Chrome abrirá automaticamente o WhatsApp Web
4. Escaneie o QR Code com seu celular
5. Aguarde o login ser confirmado

### Configurações Avançadas

Você pode modificar as configurações no arquivo `server.js`:

- **Porta:** Altere `PORT` (padrão: 3000)
- **Modo Headless:** Altere `headless = true` no WhatsAppBot
- **Timeout:** Altere `waitTimeout` no WhatsAppBot

## 📡 API Endpoints

### Health Check
```
GET /api/health
```

### Contatos
```
GET /api/contacts
```

### Enviar Mensagens
```
POST /api/send
Content-Type: application/json

{
  "contacts": ["Nome1", "Nome2"],
  "message": "Sua mensagem aqui"
}
```

### Jobs (Status de Envio)
```
GET /api/job/:jobId
```

### Instâncias
```
GET /api/instances
POST /api/instances
DELETE /api/instances/:id
```

## 🚨 Solução de Problemas

### Chrome não abre
- Verifique se o Google Chrome está instalado
- Execute: `npm install chromedriver`

### Bot não conecta
- Verifique se o WhatsApp Web está funcionando no navegador
- Aguarde o QR Code aparecer e escaneie com o celular
- Verifique se não há outras sessões ativas do WhatsApp Web

### Erro de permissão
- Execute como administrador (Windows)
- Verifique as permissões de arquivo

## 🔄 Migração do Python

Esta versão foi migrada da versão Python mantendo:
- ✅ Mesma funcionalidade
- ✅ Mesmo banco de dados SQLite
- ✅ Mesma interface web
- ✅ Mesmas rotas da API

### Principais mudanças:
- Flask → Express.js
- Python Selenium → Node.js Selenium
- Python threading → Node.js async/await
- Mesma lógica de negócio

## 📝 Logs

Os logs são exibidos no console onde você executou `npm start`.

## 🛑 Parar a Aplicação

Use `Ctrl+C` no terminal para parar o servidor graciosamente.

## 📞 Suporte

Para problemas ou dúvidas, verifique:
1. Logs no console
2. Status da API em `/api/health`
3. Se o Chrome está funcionando
4. Se o WhatsApp Web está logado

---

**Versão:** 2.0.0 (Node.js)  
**Migrado de:** Python/Flask  
**Banco:** SQLite (mantido)
