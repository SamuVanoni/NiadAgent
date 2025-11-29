# --- services/langchain-service/app/main.py ---

import os
from flask import Flask, request, jsonify
import traceback
from dotenv import load_dotenv

# Carrega .env local (para testes)
load_dotenv() 

# Importa a FUNÇÃO de lógica do nosso outro arquivo
# (Lembre-se de criar o arquivo app/__init__.py)
from .orchestrator import generate_summary
from datetime import datetime, timezone

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
    print(f"[LangChain Server] Recebido job de sumarização para user {user_id}")

    try:
        # 2. Chamar a Lógica
        # Passamos a data atual (timezone-aware UTC) para que o LLM possa resolver referências relativas
        current_date = datetime.now(timezone.utc).strftime('%Y-%m-%d')
        result = generate_summary(text_input=text_input, current_date=current_date)

        # 3. Retornar a Resposta (Seguir o Contrato): summary + meeting_date
        return jsonify({"summary": result.get('summary'), "meeting_date": result.get('meeting_date')})

    except Exception as e:
        print(f"[LangChain Server] ERRO: {e}")
        print(traceback.format_exc())
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
    # debug=True é ótimo para dev local e fará o "hot-reload" do Python
    app.run(host='0.0.0.0', port=port, debug=True)