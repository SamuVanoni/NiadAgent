// Importação dos clients que fazem o trabalho pesado
const { getFileUrl, transcribeAudio } = require('../clients/transcription.client');
const { summarizeText } = require('../clients/langchain.client');
const { sendTelegramMessage, sendTelegramFile } = require('../clients/telegram.client');
const axios = require('axios');

// URL base do serviço que gera PDF a partir de DOCX
const DOCX_SERVICE_URL = process.env.DOCX_SERVICE_URL || 'http://localhost:8090';

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
        const summaryResult = await summarizeText(transcription, user_id);
        const summary = summaryResult && summaryResult.summary ? summaryResult.summary : '';
        const meeting_date_from_llm = summaryResult && summaryResult.meeting_date ? summaryResult.meeting_date : null;
        console.log(`[API Gateway] CONTRATO 3 concluído!`);
        
        // --- CONTRATO 4: Enviar Resposta (MS Telegram) ---
        console.log(`[API Gateway] Iniciando CONTRATO 4 (Resposta - texto)...`);
        await sendTelegramMessage(chat_id, summary);
        console.log(`[API Gateway] CONTRATO 4 concluído!`);

        //  Gerar PDF a partir do template DOCX e do resumo ---
        try {
            console.log(`[API Gateway] Solicitando geração de PDF ao serviço DOCX...`);

            // Decide a data da reunião: primeiro usa o valor identificado pelo LLM,
            // caso contrário usa o timestamp da mensagem do Telegram (se fornecido),
            // senão usa a data atual.
            let when = null;
            if (meeting_date_from_llm) {
                // meeting_date_from_llm expected as 'YYYY-MM-DD'
                when = new Date(meeting_date_from_llm + 'T00:00:00');
            } else {
                const msgTimestamp = req.body.message_date ? Number(req.body.message_date) : null;
                when = msgTimestamp ? new Date(msgTimestamp * 1000) : new Date();
            }

            const monthNames = ['JANEIRO','FEVEREIRO','MARÇO','ABRIL','MAIO','JUNHO','JULHO','AGOSTO','SETEMBRO','OUTUBRO','NOVEMBRO','DEZEMBRO'];
            const dia = String(when.getDate());
            const mes = monthNames[when.getMonth()];
            const ano = String(when.getFullYear());
            const data = `${String(when.getDate()).padStart(2,'0')}/${String(when.getMonth()+1).padStart(2,'0')}/${when.getFullYear()}`;

            // Decide qual formato solicitar ao docx-service: 'docx' (padrão) ou 'pdf'
            const desiredFormat = req.body.output_format ? String(req.body.output_format).toLowerCase() : 'docx';

            const docxRequest = {
                template_name: 'summary_template.docx', // nome do template esperado na pasta templates/
                data: {
                    texto: summary,
                    data,
                    dia,
                    mes,
                    ano
                },
                format: desiredFormat
            };

            const docxResp = await axios.post(`${DOCX_SERVICE_URL}/generate`, docxRequest, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 120000
            });

            if (docxResp.data && docxResp.data.file_url) {
                const fileUrl = docxResp.data.file_url;
                const fileType = docxResp.data.file_type || (desiredFormat === 'pdf' ? 'pdf' : 'docx');
                console.log(`[API Gateway] Arquivo gerado em: ${fileUrl} (type=${fileType})`);

                // Envia o arquivo gerado ao usuário (nome de arquivo baseado no tipo)
                await sendTelegramFile(chat_id, fileUrl, `Segue o resumo em ${fileType.toUpperCase()}.`, fileType);
                console.log(`[API Gateway] Arquivo enviado para o usuário ${user_id}`);
            } else {
                console.warn('[API Gateway] Resposta inválida do docx-service (file_url ausente).');
            }

        } catch (pdfErr) {
            console.error('[API Gateway] Erro ao gerar/enviar arquivo:', pdfErr.message);
            // Notifica usuário que PDF falhou, mas o texto já foi enviado
            try {
                await sendTelegramMessage(chat_id, 'O resumo foi gerado, mas houve um erro ao criar o PDF.');
            } catch (_) {}
        }
        
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