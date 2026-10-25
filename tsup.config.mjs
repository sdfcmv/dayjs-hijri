import { readFileSync } from 'node:fs';
import { defineConfig } from 'tsup';

// Keep the project and calendar-data licenses with standalone copies of either build.
const licenseBanner = `/*!\n${['LICENSE', 'THIRD_PARTY_NOTICES.md']
  .map((file) => readFileSync(new URL(file, import.meta.url), 'utf8').trim())
  .join('\n\n')}\n*/`;

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  target: 'es2022',
  dts: true,
  sourcemap: true,
  clean: true,
  external: ['dayjs'],
  banner: { js: licenseBanner },
});
