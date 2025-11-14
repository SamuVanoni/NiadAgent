// Servidor do API Gateway
const express = require('express');

// Importação de middlewares de segurança e validação
const { audioProcessingLimiter } = require('./middlewares/rateLimit.middleware');
const { validateAudioRequest } = require('./middlewares/validation.middleware');

// Importação do nosso novo controlador
const { handleAudioProcessing } = require('./controllers/orchestration.controller');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware global para parsing de JSON
app.use(express.json());

// --- Definição de Rotas ---

/**
 * Rota principal para processamento de áudio (Contrato 1).
 * * Note como a lógica foi abstraída:
 * 1. audioProcessingLimiter: Middleware de Rate Limit
 * 2. validateAudioRequest: Middleware de Validação
 * 3. handleAudioProcessing: Controlador com a lógica de orquestração
 * * O arquivo de rotas (index.js) agora só se preocupa com
 * "qual rota" e "quais funções" chamar, não "como" elas funcionam.
 */
app.post('/api/v1/process-audio', 
    audioProcessingLimiter,
    validateAudioRequest,
    handleAudioProcessing 
);

// Rota de Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: "API Gateway Ok" });
});


// Inicia o servidor
app.listen(PORT, () => {
    console.log(`[API Gateway] Serviço rodando na porta ${PORT}`);
});