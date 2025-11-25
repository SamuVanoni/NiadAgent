const { bot } = require('./bot');
const axios = require('axios');
const Stream = require('stream');

const handleSendReply = (req, res) => {
    const { chat_id, message_text } = req.body;

    if (!chat_id || !message_text) {
        console.warn("[MS Telegram] Recebida chamada /send-reply inválida.");
        return res.status(400).json({ error: "Missing chat_id or message_text" });
    }

    console.log(`[MS Telegram] Recebido Contrato 4: Enviando resposta para chat ${chat_id}`);

    bot.telegram.sendMessage(chat_id, message_text)
        .then(() => {
            res.status(200).json({ status: "sent" });
        })
        .catch(err => {
            console.error("[MS Telegram] Erro ao enviar mensagem de resposta: ", err.message);
            res.status(500).json({ error: "Failed to send message" });
        });
};

module.exports = { handleSendReply };

const handleSendFile = async (req, res) => {
    const { chat_id, pdf_url, caption } = req.body;

    if (!chat_id || !pdf_url) {
        console.warn("[MS Telegram] Recebida chamada /send-file inválida.");
        return res.status(400).json({ error: "Missing chat_id or pdf_url" });
    }

    console.log(`[MS Telegram] Recebido Contrato: Enviando arquivo para chat ${chat_id} -> ${pdf_url}`);

    try {
        // Baixa o PDF internamente entre containers
        const resp = await axios.get(pdf_url, { responseType: 'arraybuffer', timeout: 60000 });
        const buffer = Buffer.from(resp.data, 'binary');

        // Transforma em stream para compatibilidade
        const pass = new Stream.PassThrough();
        pass.end(buffer);

        // Envia o documento como upload (arquivo), evitando erro de URL inválida
        await bot.telegram.sendDocument(chat_id, { source: pass, filename: 'resumo.pdf' }, { caption: caption || '' });

        return res.status(200).json({ status: "sent" });

    } catch (err) {
        // Erros: falha ao baixar o arquivo, timeout, ou falha ao enviar ao Telegram
        console.error("[MS Telegram] Erro ao enviar arquivo: ", err.response ? (err.response.data || err.response.statusText) : err.message);
        return res.status(500).json({ error: "Failed to send file" });
    }
};

module.exports = { handleSendReply, handleSendFile };