# Servidor "Mock" do Bot Whisper
from flask import Flask, request, jsonify
import os

app = Flask(__name__)

# --- CONTRATO 2 (Receber do API Gateway) ---
@app.route("/transcribe", methods=["POST"])
def mock_transcribe():
    data = request.get_json()
    if not data or "file_url" not in data:
        return jsonify({"error": "Missing file_url"}), 400
    
    print(f"[Bot Whisper] MOCK: Recebido job para transcrever: {data['file_url']}")
    
    # O dev aqui implementaria a lógica real de download e transcrição
    
    # Retorna uma transcrição "fake"
    return jsonify({
        "transcription": "Texto 'fake' vindo do mock do Whisper. O dev irá implementar a lógica real."
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)