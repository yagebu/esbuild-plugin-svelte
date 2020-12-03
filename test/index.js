import { rejects, strictEqual, throws } from "assert";
import { statSync } from "fs";
import { join } from "path";

import { test } from "uvu";
import { build } from "esbuild";

import plugin from "../index";

const doesNotExist = (file) => throws(() => statSync(file));

test("compile a simple svelte project", async () => {
  const dir = join(__dirname, "svelte-project");
  const res = await build({
    entryPoints: [join(dir, "index.js")],
    bundle: true,
    outfile: join(dir, "output.js"),
    plugins: [plugin()],
  });
  strictEqual(res.warnings.length, 0);
});

test("compile a simple svelte project without css", async () => {
  const dir = join(__dirname, "svelte-project-without-css");
  const res = await build({
    entryPoints: [join(dir, "index.js")],
    bundle: true,
    outfile: join(dir, "output.js"),
    plugins: [plugin()],
  });
  strictEqual(res.warnings.length, 0);
});

test("compile a svelte project that has errors", async () => {
  const dir = join(__dirname, "svelte-project-with-errors");
  await rejects(() =>
    build({
      entryPoints: [join(dir, "index.js")],
      bundle: true,
      outfile: join(dir, "output.js"),
      plugins: [plugin()],
    })
  );
  doesNotExist(join(dir, "output.js"));
  doesNotExist(join(dir, "output.css"));
});

test("compile a svelte project that adds style tags at runtime", async () => {
  const dir = join(__dirname, "svelte-project-runtime-css");
  const res = await build({
    entryPoints: [join(dir, "index.js")],
    bundle: true,
    sourcemap: false,
    outfile: join(dir, "output.js"),
    plugins: [plugin({ compilerOptions: { css: true } })],
  });
  strictEqual(res.warnings.length, 1);
  doesNotExist(join(dir, "output.css"));
});

test("compile a svelte project that uses typescript", async () => {
  const dir = join(__dirname, "svelte-project-with-svelte-config-js");
  const { preprocess } = require(join(dir, "svelte.config.js"));
  const res = await build({
    entryPoints: [join(dir, "index.js")],
    bundle: true,
    outfile: join(dir, "output.js"),
    plugins: [plugin({ preprocess })],
  });
  strictEqual(res.warnings.length, 0);
});

test.run();
