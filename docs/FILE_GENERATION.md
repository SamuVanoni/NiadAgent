# Resumo do fluxo de geração de arquivos (DOCX/PDF)

Objetivo: gerar um arquivo (por padrão DOCX, opcionalmente PDF) a partir de um template DOCX preenchido com os dados gerados pela IA (resumo) e enviá-lo ao usuário via Telegram.

## Contrato entre serviços

1) MS-Telegram -> API Gateway (contrato existente)
   - Body enviado ao endpoint `/api/v1/process-audio` deve incluir:
     - chat_id
     - user_id
     - file_id
     - file_size_bytes
     - message_date (opcional, timestamp unix)

2) API Gateway -> LangChain (sem mudança no endpoint)
   - Recebe `summary` (string) como resposta de sumarização, e também `meeting_date` (opcional) quando o LLM identificar uma menção temporal.

3) API Gateway -> Docx-Service
  - POST `/generate` com body JSON:
    {
      "template_name": "summary_template.docx",
      "data": {
          "texto": "<texto do resumo>",
          "data": "dd/mm/yyyy",
          "dia": "9",
          "mes": "abril",
          "ano": "2025"
        },
      "format": "docx" // opcional: 'docx' (padrão) ou 'pdf'
    }
  - Resposta esperada: { "file_url": "http://docx-service:8090/files/<id>.<ext>", "file_type": "docx|pdf" }

4) API Gateway -> MS-Telegram (novo contrato)
   - POST `/send-file` com body JSON:
     { "chat_id": <chat_id>, "file_url": "http://...", "file_type": "docx|pdf", "caption": "opcional" }
   - MS-Telegram baixa o arquivo internamente e envia o documento ao usuário através do Bot do Telegram.

### Observações sobre data

- O serviço `ms-telegram` envia `message_date` (timestamp unix) quando disponível no job.
- O `api-gateway` agora tenta primeiramente usar a data identificada pelo LLM (`meeting_date`) — se o LangChain/Gemini detectar uma menção temporal na transcrição ele retornará `meeting_date` em ISO (`YYYY-MM-DD`) e essa data será usada para compor `data`, `dia`, `mes`, `ano` enviados ao `docx-service`.
- Se o LLM não identificar uma data (ou retornar `null`), o `api-gateway` usa `message_date` como fallback; se `message_date` ausente, usa a data atual.

## Instruções para o template DOCX

 - Crie um DOCX com os placeholders usando sintaxe Jinja (ex.: `{{ texto }}`) onde quiser que o conteúdo apareça:
   - `{{ texto }}`
   - `{{ data }}`
   - `{{ dia }}`
   - `{{ mes }}`
   - `{{ ano }}`
 - Salve o arquivo em `services/docx-service/app/templates/summary_template.docx`

## Notas de infraestrutura

- A conversão DOCX -> PDF é feita via LibreOffice (`soffice --headless --convert-to pdf`) quando `format: "pdf"` é solicitado.
- O serviço `docx-service` expõe `/files/<nome.ext>` para download interno. O `api-gateway` encaminha essa URL ao `ms-telegram`.
- No Docker Compose já incluímos `docx-service` e configuramos `DOCX_SERVICE_URL` para `http://docx-service:8090`.