import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
  declaration: true,
  externals: ["oxc-parser"],
  rollup: {
    emitCJS: true,
    inlineDependencies: true,
  },
  entries: ["src/index"],
});
