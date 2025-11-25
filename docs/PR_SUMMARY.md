# Pull Request: Resumos em PDF a partir de template DOCX

Resumo curto

Este PR adiciona a geração de PDFs para os resumos gerados pela IA. Foi criado um novo microserviço (`docx-service`) que recebe um template DOCX (com placeholders Jinja) e os dados a serem inseridos, gera um DOCX preenchido e converte para PDF usando LibreOffice. O fluxo foi integrado ao `api-gateway` e ao `ms-telegram` para que, ao final do processamento, o usuário receba o resumo também em PDF.

O que foi feito (lista objetiva)

- Novo serviço: `services/docx-service`
  - `app/main.py` (Flask) com endpoints:
    - `POST /generate` — preenche template DOCX via `docxtpl` (Jinja) e gera PDF; retorna `pdf_url`.
    - `GET /files/<nome>` — serve os PDFs gerados.
  - `Dockerfile` e `requirements.txt` (adiciona `docxtpl` e `python-docx` compatível).
  - Pasta de templates: `services/docx-service/app/templates/`.
- Alterações no `api-gateway`
  - Orquestração atualizada para, após gerar o `summary`, montar os campos de data (`texto`, `data`, `dia`, `mes`, `ano`) e chamar `docx-service` `POST /generate`.
  - Ao receber `pdf_url`, o `api-gateway` chama `ms-telegram` `POST /send-file` para entregar o PDF ao usuário.
- Alterações no `ms-telegram`
  - O bot agora inclui `message_date` (timestamp unix) no job enviado ao `api-gateway`.
  - Adicionado endpoint `POST /send-file` que baixa o PDF internamente e faz upload ao Telegram (`sendDocument`).
- Documentação atualizada
  - `docs/API_CONTRACTS.md` — contratos atualizados (incluindo `message_date`, `/generate` e `/send-file`).
  - `docs/PDF_GENERATION.md` — resumo do fluxo e instruções do template.
  - `docs/RUN_TUTORIAL.md` — instruções para incluir e rodar o `docx-service` localmente.
  - `docs/PR_SUMMARY.md` — este arquivo (texto do PR).

Alterações de dependência importantes

- `services/docx-service/requirements.txt` foi atualizado para usar `docxtpl` e uma versão compatível de `python-docx` (ex: `python-docx==1.2.0`). Isso foi necessário porque o `docxtpl` exige `python-docx>=1.1.1`.

Motivação técnica

- A substituição manual de placeholders com `python-docx` mostrou-se frágil (perda de conteúdo quando placeholders estavam divididos em runs). A solução com `docxtpl` (Jinja) preserva estilos e conteúdo não template, é robusta para templates mais complexos e já é uma prática consolidada para documentos Word template-driven.

Contrato e fluxo (alto nível)

1. `ms-telegram` recebe áudio do usuário e envia job para `api-gateway`, incluindo `message_date` (timestamp unix).
2. `api-gateway` transcreve (bot-whisper) e gera `summary` (langchain-service).
3. `api-gateway` chama `docx-service` `POST /generate` com `template_name` e `data` (inclui `texto`, `data`, `dia`, `mes`, `ano`).
4. `docx-service` gera o PDF e responde com `pdf_url`.
5. `api-gateway` chama `ms-telegram` `POST /send-file` com `chat_id` e `pdf_url`.
6. `ms-telegram` baixa o PDF e faz upload ao Telegram; usuário recebe o documento.

Como testar localmente (checklist rápido)

- Coloque um template Jinja em `services/docx-service/app/templates/summary_template.docx` com placeholders: `{{ texto }}`, `{{ data }}`, `{{ dia }}`, `{{ mes }}`, `{{ ano }}`.
- Subir containers (incluindo docx-service):

```bash
# build e sobe todos os serviços necessários (inclui docx-service e bot-whisper local)
docker compose --profile core --profile local-whisper up -d --build

# ver logs
docker compose logs -f api-gateway docx-service ms-telegram
```

- Enviar um job de teste ao `api-gateway` (pode usar curl/postman) simulando o payload do `ms-telegram` com `message_date`.
- Verificar que o `docx-service` responde com `pdf_url` e que o `ms-telegram` envia o documento ao Telegram.

Notas e pontos de atenção

- Templates Word podem fragmentar placeholders em múltiplos "runs" quando editados no Word; sempre verifique que cada placeholder esteja em um único run para garantir render correto. Coloque instruções no template README para facilitar.
- A conversão DOCX -> PDF depende do LibreOffice no container; isso aumenta a imagem e o tempo de build.
- Se ocorrerem problemas de dependências no build do container (`docxtpl` x `python-docx`), ajuste o `requirements.txt` para uma versão de `python-docx` compatível (já ajustado neste PR).

Próximos passos sugeridos

- Testes end-to-end automatizados para o fluxo PDF (happy path + erro de conversão).
- Validação e regras de sanitização do `texto` enviado ao template (por exemplo limite de tamanho, remoção de bytes inválidos).

Descrição breve para o título do PR

"feat: gerar resumos em PDF a partir de template DOCX e enviar via Telegram"

Mensagem longa para o PR (exemplo, pronta para colar no campo de descrição do PR)

```
Adiciona um serviço `docx-service` que gera PDFs a partir de templates DOCX preenchidos com o resumo gerado pela IA.

Principais mudanças:
- Novo serviço `docx-service` (Flask + docxtpl) e infraestrutura Docker associada.
- Integração no `api-gateway` para solicitar geração de PDF e encaminhar o resultado ao `ms-telegram`.
- `ms-telegram` atualizada para enviar `message_date` e para baixar/reenviar PDFs internamente.
- Documentação e contratos atualizados (API_CONTRACTS, PDF_GENERATION, RUN_TUTORIAL).

Motivação: substituir a abordagem frágil de substituição manual em DOCX por `docxtpl` (Jinja), preservando formatação e evitando perda de conteúdo.

Instruções de teste e notas de dependência estão em `docs/`.
```