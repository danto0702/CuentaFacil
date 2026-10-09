import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { renderTagsDoc } from '../src/tags-doc.js';

const target = fileURLToPath(new URL('../../../docs/TEMPLATE_TAGS.md', import.meta.url));
await writeFile(target, renderTagsDoc());
console.log(`✓ ${target}`);
