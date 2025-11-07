// Servidor do API Gateway
const express = require('express');
const { audioProcessingLimiter } = require('./middlewares/rateLimit.middleware');
const { validateAudioRequest } = require('./middlewares/validation.middleware');
const { getFileUrl, transcribeAudio } = require('./clients/transcription.client');
const app = express();

const PORT = process.env.PORT || 8080;

app.use(express.json());

// --- CONTRATO 1 (Receber do MS Telegram) ---
// Pipeline: Rate Limit → Validação → Handler
app.post('/api/v1/process-audio', 
    audioProcessingLimiter,  // 1. MITIGAÇÃO ID 08: Rate Limit por usuário
    validateAudioRequest,     // 2. MITIGAÇÃO ID 08: Validação de integridade e tamanho
    async (req, res) => {     // 3. Handler: Orquestra os contratos 2, 3 e 4
        const { chat_id, user_id, file_id, file_size_bytes } = req.body;
        
        console.log(`[API Gateway] Recebido job para user ${user_id}`);
        
        // Responde imediatamente (processamento assíncrono)
        res.status(200).json({ 
            status: "received", 
            message: "Áudio recebido e enfileirado para processamento." 
        });
        
        try {
            // --- CONTRATO 2: Transcrição (Whisper) ---
            console.log(`[API Gateway] Iniciando CONTRATO 2 (Transcrição)...`);
            const file_url = await getFileUrl(file_id);
            const transcription = await transcribeAudio(file_url);
            console.log(`[API Gateway] CONTRATO 2 concluído!`);
            
            // --- CONTRATO 3: Sumarização (LangChain) ---
            // TODO: Implementar chamada ao LangChain
            console.log(`[API Gateway] TODO: CONTRATO 3 (Sumarização)`);
            
            // --- CONTRATO 4: Enviar Resposta (MS Telegram) ---
            // TODO: Implementar envio da resposta ao usuário
            console.log(`[API Gateway] TODO: CONTRATO 4 (Resposta)`);
            
            console.log(`[API Gateway] Processamento concluído para user ${user_id}`);
            
        } catch (error) {
            console.error(`[API Gateway] ERRO no processamento:`, error.message);
            // TODO: Notificar usuário do erro
        }
    }
);

app.listen(PORT, () => {
    console.log(`[API Gateway] Serviço rodando na porta ${PORT}`);
});