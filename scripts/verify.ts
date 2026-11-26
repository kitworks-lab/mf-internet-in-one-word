import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { isValid, outputPath, run, un, WORD_PATTERN, writeEntry } from "../main.ts";

const failures: string[] = [];
const check = (condition: boolean, message: string): void => {
  if (!condition) failures.push(message);
};

const dir = mkdtempSync(join(tmpdir(), "entry-verify-"));
process.env.ENTRY_OUTPUT_PATH = join(dir, "nested", "entry.txt");

try {
  const first = un();
  const second = un();
  check(first === second, `non-deterministic: ${first} vs ${second}`);
  check(/^[A-Za-z][A-Za-z-]{0,29}$/.test(first) || WORD_PATTERN.test(first), `not a single word: ${first}`);
  check(isValid(first), `isValid rejected: ${first}`);
  check(!/\s/.test(first), "contains whitespace");
  check([...first].length >= 1 && [...first].length <= 30, "char count out of range");
  check(Buffer.byteLength(first, "utf8") >= 1 && Buffer.byteLength(first, "utf8") <= 30, "byte count out of range");

  const target = join(dir, "explicit", "entry.txt");
  writeEntry(first, target);
  check(readFileSync(target, "utf8") === first, "written file does not match word");
  check(run(["--check-only"]) === 0, "--check-only did not exit 0");
  check(run(["--stats"]) === 0, "--stats did not exit 0");
  check(run([]) === 0, "default run did not exit 0");
  check(readFileSync(outputPath(), "utf8") === first, "run() did not write the entry to ENTRY_OUTPUT_PATH");
  check(outputPath() === process.env.ENTRY_OUTPUT_PATH, "output path resolution wrong");
  if (failures.length === 0) console.log(`ok ${first}`);
} finally {
  rmSync(dir, { recursive: true, force: true });
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`FAIL ${failure}`);
  process.exitCode = 1;
}