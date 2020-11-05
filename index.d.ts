import { CompileOptions } from "svelte/types/compiler/interfaces";
import { PreprocessorGroup } from "svelte/types/compiler/preprocess";
import { Plugin } from "esbuild";
interface PluginOptions {
    preprocess?: PreprocessorGroup;
    compilerOptions?: CompileOptions;
}
declare function esbuildPluginSvelte(opts?: PluginOptions): Plugin;
export default esbuildPluginSvelte;
