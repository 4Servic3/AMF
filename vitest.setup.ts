import { vi } from 'vitest';

// Variáveis de ambiente de fallback para execução segura em testes locais
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy-test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy';

// Mock do pacote server-only para execução de testes unitários isolados
vi.mock('server-only', () => ({}));

// Mock de next/headers para Next.js 16 App Router em ambiente Vitest
vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    getAll: () => [],
    setAll: () => {},
    get: () => undefined,
    set: () => {},
  })),
  headers: vi.fn(async () => new Headers()),
}));
