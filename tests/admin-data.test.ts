import { beforeEach, describe, it, expect, vi } from "vitest";
const mocks = vi.hoisted(() => ({ permission: vi.fn(), service: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/dal", () => ({ requirePermission: mocks.permission }));
vi.mock("@/lib/supabase/service-role", () => ({
  createServiceRoleClient: mocks.service,
}));
import { adminDb, allRows } from "@/lib/admin-data";
describe("privileged admin data", () => {
  beforeEach(() => vi.resetAllMocks());
  it("checks permission before creating privileged client", async () => {
    mocks.permission.mockRejectedValue(new Error("denied"));
    await expect(adminDb("users.manage")).rejects.toThrow("denied");
    expect(mocks.service).not.toHaveBeenCalled();
  });
  it("does not truncate a report at the database page limit", async () => {
    const range = vi
      .fn()
      .mockResolvedValueOnce({
        data: Array.from({ length: 500 }, (_, id) => ({ id })),
        error: null,
      })
      .mockResolvedValueOnce({ data: [{ id: 501 }], error: null });
    const q: any = { select: () => q, order: () => q, range };
    const result = await allRows({ from: () => q }, "profiles", "id");
    expect(result).toHaveLength(501);
    expect(range).toHaveBeenLastCalledWith(500, 999);
  });
  it("surfaces failed queries instead of returning misleading zero totals", async () => {
    const q: any = {
      select: () => q,
      order: () => q,
      range: () => Promise.resolve({ data: null, error: { code: "offline" } }),
    };
    await expect(allRows({ from: () => q }, "profiles", "id")).rejects.toThrow(
      "consultar",
    );
  });
});
