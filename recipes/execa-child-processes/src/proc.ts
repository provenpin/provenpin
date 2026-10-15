import { execa, ExecaError } from "execa";

const node = process.execPath;

/** Run a small Node script as a subprocess (stands in for any CLI tool). */
export function runScript(code: string, opts: { input?: string; timeout?: number; env?: Record<string, string> } = {}) {
  return execa(node, ["-e", code], { input: opts.input, timeout: opts.timeout, env: opts.env });
}

export async function upperCase(text: string): Promise<string> {
  const { stdout } = await runScript("process.stdin.on('data', d => process.stdout.write(String(d).toUpperCase()))", { input: text });
  return stdout;
}

export async function listLines(count: number): Promise<string[]> {
  const { stdout } = await execa(node, ["-e", `for (let i = 1; i <= ${count}; i++) console.log("line " + i)`], { lines: true });
  return stdout;
}

export async function exitInfo(code: string) {
  const r = await execa(node, ["-e", code], { reject: false });
  return { exitCode: r.exitCode, failed: r.failed, stderr: r.stderr };
}

export async function tryRun(code: string, timeout?: number) {
  try {
    await runScript(code, { timeout });
    return { ok: true as const };
  } catch (e) {
    if (e instanceof ExecaError) return { ok: false as const, exitCode: e.exitCode, timedOut: e.timedOut, stderr: e.stderr, short: e.shortMessage };
    throw e;
  }
}
