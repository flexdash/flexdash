module.exports = {
  preset: '@vue/cli-plugin-unit-jest',
  "moduleNameMapper": {
    "^@(public/.*)$": "<rootDir>/$1",
  },
  collectCoverage: true,
  //coverageProvider: 'v8',
  coverageDirectory: 'tests/cov',
  coverageReporters: ['text', 'html'],
  collectCoverageFrom: [
    'src/*.{js,vue}',
    'src/components/widget-*.{js,vue}',
    //'src/components/*.{js,vue}',
    //'src/grids/*.{js,vue}',
    //'src/widgets/*.{js,vue}',
    '!src/main.js',
    '!src/components/demo.vue',
    '!src/components/uib.vue',
  ]
}
