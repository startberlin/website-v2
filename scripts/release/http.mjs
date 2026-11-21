import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

const execute = promisify(execFile);

export function curlResponse(headerText, body) {
  // curl may include a proxy handshake or interim response before the real headers.
  const block = headerText.trim().split(/\r?\n\r?\n/).filter(part => /^HTTP\//.test(part)).at(-1);
  const lines = block?.split(/\r?\n/) || [];
  const status = /^HTTP\/[\d.]+\s+(\d{3})\b/.exec(lines.shift() || '');
  if (!status) throw new Error('The authenticated request returned no valid HTTP status.');
  const headers = new Headers();
  for (const line of lines) {
    const separator = line.indexOf(':');
    if (separator <= 0) throw new Error('The authenticated request returned malformed headers.');
    headers.append(line.slice(0, separator), line.slice(separator + 1).trim());
  }
  const code = Number(status[1]);
  return new Response([204, 205, 304].includes(code) ? null : body, { status: code, headers });
}

export async function vercelGet(url, cli = process.env.VERCEL_CLI) {
  const directory = await mkdtemp(join(tmpdir(), 'website-http-'));
  const headerFile = join(directory, 'headers');
  const bodyFile = join(directory, 'body');
  try {
    // The CLI obtains project-scoped access using the existing Vercel authentication.
    // No credential is passed as an argument, and redirects remain visible to smoke checks.
    // curl is non-interactive by design; this CLI version forwards that global flag to curl.
    await execute(cli, ['curl', url.href, '--',
      '--silent', '--show-error', '--max-time', '30', '--no-location',
      '--dump-header', headerFile, '--output', bodyFile], { timeout: 45_000, maxBuffer: 512_000 });
    return curlResponse(await readFile(headerFile, 'utf8'), await readFile(bodyFile));
  } catch (error) {
    // CLI error objects can contain captured output. Keep credentials out of diagnostics.
    throw new Error(`Authenticated GET ${url.pathname} failed. Verify the START Vercel token and deployment access.`, { cause: error });
  } finally { await rm(directory, { recursive: true, force: true }); }
}
