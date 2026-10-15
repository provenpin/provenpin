#!/usr/bin/env -S node --import tsx
import { run } from "./cli.ts";

const r = await run(process.argv.slice(2));
process.stdout.write(r.stdout);
process.stderr.write(r.stderr);
process.exitCode = r.code;
