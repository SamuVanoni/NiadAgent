const { bot } = require('./bot');

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