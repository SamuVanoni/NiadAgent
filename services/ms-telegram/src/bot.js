const { Telegraf } = require('telegraf');
const axios = require('axios');

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const API_GATEWAY_URL = process.env.API_GATEWAY_URL;

if (!TELEGRAM_TOKEN || !API_GATEWAY_URL) {
    console.error("[Bot Logic] ERRO: Variáveis de ambiente essenciais não definidas");
    process.exit(1);
}

const bot = new Telegraf(TELEGRAM_TOKEN);

// Lógica para recebimento de áudio
bot.on('voice', async (ctx) => {
    console.log("[MS Telegram] Mensagem de voz recebida.");

    const voiceData = {
        chat_id: ctx.message.chat.id,
        user_id: ctx.message.from.id,
        file_id: ctx.message.voice.file_id,
        file_size_bytes: ctx.message.voice.file_size,
        // Timestamp (unix) quando a mensagem foi enviada pelo usuário.
        message_date: ctx.message.date
    };

    try {
        await axios.post(`${API_GATEWAY_URL}/api/v1/process-audio`, voiceData);
        console.log(`[MS Telegram] Job enviado ao API Gateway para user ${voiceData.user_id}`);
        ctx.reply('Seu áudio foi recebido e está sendo processado. Avisarei quando estiver pronto!');
    } catch (err) {
        console.error("[MS Telegram] Erro ao chamar API Gateway: ", err.response ? err.response.data : err.message);
        ctx.reply('Desculpe, não consegui iniciar o processamento do seu áudio. Tente novamente.');
    }
});

// Lógica simples para mensagens de texto
bot.on('text', (ctx) => {
    ctx.reply('Olá! Por favor, envie uma mensagem de voz ou áudio de reunião para que eu possa processá-la.');
});

module.exports = {
    bot,
    webhookCallback: (req, res) => bot.handleUpdate(req.body, res)
};