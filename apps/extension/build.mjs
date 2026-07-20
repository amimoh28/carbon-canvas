import * as esbuild from "esbuild";
import { cpSync, mkdirSync, rmSync } from "node:fs";

const outdir = "dist";
rmSync(outdir, { recursive: true, force: true });
mkdirSync(outdir, { recursive: true });

await esbuild.build({
  entryPoints: {
    "content": "src/content/index.ts",
    "worker": "src/background/worker.ts",
    "popup": "src/popup/popup.ts",
  },
  bundle: true,
  format: "iife", // content scripts & MV3 workers: no module imports at runtime
  target: "chrome110",
  outdir,
  sourcemap: false,
  minify: false, // readable output — reviewers of the store listing and users can audit
  logLevel: "info",
});

cpSync("static", outdir, { recursive: true });
console.log("extension built → dist/");
