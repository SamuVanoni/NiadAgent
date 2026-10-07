## Tutorial para rodar o projeto

Temos duas opções para rodar o projeto:
1. Usando o `bot-whisper` em outra máquina (na rede)
2. Usando todos os serviços na mesma máquina

A seguir existe o tutorial simples e direto para a execução de cada um deles!

## Antes de tudo: o `.env` e o webhook

Subir os containers **não é suficiente** para o bot responder. Faltam duas coisas, e a
segunda não estava documentada aqui: sem ela os quatro serviços sobem saudáveis, o
`/health` responde 200 e o bot fica mudo — sem nenhuma pista do motivo nos logs.

### 1. Preencher o `.env`

Copie o `.env.example` para `.env` (ele está no `.gitignore`, não suba por engano) e
preencha:

| Variável | Onde conseguir |
|---|---|
| `TELEGRAM_TOKEN` | No Telegram, com o **@BotFather**. Bot novo: `/newbot`. Bot existente: `/mybots` -> escolher o bot -> *API Token*. Cuidado: `/token` gera outro e **invalida o anterior**. |
| `TELEGRAM_SECRET_TOKEN` | **Você inventa.** Não se obtém em lugar nenhum: é um segredo compartilhado entre você e o Telegram (Mitigação ID 05). Até 256 caracteres, só `A-Z a-z 0-9 _ -`. |
| `GEMINI_API_KEY` | https://aistudio.google.com/apikey (Google AI Studio, não o Google Cloud). |
| `WHISPER_SERVICE_URL` | Depende do modo — ver as duas seções abaixo. |
| `TELEGRAM_SERVICE_URL` e `LANGCHAIN_SERVICE_URL` | Já vêm corretos no exemplo (nomes internos do Compose). |

### 2. Registrar o webhook no Telegram

O Telegram **não faz polling**: ele empurra cada mensagem com um `POST` para uma URL
**pública e HTTPS**. Um `localhost` não é alcançável por ele.

1. Exponha o `ms-telegram` (porta 8443 no host, 8080 no container) numa URL pública
   HTTPS. Qualquer túnel serve — `cloudflared`, `ngrok` etc.
2. Registre:
   ~~~
   curl -X POST "https://api.telegram.org/bot<TELEGRAM_TOKEN>/setWebhook" -d "url=https://SEU-ENDERECO-PUBLICO/webhook" -d "secret_token=<TELEGRAM_SECRET_TOKEN>"
   ~~~
   O `secret_token` precisa ser **o mesmo** do `.env`: o Telegram passa a devolvê-lo no
   cabeçalho `X-Telegram-Bot-Api-Secret-Token`, e o `security.middleware.js` rejeita com
   401 quem não tiver.
3. Confira:
   ~~~
   curl "https://api.telegram.org/bot<TELEGRAM_TOKEN>/getWebhookInfo"
   ~~~
   Olhe `url`, `pending_update_count` e principalmente `last_error_message`.
4. Ao terminar, libere o bot:
   ~~~
   curl "https://api.telegram.org/bot<TELEGRAM_TOKEN>/deleteWebhook"
   ~~~

O endereço do túnel **muda cada vez que você o sobe**, então o `setWebhook` precisa ser
refeito a cada sessão de teste.

### 3. Limitações conhecidas na hora de testar

- O bot trata **apenas mensagem de voz** (`bot.on('voice')` em `bot.js`): é preciso
  **segurar o microfone e falar**. Arquivo de áudio anexado chega ao Telegram como
  `audio`, para o qual não existe handler — o bot não responde nada.
- O tier gratuito do Gemini tem **duas** cotas, e a que mais incomoda testando é a por
  minuto: **5 requisições por minuto, por modelo** (quota
  `GenerateRequestsPerMinutePerProjectPerModel-FreeTier`), além do limite diário. O
  `max_retries` padrão do cliente do LangChain é **6**, então uma única mensagem de voz
  estourava a cota por minuto sozinha — o retry que existia para dar resiliência era o
  que produzia o 429. Hoje o `orchestrator.py` usa **1 tentativa por modelo** e cai para
  o próximo da lista `MODELOS`, então uma mensagem custa no máximo 3 chamadas.
- **Modelo sobrecarregado é comum e não é erro seu.** O Gemini devolve **503 "high
  demand"** quando o modelo está cheio; é transitório e do lado do Google. Vale saber
  distinguir os três: **503** sobrecarga (passa sozinho), **429** cota (espere a janela),
  **404** modelo que a sua chave não alcança (aí sim é configuração). Com o fallback, o
  bot sobrevive aos dois primeiros desde que algum modelo da lista responda.

---

### Usando o `bot-whisper` em outra máquina (na rede)

- **No .env** : É de extrema importância que a variável `WHISPER_SERVICE_URL` esteja apontando para o link correto (para o *IP:Porta* da máquina destino). Existem dois exemplos para os dois casos.

- **Na máquina remota**:
    - Já deve estar com o conteiner do `bot-whisper` construído e rodando. Porém, se for necessário rodar via ssh, só usar o comando:
        ~~~
        docker compose --profile local-whisper up -d --build
        ~~~
    - Para ver os logs e acompanhar o que está acontecendo:
        ~~~
        docker logs -f bot-whisper
        ~~~

- **Na máquina local (notebook da apresentação)**:
    - Já deve estar com os conteiners `ms-telegram`, `api-gateway` e `langchain-service` construídos e rodando. Comando para isso:
        ~~~
        docker compose --profile core up -d --build
        ~~~
    - Para ver os logs e acompanhar o que está acontecendo:
        ~~~
        docker compose --profile core logs -f
        ~~~

## Usando todos os conteiner na mesma máquina (Plano B)

Caso não seja possível usar o micro serviço remoto, siga os seguintes passos:

- **No .env** : É de extrema importância que a variável `WHISPER_SERVICE_URL` esteja apontando para o link correto (para o *conteiner:porta* rodando na máquina local). Existem dois exemplos para os dois casos.

- **Na máquina local (notebook da apresentação)**:
    - Será necessário contruir e rodar os conteiners `ms-telegram`, `api-gateway`, `langchain-service` e `bot-whisper` (todos eles). Comando para isso:
        ~~~
        docker compose --profile core --profile local-whisper up -d --build
        ~~~
    - Para ver os logs e acompanhar o que está acontecendo:
        ~~~
        docker compose --profile core --profile local-whisper logs -f
        ~~~