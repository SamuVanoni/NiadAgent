const TELEGRAM_SECRET_TOKEN = process.env.TELEGRAM_SECRET_TOKEN;

if (!TELEGRAM_SECRET_TOKEN) {
    console.warn("ALERTA: TELEGRAM_SECRET_TOKEN não definido! O webhook está inseguro.");
}

const securituMiddleware = (req, res, next) => {
    const secretToken = req.headers['x-telegram-bot-api-secret-token'];

    if (secretToken != TELEGRAM_SECRET_TOKEN) {
        console.warn("[MS Telegram] ALERTA: Tentativa de Webhook com token inválido. Rejeitado!")
        return res.status(401).send('Unauthorized');
    }

    // Token correto, pode continuar para o Telgraf
    next()
};

module.exports = { securituMiddleware };