import nextVitals from "eslint-config-next/core-web-vitals.js";

const eslintConfig = [
  ...nextVitals.default ?? nextVitals,
  { ignores: [".next/**", "out/**", "build/**", "next-env.d.ts"] },
];

export default eslintConfig;
