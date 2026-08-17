import { describe, it, expect, vi } from 'vitest';
import { GET } from '../src/app/app/certificados/[certificateId]/route';

// Mock request
function createMockRequest() {
  return new Request('http://localhost:3000/app/certificados/preview-test');
}

describe('Certificate API', () => {
  it('should return a PDF buffer with status 200', async () => {
    const req = createMockRequest();
    const response = await GET(req, { params: Promise.resolve({ certificateId: 'preview-test' }) } as any);
    
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/pdf');
    expect(response.headers.get('Content-Disposition')).toContain('inline; filename="Certificado_test.pdf"');
    
    // Check if body is present (the PDF buffer)
    const arrayBuffer = await response.arrayBuffer();
    expect(arrayBuffer.byteLength).toBeGreaterThan(0);
  });
});
