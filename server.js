const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const morgan = require('morgan');
const WhatsAppBot = require('./whatsapp-bot');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));
app.use(express.static('.'));

// Configurações do banco de dados
const DB_PATH = 'app_new.db';

// Instância global do bot
let botInstance = null;
let botLock = false;

// Inicializar banco de dados
function initDatabase() {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(DB_PATH, (err) => {
            if (err) {
                console.error('Erro ao conectar com o banco:', err);
                reject(err);
                return;
            }
            console.log('Conectado ao banco SQLite');
        });

        // Criar tabelas
        db.serialize(() => {
            // Tabela de jobs
            db.run(`
                CREATE TABLE IF NOT EXISTS jobs (
                    id TEXT PRIMARY KEY,
                    status TEXT NOT NULL,
                    result TEXT,
                    error TEXT,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )
            `);

            // Tabela de instâncias
            db.run(`
                CREATE TABLE IF NOT EXISTS instances (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    contacts TEXT NOT NULL,
                    message TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )
            `, (err) => {
                if (err) {
                    console.error('Erro ao criar tabelas:', err);
                    reject(err);
                } else {
                    console.log('Banco de dados inicializado');
                    resolve();
                }
            });
        });

        db.close();
    });
}

// Funções do banco de dados
function createJob(jobId, status = 'queued') {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(DB_PATH);
        const now = new Date().toISOString();
        
        db.run(
            'INSERT INTO jobs (id, status, created_at, updated_at) VALUES (?, ?, ?, ?)',
            [jobId, status, now, now],
            function(err) {
                if (err) {
                    console.error('Erro ao criar job:', err);
                    reject(err);
                } else {
                    resolve(this.lastID);
                }
            }
        );
        
        db.close();
    });
}

function updateJob(jobId, status, result = null, error = null) {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(DB_PATH);
        const now = new Date().toISOString();
        
        db.run(
            'UPDATE jobs SET status=?, result=?, error=?, updated_at=? WHERE id=?',
            [status, result, error, now, jobId],
            function(err) {
                if (err) {
                    console.error('Erro ao atualizar job:', err);
                    reject(err);
                } else {
                    resolve(this.changes);
                }
            }
        );
        
        db.close();
    });
}

function getJob(jobId) {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(DB_PATH);
        
        db.get('SELECT * FROM jobs WHERE id = ?', [jobId], (err, row) => {
            if (err) {
                console.error('Erro ao obter job:', err);
                reject(err);
            } else {
                resolve(row);
            }
        });
        
        db.close();
    });
}

// Função para obter instância do bot
function getBotInstance() {
    return new Promise(async (resolve, reject) => {
        if (botLock) {
            // Aguardar um pouco se o bot estiver sendo inicializado
            setTimeout(() => getBotInstance().then(resolve).catch(reject), 1000);
            return;
        }

        if (botInstance) {
            resolve(botInstance);
            return;
        }

        botLock = true;
        try {
                console.log('Criando nova instância do bot...');
                // Aumentar tempo de espera para dar tempo do QR renderizar
                botInstance = new WhatsAppBot(false, 45000);

                // Start with a safety timeout so we don't hang forever if chromedriver blocks
                const startTimeoutMs = 60000; // 60 seconds
                console.log(`Iniciando o bot com timeout de ${startTimeoutMs}ms para criação do driver`);
                try {
                    const started = await Promise.race([
                        botInstance.start(),
                        new Promise((_, rejectTimeout) => setTimeout(() => rejectTimeout(new Error('Timeout ao iniciar o driver')), startTimeoutMs))
                    ]);

                    if (!started) {
                        console.error('Falha ao iniciar bot - start() retornou falso');
                        try {
                            await botInstance.stop();
                        } catch (stopErr) {
                            console.warn('Erro ao parar instância após falha de start():', stopErr && stopErr.message ? stopErr.message : stopErr);
                        }
                        botInstance = null;
                        reject(new Error('Falha ao iniciar bot - start() retornou falso'));
                        return;
                    }
                } catch (startErr) {
                    console.error('Erro ao iniciar driver do bot:', startErr && startErr.stack ? startErr.stack : startErr);
                    // cleanup
                    try {
                        if (botInstance) await botInstance.stop();
                    } catch (stopErr) {
                        console.warn('Erro ao limpar instância do bot após falha:', stopErr && stopErr.message ? stopErr.message : stopErr);
                    }
                    botInstance = null;
                    reject(startErr);
                    return;
                }
            
            console.log('✅ Bot iniciado com sucesso!');
            resolve(botInstance);
        } catch (error) {
            console.error('Erro ao criar instância do bot:', error);
            console.error('Possíveis causas:');
            console.error('1. Chrome não está instalado');
            console.error('2. Chromedriver não encontrado');
            console.error('3. Porta já em uso');
            console.error('4. Permissões insuficientes');
            botInstance = null;
            reject(error);
        } finally {
            botLock = false;
        }
    });
}

// Função para enviar mensagens em background
async function backgroundSendMessages(jobId, contacts, message) {
    try {
        await updateJob(jobId, 'running');
        
        const bot = await getBotInstance();
        if (!bot) {
            await updateJob(jobId, 'failed', null, 'Bot não disponível');
            return;
        }
        
        console.log(`Enviando mensagens para ${contacts.length} contatos`);
        const results = await bot.sendMessages(contacts, message);
        
        if (results.sent && results.sent.length > 0) {
            await updateJob(jobId, 'finished', `Mensagens enviadas para ${results.sent.length} contatos`);
        } else {
            await updateJob(jobId, 'failed', null, 'Nenhuma mensagem foi enviada');
        }
        
    } catch (error) {
        console.error('Erro no envio em background:', error);
        await updateJob(jobId, 'failed', null, error.message);
    }
}

// Rotas da API
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        bot_status: botInstance ? (botInstance.isLoggedIn ? 'connected' : 'initializing') : 'not_started'
    });
});

app.post('/api/bot/start', async (req, res) => {
    try {
        if (botInstance) {
            return res.json({ 
                status: 'already_started', 
                message: 'Bot já está inicializado',
                bot_status: botInstance.isLoggedIn ? 'connected' : 'initializing'
            });
        }
        
        console.log('🚀 Inicializando bot manualmente...');
        const bot = await getBotInstance();
        
        if (bot) {
            res.json({ 
                status: 'started', 
                message: 'Bot inicializado com sucesso',
                bot_status: bot.isLoggedIn ? 'connected' : 'initializing'
            });
        } else {
            res.status(500).json({ 
                status: 'error', 
                message: 'Falha ao inicializar bot' 
            });
        }
        
    } catch (error) {
        console.error('Erro ao inicializar bot:', error);
        res.status(500).json({ 
            status: 'error', 
            message: error.message 
        });
    }
});

app.post('/api/bot/stop', async (req, res) => {
    try {
        if (!botInstance) {
            return res.json({ 
                status: 'not_started', 
                message: 'Bot não está inicializado'
            });
        }
        
        console.log('🛑 Parando bot...');
        await botInstance.stop();
        botInstance = null;
        
        res.json({ 
            status: 'stopped', 
            message: 'Bot parado com sucesso'
        });
        
    } catch (error) {
        console.error('Erro ao parar bot:', error);
        res.status(500).json({ 
            status: 'error', 
            message: error.message 
        });
    }
});

app.post('/api/bot/restart', async (req, res) => {
    try {
        console.log('🔄 Reiniciando bot...');
        
        // Parar bot atual se existir
        if (botInstance) {
            await botInstance.stop();
            botInstance = null;
        }
        
        // Aguardar um pouco
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Inicializar novo bot
        const bot = await getBotInstance();
        
        if (bot) {
            res.json({ 
                status: 'restarted', 
                message: 'Bot reiniciado com sucesso',
                bot_status: bot.isLoggedIn ? 'connected' : 'initializing'
            });
        } else {
            res.status(500).json({ 
                status: 'error', 
                message: 'Falha ao reiniciar bot' 
            });
        }
        
    } catch (error) {
        console.error('Erro ao reiniciar bot:', error);
        res.status(500).json({ 
            status: 'error', 
            message: error.message 
        });
    }
});

app.get('/api/contacts', async (req, res) => {
    try {
        console.log('📞 Solicitação de contatos recebida...');
        
        // Verificar se o bot está disponível sem tentar inicializar
        if (!botInstance) {
            return res.status(503).json({ 
                error: 'Bot não inicializado. Acesse a página principal primeiro para inicializar o bot.' 
            });
        }
        
        if (!botInstance.isLoggedIn) {
            return res.status(401).json({ 
                error: 'Bot não está logado no WhatsApp Web. Escaneie o QR Code primeiro.' 
            });
        }
        
        console.log('🔍 Obtendo lista de contatos...');
        const contacts = await botInstance.getContacts();
        
        console.log(`✅ ${contacts.length} contatos obtidos com sucesso`);
        res.json({ contacts: contacts, count: contacts.length });
        
    } catch (error) {
        console.error('❌ Erro ao obter contatos:', error);
        res.status(500).json({ error: error.message });
    }
});

// Debug endpoint to retrieve last saved WhatsApp QR screenshot
app.get('/api/debug/qr', (req, res) => {
    const ssPath = path.join(__dirname, 'whatsapp_qr_debug.png');
    if (fs.existsSync(ssPath)) {
        return res.sendFile(ssPath);
    }
    return res.status(404).json({ error: 'screenshot not found', path: ssPath });
});

app.post('/api/send', async (req, res) => {
    try {
        const { contacts, message } = req.body;
        
        // Validação mais robusta
        if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
            return res.status(400).json({ error: 'Pelo menos um contato é obrigatório' });
        }
        
        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            return res.status(400).json({ error: 'Mensagem é obrigatória' });
        }
        
        // Criar job
        const jobId = uuidv4();
        await createJob(jobId, 'queued');
        
        // Iniciar envio em background
        backgroundSendMessages(jobId, contacts, message).catch(console.error);
        
        res.status(202).json({ job_id: jobId, status: 'queued' });
        
    } catch (error) {
        console.error('Erro ao enviar mensagens:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/job/:jobId', async (req, res) => {
    try {
        const job = await getJob(req.params.jobId);
        if (!job) {
            return res.status(404).json({ error: 'Job não encontrado' });
        }
        
        res.json(job);
        
    } catch (error) {
        console.error('Erro ao obter job:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/instances', (req, res) => {
    const db = new sqlite3.Database(DB_PATH);
    
    db.all('SELECT * FROM instances ORDER BY created_at DESC', (err, rows) => {
        if (err) {
            console.error('Erro ao listar instâncias:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        
        const instances = rows.map(row => ({
            id: row.id,
            name: row.name,
            contacts: row.contacts ? row.contacts.split(',') : [],
            message: row.message,
            created_at: row.created_at,
            updated_at: row.updated_at
        }));
        
        res.json({ instances });
    });
    
    db.close();
});

app.get('/api/instances/:instanceId', (req, res) => {
    const db = new sqlite3.Database(DB_PATH);
    
    db.get('SELECT * FROM instances WHERE id = ?', [req.params.instanceId], (err, row) => {
        if (err) {
            console.error('Erro ao obter instância:', err);
            res.status(500).json({ error: err.message });
        } else if (!row) {
            res.status(404).json({ error: 'Instância não encontrada' });
        } else {
            const instance = {
                id: row.id,
                name: row.name,
                contacts: row.contacts ? row.contacts.split(',') : [],
                message: row.message,
                created_at: row.created_at,
                updated_at: row.updated_at
            };
            res.json(instance);
        }
    });
    
    db.close();
});

app.post('/api/instances', (req, res) => {
    try {
        const { name, contacts, message } = req.body;
        
        // Validação mais robusta
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return res.status(400).json({ error: 'Nome é obrigatório' });
        }
        
        if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
            return res.status(400).json({ error: 'Pelo menos um contato é obrigatório' });
        }
        
        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            return res.status(400).json({ error: 'Mensagem é obrigatória' });
        }
        
        const instanceId = uuidv4();
        const now = new Date().toISOString();
        
        const db = new sqlite3.Database(DB_PATH);
        db.run(
            'INSERT INTO instances (id, name, contacts, message, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
            [instanceId, name, contacts.join(','), message, now, now],
            function(err) {
                if (err) {
                    console.error('Erro ao criar instância:', err);
                    res.status(500).json({ error: err.message });
                } else {
                    res.status(201).json({
                        id: instanceId,
                        name: name,
                        contacts: contacts,
                        message: message,
                        created_at: now,
                        updated_at: now
                    });
                }
            }
        );
        
        db.close();
        
    } catch (error) {
        console.error('Erro ao criar instância:', error);
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/instances/:instanceId', (req, res) => {
    try {
        const { name, contacts, message } = req.body;
        
        // Validação mais robusta
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return res.status(400).json({ error: 'Nome é obrigatório' });
        }
        
        if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
            return res.status(400).json({ error: 'Pelo menos um contato é obrigatório' });
        }
        
        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            return res.status(400).json({ error: 'Mensagem é obrigatória' });
        }
        
        const now = new Date().toISOString();
        
        const db = new sqlite3.Database(DB_PATH);
        db.run(
            'UPDATE instances SET name=?, contacts=?, message=?, updated_at=? WHERE id=?',
            [name, contacts.join(','), message, now, req.params.instanceId],
            function(err) {
                if (err) {
                    console.error('Erro ao atualizar instância:', err);
                    res.status(500).json({ error: err.message });
                } else if (this.changes === 0) {
                    res.status(404).json({ error: 'Instância não encontrada' });
                } else {
                    res.json({
                        id: req.params.instanceId,
                        name: name,
                        contacts: contacts,
                        message: message,
                        updated_at: now
                    });
                }
            }
        );
        
        db.close();
        
    } catch (error) {
        console.error('Erro ao atualizar instância:', error);
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/instances/:instanceId', (req, res) => {
    const db = new sqlite3.Database(DB_PATH);
    
    db.run('DELETE FROM instances WHERE id = ?', [req.params.instanceId], function(err) {
        if (err) {
            console.error('Erro ao deletar instância:', err);
            res.status(500).json({ error: err.message });
        } else if (this.changes === 0) {
            res.status(404).json({ error: 'Instância não encontrada' });
        } else {
            res.json({ status: 'deleted' });
        }
    });
    
    db.close();
});

// Inicializar servidor
async function startServer() {
    try {
        await initDatabase();
        console.log('Iniciando servidor Express...');
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Servidor rodando na porta ${PORT}`);
            console.log(`Acesse: http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Erro ao iniciar servidor:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('Parando servidor...');
    if (botInstance) {
        botInstance.stop();
    }
    process.exit(0);
});

startServer();
