# @somaverso/documentos (stub — M4)

Templates HTML + CSS de impressão para o requerimento de matrícula e o
contrato de prestação de serviços (PRD §11), renderizados via
Playwright/Chromium.

**Antes de implementar:** o texto, o CSS e as âncoras de assinatura devem
ser copiados **ao caractere** de `files (3)/somaescola-app.html` (artefato
normativo #4, PRD §0) — não parafrasear cláusulas, rótulos ou referências
legais (Cl. 8ª §6º, Cl. 12ª §1º, Cl. 13ª §1º, Cl. 15ª, Cl. 16ª, CPC art.
784 III, LGPD art. 14/39).

Requisitos de determinismo (PRD §11): fontes embutidas e locais, sem CDN em
tempo de render, `TZ=America/Sao_Paulo`, metadados fixos, sem
cabeçalho/rodapé do Chromium, escala 1 — mesmo pedido + mesma tabela +
mesmo `geradoEm` deve produzir sempre o mesmo SHA-256.

Logotipo: ativo real do cliente, versionado em `assets/`. Não gerar marca,
não substituir por texto.
