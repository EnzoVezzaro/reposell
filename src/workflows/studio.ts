/**
 * Launches the visual /sell builder (@reposell/storefront-studio) against
 * the current repository. Fetched from npm at run time via npx — zero
 * configuration: the Studio operates on <cwd>/.reposell/storefront.json
 * and renders into <cwd>/sell/ by convention.
 *
 * Port 5199 belongs to the builder: a stale or half-dead previous instance
 * is detected and terminated automatically, so users never clean up by hand.
 */

import { spawn, spawnSync } from 'child_process';

export const STUDIO_PORT = 5199;
export const STUDIO_URL = `http://localhost:${STUDIO_PORT}`;
// Cold npx installs the package (GrapesJS is large) — allow a slow first run.
const READY_TIMEOUT_MS = 90_000;

/** Opens the URL in the user's browser (best effort, all platforms). */
function openBrowser(): void {
  try {
    const opener = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'cmd' : 'xdg-open';
    const args = process.platform === 'win32' ? ['/c', 'start', '', STUDIO_URL] : [STUDIO_URL];
    const child = spawn(opener, args, { stdio: 'ignore', detached: true });
    child.unref();
    child.on('error', () => {});
  } catch {
    // Opening is cosmetic; the URL is printed in the transcript regardless.
  }
}

/** Pure: extracts numeric PIDs from `lsof -ti` output. Exported for tests. */
export function parsePids(text: string): number[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^\d+$/.test(line))
    .map((line) => Number(line))
    // PID 0 is not a process — kill(0) would signal the whole group.
    .filter((pid) => pid > 0);
}

/** Best-effort: PIDs listening on the builder port (empty when unknown). */
function pidsOnPort(): number[] {
  if (process.platform === 'win32') return []; // lsof unavailable; skip silently
  try {
    const result = spawnSync('lsof', ['-ti', `tcp:${STUDIO_PORT}`], { encoding: 'utf8' });
    return parsePids(result.stdout ?? '');
  } catch {
    return [];
  }
}

function killStalePortHolders(): boolean {
  const pids = pidsOnPort();
  if (pids.length === 0) return false;
  for (const pid of pids) {
    try {
      process.kill(pid, 'SIGKILL');
    } catch {
      // Already gone or owned by another user — nothing to do.
    }
  }
  return true;
}

export interface StudioLaunch {
  started: boolean;
  /** True when the URL is serving (freshly started or already running). */
  ready: boolean;
  detail?: string;
}

function isReady(): Promise<boolean> {
  return fetch(`${STUDIO_URL}/api/document`, { signal: AbortSignal.timeout(2_000) })
    .then((response) => response.ok)
    .catch(() => false);
}

/**
 * Starts the Studio via npx (detached — it outlives the wizard) and resolves
 * once it serves. If something already listens on the port, reports ready
 * without starting a second instance.
 */
export async function launchStudio(cwd: string): Promise<StudioLaunch> {
  if (await isReady()) {
    // Already running (e.g. a previous wizard session) — the bin only opens
    // the browser on fresh starts, so open it here too.
    openBrowser();
    return { started: false, ready: true };
  }

  // Port 5199 is the builder's dedicated port: anything listening that does
  // not answer the health probe is stale (crashed run, old code, foreign
  // process). Terminate it so the user never has to.
  if (killStalePortHolders()) {
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  // The builder must outlive the wizard (detached), but if it dies BEFORE
  // ever serving (bad install, crash on boot) we must not sit through the
  // full readiness timeout — surface the exit immediately instead.
  let exitedEarly: string | null = null;
  const spawnOnce = (): void => {
    const child = spawn(command, ['-y', '@reposell/storefront-studio@latest'], {
      cwd,
      detached: true,
      stdio: 'ignore',
    });
    child.unref();
    child.on('error', (error) => {
      exitedEarly = `could not run npx (${error.message})`;
    });
    child.on('exit', (code, signal) => {
      exitedEarly = `builder process exited before serving (code ${code ?? signal})`;
    });
  };

  try {
    spawnOnce();
  } catch (error) {
    return {
      started: false,
      ready: false,
      detail: error instanceof Error ? error.message : String(error),
    };
  }

  let ready = false;
  const deadline = Date.now() + READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    ready = await isReady();
    if (ready || exitedEarly !== null) break;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  if (!ready && exitedEarly !== null && killStalePortHolders()) {
    // The fresh instance died against a zombie we only now could see
    // (race between probe and listen) — clear and retry exactly once.
    exitedEarly = null;
    spawnOnce();
    const retryDeadline = Date.now() + READY_TIMEOUT_MS;
    while (Date.now() < retryDeadline) {
      ready = await isReady();
      if (ready || exitedEarly !== null) break;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  if (!ready) {
    return {
      started: true,
      ready: false,
      detail: exitedEarly ?? `builder did not become ready at ${STUDIO_URL} within ${READY_TIMEOUT_MS / 1000}s`,
    };
  }
  // Fresh start: give Vite's first compile a beat, then open.
  setTimeout(openBrowser, 1_500);
  return { started: true, ready: true };
}
