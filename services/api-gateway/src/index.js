// Servidor "Mock" do API Gateway
const express = require('express');
const { audioProcessingLimiter } = require('./middlewares/rateLimit.middleware');
const app = express();

const PORT = process.env.PORT || 8080;
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

app.use(express.json());

// --- CONTRATO 1 (Receber do MS Telegram) ---
// Aplica o Rate Limit antes do handler
app.post('/api/v1/process-audio', audioProcessingLimiter, (req, res) => {
    const { chat_id, user_id, file_id, file_size_bytes } = req.body;
    
    console.log(`[API Gateway] Recebido job para user ${user_id} e file ${file_id}`);

    // MITIGAÇÃO ID 08 (Tamanho): Validar o tamanho
    if (file_size_bytes > MAX_FILE_SIZE) {
        console.warn(`[API Gateway] Rejeitado: Arquivo muito grande (${file_size_bytes} bytes)`);
        return res.status(413).json({ error: "Arquivo de áudio excede o tamanho máximo permitido." });
    }

    // MITIGAÇÃO ID 08 (Taxa): Rate Limit aplicado via middleware
    console.log(`[API Gateway] Rate Limit OK para user ${user_id}`);

    console.log("[API Gateway] Job validado e enfileirado.");
    
    // O dev aqui implementaria a lógica de chamar os Contratos 2, 3 e 4
    // (Chamar Whisper, depois LangChain, depois MS Telegram)
    
    res.status(200).json({ status: "received", message: "Áudio recebido..." });
});

app.listen(PORT, () => {
    console.log(`[API Gateway] Serviço rodando na porta ${PORT}`);
});