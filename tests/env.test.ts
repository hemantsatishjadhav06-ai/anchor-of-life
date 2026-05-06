import { describe, it, expect, afterEach, vi } from 'vitest';

const REQUIRED_KEYS = ['OPENROUTER_API_KEY'] as const;

describe('env module', () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it('loads without throwing when all required vars are present', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'test-key');
    await expect(import('@/lib/env')).resolves.toBeDefined();
  });

  for (const key of REQUIRED_KEYS) {
    it(`throws with "${key}" in the error message when ${key} is missing`, async () => {
      vi.stubEnv(key, '');
      await expect(import('@/lib/env')).rejects.toThrow(key);
    });
  }
});
