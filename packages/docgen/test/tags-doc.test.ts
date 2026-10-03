import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { renderTagsDoc } from '../src/tags-doc.js';

describe('docs/TEMPLATE_TAGS.md', () => {
  it('is up to date (run `pnpm tags:doc`)', async () => {
    const current = await readFile(new URL('../../../docs/TEMPLATE_TAGS.md', import.meta.url), 'utf8');
    expect(current).toBe(renderTagsDoc());
  });
});
