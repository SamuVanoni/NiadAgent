const rateLimit = require('express-rate-limit');

// MITIGAÇÃO ID 08: Rate Limit por usuário
// Limita cada user_id a 5 requisições por 15 minutos
const audioProcessingLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 10, // Máximo de 5 requisições por janela
    message: { 
        error: "Limite de requisições excedido. Tente novamente mais tarde." 
    },
    standardHeaders: true, // Retorna info no header `RateLimit-*`
    legacyHeaders: false,
    // Usa o user_id do body como chave para o rate limit
    keyGenerator: (req) => {
        return req.body.user_id ? req.body.user_id.toString() : req.ip;
    },
    // Retorna 429 (Too Many Requests)
    statusCode: 429,
    handler: (req, res) => {
        console.warn(`[Rate Limit] User ${req.body.user_id} excedeu o limite de requisições`);
        res.status(429).json({ 
            error: "Limite de requisições excedido. Tente novamente mais tarde." 
        });
    }
});

module.exports = { audioProcessingLimiter };
