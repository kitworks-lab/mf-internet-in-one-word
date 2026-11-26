import { mkdirSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { pathToFileURL } from "node:url";
import { WORD } from "./src/word.ts";

const DEFAULT_OUTPUT_PATH = "/output/entry.txt";
export const WORD_PATTERN = /^[A-Za-z]{1,30}$/;
const MAX_CHARS = 30;
const MAX_BYTES = 30;

export function un(): string {
  return WORD;
}

export function outputPath(): string {
  return process.env.ENTRY_OUTPUT_PATH || DEFAULT_OUTPUT_PATH;
}

export function isValid(word: string): boolean {
  return (
    WORD_PATTERN.test(word) &&
    [...word].length <= MAX_CHARS &&
    Buffer.byteLength(word, "utf8") <= MAX_BYTES
  );
}

export function writeEntry(word: string, path: string = outputPath()): void {
  mkdirSync(dirname(path), { recursive: true });
  const temporaryPath = `${path}.tmp`;
  writeFileSync(temporaryPath, word, "utf8");
  renameSync(temporaryPath, path);
}

export function run(argv: readonly string[]): number {
  const word = un();
  if (!isValid(word)) {
    console.error(`invalid entry: ${JSON.stringify(word)}`);
    return 1;
  }
  if (argv.includes("--print")) {
    console.log(word);
  }
  if (argv.includes("--stats")) {
    console.error(`chars=${[...word].length} bytes=${Buffer.byteLength(word, "utf8")}`);
  }
  if (!argv.includes("--check-only")) {
    writeEntry(word);
  }
  return 0;
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  process.exitCode = run(process.argv.slice(2));
}