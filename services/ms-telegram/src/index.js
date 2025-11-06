// Servidor "Mock" do MS Telegram
const express = require('express');
const { securityMiddleware } = require('./security.middleware');
const { webhookCallback } = require('./bot');
const { handleSendReply } = require('./reply.controller');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

// --- Rotas ---

// Rota do Webhook do Telegram
// 1. O Express recebe o POST em /webhook
// 2. O securityMiddleware é executado PRIMEIRO.
// 3. Se passar, o webhookCallback (do Telegraf) é executado.
app.post('/webhook', securityMiddleware, webhookCallback);

// Rota do Contrato 4 (Resposta do API Gateway)
// 1. O Express recebe o POST em /send-reply
// 2. O handleSendReply (do controller) é executado.
app.post('/send-reply', handleSendReply);

// Rota de Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: "Webhook Ok" });
});

// Inicia o servidor
app.listen(PORT, () => {
    console.log(`[MS Telegram] Serviço rodando na porta ${PORT}`);
    console.log("Lembre-se de registrar seu webhook no Telegram!");
});