import {defineConfig} from 'html-validate';

export default defineConfig({
  root: true,
  extends: [
    'html-validate:recommended',
  ],
  rules: {
    'no-inline-style': 'error',
    'element-required-attributes': 'error',
    'missing-doctype': 'error',
    'no-style-tag': 'error',
    'no-trailing-whitespace': 'error',
    'text-content': 'off',
    'void-style': ['error', {style: 'omit'}],
    'wcag/h30': 'off',
    'wcag/h71': 'off',
  },
  elements: [
    'html5',
  ],
});
