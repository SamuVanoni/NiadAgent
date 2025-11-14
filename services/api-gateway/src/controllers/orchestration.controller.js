// Importação dos clients que fazem o trabalho pesado
const { getFileUrl, transcribeAudio } = require('../clients/transcription.client');
const { summarizeText } = require('../clients/langchain.client');
const { sendTelegramMessage } = require('../clients/telegram.client');

/**
 * Lida com todo o fluxo de processamento de áudio.
 * Esta é a lógica de orquestração (o "como fazer") que foi
 * extraída do index.js para seguir o princípio de SoC.
 */
const handleAudioProcessing = async (req, res) => {
    // 1. Extrair dados da requisição (já validados pelos middlewares)
    const { chat_id, user_id, file_id } = req.body;
    
    console.log(`[API Gateway] Recebido job para user ${user_id}`);
    
    // 2. Responder imediatamente (Contrato 1)
    // Isso libera o MS Telegram e informa que o job foi aceito.
    res.status(200).json({ 
        status: "received", 
        message: "Áudio recebido e enfileirado para processamento." 
    });
    
    // --- Início do Processamento Assíncrono ---
    // A partir daqui, o cliente original (MS Telegram) já recebeu o 200 OK.
    // O restante do fluxo acontece em background.
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
        const summary = await summarizeText(transcription, user_id);
        console.log(`[API Gateway] CONTRATO 3 concluído!`);
        
        // --- CONTRATO 4: Enviar Resposta (MS Telegram) ---
        console.log(`[API Gateway] Iniciando CONTRATO 4 (Resposta)...`);
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
};

module.exports = {
    handleAudioProcessing
};