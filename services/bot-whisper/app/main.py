# Servidor do Bot Whisper - Transcrição de Áudio
from flask import Flask, request, jsonify
import os
from processor import WhisperProcessor

app = Flask(__name__)

# Inicializa o processador Whisper na inicialização do serviço
# Modelo "base" = 74MB, bom equilíbrio entre velocidade e precisão
print("[Bot Whisper] Inicializando serviço...")

# ATENÇÃO: Lembre-se de mudar esta linha para "medium" na máquina Desktop
whisper_processor = WhisperProcessor(model_name="medium")
print("[Bot Whisper] Serviço pronto para receber requisições!")

# --- CONTRATO 2 (Receber do API Gateway) ---
@app.route("/transcribe", methods=["POST"])
def transcribe():
    """
    Endpoint de transcrição conforme API_CONTRACTS.md - Contrato 2
    
    Request Body:
        {
            "file_url": "https://api.telegram.org/file/bot<TOKEN>/.../audio.oga"
        }
    
    Response (200 OK):
        {
            "transcription": "Texto transcrito..."
        }
    """
    data = request.get_json()
    
    # Valida o contrato
    if not data or "file_url" not in data:
        print("[Bot Whisper] ERRO: Requisição inválida - 'file_url' não fornecido")
        return jsonify({"error": "Missing file_url"}), 400
    
    file_url = data["file_url"]
    print(f"[Bot Whisper] Recebido job para transcrever: {file_url}")
    
    try:
        # Processa o áudio (baixa + transcreve)
        transcription = whisper_processor.process_audio_url(file_url)
        
        print(f"[Bot Whisper] Transcrição concluída com sucesso!")
        
        # Retorna conforme o Contrato 2
        return jsonify({
            "transcription": transcription
        }), 200
        
    except Exception as e:
        print(f"[Bot Whisper] ERRO durante processamento: {str(e)}")
        return jsonify({
            "error": "Erro ao processar o áudio",
            "details": str(e)
        }), 500

@app.route("/health", methods=["GET"])
def health_check():
    """
    Verifica a saúde do serviço e reporta o modelo carregado.
    """
    model_loaded = whisper_processor.get_model_name()
    return jsonify({
        "status": "ok",
        "message": "Whisper service is running.",
        "model_loaded": model_loaded  # Ex: "base", "medium"
    }), 200

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)