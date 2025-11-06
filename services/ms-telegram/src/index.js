// Servidor "Mock" do MS Telegram
const express = require('express');
const app = express();
const axios = require('axios');

const PORT = process.env.PORT || 8080;
const API_GATEWAY_URL = process.env.API_GATEWAY_URL;
const TELEGRAM_SECRET_TOKEN = process.env.TELEGRAM_SECRET_TOKEN;

app.use(express.json());

// --- CONTRATO 1 (Webhook do Telegram) ---
// Este é o endpoint que o Telegram chama
app.post('/webhook', (req, res) => {
    console.log("[MS Telegram] Webhook recebido!");

    // MITIGAÇÃO ID 05: Validar o token secreto
    const secretToken = req.headers['x-telegram-bot-api-secret-token'];
    if (secretToken !== TELEGRAM_SECRET_TOKEN) {
        console.warn("[MS Telegram] Token secreto inválido. Rejeitado.");
        return res.status(401).send('Unauthorized');
    }

    // Dados "mock" do webhook (o dev irá implementar a lógica real)
    const MOCK_DATA = {
        chat_id: 12345,
        user_id: 98765,
        file_id: "MOCK_FILE_ID",
        file_size_bytes: 50000
    };
    
    // Chamar o API Gateway (Contrato 1)
    axios.post(`${API_GATEWAY_URL}/api/v1/process-audio`, MOCK_DATA)
        .then(response => {
            console.log("[MS Telegram] Áudio enviado ao API Gateway.");
            // Responde 200 OK para o Telegram
            res.status(200).send(response.data);
        })
        .catch(err => {
            console.error("[MS Telegram] Erro ao chamar API Gateway:", err.message);
            res.status(500).send('Erro interno');
        });
});

// --- CONTRATO 4 (Receber Resposta) ---
app.post('/send-reply', (req, res) => {
    const { chat_id, message_text } = req.body;
    console.log(`[MS Telegram] MOCK: Enviando resposta para o chat ${chat_id}:`);
    console.log(message_text);
    
    // O dev aqui implementaria a chamada real à API do Telegram
    
    res.status(200).json({ status: "sent" });
});

app.listen(PORT, () => {
    console.log(`[MS Telegram] Serviço "Mock" rodando na porta ${PORT}`);
});