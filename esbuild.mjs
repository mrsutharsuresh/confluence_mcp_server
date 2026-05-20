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

// Uninstall script bundle (runs during VS Code extension uninstall)
const uninstallConfig = {
  ...baseConfig,
  entryPoints: ["src/uninstall.ts"],
  outfile: "dist/uninstall.js",
  platform: "node",
  format: "cjs",
  external: [],
  target: "node18",
};

if (isDev) {
  const extensionCtx = await esbuild.context(extensionConfig);
  const serverCtx = await esbuild.context(serverConfig);
  const uninstallCtx = await esbuild.context(uninstallConfig);
  await Promise.all([extensionCtx.watch(), serverCtx.watch(), uninstallCtx.watch()]);
  console.log("Watching for changes...");
} else {
  await Promise.all([
    esbuild.build(extensionConfig),
    esbuild.build(serverConfig),
    esbuild.build(uninstallConfig),
  ]);
  console.log("Build complete.");
}
