import { accessSync, constants } from 'node:fs';
import { execFileSync, spawn } from 'node:child_process';

const MAX_WAIT_MS = 120_000;
const RETRY_INTERVAL_MS = 3_000;

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function canRunDockerInfo() {
  try {
    execFileSync('docker', ['info'], {
      stdio: 'ignore',
    });
    return true;
  } catch {
    return false;
  }
}

function startDockerDesktopOnWindows() {
  const candidates = [
    'C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe',
    'C:\\Program Files\\Docker\\Docker\\Docker Desktop Installer.exe',
  ];

  for (const executablePath of candidates) {
    try {
      accessSync(executablePath, constants.F_OK);
      spawn(executablePath, [], {
        detached: true,
        stdio: 'ignore',
      }).unref();
      return executablePath;
    } catch {
      // Try the next candidate.
    }
  }

  throw new Error(
    'Docker Desktop nao foi encontrado no caminho padrao. Instale-o ou abra-o manualmente antes de rodar o compose.',
  );
}

async function ensureDockerReady() {
  if (canRunDockerInfo()) {
    process.stdout.write('Docker ja esta pronto.\n');
    return;
  }

  if (process.platform === 'win32') {
    const startedPath = startDockerDesktopOnWindows();
    process.stdout.write(`Abrindo Docker Desktop: ${startedPath}\n`);
  } else {
    throw new Error('Docker nao esta rodando. Inicie o daemon do Docker e tente novamente.');
  }

  const deadline = Date.now() + MAX_WAIT_MS;

  while (Date.now() < deadline) {
    if (canRunDockerInfo()) {
      process.stdout.write('Docker ficou disponivel.\n');
      return;
    }

    process.stdout.write('Aguardando o Docker iniciar...\n');
    await sleep(RETRY_INTERVAL_MS);
  }

  throw new Error(
    'O Docker Desktop foi aberto, mas o engine nao ficou pronto a tempo. Aguarde mais um pouco e rode o comando novamente.',
  );
}

await ensureDockerReady();
