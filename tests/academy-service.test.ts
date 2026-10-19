import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ user: vi.fn(), flags: vi.fn(), service: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({createClient: async () => ({auth:{getUser:mocks.user}})}));
vi.mock("@/lib/services/flags", () => ({getFeatureFlags:mocks.flags}));
vi.mock("@/lib/supabase/service-role", () => ({createServiceRoleClient:mocks.service}));
import { getAcademyData } from "@/lib/services/academy";
describe("Academy privileged reads", () => {
  beforeEach(() => vi.clearAllMocks());
  it("does not create a service role client without verified identity", async () => {
    mocks.user.mockResolvedValue({data:{user:null},error:null});
    expect(await getAcademyData()).toEqual({state:"signed_out"});
    expect(mocks.service).not.toHaveBeenCalled();
    expect(mocks.flags).not.toHaveBeenCalled();
  });
  it("does not read private configuration when the feature is disabled", async () => {
    mocks.user.mockResolvedValue({data:{user:{id:"member"}},error:null});
    mocks.flags.mockResolvedValue({member_academy_enabled:false});
    expect(await getAcademyData()).toEqual({state:"disabled"});
    expect(mocks.service).not.toHaveBeenCalled();
  });
  it("returns an honest empty result for no published paths", async () => {
    mocks.user.mockResolvedValue({data:{user:{id:"member"}},error:null});
    mocks.flags.mockResolvedValue({member_academy_enabled:true});
    const eq=vi.fn().mockReturnValue({order:async()=>({data:[],error:null})});
    mocks.service.mockReturnValue({from:()=>({select:()=>({eq})})});
    expect(await getAcademyData()).toEqual({state:"ready",paths:[]});
    expect(eq).toHaveBeenCalledWith("status","published");
  });
});
