import { promises } from "fs";

import { compile, preprocess } from "svelte/compiler";
import { CompileOptions, Warning } from "svelte/types/compiler/interfaces";
import { PreprocessorGroup } from "svelte/types/compiler/preprocess/types";
import { PartialMessage, Location, Plugin } from "esbuild";
import { relative } from "path";

const { readFile } = promises;

/**
 * Convert a warning or error emitted from the svelte compiler for esbuild.
 */
function convertWarning(
  source: string,
  { message, filename, start, end, frame }: Warning
): PartialMessage {
  if (!start || !end) {
    return { text: message };
  }
  const lines = source.split(/\r\n|\r|\n/);
  const lineText = lines[start.line - 1];
  const location: Partial<Location> = {
    file: filename,
    line: start.line,
    column: start.column,
    length:
      (start.line === end.line ? end.column : lineText.length) - start.column,
    lineText,
  };
  return { text: message, location };
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

        let res: ReturnType<typeof compile>;
        try {
          res = compile(source, { ...compilerOptions, filename });
        } catch (err) {
          return { errors: [convertWarning(source, err)] };
        }
        const { js, css, warnings } = res;

        let code = `${js.code}\n//# sourceMappingURL=${js.map.toUrl()}`;

        // Emit CSS, otherwise it will be included in the JS and injected at runtime.
        if (css.code && !compilerOptions.css) {
          const cssPath = `${path}.css`;
          cache.set(
            cssPath,
            `${css.code}/*# sourceMappingURL=${css.map.toUrl()}*/`
          );
          code = `${code}\nimport ${JSON.stringify(cssPath)}`;
        }

        return {
          contents: code,
          warnings: warnings.map((w) => convertWarning(source, w)),
        };
      });
    },
  };
}

export default esbuildPluginSvelte;
