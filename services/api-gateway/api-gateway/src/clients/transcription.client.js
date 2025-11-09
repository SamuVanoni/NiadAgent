const axios = require('axios');

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const WHISPER_SERVICE_URL = process.env.WHISPER_SERVICE_URL || 'http://bot-whisper:5000';

if (!TELEGRAM_TOKEN) {
    console.error("[Transcription Client] ERRO: TELEGRAM_TOKEN não definido");
    process.exit(1);
}

/**
 * Obtém a URL de download do arquivo do Telegram
 */
async function getFileUrl(file_id) {
    console.log(`[Transcription Client] Obtendo URL do arquivo ${file_id}...`);
    
    const response = await axios.get(
        `https://api.telegram.org/bot${TELEGRAM_TOKEN}/getFile`,
        { params: { file_id } }
    );
    
    if (!response.data.ok) {
        throw new Error('Falha ao obter informações do arquivo do Telegram');
    }
    
    const file_path = response.data.result.file_path;
    const file_url = `https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${file_path}`;
    
    console.log(`[Transcription Client] URL obtida com sucesso`);
    return file_url;
}

/**
 * CONTRATO 2: Envia áudio para transcrição no Bot Whisper
 * 
 * @param {string} file_url - URL do arquivo de áudio
 * @returns {Promise<string>} Texto transcrito
 */
async function transcribeAudio(file_url) {
    console.log(`[Transcription Client] Enviando para Whisper: ${WHISPER_SERVICE_URL}/transcribe`);
    
    const response = await axios.post(
        `${WHISPER_SERVICE_URL}/transcribe`,
        { file_url },
        { timeout: 300000 } // 5 minutos de timeout (tempo máximo de espera)
    );
    
    const transcription = response.data.transcription;
    console.log(`[Transcription Client] Transcrição recebida (${transcription.length} caracteres)`);

    console.log("TRANSCRIÇÃO RECEBIDA DO WHISPER:");
    console.log(transcription);

    return transcription;
}

module.exports = { getFileUrl, transcribeAudio };
