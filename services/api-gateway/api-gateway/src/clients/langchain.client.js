const axios = require('axios');

// URL base do seu serviço LangChain (idealmente de variáveis de ambiente)
const LANGCHAIN_SERVICE_URL = process.env.LANGCHAIN_SERVICE_URL || 'http://localhost:8082'; // Ex: http://langchain-service.internal

/**
 * Envia o texto transcrito para o serviço LangChain para sumarização.
 * Segue o "Contrato de Sumarização".
 *
 * @param {string} text_to_summarize - O texto completo transcrito pelo Whisper.
 * @param {(string|number)} user_id - O ID do usuário (para mitigação ID 06).
 * @returns {Promise<string>} - O resumo gerado pelo LangChain/Gemini.
 */
async function summarizeText(text_to_summarize, user_id) {
    const endpoint = `${LANGCHAIN_SERVICE_URL}/summarize`;
    
    // 1. Monta o corpo da requisição conforme o contrato
    const requestBody = {
        text_to_summarize,
        user_id
    };

    console.log(`[LangChain Client] Enviando ${text_to_summarize.length} caracteres para sumarização (User: ${user_id}).`);

    try {
        // 2. Faz a chamada POST
        const response = await axios.post(endpoint, requestBody, {
            headers: { 'Content-Type': 'application/json' },
            // Define um timeout razoável para LLMs (ex: 2 minutos)
            timeout: 120000 
        });

        // 3. Valida e retorna o resumo do corpo da resposta
        if (response.data && response.data.summary) {
            return response.data.summary;
        } else {
            // Se o serviço der 200 OK mas o corpo for inválido
            throw new Error("Resposta inválida do serviço de sumarização. 'summary' não encontrado.");
        }

    } catch (error) {
        if (error.response) {
            // O servidor respondeu com um status de erro (4xx, 5xx)
            console.error(`[LangChain Client] Erro do serviço LangChain (${error.response.status}):`, error.response.data);
            throw new Error(`Serviço de sumarização falhou com status ${error.response.status}`);
        } else if (error.request) {
            // A requisição foi feita, mas não houve resposta (ex: timeout, serviço offline)
            console.error(`[LangChain Client] Serviço de sumarização não respondeu:`, error.message);
            throw new Error("Não foi possível conectar ao serviço de sumarização.");
        } else {
            // Erro ao configurar a requisição
            console.error(`[LangChain Client] Erro ao configurar requisição:`, error.message);
            throw new Error(error.message);
        }
    }
}

module.exports = {
    summarizeText
};