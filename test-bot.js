const WhatsAppBot = require('./whatsapp-bot');

async function testBot() {
    console.log('🧪 Testando WhatsApp Bot...');
    console.log('=====================================');
    
    const bot = new WhatsAppBot();
    
    try {
        console.log('1. Iniciando bot...');
        const started = await bot.start();
        
        if (!started) {
            console.log('❌ Falha ao iniciar bot');
            console.log('\n🔧 Soluções possíveis:');
            console.log('1. Verifique se o Google Chrome está instalado');
            console.log('2. Feche todas as janelas do WhatsApp Web');
            console.log('3. Execute como administrador');
            console.log('4. Verifique se não há antivírus bloqueando');
            return;
        }
        
        console.log('✅ Bot iniciado com sucesso!');
        console.log('2. Aguardando login no WhatsApp Web...');
        console.log('   (Escaneie o QR Code se necessário)');
        
        // Aguardar um pouco para o usuário fazer login
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        console.log('3. Verificando status de login...');
        if (bot.isLoggedIn) {
            console.log('✅ Login confirmado!');
            
            console.log('4. Obtendo contatos...');
            const contacts = await bot.getContacts();
            console.log(`✅ Encontrados ${contacts.length} contatos`);
            
            if (contacts.length > 0) {
                console.log('\n📋 Primeiros 5 contatos:');
                contacts.slice(0, 5).forEach((contact, index) => {
                    console.log(`   ${index + 1}. ${contact}`);
                });
            }
            
            console.log('\n🎉 Teste concluído com sucesso!');
            console.log('✅ O bot está funcionando corretamente');
            
        } else {
            console.log('❌ Não foi possível confirmar o login');
            console.log('   Certifique-se de que escaneou o QR Code');
        }
        
    } catch (error) {
        console.log('❌ Erro durante o teste:', error.message);
        console.log('\n🔧 Detalhes do erro:');
        console.log(error.stack);
    } finally {
        console.log('\n5. Parando bot...');
        await bot.stop();
        console.log('✅ Bot parado');
    }
}

// Executar teste
testBot().catch(console.error);
