"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = require("fs/promises");
const compiler_1 = require("svelte/compiler");
const path_1 = require("path");
/**
 * Convert a warning or error emitted from the svelte compiler for esbuild.
 */
function convertWarning(source, { message, filename, start, end, frame }) {
    if (!start || !end) {
        return { text: message };
    }
    const lines = source.split(/\r\n|\r|\n/);
    const lineText = lines[start.line - 1];
    const location = {
        file: filename,
        line: start.line,
        column: start.column,
        length: (start.line === end.line ? end.column : lineText.length) - start.column,
        lineText,
    };
    return { text: message, location };
}
function esbuildPluginSvelte(opts = {}) {
    return {
        name: "esbuild-plugin-svelte",
        setup(build) {
            /** A cache of the compiled CSS. */
            const cache = new Map();
            // Register loader for the 'fake' CSS files that we import from
            // the compiled Javascript.
            build.onLoad({ filter: /\.svelte\.css$/ }, ({ path }) => {
                const contents = cache.get(path);
                return contents ? { contents, loader: "css" } : null;
            });
            // Register loader for all .svelte files.
            //
            build.onLoad({ filter: /\.svelte$/ }, async ({ path }) => {
                let source = await promises_1.readFile(path, "utf-8");
                const filename = path_1.relative(process.cwd(), path);
                if (opts.preprocess) {
                    const processed = await compiler_1.preprocess(source, opts.preprocess, {
                        filename,
                    });
                    source = processed.code;
                }
                const compilerOptions = {
                    css: false,
                    ...opts.compilerOptions,
                };
                let res;
                try {
                    res = compiler_1.compile(source, { ...compilerOptions, filename });
                }
                catch (err) {
                    return { errors: [convertWarning(source, err)] };
                }
                const { js, css, warnings } = res;
                let code = `${js.code}\n//# sourceMappingURL=${js.map.toUrl()}`;
                // Emit CSS, otherwise it will be included in the JS and injected at runtime.
                if (!compilerOptions.css) {
                    const cssPath = `${path}.css`;
                    cache.set(cssPath, `${css.code}/*# sourceMappingURL=${css.map.toUrl()}*/`);
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
exports.default = esbuildPluginSvelte;
