import { describe, expect, it } from "vitest";
import { calcDose } from "@/components/planilha-felinos/utils/dose";
import { matchesSearch, normalizeText } from "@/components/planilha-felinos/utils/normalize";
import type { CalcInfo } from "@/components/planilha-felinos/types";

describe("planilha original calculation compatibility", () => {
  it("scales a synthetic dose range by weight", () => {
    const calc: CalcInfo = { type: "mg_per_kg", minCoef: 2, maxCoef: 4, unit: "mg" };
    expect(calcDose(calc, 4)).toBe("8 – 16 mg");
    expect(calcDose(calc, 0.5)).toBe("1 – 2 mg");
    expect(calcDose(calc, 20)).toBe("40 – 80 mg");
  });
  it("preserves microgram units and the original two-decimal rounding", () => {
    expect(calcDose({ type: "mg_per_kg", minCoef: 0.333, maxCoef: 0.333, unit: "mcg" }, 4)).toBe("1.33 mcg");
    expect(calcDose({ type: "mg_per_kg", minCoef: 2.5, maxCoef: 2.5 }, 4)).toBe("10 mg");
  });
  it.each(["pending", "fixed", "per_m2", "topical", "reference_only"] as const)(
    "does not calculate a %s reference",
    (type) => expect(calcDose({ type, minCoef: 2, maxCoef: 4 }, 4)).toBeNull(),
  );
  it("returns no result for missing coefficients", () => {
    expect(calcDose({ type: "mg_per_kg", minCoef: 2 }, 4)).toBeNull();
  });
});

describe("planilha original search compatibility", () => {
  it("ignores accents, surrounding whitespace, and case", () => {
    expect(normalizeText("  INDICAÇÃO  ")).toBe("indicacao");
    expect(matchesSearch("ANALGESICO", "Nome sintético", "Analgésico", "")).toBe(true);
  });
  it("searches each supplied field independently", () => {
    expect(matchesSearch("exemplo", "Nome", "Classe", "Indicação de exemplo")).toBe(true);
    expect(matchesSearch("ausente", "Nome", "Classe", "Indicação")).toBe(false);
    expect(matchesSearch("   ", "Nome")).toBe(true);
  });
});
