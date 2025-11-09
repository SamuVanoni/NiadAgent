// Servidor do API Gateway
const express = require('express');

// Importação de middlewares
const { audioProcessingLimiter } = require('./middlewares/rateLimit.middleware');
const { validateAudioRequest } = require('./middlewares/validation.middleware');

// Importação de clients
const { getFileUrl, transcribeAudio } = require('./clients/transcription.client');
const { summarizeText } = require('./clients/langchain.client');
const { sendTelegramMessage } = require('./clients/telegram.client');


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
            
            // Verificação simples da transcrição
            if (!transcription || transcription.trim() === "") {
                throw new Error("A transcrição resultou em um texto vazio.");
            }
            console.log(`[API Gateway] CONTRATO 2 concluído! (Transcrição com ${transcription.length} caracteres)`);
            
            // --- CONTRATO 3: Sumarização (LangChain) ---
            console.log(`[API Gateway] Iniciando CONTRATO 3 (Sumarização)...`);
            
            // Chama o novo cliente do LangChain seguindo o contrato
            const summary = await summarizeText(transcription, user_id);
            
            console.log(`[API Gateway] CONTRATO 3 concluído!`);
            
            // --- CONTRATO 4: Enviar Resposta (MS Telegram) ---
            console.log(`[API Gateway] Iniciando CONTRATO 4 (Resposta)...`);
            
            // Envia o resumo final para o microserviço do Telegram
            await sendTelegramMessage(chat_id, summary);
            
            console.log(`[API Gateway] CONTRATO 4 concluído!`);
            
            console.log(`[API Gateway] Processamento CONCLUÍDO com sucesso para user ${user_id}`);            
        } catch (error) {
            console.error(`[API Gateway] ERRO no processamento (user ${user_id}):`, error.message);
            
            // --- Notificação de Erro (Contrato 4 de Falha) ---
            // Tenta notificar o usuário sobre o erro
            try {
                const friendlyErrorMessage = "Desculpe, ocorreu um erro ao processar seu áudio. A equipe técnica já foi notificada.";
                await sendTelegramMessage(chat_id, friendlyErrorMessage);
                console.log(`[API Gateway] Usuário ${user_id} notificado sobre o erro.`);
            } catch (notifyError) {
                // Se até a notificação falhar, apenas logamos
                console.error(`[API Gateway] FALHA AO NOTIFICAR usuário ${user_id} sobre o erro:`, notifyError.message);
            }
        }
    }
);

app.listen(PORT, () => {
    console.log(`[API Gateway] Serviço rodando na porta ${PORT}`);
});