const axios = require('axios');

// URL base do seu microserviço do Telegram (idealmente de variáveis de ambiente)
// Este é o serviço que VOCÊ criou para gerenciar a API do Bot
const TELEGRAM_SERVICE_URL = process.env.TELEGRAM_SERVICE_URL || 'http://localhost:8081'; // Ex: http://ms-telegram.internal

/**
 * Envia uma mensagem de texto para o seu microserviço do Telegram,
 * que então a repassará ao usuário final.
 * (Contrato 4)
 *
 * @param {(string|number)} chat_id - O ID do chat para onde a mensagem deve ser enviada.
 * @param {string} text - O texto da mensagem (resumo ou erro).
 * @returns {Promise<void>}
 */
async function sendTelegramMessage(chat_id, text) {    
    // Endpoint correto do contrato
    const endpoint = `${TELEGRAM_SERVICE_URL}/send-reply`; 
    
    // Corpo da requisição correto (mapeando 'text' para 'message_text')
    const requestBody = {
        chat_id,
        message_text: text 
    };

    try {
        await axios.post(endpoint, requestBody, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000 // Timeout de 10s para enviar a mensagem
        });
        console.log(`[Telegram Client] Mensagem enviada com sucesso para o chat ${chat_id}.`);
    } catch (error) {
        if (error.response) {
            console.error(`[Telegram Client] Erro do MS-Telegram (${error.response.status}):`, error.response.data);
            throw new Error(`Serviço do Telegram falhou com status ${error.response.status}`);
        } else if (error.request) {
            console.error(`[Telegram Client] MS-Telegram não respondeu:`, error.message);
            throw new Error("Não foi possível conectar ao serviço do Telegram.");
        } else {
            console.error(`[Telegram Client] Erro ao configurar requisição:`, error.message);
            throw new Error(error.message);
        }
    }
}

module.exports = {
    sendTelegramMessage
};

// Enviar arquivo (contrato) para o MS-Telegram
async function sendTelegramFile(chat_id, file_url, caption, file_type) {
    const endpoint = `${TELEGRAM_SERVICE_URL}/send-file`;
    const requestBody = { chat_id, file_url, caption, file_type };

    try {
        await axios.post(endpoint, requestBody, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 20000
        });
        console.log(`[Telegram Client] Arquivo enviado com sucesso para o chat ${chat_id}.`);
    } catch (error) {
        if (error.response) {
            console.error(`[Telegram Client] Erro do MS-Telegram (${error.response.status}):`, error.response.data);
            throw new Error(`Serviço do Telegram falhou com status ${error.response.status}`);
        } else if (error.request) {
            console.error(`[Telegram Client] MS-Telegram não respondeu:`, error.message);
            throw new Error("Não foi possível conectar ao serviço do Telegram.");
        } else {
            console.error(`[Telegram Client] Erro ao configurar requisição:`, error.message);
            throw new Error(error.message);
        }
    }
}

module.exports = {
    sendTelegramMessage,
    sendTelegramFile
};