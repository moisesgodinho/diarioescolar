import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

function parseEnvBlock(content) {
  const values = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');

    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim().replace(/^"|"$/g, '');

    values[key] = value;
  }

  return values;
}

const workspaceRoot = process.cwd();
const envLocalPath = resolve(workspaceRoot, '.env.local');
const npxBin = process.platform === 'win32' ? 'npx.cmd' : 'npx';

const statusOutput = execFileSync(
  npxBin,
  ['supabase', 'status', '-o', 'env'],
  {
    cwd: workspaceRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  },
);

const supabaseEnv = parseEnvBlock(statusOutput);

if (!supabaseEnv.API_URL || !supabaseEnv.ANON_KEY) {
  throw new Error('Could not read API_URL or ANON_KEY from `supabase status -o env`.');
}

const existingEnv = existsSync(envLocalPath)
  ? parseEnvBlock(readFileSync(envLocalPath, 'utf8'))
  : {};

const nextEnv = [
  '# Generated from local Supabase status.',
  `VITE_SUPABASE_URL=${supabaseEnv.API_URL}`,
  `VITE_SUPABASE_ANON_KEY=${supabaseEnv.ANON_KEY}`,
  `VITE_BD_CATALOG_SYNC_URL=${existingEnv.VITE_BD_CATALOG_SYNC_URL ?? ''}`,
  '',
].join('\n');

writeFileSync(envLocalPath, nextEnv, 'utf8');

process.stdout.write(`Updated ${envLocalPath}\n`);
