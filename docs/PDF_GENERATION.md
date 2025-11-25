# Resumo do fluxo de geração de PDF

Objetivo: gerar um PDF a partir de um template DOCX preenchido com os dados gerados pela IA (resumo) e enviá-lo ao usuário via Telegram.

## Contrato entre serviços

1) MS-Telegram -> API Gateway (contrato existente)
   - Body enviado ao endpoint `/api/v1/process-audio` deve incluir:
     - chat_id
     - user_id
     - file_id
     - file_size_bytes
     - message_date (opcional, timestamp unix)

2) API Gateway -> LangChain (sem mudança)
   - Recebe `summary` (string) como resposta de sumarização.

3) API Gateway -> Docx-Service (novo contrato)
   - POST `/generate` com body JSON:
     {
       "template_name": "summary_template.docx",
      "data": {
          "texto": "<texto do resumo>",
          "data": "dd/mm/yyyy",
          "dia": "9",
          "mes": "abril",
          "ano": "2025"
        }
     }
   - Resposta esperada: { "pdf_url": "http://docx-service:8090/files/<id>.pdf" }

4) API Gateway -> MS-Telegram (novo contrato)
   - POST `/send-file` com body JSON:
     { "chat_id": <chat_id>, "pdf_url": "http://...", "caption": "opcional" }
   - MS-Telegram envia o documento ao usuário através do Bot do Telegram.

### Observações sobre data

- O serviço `ms-telegram` agora envia `message_date` (timestamp unix) quando envia o job.
- O `api-gateway` usa esse timestamp, quando disponível, para calcular Dia/Mês/Ano/Data e preencher o template.
- Se `message_date` não estiver disponível, o servidor usa a data atual.

## Instruções para o template DOCX

 - Crie um DOCX com os placeholders usando sintaxe Jinja (ex.: `{{ texto }}`) onde quiser que o conteúdo apareça:
   - `{{ texto }}`
   - `{{ data }}`
   - `{{ dia }}`
   - `{{ mes }}`
   - `{{ ano }}`
 - Salve o arquivo em `services/docx-service/app/templates/summary_template.docx`

## Notas de infraestrutura

- A conversão DOCX -> PDF é feita via LibreOffice (`soffice --headless --convert-to pdf`).
- O serviço `docx-service` expõe `/files/<nome.pdf>` para download interno. O `api-gateway` encaminha essa URL ao `ms-telegram`.
- No Docker Compose já incluímos `docx-service` e configuramos `DOCX_SERVICE_URL` para `http://docx-service:8090`.
