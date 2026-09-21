import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ access: vi.fn(), read: vi.fn() }));
vi.mock('@/lib/products/planilha-access', () => ({ getPlanilhaAccess: mocks.access }));
vi.mock('@/lib/products/planilha-files', () => ({ readPlanilhaFile: mocks.read, PLANILHA_XLSX_KEY: 'fixed-private-file.xlsx' }));
import { GET } from '@/app/api/products/planilha-doses-seguras-felinos/download/route';
beforeEach(() => { vi.resetAllMocks(); });
it.each([['unauthenticated',401],['locked',403],['unavailable',503]])('blocks %s without reading paid files', async (state, status) => {
  mocks.access.mockResolvedValue({state});
  const response = await GET();
  expect(response.status).toBe(status);
  expect(response.headers.get('cache-control')).toContain('no-store');
  expect(mocks.read).not.toHaveBeenCalled();
});
it('sends the original bytes only after authorization, as a private Excel attachment', async () => {
  mocks.access.mockResolvedValue({state:'available'});
  const original = new Uint8Array([80,75,3,4,10,20,30]);
  mocks.read.mockResolvedValue(new Blob([original]));
  const response = await GET();
  expect(response.status).toBe(200);
  expect(mocks.read).toHaveBeenCalledWith('fixed-private-file.xlsx');
  expect(new Uint8Array(await response.arrayBuffer())).toEqual(original);
  expect(response.headers.get('content-disposition')).toContain('attachment;');
  expect(response.headers.get('content-type')).toContain('spreadsheetml');
  expect(response.headers.get('cache-control')).toContain('no-store');
  expect(response.headers.get('vary')).toBe('Cookie');
});
it('does not expose storage or authentication errors', async () => {
  mocks.access.mockResolvedValue({state:'available'});
  mocks.read.mockRejectedValue(new Error('SECRET-URL'));
  const response = await GET();
  expect(response.status).toBe(503);
  expect(await response.text()).not.toContain('SECRET-URL');
});
