import { describe, expect, test } from "vitest";
import { montaMaterialCanonico, ordenaChavesRecursivo, serializaCanonico } from "../../src/canonico.js";
import { GENESE } from "../../src/tipos.js";

describe("montaMaterialCanonico", () => {
  test("produz a string exata na ordem de chaves do PRD §10, sem espaços", () => {
    const material = montaMaterialCanonico({
      seq: 1,
      em: "2027-02-01T12:00:00.000Z",
      tipo: "PEDIDO_RECEBIDO",
      ator: "secretaria@novageracaoitu.com.br",
      matriculaId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      payloadJson: '{"a":1,"b":2}',
      hashAnterior: GENESE,
    });

    expect(material).toBe(
      '{"seq":1,"em":"2027-02-01T12:00:00.000Z","tipo":"PEDIDO_RECEBIDO",' +
        '"ator":"secretaria@novageracaoitu.com.br",' +
        '"matriculaId":"3fa85f64-5717-4562-b3fc-2c963f66afa6",' +
        '"payload":{"a":1,"b":2},' +
        `"hashAnterior":"${GENESE}"}`,
    );
  });

  test("matriculaId nulo serializa como JSON null, não string vazia", () => {
    const material = montaMaterialCanonico({
      seq: 1,
      em: "2027-02-01T12:00:00.000Z",
      tipo: "TABELA_APROVADA",
      ator: "direcao@novageracaoitu.com.br",
      matriculaId: null,
      payloadJson: "{}",
      hashAnterior: GENESE,
    });
    expect(material).toContain('"matriculaId":null');
  });
});

describe("ordenaChavesRecursivo", () => {
  test("ordena chaves de objeto simples", () => {
    expect(ordenaChavesRecursivo({ b: 2, a: 1 })).toEqual({ a: 1, b: 2 });
    expect(JSON.stringify(ordenaChavesRecursivo({ b: 2, a: 1 }))).toBe('{"a":1,"b":2}');
  });

  test("ordena recursivamente objetos aninhados", () => {
    const ordenado = ordenaChavesRecursivo({ z: { y: 2, x: 1 }, a: 1 });
    expect(JSON.stringify(ordenado)).toBe('{"a":1,"z":{"x":1,"y":2}}');
  });

  test("preserva ordem de arrays (ordem é semântica, não alfabética)", () => {
    const ordenado = ordenaChavesRecursivo({ lista: [3, 1, 2] });
    expect(ordenado).toEqual({ lista: [3, 1, 2] });
  });

  test("valores primitivos e null passam direto", () => {
    expect(ordenaChavesRecursivo(42)).toBe(42);
    expect(ordenaChavesRecursivo("x")).toBe("x");
    expect(ordenaChavesRecursivo(null)).toBe(null);
  });
});

describe("serializaCanonico", () => {
  test("ordena o payload antes de montar o material — ordem de construção do objeto não importa", () => {
    const base = {
      seq: 1,
      em: "2027-02-01T12:00:00.000Z",
      tipo: "PEDIDO_RECEBIDO",
      ator: "secretaria@novageracaoitu.com.br",
      matriculaId: null,
      hashAnterior: GENESE,
    };
    const m1 = serializaCanonico({ ...base, payload: { b: 2, a: 1 } });
    const m2 = serializaCanonico({ ...base, payload: { a: 1, b: 2 } });
    expect(m1).toBe(m2);
  });
});
