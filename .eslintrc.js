module.exports = {
  root: true,
  extends: ["expo", "prettier"],
  ignorePatterns: ["node_modules/", "dist/", "supabase/functions/"],
  rules: {
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
  },
};
