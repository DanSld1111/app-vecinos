/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  rootDir: "src",
  testRegex: ".*\\.spec\\.ts$",
  transform: {
    "^.+\\.ts$": ["ts-jest", { tsconfig: "<rootDir>/../tsconfig.json" }],
  },
  // "meilisearch" se publica como ESM puro, incompatible con el Jest en CommonJS de este
  // proyecto — se reemplaza por un mock mínimo, ver test/mocks/meilisearch.ts.
  moduleNameMapper: {
    "^meilisearch$": "<rootDir>/../test/mocks/meilisearch.ts",
  },
};
