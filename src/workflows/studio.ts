/**
 * Launches the visual /sell builder (@reposell/storefront-studio) against
 * the current repository. Fetched from npm at run time via npx — zero
 * configuration: the Studio operates on <cwd>/.reposell/storefront.json
 * and renders into <cwd>/sell/ by convention.
 */

import { spawn } from 'child_process';

export const STUDIO_PORT = 5199;
export const STUDIO_URL = `http://localhost:${STUDIO_PORT}`;
const READY_TIMEOUT_MS = 30_000;

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
  return ready
    ? { started: true, ready: true }
    : { started: true, ready: false, detail: `builder did not become ready at ${STUDIO_URL} within ${READY_TIMEOUT_MS / 1000}s` };
}
