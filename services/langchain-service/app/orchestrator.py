# --- services/langchain-service/app/orchestrator.py ---

import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
import traceback
from langchain_core.output_parsers import StrOutputParser
import json
from datetime import datetime, timezone

# --- 1. Configuração e Segurança (Mitigação ID 07) ---
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
if not GEMINI_API_KEY:
    print("ERRO: GEMINI_API_KEY não encontrada no ambiente.")
    # Isso fará o serviço falhar na inicialização se a chave estiver faltando

# --- 2. Lógica da IA (O "Chain") ---

# 1. Instanciar o LLM (Gemini)
llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", google_api_key=GEMINI_API_KEY)

# 2. Definir o Prompt Template (Mitigação ID 06)
system_message = (
    "Você é um assistente especialista em sumarização de reuniões. "
    "Sua tarefa é receber um texto de transcrição e retornar um resumo conciso e, se possível, identificar o dia/ data em que a reunião ocorrerá. "
    "RETORNE APENAS UM OBJETO JSON com duas chaves: 'summary' (string) e 'meeting_date' (string no formato YYYY-MM-DD ou null). Não use markdown para demarcar o JSON, apenas o envie em texto puro. "
    "Para 'meeting_date' você deve analisar menções temporais explícitas ou implícitas no texto (ex: 'amanhã', 'na próxima terça', 'dia 5', 'segunda-feira que vem'). "
    "Se houver qualquer menção temporal, RESOLVA-A para uma data absoluta relativa à data atual fornecida no campo 'current_date' do input e retorne essa data em ISO (YYYY-MM-DD). "
    "Se NÃO houver nenhuma menção temporal confiável, retorne 'meeting_date' como null. "
    "NÃO inclua nada além do JSON — não explique, não adicione texto adicional."
)

human_message = (
    "Por favor, resuma o seguinte texto de reunião: {text_input}\n"
    "Data atual (YYYY-MM-DD): {current_date}\n"
    # As chaves JSON precisam ser escapadas para não serem interpretadas como variáveis pelo ChatPromptTemplate
    "Lembre-se: responda APENAS com JSON: {{\"summary\": <string>, \"meeting_date\": <YYYY-MM-DD or null>}}"
)

prompt_template = ChatPromptTemplate.from_messages([
    ("system", system_message),
    ("human", human_message)
])

# 3. Definir o Parser de Saída
output_parser = StrOutputParser()

# 4. Montar o "Chain"
summarize_chain = prompt_template | llm | output_parser

print("[LangChain Orchestrator] Chain de sumarização pronto (usando gemini-2.5-flash).")


# --- 5. Função de Interface (O que o main.py vai chamar) ---
def generate_summary(text_input: str, current_date: str = None) -> dict:
    """
    Executa o chain de sumarização com o texto de entrada e retorna um dict com
    'summary' (string) e 'meeting_date' (YYYY-MM-DD) ou None.
    """
    try:
        if not current_date:
            current_date = datetime.now(timezone.utc).strftime('%Y-%m-%d')

        input_payload = {"text_input": text_input, "current_date": current_date}
        print(f"[LangChain Orchestrator] Invocando chain com input (len text): {len(text_input)}; current_date={current_date}")
        # Log do payload (cuidado com dados sensíveis)
        # print(f"[LangChain Orchestrator] Input payload: {input_payload}")

        # O .invoke() passa a entrada para o chain e espera a resposta
        raw = summarize_chain.invoke(input_payload)

        # Log da resposta bruta (limitada)
        raw_preview = raw if len(raw) < 1000 else raw[:1000] + '...'
        print(f"[LangChain Orchestrator] Resposta bruta do LLM (preview): {raw_preview}")

        # Tenta decodificar o JSON retornado pelo LLM
        try:
            parsed = json.loads(raw)
        except Exception:
            # Se o LLM retornou algo não-JSON, encapsulamos como summary e meeting_date=null
            print("[LangChain Orchestrator] Falha ao fazer json.loads da resposta do LLM; tratando como texto livre.")
            parsed = {"summary": raw, "meeting_date": None}

        # Normaliza os campos
        summary = parsed.get('summary') if isinstance(parsed.get('summary'), str) else str(parsed.get('summary') or '')
        meeting_date = parsed.get('meeting_date') if parsed.get('meeting_date') else None

        print(f"[LangChain Orchestrator] Parsed meeting_date={meeting_date}")

        return {"summary": summary, "meeting_date": meeting_date}

    except Exception as e:
        print(f"[LangChain Orchestrator] ERRO ao invocar o chain: {e}")
        traceback.print_exc()
        # Propaga o erro para o main.py tratar como um 500
        raise e