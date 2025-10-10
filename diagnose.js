const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const { Options, ServiceBuilder } = require('selenium-webdriver/chrome');
const path = require('path');
const fs = require('fs');

async function diagnose() {
    console.log('🔍 Diagnóstico do WhatsApp Bot');
    console.log('=====================================');
    
    // 1. Verificar Node.js
    console.log('1. ✅ Node.js:', process.version);
    
    // 2. Verificar dependências
    console.log('2. Verificando dependências...');
    try {
        require('selenium-webdriver');
        console.log('   ✅ selenium-webdriver: OK');
    } catch (e) {
        console.log('   ❌ selenium-webdriver: FALTANDO');
        return;
    }
    
    // 3. Verificar Chrome
    console.log('3. Verificando Chrome...');
    const chromePaths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe'
    ];
    
    let chromeFound = false;
    for (const chromePath of chromePaths) {
        if (fs.existsSync(chromePath)) {
            console.log('   ✅ Chrome encontrado:', chromePath);
            chromeFound = true;
            break;
        }
    }
    
    if (!chromeFound) {
        console.log('   ❌ Chrome não encontrado nos caminhos padrão');
        console.log('   💡 Instale o Google Chrome em: https://www.google.com/chrome/');
        return;
    }
    
    // 4. Verificar Chromedriver
    console.log('4. Verificando Chromedriver...');
    const chromedriverPath = path.join(__dirname, 'chromedriver.exe');
    if (fs.existsSync(chromedriverPath)) {
        console.log('   ✅ Chromedriver local encontrado');
    } else {
        console.log('   ⚠️  Chromedriver local não encontrado, tentando automático...');
    }
    
    // 5. Testar criação do driver
    console.log('5. Testando criação do driver...');
    let driver = null;
    try {
        const options = new Options();
        options.addArguments('--no-sandbox');
        options.addArguments('--disable-dev-shm-usage');
        options.addArguments('--disable-blink-features=AutomationControlled');
        options.addArguments('--disable-web-security');
        options.addArguments('--disable-features=VizDisplayCompositor');
        options.excludeSwitches('enable-automation');
        options.addArguments('--disable-automation');
        
        // Usar ChromeDriver automático para compatibilidade
        console.log('   Usando ChromeDriver automático');
        
        driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(options)
            .build();
        console.log('   ✅ Driver criado com sucesso!');
        
        // 6. Testar navegação
        console.log('6. Testando navegação...');
        await driver.get('https://www.google.com');
        const title = await driver.getTitle();
        console.log('   ✅ Navegação funcionando, título:', title);
        
    } catch (error) {
        console.log('   ❌ Erro ao criar driver:', error.message);
        console.log('   💡 Possíveis soluções:');
        console.log('      - Execute como administrador');
        console.log('      - Desative temporariamente o antivírus');
        console.log('      - Verifique se o Chrome está atualizado');
        console.log('      - Feche todas as janelas do Chrome');
        return;
    } finally {
        if (driver) {
            try {
                await driver.quit();
                console.log('   ✅ Driver fechado com sucesso');
            } catch (e) {
                console.log('   ⚠️  Erro ao fechar driver:', e.message);
            }
        }
    }
    
    // 7. Verificar processos Chrome
    console.log('7. Verificando processos Chrome...');
    const { exec } = require('child_process');
    exec('tasklist /FI "IMAGENAME eq chrome.exe"', (error, stdout, stderr) => {
        if (stdout.includes('chrome.exe')) {
            console.log('   ⚠️  Há processos Chrome rodando');
            console.log('   💡 Feche todas as janelas do Chrome e tente novamente');
        } else {
            console.log('   ✅ Nenhum processo Chrome rodando');
        }
    });
    
    console.log('\n🎉 Diagnóstico concluído!');
    console.log('💡 Se tudo estiver OK, execute: npm start');
}

diagnose().catch(console.error);
