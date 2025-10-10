const { Builder, By, Key, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const { Options, ServiceBuilder } = require('selenium-webdriver/chrome');
const path = require('path');
const fs = require('fs'class WhatsAppBot {
    constructor(headless = null, waitTimeout = 30000) {
        this.driver = null;
        this.waitTimeout = waitTimeout;
        // Auto-detectar se deve rodar em headless baseado no ambiente
        // Em produção (sem DISPLAY), usar headless automaticamente
        if (headless === null) {
            this.headless = !process.env.DISPLAY || process.env.NODE_ENV === 'production';
        } else {
            this.headless = headless;
        }
        this.isLoggedIn = false;
        console.log(`🔧 Modo headless: ${this.headless ? 'ATIVADO' : 'DESATIVADO'}`);
    }alse;
      async start() {
        try {
            console.log('🔧 Iniciando WhatsApp Bot...');
            console.log(`📦 Ambiente: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🖥️  Display: ${process.env.DISPLAY || 'nenhum (headless obrigatório)'}`);Bot...');
               // Configurações do Chrome - otimizadas para WhatsApp Web
            const options = new Options();
            
            // Flags essenciais para ambientes de produção/container
            options.addArguments('--no-sandbox');
            options.addArguments('--disable-dev-shm-usage');
            options.addArguments('--disable-gpu');
            options.addArguments('--disable-software-rasterizer');
            
            // Flags para servidores sem display gráfico
            if (this.headless) {
                console.log('🖥️  Executando em modo headless (sem interface gráfica)');
                options.addArguments('--headless=new'); // Chrome 109+
                options.addArguments('--disable-extensions');
                options.addArguments('--remote-debugging-port=9222');
            }
            
            // Flags adicionais para estabilidade
            options.addArguments('--disable-blink-features=AutomationControlled');
            options.addArguments('--disable-web-security');
            options.addArguments('--disable-features=VizDisplayCompositor');
            options.addArguments('--disable-setuid-sandbox');
            options.addArguments('--disable-infobars');
            options.addArguments('--window-size=1280,720');
            
            // Configurações experimentais para Selenium 4.x
            options.excludeSwitches('enable-automation');
            options.addArguments('--disable-automation');
            
            // Não maximizar em headless
            if (!this.headless) {
                options.addArguments('--start-maximized');
            }Arguments('--start-maximiz			// Usar perfil de usuário dedicado para persistir sessão
			// IMPORTANTE: Em servidores efêmeros (como OnRender), a sessão não persiste entre restarts
			const userDataDir = path.join(process.cwd(), 'chrome-profile');
			try {
				if (!fs.existsSync(userDataDir)) {
					fs.mkdirSync(userDataDir, { recursive: true });
				}
				options.addArguments(`user-data-dir=${userDataDir}`);
				options.addArguments('--profile-directory=Default');
				console.log('👤 Usando perfil do Chrome em', userDataDir);
			} catch (e) {
				console.warn('⚠️ Não foi possível configurar user-data-dir:', e && e.message ? e.message : e);
				// Em produção, continuar mesmo sem user-data-dir
			}? e.message : e);
			}
            
            console.log('📋 Configurações do Chrome aplicadas');
            
            // Usar ChromeDriver automático (compatível com a versão do Chrome)
            console.log('✅ Usando ChromeDriver automático');
            
            // Criar driver
            console.log('🚀 Criando driver...');
            this.driver = await new Builder()
                .forBrowser('chrome')
                .setChromeOptions(options)
                .build();
            console.log('✅ Driver criado com sucesso!');
            
            // Executar script para remover webdriver property
            await this.driver.executeScript("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})");
            
			// Abrir WhatsApp Web
            console.log('🌐 Abrindo WhatsApp Web...');
            await this.driver.get('https://web.whatsapp.com');
            
            // Diagnostics: maximize window, log url/title and save screenshot to help debug QR visibility
            try {
                try {
                    await this.driver.manage().window().maximize();
                } catch (e) {
                    // ignore if not supported
                }
                const currentUrl = await this.driver.getCurrentUrl();
                const title = await this.driver.getTitle();
                console.log(`🔍 Página aberta: url=${currentUrl} title=${title}`);
                try {
                    const png = await this.driver.takeScreenshot();
                    const ssPath = path.join(process.cwd(), 'whatsapp_qr_debug.png');
                    fs.writeFileSync(ssPath, png, 'base64');
                    console.log('📸 Screenshot salvo em', ssPath);
                } catch (e) {
                    console.warn('📸 Falha ao salvar screenshot:', e && e.message ? e.message : e);
                }
            } catch (e) {
                console.warn('⚠️ Diagnostics after opening WhatsApp failed:', e && e.message ? e.message : e);
            }

                // Aguardar carregamento inicial - usar waitTimeout para páginas lentas
				const initialWait = Math.min(60, Math.max(10, Math.ceil(this.waitTimeout / 1000)));
				console.log(`⏳ Aguardando carregamento da página (${initialWait}s)...`);
				// Esperar DOM pronto ou até timeout
				const end = Date.now() + initialWait * 1000;
				while (Date.now() < end) {
					try {
						const ready = await this.driver.executeScript('return document.readyState');
						if (ready === 'complete') break;
					} catch (_) {}
					await this.driver.sleep(500);
				}
            
            // Verificar se já está logado
			console.log('🔍 Verificando status de login...');
			await this.check        } catch (error) {
            console.error('❌ Erro ao iniciar bot:', error);
            console.error('Detalhes do erro:', error.message);
            
            // Mensagens de erro mais específicas
            if (error.message.includes('chrome') || error.message.includes('Chrome')) {
                console.error('🚫 PROBLEMA: Chrome não encontrado ou não instalado corretamente');
                console.error('🛠️  SOLUÇÃO para OnRender:');
                console.error('   1. Adicione um arquivo render.yaml com instalação do Chrome');
                console.error('   2. Ou use um Dockerfile customizado com Chrome instalado');
                console.error('   3. Veja: https://render.com/docs/docker');
            }
            
            if (error.message.includes('session')) {
                console.error('🚫 PROBLEMA: Falha ao criar sessão do Chrome');
                console.error('🛠️  SOLUÇÃO: Verifique se as flags do Chrome estão corretas');
            }
            
            if (this.driver) {
                try {
                    await this.driver.quit();
                } catch (quitError) {
                    console.error('Erro ao fechar driver:', quitError);
                }
                this.driver = null;
            }
            return false;
        }          this.driver = null;
            }
            return false;
        }
    }

    async checkLoginStatus() {
        try {
            console.log('🔍 Verificando status de login...');
            
			// Aguardar carregamento da página
			await this.driver.sleep(3000);
			
			// Tentar forçar exibição do QR: clicar no botão de recarregar QR se existir
			try {
				const refreshBtn = await this.driver.findElement(By.css("[data-testid='refresh-large']"));
				if (refreshBtn) {
					await refreshBtn.click();
					console.log('🔄 Botão de recarregar QR clicado');
					await this.driver.sleep(2000);
				}
			} catch (_) {}
            
            // Verificar se já está logado procurando por elementos específicos
            try {
                // Procurar por elementos que indicam que está logado
                const chatList = await this.driver.findElement(By.css("[data-testid='chat-list']"));
                if (chatList) {
                    this.isLoggedIn = true;
                    console.log('✅ WhatsApp Web já está logado!');
                    return true;
                }
            } catch (error) {
                console.log('📋 Lista de chats não encontrada, verificando QR Code...');
            }
            
            // Se não encontrou chat-list, verificar se há QR code
            try {
                // Procurar QR Code por diferentes seletores
                let qrCode = null;
				const qrSelectors = [
					"[data-ref]",
					"canvas[aria-label*='Scan me']",
					"[data-testid='qrcode']",
					"[data-testid='qr-code']",
					".qr-wrapper",
					"div[role='img'][aria-label*='QR']"
				];
                
                for (const selector of qrSelectors) {
                    try {
                        qrCode = await this.driver.findElement(By.css(selector));
                        if (qrCode) {
                            console.log(`📱 QR Code detectado (seletor: ${selector})`);
                            break;
                        }
                    } catch (e) {
                        continue;
                    }
                }
                
                if (qrCode) {
                    console.log('📱 QR Code detectado!');
                    console.log('📲 INSTRUÇÕES:');
                    console.log('   1. Abra o WhatsApp no seu celular');
                    console.log('   2. Toque em "Menu" ou "Configurações"');
                    console.log('   3. Toque em "Dispositivos conectados"');
                    console.log('   4. Toque em "Conectar um dispositivo"');
                    console.log('   5. Escaneie o QR Code que aparece na tela do computador');
                    console.log('⏳ Aguardando login... (máximo 30 segundos)');
                    
                    // Aguardar login com timeout configurável (this.waitTimeout em ms)
					const maxWait = Math.max(20, Math.ceil(this.waitTimeout / 1000)); // mínimo 20s
                    for (let i = 0; i < maxWait; i++) {
                        await this.driver.sleep(1000);
                        if (i % 5 === 0) { // Mostrar progresso a cada 5 segundos
                            console.log(`   Aguardando login... ${i}/${maxWait}s`);
                        }

                        try {
                            await this.driver.findElement(By.css("[data-testid='chat-list']"));
                            this.isLoggedIn = true;
                            console.log('🎉 Login realizado com sucesso!');
                            return true;
                        } catch (error) {
                            continue;
                        }
                    }
                    
                    console.warn('⏰ Timeout aguardando login');
                    console.log('💡 Se o QR Code não apareceu, tente:');
                    console.log('   - Recarregar a página no navegador');
                    console.log('   - Fechar e reabrir o navegador');
                    console.log('   - Verificar se não há outras sessões ativas');
                    return false;
                } else {
                    console.log('⚠️  QR Code não encontrado');
                }
            } catch (error) {
                console.log('⚠️  Erro ao procurar QR Code:', error.message);
            }
            
            // Tentar uma abordagem mais simples - verificar se há elementos de contato
            try {
                console.log('🔍 Verificando elementos da página...');
                const spansWithTitle = await this.driver.findElements(By.css("span[title]"));
                if (spansWithTitle.length > 5) { // Se há muitos spans com title, provavelmente está logado
                    this.isLoggedIn = true;
                    console.log('✅ WhatsApp Web está logado (detectado por elementos)');
                    return true;
                }
            } catch (error) {
                console.log('⚠️  Erro ao verificar elementos:', error.message);
            }
            
            console.warn('❌ Não foi possível determinar o status de login');
            console.log('💡 POSSÍVEIS SOLUÇÕES:');
            console.log('   1. Verifique se o navegador está aberto e visível');
            console.log('   2. Recarregue a página manualmente (F5)');
            console.log('   3. Feche outras sessões do WhatsApp Web');
            console.log('   4. Verifique sua conexão com a internet');
            return false;
                    
        } catch (error) {
            console.error('Erro ao verificar login:', error);
            return false;
        }
    }

    async getContacts() {
        if (!this.isLoggedIn) {
            console.error('Bot não está logado');
            return [];
        }
        
        try {
            // Aguardar carregamento da lista de contatos
            await this.driver.wait(until.elementLocated(By.css("[data-testid='chat-list']")), 10000);
            
            // Script JavaScript para obter nomes dos contatos
            const script = `
                const contacts = [];
                const chatItems = document.querySelectorAll('[data-testid="chat-list"] [role="listitem"]');
                
                chatItems.forEach(item => {
                    const nameElement = item.querySelector('[data-testid="cell-frame-container"] span[title]');
                    if (nameElement) {
                        const name = nameElement.getAttribute('title');
                        if (name && name.trim()) {
                            contacts.push(name.trim());
                        }
                    }
                });
                
                return contacts;
            `;
            
            const contacts = await this.driver.executeScript(script);
            console.log(`Encontrados ${contacts.length} contatos`);
            return contacts;
            
        } catch (error) {
            console.error('Erro ao obter contatos:', error);
            return [];
        }
    }

    async sendMessage(contactName, message) {
        if (!this.isLoggedIn) {
            console.error('Bot não está logado');
            return false;
        }
        
        try {
            console.log(`Enviando mensagem para: ${contactName}`);
            
            // Script para encontrar e clicar no contato
            const clickScript = `
                const contactName = "${contactName}";
                const chatItems = document.querySelectorAll('[data-testid="chat-list"] [role="listitem"]');
                
                for (let item of chatItems) {
                    const nameElement = item.querySelector('[data-testid="cell-frame-container"] span[title]');
                    if (nameElement) {
                        const name = nameElement.getAttribute('title');
                        if (name && name.trim() === contactName) {
                            nameElement.click();
                            return true;
                        }
                    }
                }
                return false;
            `;
            
            // Tentar clicar no contato
            const clicked = await this.driver.executeScript(clickScript);
            if (!clicked) {
                console.error(`Contato '${contactName}' não encontrado`);
                return false;
            }
            
            // Aguardar o chat abrir
            await this.driver.sleep(2000);
            
            // Aguardar campo de mensagem aparecer
            const messageBox = await this.driver.wait(
                until.elementLocated(By.css("[data-testid='conversation-compose-box-input']")),
                10000
            );
            
            // Limpar campo e digitar mensagem
            await messageBox.clear();
            await messageBox.sendKeys(message);
            
            // Aguardar um pouco antes de enviar
            await this.driver.sleep(1000);
            
            // Enviar mensagem (pressionar Enter)
            await messageBox.sendKeys(Key.ENTER);
            
            console.log(`✅ Mensagem enviada para ${contactName}`);
            return true;
            
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
            return false;
        }
    }

    async sendMessages(contacts, message) {
        const results = { sent: [], failed: [] };
        
        for (const contact of contacts) {
            try {
                if (await this.sendMessage(contact, message)) {
                    results.sent.push(contact);
                } else {
                    results.failed.push({ contact: contact, error: 'Falha ao enviar' });
                }
            } catch (error) {
                results.failed.push({ contact: contact, error: error.message });
            }
        }
        
        return results;
    }

    async stop() {
        if (this.driver) {
            try {
                await this.driver.quit();
                console.log('Bot parado');
            } catch (error) {
                console.error('Erro ao parar bot:', error);
            } finally {
                this.driver = null;
                this.isLoggedIn = false;
            }
        }
    }
}

module.exports = WhatsAppBot;

// Teste simples se executado diretamente
if (require.main === module) {
    const bot = new WhatsAppBot();
    
    async function test() {
        try {
            if (await bot.start()) {
                const contacts = await bot.getContacts();
                console.log(`Contatos encontrados: ${contacts.length}`);
                for (let i = 0; i < Math.min(5, contacts.length); i++) {
                    console.log(`  ${i+1}. ${contacts[i]}`);
                }
                
                if (contacts.length > 0) {
                    // Teste de envio
                    const success = await bot.sendMessage(contacts[0], 'Teste do novo bot');
                    console.log(`Envio: ${success ? 'Sucesso' : 'Falha'}`);
                }
            }
        } finally {
            await bot.stop();
        }
    }
    
    test().catch(console.error);
}
