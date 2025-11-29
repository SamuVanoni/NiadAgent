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
    const { chat_id, file_url, caption, file_type } = req.body;

    if (!chat_id || !file_url) {
        console.warn("[MS Telegram] Recebida chamada /send-file inválida.");
        return res.status(400).json({ error: "Missing chat_id or file_url" });
    }

    console.log(`[MS Telegram] Recebido Contrato: Enviando arquivo para chat ${chat_id} -> ${file_url}`);

    try {
        // Baixa o arquivo internamente entre containers
        const resp = await axios.get(file_url, { responseType: 'arraybuffer', timeout: 60000 });
        const buffer = Buffer.from(resp.data, 'binary');

        // Transforma em stream para compatibilidade
        const pass = new Stream.PassThrough();
        pass.end(buffer);

        // Determina nome do arquivo a partir de file_type (se fornecido) ou da URL
        let filename = 'Ata de Reunião';
        if (file_type) {
            filename = `${filename}.${file_type}`;
        } else {
            // tenta inferir extensão da URL
            const match = file_url.match(/\.([0-9a-zA-Z]+)(?:\?|$)/);
            const ext = match ? match[1] : 'bin';
            filename = `${filename}.${ext}`;
        }

        // Envia o documento como upload (arquivo), evitando erro de URL inválida
        await bot.telegram.sendDocument(chat_id, { source: pass, filename }, { caption: caption || '' });

        return res.status(200).json({ status: "sent" });

    } catch (err) {
        // Erros: falha ao baixar o arquivo, timeout, ou falha ao enviar ao Telegram
        console.error("[MS Telegram] Erro ao enviar arquivo: ", err.response ? (err.response.data || err.response.statusText) : err.message);
        return res.status(500).json({ error: "Failed to send file" });
    }
};

module.exports = { handleSendReply, handleSendFile };