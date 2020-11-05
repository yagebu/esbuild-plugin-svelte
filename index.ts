import { readFile } from "fs/promises";

import { compile, preprocess } from "svelte/compiler";
import { CompileOptions, Warning } from "svelte/types/compiler/interfaces";
import { PreprocessorGroup } from "svelte/types/compiler/preprocess";
import { PartialMessage, Plugin } from "esbuild";
import { relative } from "path";

/**
 * Convert a warning emitted from the svelte compiler for esbuild.
 */
function convertWarning({
  message,
  filename,
  start,
  end,
  frame,
}: Warning): PartialMessage {
  if (!start || !end) {
    return { text: message };
  }
  return {
    text: message,
    location: { ...start, file: filename, lineText: frame },
  };
}

interface PluginOptions {
  preprocess?: PreprocessorGroup;
  compilerOptions?: CompileOptions;
}

function esbuildPluginSvelte(opts: PluginOptions = {}): Plugin {
  return {
    name: "esbuild-plugin-svelte",
    setup(build) {
      /** A cache of the compiled CSS. */
      const cache = new Map<string, string>();

      // Register loader for the 'fake' CSS files that we import from
      // the compiled Javascript.
      build.onLoad({ filter: /\.svelte\.css$/ }, ({ path }) => {
        const contents = cache.get(path);
        return contents ? { contents, loader: "css" } : null;
      });

      // Register loader for all .svelte files.
      //
      build.onLoad({ filter: /\.svelte$/ }, async ({ path }) => {
        let source = await readFile(path, "utf-8");
        const filename = relative(process.cwd(), path);

        if (opts.preprocess) {
          const processed = await preprocess(source, opts.preprocess, {
            filename,
          });
          source = processed.code;
        }
        const compilerOptions: CompileOptions = {
          css: false,
          ...opts.compilerOptions,
        };

        const { js, css, warnings } = compile(source, {
          ...compilerOptions,
          filename,
        });

        const code = `${js.code}\n//# sourceMappingURL=${js.map.toUrl()}`;

        // CSS will be included in the JS and injected at runtime.
        if (compilerOptions.css) {
          return { contents: code, warnings: warnings.map(convertWarning) };
        }

        const cssPath = `${path}.css`;
        cache.set(
          cssPath,
          `${css.code}/*# sourceMappingURL=${css.map.toUrl()}*/`
        );

        return {
          contents: `${code}\nimport ${JSON.stringify(cssPath)}`,
          warnings: warnings.map(convertWarning),
        };
      });
    },
  };
}

export default esbuildPluginSvelte;
