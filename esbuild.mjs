import * as esbuild from "esbuild";

const isDev = process.argv.includes("--watch");

const baseConfig = {
  bundle: true,
  minify: !isDev,
  sourcemap: isDev,
  logLevel: "info",
};

// Extension host bundle (runs inside VS Code process)
const extensionConfig = {
  ...baseConfig,
  entryPoints: ["src/extension.ts"],
  outfile: "dist/extension.js",
  platform: "node",
  format: "cjs",
  external: ["vscode"],
  target: "node18",
};

// MCP server bundle (spawned as a subprocess by VS Code)
const serverConfig = {
  ...baseConfig,
  entryPoints: ["src/server/index.ts"],
  outfile: "dist/server.js",
  platform: "node",
  format: "cjs",
  external: [],
  target: "node18",
  banner: {
    js: "#!/usr/bin/env node",
  },
};

if (isDev) {
  const extensionCtx = await esbuild.context(extensionConfig);
  const serverCtx = await esbuild.context(serverConfig);
  await Promise.all([extensionCtx.watch(), serverCtx.watch()]);
  console.log("Watching for changes...");
} else {
  await Promise.all([
    esbuild.build(extensionConfig),
    esbuild.build(serverConfig),
  ]);
  console.log("Build complete.");
}
