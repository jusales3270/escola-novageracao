import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = fileURLToPath(new URL(".", import.meta.url));
const fixtures = JSON.parse(readFileSync(path.resolve(AQUI, "../.fixtures.json"), "utf8")) as {
  operador: { email: string; senha: string };
  anoLetivo: number;
};

/**
 * PRD §17/§19 — jornada adaptada ao que é testável no M3 (sem M4/M5):
 * INCOMPLETO → BLOQUEADO (R-07, tabela não aprovada) → LIBERADO (após
 * aprovação + testemunhas) → emissão real com stub honesto → trilha.
 */
test("jornada de matrícula: incompleto → bloqueado → liberado → emissão", async ({ page }) => {
  await page.goto("/login");
  await page.locator('input[type="email"]').fill(fixtures.operador.email);
  await page.locator('input[type="password"]').fill(fixtures.operador.senha);
  await page.getByRole("button", { name: "Entrar" }).click();

  await expect(page).toHaveURL(/\/matriculas/);

  await page.getByLabel(/ano letivo/i).fill(String(fixtures.anoLetivo));
  await page.getByRole("button", { name: "Criar rascunho" }).click();
  await expect(page.getByText(/RASCUNHO/)).toBeVisible();

  // Simula com pedido vazio => INCOMPLETO.
  await page.getByRole("button", { name: "Simular" }).click();
  await expect(page.getByText(/pendente/)).toBeVisible();

  // Preenche o formulário mínimo para ficar completo.
  const aluno = page.getByRole("group", { name: "Aluno" });
  await aluno.getByPlaceholder("Nome do aluno").fill("Ana Beatriz Souza");
  await aluno.locator('input[type="date"]').fill("2020-01-15");
  await aluno.getByPlaceholder("Endereço").fill("Rua das Flores, 123");
  await aluno.getByPlaceholder("Bairro").fill("Centro");
  await aluno.getByPlaceholder("Cidade").fill("Itu");
  await aluno.getByPlaceholder("CEP").fill("13300000");
  await aluno.getByPlaceholder("Contato de emergência — nome").fill("Maria Souza");
  await aluno.getByPlaceholder("Contato de emergência — telefone").fill("11999990000");

  const contratante = page.getByRole("group", { name: "Contratante" });
  await contratante.getByPlaceholder("Nome").fill("Carlos Souza");
  await contratante.getByPlaceholder("CPF").fill("52998224725");
  await contratante.getByPlaceholder("E-mail").fill("carlos@example.com");
  await contratante.getByPlaceholder("Telefone").fill("11999990001");

  const financeiro = page.getByRole("group", { name: "Responsável financeiro" });
  await financeiro.getByRole("checkbox").check();

  const consentimentos = page.getByRole("group", { name: "Consentimento de imagem por canal" });
  for (const rotulo of ["SITE", "REDES_SOCIAIS", "ALBUM_TURMA", "USO_PEDAGOGICO_INTERNO", "MATERIAL_IMPRESSO"]) {
    await consentimentos.getByLabel(rotulo).check();
  }

  // Tabela ainda não aprovada => BLOQUEADO em R-07.
  await page.getByRole("button", { name: "Simular" }).click();
  await expect(page.getByText("R-07")).toBeVisible();
  await expect(page.getByRole("button", { name: "Emitir" })).toBeDisabled();

  // Define as 2 testemunhas exigidas por R-06 (papel DIRECAO).
  const testemunhas = page.getByRole("group", { name: /Testemunhas/ });
  await testemunhas
    .getByPlaceholder(/Nome,CPF,email/)
    .fill("Renato Alves,52998224725,renato@novageracaoitu.com.br; Débora Lima,11144477735,debora@novageracaoitu.com.br");
  await testemunhas.getByRole("button", { name: "Definir testemunhas" }).click();

  // Aprova a tabela de preços numa aba separada (mesmo usuário, papel DIRECAO).
  await page.getByRole("link", { name: "Tabelas de preço" }).click();
  await expect(page.getByRole("row", { name: new RegExp(String(fixtures.anoLetivo)) })).toBeVisible();
  await page.getByRole("row", { name: new RegExp(String(fixtures.anoLetivo)) }).getByRole("button", { name: "Aprovar" }).click();
  await expect(page.getByRole("row", { name: new RegExp(String(fixtures.anoLetivo)) })).toContainText("APROVADA");

  // Volta pela navegação do browser (não pelo link genérico "Matrícula")
  // para preservar o id da matrícula na URL — ver App.tsx/PaginaMatricula.tsx.
  await page.goBack();

  // Agora deve liberar.
  await page.getByRole("button", { name: "Simular" }).click();
  await expect(page.getByText("✅ LIBERADO")).toBeVisible();
  await expect(page.getByRole("button", { name: "Emitir" })).toBeEnabled();

  await page.getByRole("button", { name: "Emitir" }).click();
  await expect(page.getByText(/M4\/M5/)).toBeVisible();

  // Trilha íntegra: PEDIDO_RECEBIDO seguido de VEREDITO_MOTOR.
  await expect(page.getByText("PEDIDO_RECEBIDO")).toBeVisible();
  await expect(page.getByText("VEREDITO_MOTOR")).toBeVisible();
});
