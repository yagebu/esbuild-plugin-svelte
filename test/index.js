import { statSync } from "fs";
import { join } from "path";

import { test } from "uvu";
import { build } from "esbuild";

import plugin from "../index";
import { throws } from "assert";

test("compile a simple svelte project", async () => {
  const dir = join(__dirname, "svelte-project");
  const res = await build({
    entryPoints: [join(dir, "index.js")],
    bundle: true,
    outfile: join(dir, "output.js"),
    plugins: [plugin()],
  });
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
  throws(() => statSync(join(dir, "output.css")));
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
});

test.run();
