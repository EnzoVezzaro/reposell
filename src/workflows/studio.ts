/**
 * Launches the visual /sell builder (@reposell/storefront-studio) against
 * the current repository. Fetched from npm at run time via npx — zero
 * configuration: the Studio operates on <cwd>/.reposell/storefront.json
 * and renders into <cwd>/sell/ by convention.
 */

import { spawn } from 'child_process';

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

async function waitForReady(): Promise<boolean> {
  const deadline = Date.now() + READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (await isReady()) return true;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return false;
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

  const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  try {
    const child = spawn(command, ['-y', '@reposell/storefront-studio@latest'], {
      cwd,
      detached: true,
      stdio: 'ignore',
    });
    child.unref();
    child.on('error', () => {});
  } catch (error) {
    return {
      started: false,
      ready: false,
      detail: error instanceof Error ? error.message : String(error),
    };
  }

  const ready = await waitForReady();
  if (!ready) {
    return { started: true, ready: false, detail: `builder did not become ready at ${STUDIO_URL} within ${READY_TIMEOUT_MS / 1000}s` };
  }
  // Fresh start: give Vite's first compile a beat, then open.
  setTimeout(openBrowser, 1_500);
  return { started: true, ready: true };
}
