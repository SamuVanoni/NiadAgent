Coloque aqui o seu arquivo DOCX template que contém os placeholders em sintaxe Jinja (exatamente como estão, com espaços):

- {{ texto }} -> O texto do resumo que a IA deve preencher
- {{ data }}  -> Data no formato dd/mm/yyyy (ex: 09/04/2025)
- {{ dia }}   -> Dia em formato numérico (ex: 9)
- {{ mes }}   -> Mês por extenso em português (ex: abril)
- {{ ano }}   -> Ano (ex: 2025)

Nome do template padrão esperado: `summary_template.docx`

Coloque o(s) templates nesta pasta e reinicie o serviço para que fiquem disponíveis.

Observações importantes:
- Sempre garanta que cada tag Jinja esteja em um único run (sem ser dividida por estilos). Use "Localizar e substituir" no Word para trocar facilmente `[texto]` -> `{{ texto }}`.
- Para textos com formatação interna dinâmica use `{{r campo }}` e envie um objecto RichText no contexto (docxtpl).
