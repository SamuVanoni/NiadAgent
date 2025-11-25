# A ideia por trás do NIAD Agent

Este arquivo tem como objetivo discorrer sobre o porquê criar e usar a ferramenta **NIAD Agent**, bem como suas especificações técnicas.

## A dor que existe

A idea para o NIAD Agent surgiu na faculdade, como um projeto para a disciplina de Sistemas Distribuídos. Recebemos a missão de escolher algum grupo de estudos para identificar suas dores e propor uma solução tecnológica em formato de *sistema suficientemente distribuído* para essa dor.

Como um dos integrantes do nosso grupo é o presidente de um grupo de estudos, o **NIAD (Núcleo de Estudos em Inteligência Artificial)**, decidimos seguir com esse. Quem melhor que o presidente do núcleo para identificar as dores do ambiente?!

Ele nos disse que a principal dor que poderíamos sanar com um software seria a questão de resumos inteligentes das reuniões que eles realizam!

Basicamente há uma necessidade de automação que gere algum tipo de resumo de reuniões do núcleo, de forma a facilitar a síntese de tudo que foi discutido.

## Como resolver?

Para ajudar o NIAD a gerenciar o conteúdo de suas reuniões pensamos em uma solução simples, que é gravar as reuniões em áudio e devolver um resumo dos principais pontos abordados, insights e informações relevantes que foram discutidas.

Com a solução desenvolvida - baseada em um chatbot no Telegram - cada integrante do núcleo pode utilizar a ferramenta individualmente, sem a necessidade de designar uma pessoa específica para realizar a gravação em áudio das reuniões. Assim, qualquer membro que desejar obter o resumo de uma reunião (ou de parte dela) pode fazê-lo livremente, conforme sua necessidade e preferência.

## A parte técnica

No arquivo [README](/README.md) é possível encontrar toda a descrição técnica da ideia, mais especificamente a arquitetura do projeto e sua justificativa.

Também é possível analisar todo o estudo de [Modelagem de Ameaças](/docs/MODELAGEM_DE_AMEACAS.md) criado levando em consideração toda a arquitetura do projeto e seus pontos de comunicação.

Outra coisa importante são os [Contratos de API](/docs/API_CONTRACTS.md), que foram elaborados visando uma comunicação clara entre módulos e garantindo que a equipe de desenvolvimento consiga trabalhar independentemente em seus módulos sem precisar gastar tempo esperando o modelo JSON do outro módulo, o endpoint, etc.

## Como testar

Se tiver interesse em testar (válido em tempo integral durante a apresentação do trabalho), basta ler o QR Code abaixo e mandar um áudio para o chat que abrir.

![QR Code - NIAD Agent Bot](/docs/assets/qr_code_chat.jpg)