import { describe, it, expect } from "vitest";
import { accessStatus, csvCell, bannerHref } from "@/lib/admin-values";
describe("admin data display", () => {
  it("does not call expired or scheduled access active", () => {
    const now = Date.parse("2026-09-15");
    expect(
      accessStatus({ status: "active", expires_at: "2026-09-15" }, now),
    ).toBe("Expirado");
    expect(
      accessStatus({ status: "active", starts_at: "2026-09-16" }, now),
    ).toBe("Agendado");
    expect(accessStatus({ status: "revoked" }, now)).toBe("Revogado");
  });
  it("neutralizes CSV formulas and escapes structured data", () => {
    expect(csvCell("=1+1").charCodeAt(1)).toBe(39);
    expect(csvCell('a"b')).toBe('"a""b"');
    expect(csvCell({ test: 1 })).toBe('"{""test"":1}"');
  });
  it("restricts banner navigation to supported app routes", () => {
    expect(bannerHref("external_url", "javascript:alert(1)")).toBeUndefined();
    expect(bannerHref("course", "curso-1")).toBe("/app/cursos/curso-1");
    expect(bannerHref("course", null)).toBeUndefined();
  });
});
