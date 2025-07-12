import { spawn } from "child_process";
import { mkdtemp, writeFile, rm } from "fs/promises";
import path from "path";
import languageMap from "./languageMap";


// ExecutionResult Interface 
interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  durationMs: number;
}

export const runCodeInDocker = async (
  language: string,
  code: string,
  correlationId: string
): Promise<ExecutionResult> => {
  const config = languageMap[language];
  if (!config) throw new Error(`Unsupported language: ${language}`);

  const workdir = await mkdtemp(path.join("/tmp/", correlationId));
  const filePath = path.join(workdir, `Main.${config.extension}`);
  await writeFile(filePath, code);

  const args = [
    "run",
    "--rm",
    "-v",
    `${workdir}:/workspace`,
    "--network",
    "none",
    "--memory",
    "256m",
    config.image,
    "/bin/sh",
    "-c",
    `${config.compileCommand} && ${config.runCommand}`,
  ];

  const start = Date.now();

  return new Promise((resolve, reject) => {
    const proc = spawn("docker", args, { timeout: 10000 });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (chunk) => (stdout += chunk));
    proc.stderr.on("data", (chunk) => (stderr += chunk));
    proc.on("error", reject);

    proc.on("close", async (exitCode) => {
      const durationMs = Date.now() - start;
      try {
        await rm(workdir, { recursive: true, force: true });
      } catch (e) {
        console.error("Cleanup error:", e);
      }
      resolve({ stdout, stderr, exitCode, durationMs });
    });
  });
};
