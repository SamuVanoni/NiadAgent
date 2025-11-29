# 📜 Contratos de API - Projeto NIAD Agent (Secure v1)

Este documento é a **fonte única da verdade (Single Source of Truth)** para a comunicação entre todos os microserviços do projeto NIAD Agent.

Todos os desenvolvedores **devem** seguir estes contratos. Estes contratos foram projetados com base na [Modelagem de Ameaças] do projeto para incluir mitigações de segurança essenciais.

---

## 1. Contrato de Ingestão (Ingestion)
`MS Telegram` -> `API Gateway`

Este contrato inicia o fluxo. O `MS Telegram` valida o webhook e encaminha os dados essenciais para o `API Gateway` processar.

* **Serviço de Destino:** `api-gateway`
* **Endpoint:** `POST /api/v1/process-audio`

### Requisitos de Segurança (Implementados pelo `MS Telegram`):
* **Mitigação ID 05 (DoS no Webhook):** O `MS Telegram` **DEVE** validar o cabeçalho `X-Telegram-Bot-Api-Secret-Token` em 100% das requisições recebidas do Telegram. Requisições sem o token secreto válido **DEVEM** ser rejeitadas.

### Contrato de Dados

* **Request Body (JSON) enviado pelo `MS Telegram`:**
    ```json
    {
      "chat_id": 123456789,
      "user_id": 987654321,
      "file_id": "AgADBAADbOkxG-dC-UuFqgAB...",
      "file_size_bytes": 124000,
      "message_date": 1697049600
    }
    ```
* **Campos de Segurança:**
    * `"user_id"`: **[Mitigação ID 08]** Usado pelo `API Gateway` para aplicar *Rate Limiting* (Limitação de Taxa) por usuário.
    * `"file_size_bytes"`: **[Mitigação ID 08]** Usado pelo `API Gateway` para aplicar *Size Validation* (Limitação de Tamanho). O Gateway rejeitará o processamento se o tamanho exceder o limite (ex: 25MB).

* **Success Response (200 OK) (do `API Gateway` para o `MS Telegram`):**
    > O `API Gateway` responde *imediatamente* (após validar taxa e tamanho) e enfileira o processamento.
    ```json
    {
      "status": "received",
      "message": "Áudio recebido e enfileirado para processamento."
    }
    ```
* **Error Response (429 Too Many Requests):**
    > Resposta caso o `user_id` exceda o *Rate Limit*.
    ```json
    {
      "error": "Limite de requisições excedido. Tente novamente mais tarde."
    }
    ```
* **Error Response (413 Payload Too Large):**
    > Resposta caso o `file_size_bytes` exceda o limite.
    ```json
    {
      "error": "Arquivo de áudio excede o tamanho máximo permitido."
    }
    ```

---

## 2. Contrato de Transcrição (Transcription)
`API Gateway` -> `Bot Whisper`

O `API Gateway` (após validar o tamanho) obtém a URL de download e a envia ao `Bot Whisper`.

* **Serviço de Destino:** `bot-whisper`
* **Endpoint:** `POST /transcribe`
* **Request Body (JSON) enviado pelo `API Gateway`:**
    ```json
    {
      "file_url": "[https://api.telegram.org/file/bot](https://api.telegram.org/file/bot)<TOKEN>/.../audio.oga"
    }
    ```
* **Success Response (200 OK) (do `Bot Whisper` para o `API Gateway`):**
    ```json
    {
      "transcription": "Este é o texto completo da reunião transcrito pelo Whisper..."
    }
    ```

---

## 3. Contrato de Sumarização (Summarization)
`API Gateway` -> `LangChain Service`

Com o texto transcrito, o `API Gateway` o envia para o serviço de sumarização.

* **Serviço de Destino:** `langchain-service`
* **Endpoint:** `POST /summarize`

### Contrato de Dados

* **Request Body (JSON) enviado pelo `API Gateway`:**
    ```json
    {
      "text_to_summarize": "Este é o texto completo da reunião transcrito pelo Whisper...",
      "user_id": 987654321
    }
    ```
* **Campo de Segurança:**
    * `"user_id"`: **[Mitigação ID 06]** Usado pelo `LangChain Service` para aplicar o princípio do menor privilégio. Permite que o RAG acesse apenas documentos/históricos pertencentes a este usuário, limitando o dano de um *Prompt Injection*.

* **Success Response (200 OK) (do `LangChain` para o `API Gateway`):**
    ```json
    {
      "summary": "Este é o resumo da reunião gerado pelo Gemini e orquestrado pelo LangChain."
    }
    ```

---

## 4. Contrato de Resposta (Reply)
`API Gateway` -> `MS Telegram`

O `API Gateway` envia a resposta final ao `MS Telegram`, que a encaminha ao usuário.

* **Serviço de Destino:** `ms-telegram`
* **Endpoint:** `POST /send-reply`
* **Request Body (JSON) enviado pelo `API Gateway`:**
    ```json
    {
      "chat_id": 123456789,
      "message_text": "Aqui está o resumo da sua reunião:\n\n- Ponto 1...\n- Ponto 2..."
    }
    ```
* **Success Response (200 OK) (do `MS Telegram` para o `API Gateway`):**
    ```json
    {
      "status": "sent"
    }
    ```

---

## 5. Contrato de Geração de Arquivo (Docx -> DOCX/PDF)
`API Gateway` -> `docx-service`

O `API Gateway` solicita ao `docx-service` a geração de um arquivo a partir de um template DOCX preenchido. O serviço suporta retorno do próprio DOCX (padrão) ou conversão para PDF quando solicitado.

* **Serviço de Destino:** `docx-service`
* **Endpoint:** `POST /generate`

### Request Body (JSON)

```json
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
```

Notas:
- `template_name` aponta para um arquivo em `services/docx-service/app/templates/`.
- As chaves dentro de `data` usam nomenclatura em minúsculas conforme padrão do projeto (`texto`, `data`, `dia`, `mes`, `ano`).

### Success Response (200 OK)

```json
{
  "file_url": "http://docx-service:8090/files/<id>.<ext>",
  "file_type": "docx|pdf"
}
```

### Error Responses
- `400 Bad Request` quando `template_name` ou `data` estiverem faltando ou inválidos.
- `500 Internal` para erros de geração/conversão.

---

## 6. Contrato de Envio de Arquivo (MS Telegram)
`API Gateway` -> `MS Telegram` (envio de arquivo gerado)

Ao receber `file_url` e `file_type` do `docx-service`, o `API Gateway` solicita ao `MS Telegram` que envie o arquivo ao usuário.

* **Serviço de Destino:** `ms-telegram`
* **Endpoint:** `POST /send-file`

### Request Body (JSON)

```json
{
  "chat_id": 123456789,
  "file_url": "http://docx-service:8090/files/<id>.<ext>",
  "file_type": "docx|pdf",
  "caption": "Resumo"
}
```

Notas operacionais:
- O `ms-telegram` baixa o arquivo internamente (entre containers) e faz o upload para o Telegram como `sendDocument`.
- O `ms-telegram` deve validar `chat_id` e `file_url` antes de tentar o download.

### Success Response (200 OK)

```json
{
  "status": "sent"
}
```

### Error Responses
- `400 Bad Request` para payload inválido.
- `504`/`502` quando o `ms-telegram` não conseguir baixar o arquivo (timeout ou endpoint inacessível).

---

## Observações gerais sobre datas e formato
- O `ms-telegram` envia `message_date` (timestamp unix) no payload inicial para o `API Gateway` quando disponível.
- O `api-gateway` agora prioriza a `meeting_date` retornada pelo LLM (quando presente). Se o LangChain/Gemini detectar uma menção temporal na transcrição, ele retorna `meeting_date` em ISO (`YYYY-MM-DD`) e essa data será usada para compor `data`, `dia`, `mes`, `ano` enviados ao `docx-service`.
- Se o LLM não identificar uma data (ou retornar `null`), o `api-gateway` usa `message_date` como fallback; se `message_date` ausente, usa a data atual.

## Fluxo resumido
1. `ms-telegram` recebe áudio do Telegram e envia job para `api-gateway` incluindo `message_date` quando disponível.
2. `api-gateway` valida e enfileira a requisição; solicita transcrição ao `bot-whisper`.
3. `api-gateway` envia texto transcrito ao `langchain-service` para gerar `summary` (e eventualmente `meeting_date`).
4. `api-gateway` envia o `summary` em `data.texto` ao `docx-service` via `POST /generate` (inclui campos de data calculados; inclui `format` opcional para escolher `docx` ou `pdf`).
5. `docx-service` responde com `file_url` e `file_type`.
6. `api-gateway` chama `ms-telegram` `POST /send-file` com `chat_id`, `file_url` e `file_type`.
7. `ms-telegram` baixa o arquivo internamente e faz upload ao Telegram (sendDocument). O usuário recebe o arquivo.

Consistência do contrato é crítica: qualquer mudança nas chaves JSON ou endpoints deve ser refletida aqui.