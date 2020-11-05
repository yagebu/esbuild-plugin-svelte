# `esbuild-plugin-svelte`

An esbuild plugin to load Svelte components.

```js
import { build } from "esbuild";
import svelte from "esbuild-plugin-svelte";

build({
  entryPoints: ["input.js"],
  bundle: true,
  outfile: "output.js",
  plugins: [svelte()],
});
```

If using preprocessors or some non-default compiler options, its best
to set them in `svelte.config.js` for tooling support.

```js
import { build } from "esbuild";
import svelte from "esbuild-plugin-svelte";

import { compilerOptions, preprocess } from "./svelte.config.js";

build({
  entryPoints: ["input.js"],
  bundle: true,
  sourcemap: "inline",
  outfile: "output.js",
  plugins: [svelte({ compilerOptions, preprocess })],
});
```

## TODO

- Support resolving `svelte` key in package.json
- Support CSS sourcemaps (this seems to be a not supported in esbuild)
