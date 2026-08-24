// Prova de que o workspace está corretamente ligado a @somaverso/motor —
// nenhuma interface real ainda (M3).
import { avalia } from "@somaverso/motor";

// TODO (M3, PRD §6): "A interface mostra o veredito em tempo real; o
// servidor reavalia e reemite o veredito antes de qualquer efeito. O
// veredito do cliente é conveniência de UX e não tem autoridade." Ou seja:
// esta página pode chamar avalia() localmente para feedback instantâneo,
// mas a emissão real (POST /v1/matriculas/:id/emissao) sempre depende do
// veredito recalculado no servidor.

const app = document.querySelector<HTMLDivElement>("#app");
if (app) {
  app.textContent = `Interface operacional — M3. (motor: ${typeof avalia})`;
}
