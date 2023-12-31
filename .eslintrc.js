module.exports = {
  extends: 'erb',
  plugins: ['@typescript-eslint', "unused-imports"],
  rules: {
    // A temporary hack related to IDE not resolving correct package.json
    'import/no-extraneous-dependencies': 'off',
    'react/react-in-jsx-scope': 'off',
    'react/jsx-filename-extension': 'off',
    'import/extensions': 'off',
    'import/no-unresolved': 'off',
    'import/no-import-module-exports': 'off',
    'no-shadow': 'off',
    '@typescript-eslint/no-shadow': 'error',
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': [
        "warn",
        {
            "ignoreRestSiblings": true,
            "argsIgnorePattern": "^_",
            "varsIgnorePattern": "^_",
            "caughtErrorsIgnorePattern": "^_"
        }
    ],
    'prettier/prettier': 0,
    'react/function-component-definition': [
      0
    ],
    "unused-imports/no-unused-imports-ts": 2,
    "no-console": "off",
    "import/prefer-default-export": "off",
    "react/jsx-no-useless-fragment": "off",
    "react/jsx-props-no-spreading": "off",
    "promise/catch-or-return": "off",
    "promise/always-return": "off",
    "react-hooks/exhaustive-deps": "off",
  },
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  settings: {
    'import/resolver': {
      // See https://github.com/benmosher/eslint-plugin-import/issues/1396#issuecomment-575727774 for line below
      node: {},
      webpack: {
        config: require.resolve('./.erb/configs/webpack.config.eslint.ts'),
      },
      typescript: {},
    },
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
  },
  "globals": {
    "RequestInit": true,
    "NodeJS": true,
  },
};
