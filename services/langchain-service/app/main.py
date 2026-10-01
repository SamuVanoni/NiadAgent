# --- services/langchain-service/app/main.py ---

import logging
import os

from flask import Flask, request, jsonify
from dotenv import load_dotenv

# Carrega .env local (para testes)
load_dotenv() 

# O logging vem ANTES do import do orchestrator, e a ordem é o conserto de um bug real:
# o orchestrator loga na importação ("Chain de sumarização pronto"), e enquanto o
# basicConfig vinha depois essa linha caía no handler of last resort, que só emite
# WARNING ou acima. O log existia no código e nunca aparecia na saída do container.
logging.basicConfig(
    level=os.environ.get("LOG_LEVEL", "INFO"),
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)
logger = logging.getLogger(__name__)

# Importa a FUNÇÃO de lógica do nosso outro arquivo
from .orchestrator import generate_summary

# Inicializa o Flask
app = Flask(__name__)

# --- Definir a Rota da API (Contrato 3) ---

@app.route("/summarize", methods=["POST"])
def handle_summarize():
    
    # 1. Validar a Requisição (Seguir o Contrato)
    data = request.get_json()
    if not data or "text_to_summarize" not in data or "user_id" not in data:
        return jsonify({"error": "Payload inválido. 'text_to_summarize' e 'user_id' são obrigatórios."}), 400
    
    text_input = data['text_to_summarize']
    user_id = data['user_id']
    
    # Log de segurança (Mitigação ID 06)
    logger.info("Recebido job de sumarização (user=%s, %d caracteres).", user_id, len(text_input))

    try:
        # 2. Chamar a Lógica
        # O trabalho pesado é feito no orchestrator.py
        summary = generate_summary(text_input=text_input)
        
        # 3. Retornar a Resposta (Seguir o Contrato)
        return jsonify({"summary": summary})

    except Exception:
        # O detalhe do erro fica no log; a resposta não vaza stack trace nem o
        # conteúdo do texto que o cliente mandou.
        logger.exception("Falha ao processar sumarização (user=%s).", user_id)
        return jsonify({"error": "Falha interna ao processar o resumo."}), 500

# --- Rota de Health Check ---
@app.route('/health')
def health_check():
    """
    Rota simples para verificar se o serviço está no ar.
    """
    return jsonify({ "status": "ok" }), 200

# --- Iniciar o Servidor ---
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    # debug NUNCA fica ligado por padrão: o debugger do Werkzeug expõe um console
    # que executa código no container. Para ter hot-reload em dev, rode com
    # FLASK_DEBUG=1.
    debug = os.environ.get('FLASK_DEBUG', '').lower() in ('1', 'true', 'yes')
    app.run(host='0.0.0.0', port=port, debug=debug)
