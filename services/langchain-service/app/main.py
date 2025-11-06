# Servidor "Mock" do LangChain Service
from flask import Flask, request, jsonify
import os

app = Flask(__name__)

# --- CONTRATO 3 (Receber do API Gateway) ---
@app.route("/summarize", methods=["POST"])
def mock_summarize():
    data = request.get_json()
    if not data or "text_to_summarize" not in data or "user_id" not in data:
        return jsonify({"error": "Missing text_to_summarize or user_id"}), 400
    
    print(f"[LangChain] MOCK: Recebido job de sumarização para user {data['user_id']}")
    print(f"[LangChain] MITIGAÇÃO ID 06: O dev usará o user_id para limitar o RAG.")
    
    # O dev aqui implementaria a lógica real do LangChain + Gemini
    
    # Retorna um resumo "fake"
    return jsonify({
        "summary": "Resumo 'fake' vindo do mock do LangChain/Gemini."
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)