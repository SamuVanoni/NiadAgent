## Tutorial para rodar o projeto

Temos duas opções para rodar o projeto:
1. Usando o `bot-whisper` em outra máquina (na rede)
2. Usando todos os serviços na mesma máquina

A seguir existe o tutorial simples e direto para a execução de cada um deles!

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

### Observação: serviço de geração de PDF (docx-service)

- Se você pretende usar a geração de PDF a partir de templates DOCX, adicione o serviço `docx-service` ao perfil que rodará localmente. O `docx-service` depende do LibreOffice dentro do container para converter DOCX -> PDF e pode aumentar o tempo de build.

- Comando para rodar todos os serviços incluindo o `docx-service` e o `bot-whisper` localmente:
    ```bash
    docker compose --profile core --profile local-whisper up -d --build
    ```

- Antes de iniciar, coloque seu template DOCX em `services/docx-service/app/templates/` com o nome sugerido `summary_template.docx`. Use a sintaxe Jinja para os placeholders: `{{ texto }}`, `{{ data }}`, `{{ dia }}`, `{{ mes }}`, `{{ ano }}`. Atenção: cada placeholder deve estar dentro de um único run no Word para evitar fragmentação.

- Após o container subir, o `docx-service` ficará disponível em `http://docx-service:8090` na rede do compose; o endpoint principal é `POST /generate` (ver `docs/PDF_GENERATION.md` para contrato).

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