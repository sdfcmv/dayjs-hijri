import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const { name: packageName } = JSON.parse(
  readFileSync(join(root, 'package.json'), 'utf8'),
);
const directory = mkdtempSync(join(tmpdir(), 'dayjs-hijri-package-'));

function run(command, args, cwd = directory) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8' });
  assert.equal(
    result.status,
    0,
    `${command} ${args.join(' ')}\n${result.stdout}\n${result.stderr}`,
  );
  return result.stdout;
}

try {
  const packed = JSON.parse(
    run(
      'npm',
      ['pack', '--ignore-scripts', '--json', '--pack-destination', directory],
      root,
    ),
  )[0];
  for (const required of [
    'dist/index.js',
    'dist/index.cjs',
    'dist/index.d.ts',
    'dist/index.d.cts',
    'LICENSE',
    'THIRD_PARTY_NOTICES.md',
  ]) {
    assert(
      packed.files.some((file) => file.path === required),
      `Missing published file: ${required}`,
    );
  }
  assert(
    !packed.files.some((file) => /^(src|test|node_modules)\//.test(file.path)),
    'Development files leaked into package.',
  );

  const modules = join(directory, 'node_modules');
  const installed = join(modules, ...packageName.split('/'));
  mkdirSync(installed, { recursive: true });
  run('tar', [
    '-xzf',
    join(directory, packed.filename),
    '--strip-components=1',
    '-C',
    installed,
  ]);
  symlinkSync(join(root, 'node_modules/dayjs'), join(modules, 'dayjs'), 'dir');

  for (const notice of ['LICENSE', 'THIRD_PARTY_NOTICES.md']) {
    const expected = readFileSync(join(root, notice), 'utf8');
    assert.equal(
      readFileSync(join(installed, notice), 'utf8'),
      expected,
      `Published notice differs from source: ${notice}`,
    );
    for (const bundle of ['dist/index.js', 'dist/index.cjs']) {
      assert(
        readFileSync(join(installed, bundle), 'utf8').includes(expected.trim()),
        `Missing license notice in ${bundle}: ${notice}`,
      );
    }
  }

  const assertions = `
    dayjs.extend(hijri);
    const value = dayjs.hijri('1446-07-07');
    assert.equal(value.format('YYYY-MM-DD'), '1446-07-07');
    assert.equal(value.calendar('gregory').format('YYYY-MM-DD'), '2025-01-07');
    assert.deepEqual(gregorianToHijri(2025, 1, 7), { year: 1446, month: 7, day: 7, daysInMonth: 30 });
  `;
  run(process.execPath, [
    '--input-type=module',
    '-e',
    `
    import assert from 'node:assert/strict';
    import dayjs from 'dayjs';
    import hijri, { gregorianToHijri } from ${JSON.stringify(packageName)};
    ${assertions}
  `,
  ]);
  run(process.execPath, [
    '--input-type=commonjs',
    '-e',
    `
    const assert = require('node:assert/strict');
    const dayjs = require('dayjs');
    const { default: hijri, gregorianToHijri } = require(${JSON.stringify(packageName)});
    ${assertions}
  `,
  ]);

  const consumer = `
    import dayjs from 'dayjs';
    import hijri, { gregorianToHijri, type Calendar, type HijriDate } from ${JSON.stringify(packageName)};
    dayjs.extend(hijri, { weekStart: 6 });
    const value: dayjs.Dayjs = dayjs.hijri('1446-07-07');
    const calendar: Calendar = value.calendar();
    const date: HijriDate = gregorianToHijri(2025, 1, 7);
    dayjs('1446-07-07', { hijri: true, calendar: 'hijri' }).date(1).calendar(calendar);
    // @ts-expect-error Invalid calendar names must be rejected.
    value.calendar('invalid');
    // @ts-expect-error Public date results are readonly.
    date.year = 1;
  `;
  writeFileSync(join(directory, 'consumer.mts'), consumer);
  writeFileSync(join(directory, 'consumer.cts'), consumer);
  run(process.execPath, [
    join(root, 'node_modules/typescript/bin/tsc'),
    '--noEmit',
    '--strict',
    '--esModuleInterop',
    '--module',
    'NodeNext',
    '--moduleResolution',
    'NodeNext',
    '--target',
    'ES2022',
    'consumer.mts',
    'consumer.cts',
  ]);
  const manifest = JSON.parse(
    readFileSync(join(installed, 'package.json'), 'utf8'),
  );
  assert.deepEqual(Object.keys(manifest.peerDependencies), ['dayjs']);
  console.log(
    `Packed ${packed.files.length} files; isolated ESM, CommonJS, and TypeScript consumers passed.`,
  );
} finally {
  rmSync(directory, { recursive: true, force: true });
}
