# Modelagem de Ameaças — NIAD Distributed AI System

Este documento apresenta a modelagem de ameaças do projeto NIAD, desenvolvida para contemplar os riscos, vulnerabilidades e medidas de mitigação na arquitetura distribuída containerizada, composta por microserviços, agentes de IA (Whisper, LangChain, Llama) e integração Telegram.

## 1. Ativos e Componentes Identificados

* **Usuário (Telegram):** Origem das interações (mensagens, áudio).
* **API do Telegram:** Canal externo para comunicação (webhooks, HTTP POST).
* **MS Telegram:** Gateway de mensagens para validação e roteamento.
* **API Gateway:** Orquestrador de solicitações e agregação de respostas.
* **Bot Whisper:** Microserviço local responsável pela transcrição de áudio.
* **LangChain:** Microserviço de vetorização RAG.
* **Llama:** Microserviço de geração de texto e sumarização.
* **Dados Sensíveis:** Áudios, textos transcritos, documentos internos, prompts de IA.
* **Rede Interna Docker:** Segmentação dos microserviços.
* **Logs:** Dados técnicos de operações e respostas.

## 2. Identificação das Ameaças

| Componente | Ameaça | Vetor de Ataque |
| :--- | :--- | :--- |
| **API do Telegram** | Interceptação ou manipulação de mensagens | Ataques Man-in-the-Middle, Webhook inundação |
| **MS Telegram** | Injeção de comandos, spoofing | Payloads maliciosos, requisições forjadas |
| **API Gateway** | DoS, bypass de autenticação | Request flooding, APIs expostas sem autenticação |
| **Bot Whisper** | Vazamento de transcrições, execução de código | Upload de áudios maliciosos, falta de sanitização |
| **LangChain** | Vazamento, prompt injection, falhas de query | Consultas maliciosas, prompts manipulados |
| **Llama** | Prompt injection, respostas incorretas/sensíveis | Dados não tratados, queries manipuladas |
| **Rede Docker** | Quebra de isolamento, invasão de containers | Falta de firewall/segregação |
| **Logs** | Exposição de dados sensíveis | Armazenamento inseguro, vazamento acidental |

## 3. Avaliação de Impacto e Probabilidade

| Ameaça | Impacto | Probabilidade |
| :--- | :--- | :--- |
| Interceptação de mensagens Telegram | Alta | Média |
| Injeção de comandos (MS Telegram) | Alta | Baixa |
| DoS no API Gateway | Média | Média |
| Vazamento de transcrições (Whisper) | Alta | Baixa |
| Prompt Injection (LangChain/Llama) | Média | Média |
| Quebra de isolamento de containers | Alta | Baixa |
| Exposição de logs | Média | Média |

## 4. Medidas de Mitigação

### Telegram/Comunicações Externas

* Utilização obrigatória de HTTPS para webhooks e API externa.
* Verificação da fonte das requisições (validar IDs, tokens, payload).
* Rate limiting e captcha para evitar flood nos endpoints.
* Logs auditáveis para rastreabilidade.

### Recepção e Processamento de Dados Internos

* Sanitização e validação dos arquivos de áudio enviados ao Whisper.
* Restringir formatos e tamanho de uploads.
* Autenticação entre microserviços (tokens, chaves de API).

### API Gateway e Microserviços

* Autenticação obrigatória em rotas críticas.
* Segregação de permissões (principle of least privilege).
* Monitoramento contínuo de requisições para detectar padrões anômalos.
* Isolamento de containers usando redes personalizadas Docker.

### IA Agents (LangChain + Llama)

* Sanitização e validação dos prompts recebidos.
* Limitar dados sensíveis em respostas sumarizadas.
* Proteger acesso aos modelos contra consultas diretas externas.

### Logs de Sistema

* Armazenar logs em diretórios protegidos e com acesso restrito.
* Revisar logs para garantir ausência de dados sensíveis ou PII.
* Rotina automatizada para limpeza e backup periódico.

## 5. Avaliação de Risco Residual

Após aplicação das medidas acima, todos os riscos considerados de alta criticidade foram reduzidos a níveis aceitáveis para contexto acadêmico.

Permanece recomendação de monitoramento contínuo, revisão dos logs e atualização periódica dos agentes de IA e dependências dos microserviços.

## 6. Diagrama de Fluxo (Referência visual)

Ver arquivo *“Visao_Pre-Modelagem_de_Ameacas.jpg”* para referência visual do fluxo e dos pontos críticos mapeados.