# SomaEscola · Módulo Matrícula

Sistema de matrícula para a CNG Educação (Grupo Nova Geração) — cadastro
único → motor de regras determinístico → requerimento e contrato gerados do
mesmo dado → assinatura eletrônica → arquivo com cadeia de evidência.
Especificação completa em `PRD EMPLEMMENT` (SVS/CNG-PRD-001).

**Zero-Inferência é requisito de arquitetura:** nenhum modelo de linguagem
participa de decisão, cálculo ou geração documental em nenhum pacote deste
repositório.

## Fontes normativas (PRD §0)

Em ordem de precedência quando houver conflito:

1. `files (3)/amostra-contrato.pdf` — fonte jurídica.
2. `files (3)/amostra-requerimento.pdf` — campos e preços praticados.
3. `files (3)/diagnostico-cng.html` — achados A-01…A-13.
4. `files (3)/somaescola-app.html` — protótipo executável; textos de
   veredito, layout dos documentos e formato do envelope.

`files (3)/somaescola-piloto.tar.gz` é um protótipo TS/Zod informal do
próprio time — **não é um artefato normativo listado acima**, é só
referência de código para comparar contra os defeitos catalogados no PRD
§16. Nunca é extraído neste repositório: se precisar comparar lógica
contra um defeito específico, extraia sob demanda para `reference/`
(gitignored) — nunca importado por nenhum pacote do workspace.

## Estrutura

```
apps/
  api/          Fastify — stub (M3)
  web/          SPA (Vite) — stub (M3)
  worker/       BullMQ — stub (M6)
packages/
  motor/        motor determinístico R-01..R-12 — implementado (M1)
  schemas/      Zod, fonte única de tipos — implementado (M1)
  documentos/   templates HTML/PDF — stub (M4)
  ledger/       cadeia de evidência — stub (M2)
infra/
  db/           migrations SQL, RLS — stub (M2)
```

## Marcos (PRD §19)

| Marco | Entrega | Aceite |
|---|---|---|
| M1 | `packages/motor` + `packages/schemas` + suíte de testes | golden 2027 bloqueia em R-01 |
| M2 | Postgres, RLS, cadeia append-only, verificação | teste de adulteração passa |
| M3 | API + interface operacional com veredito em tempo real | E2E incompleto → bloqueado → liberado |
| M4 | Render Playwright + selo + arquivo | determinismo de SHA-256 |
| M5 | DocuSign JWT + envelope + webhook + arquivamento do assinado | envelope real em homologação, 5 signatários |
| M6 | BullMQ/Redis, DLQ, observabilidade | pico simulado de 40 emissões/dia |

## Pendências que bloqueiam decisões de negócio (PRD §18)

Sete decisões só a escola pode tomar (preço do berçário integral, tabela
2028 aprovada, testemunhas fixas ou variáveis, parecer jurídico sobre
consentimento, DPA assinado, etc.). Enquanto não resolvidas, o sistema
**bloqueia**, não escolhe — por isso a tabela 2027 permanece no repositório
como fixture de regressão que deve continuar produzindo `BLOQUEADO` em
R-01 para berçário integral.

## Uso

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm test:coverage   # 100% de cobertura de branch em packages/motor
```
