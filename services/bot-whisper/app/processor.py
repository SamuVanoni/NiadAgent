import whisper
import requests
import os
import tempfile

class WhisperProcessor:
    def __init__(self, model_name="base"):
        """
        Inicializa o processador Whisper.
        
        Args:
            model_name: Nome do modelo Whisper a ser usado.
        """
        print(f"[Whisper Processor] Carregando modelo '{model_name}'...")
        
        # NOVO: Armazena o nome do modelo na instância
        self.model_name = model_name
        self.model = whisper.load_model(model_name)

        print(f"[Whisper Processor] Modelo '{model_name}' carregado com sucesso!")

    def get_model_name(self):
        """ Retorna o nome do modelo carregado. """
        return self.model_name
    
    def download_audio(self, file_url):
        """
        Baixa o arquivo de áudio do Telegram.
        
        Args:
            file_url: URL completa do arquivo de áudio
            
        Returns:
            Caminho local do arquivo baixado
        """
        print(f"[Whisper Processor] Baixando áudio de: {file_url}")
        
        try:
            response = requests.get(file_url, timeout=30)
            response.raise_for_status()
            
            # Cria um arquivo temporário para salvar o áudio
            with tempfile.NamedTemporaryFile(delete=False, suffix=".oga") as temp_file:
                temp_file.write(response.content)
                temp_path = temp_file.name
            
            print(f"[Whisper Processor] Áudio baixado: {temp_path}")
            return temp_path
            
        except requests.RequestException as e:
            print(f"[Whisper Processor] ERRO ao baixar áudio: {e}")
            raise
    
    def transcribe(self, audio_path):
        """
        Transcreve o áudio usando Whisper.
        
        Args:
            audio_path: Caminho local do arquivo de áudio
            
        Returns:
            Texto transcrito
        """
        print(f"[Whisper Processor] Iniciando transcrição...")
        
        try:
            # Transcreve o áudio
            # language="pt" força português, remova para detecção automática
            result = self.model.transcribe(
                audio_path,
                language="pt",  # Força português brasileiro
                fp16=False      # Desabilita FP16 (necessário para CPU)
            )
            
            transcription = result["text"].strip()
            
            print(f"[Whisper Processor] Transcrição concluída!")
            
            print("\n" + "="*60)
            print("TRANSCRIÇÃO DO ÁUDIO (DEBUG):")
            print("="*60)
            print(transcription)
            print("="*60 + "\n")
            
            return transcription
            
        except Exception as e:
            print(f"[Whisper Processor] ERRO na transcrição: {e}")
            raise
        finally:
            # Remove o arquivo temporário
            if os.path.exists(audio_path):
                os.remove(audio_path)
                print(f"[Whisper Processor] Arquivo temporário removido")
    
    def process_audio_url(self, file_url):
        """
        Pipeline completo: baixa e transcreve o áudio.
        
        Args:
            file_url: URL do arquivo de áudio
            
        Returns:
            Texto transcrito
        """
        audio_path = self.download_audio(file_url)
        transcription = self.transcribe(audio_path)
        return transcription
