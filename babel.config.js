module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      // Path alias resolution for the "@/..." imports.
      [
        "module-resolver",
        {
          root: ["./"],
          alias: { "@": "./src" },
          extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
        },
      ],
      // NOTE: the react-native-reanimated/plugin is added automatically by the
      // "nativewind/babel" preset (via react-native-css-interop), so we do NOT
      // list it here — adding it twice triggers a "duplicate plugin" error.
    ],
  };
};
