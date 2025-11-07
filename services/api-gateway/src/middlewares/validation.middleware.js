const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

/**
 * Middleware de validação de integridade dos dados
 * Valida campos obrigatórios e tamanho do arquivo
 */
const validateAudioRequest = (req, res, next) => {
    const { chat_id, user_id, file_id, file_size_bytes } = req.body;
    
    // Valida campos obrigatórios
    if (!chat_id || !user_id || !file_id || file_size_bytes === undefined) {
        console.warn(`[API Gateway] Rejeitado: Campos obrigatórios faltando`);
        return res.status(400).json({ 
            error: "Campos obrigatórios: chat_id, user_id, file_id, file_size_bytes" 
        });
    }
    
    // MITIGAÇÃO ID 08 (Tamanho): Validar o tamanho
    if (file_size_bytes > MAX_FILE_SIZE) {
        console.warn(`[API Gateway] Rejeitado: Arquivo muito grande (${file_size_bytes} bytes)`);
        return res.status(413).json({ 
            error: "Arquivo de áudio excede o tamanho máximo permitido." 
        });
    }
    
    // Validação adicional: tamanho não pode ser negativo ou zero
    if (file_size_bytes <= 0) {
        console.warn(`[API Gateway] Rejeitado: Tamanho de arquivo inválido (${file_size_bytes} bytes)`);
        return res.status(400).json({ 
            error: "Tamanho de arquivo inválido" 
        });
    }
    
    // Se passou por todas as validações, continua
    next();
};

module.exports = { validateAudioRequest, MAX_FILE_SIZE };
