export interface EnvSource {
  processEnv: Record<string, string | undefined>;
  envFileValues: Record<string, string>;
}

export function parseEnvFile(text: string) {
  const values: Record<string, string> = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.length === 0 || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"') && value.length >= 2) ||
      (value.startsWith("'") && value.endsWith("'") && value.length >= 2)
    ) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }
  return values satisfies Record<string, string>;
}

export function loadEnvSource(
  cwd: string,
  processEnv: Record<string, string | undefined>,
  readFile: (path: string) => Promise<string | undefined>,
): Promise<EnvSource> {
  return readFile(`${cwd}/.env`).then((text) => ({
    processEnv,
    envFileValues: text === undefined ? {} : parseEnvFile(text),
  }));
}

export function resolveValue(source: EnvSource, key: string): string | undefined {
  const fromProcess = source.processEnv[key];
  if (fromProcess !== undefined && fromProcess.trim().length > 0) return fromProcess;
  return source.envFileValues[key];
}
