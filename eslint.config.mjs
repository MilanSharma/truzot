import nextEslint from 'eslint-config-next';

const eslintConfig = [
  ...nextEslint,
  {
    rules: {
      '@next/next/no-html-link-for-pages': 'off',
    },
  },
];

export default eslintConfig;
