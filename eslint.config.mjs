import nextCoreWebVitals from "eslint-config-next";

const eslintConfig = [
  ...nextCoreWebVitals,
  {
    rules: {
      '@next/next/no-html-link-for-pages': 'off',
    },
  },
];

export default eslintConfig;
