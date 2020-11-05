# `esbuild-plugin-svelte`

An esbuild plugin to load Svelte components. Install with

```sh
npm install --save-dev esbuild esbuild-plugin-svelte
```

You can then use the plugin in a build script like the following:

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

By default, this plugin sets the Svelte `css` compiler option to false and has
esbuild handle the generated CSS. You can initialise the plugin with the
following options:

- `preprocess`: An array of preprocessors, like `svelte-preprocess`
- `compilerOptions`: Compiler options for Svelte. `filename` will be ignored.
  If `css` is set to true, no CSS is emitted via esbuild.

If using preprocessors or some non-default compiler options, its best
to set them in `svelte.config.js` for tooling support.

```js
import { build } from "esbuild";
import svelte from "esbuild-plugin-svelte";

import { compilerOptions, preprocess } from "./svelte.config.js";

build({
  entryPoints: ["input.js"],
  bundle: true,
  outfile: "output.js",
  plugins: [svelte({ compilerOptions, preprocess })],
});
```

## TODO

- Support resolving `svelte` key in package.json
- Support CSS sourcemaps (this seems to be not supported in esbuild)
