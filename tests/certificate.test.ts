import { describe, it, expect, vi } from 'vitest';
import { GET } from '../src/app/app/certificados/[certificateId]/route';

// Mock Supabase server client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: vi.fn(async () => ({ data: { user: { id: 'test-user', email: 'test@amf.com' } }, error: null })),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: 'cert-123',
          course_id: 'course-123',
          profile_id: 'test-user',
          title: 'Test Course',
          full_name: 'Dr. Teste',
          validation_code: 'ABCDEF',
          issue_date: new Date().toISOString(),
        },
        error: null,
      }),
    })),
  })),
}));

// Mock request
function createMockRequest() {
  return new Request('http://localhost:3000/app/certificados/cert-123');
}

describe('Certificate API', () => {
  it('should return a PDF buffer with status 200', async () => {
    const req = createMockRequest();
    const response = await GET(req, { params: Promise.resolve({ certificateId: 'cert-123' }) } as any);
    
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/pdf');
    expect(response.headers.get('Content-Disposition')).toContain('inline; filename="Certificado_cert-123.pdf"');
    
    // Check if body is present (the PDF buffer)
    const arrayBuffer = await response.arrayBuffer();
    expect(arrayBuffer.byteLength).toBeGreaterThan(0);
  });
});
