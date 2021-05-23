module.exports = {
  moduleFileExtensions: ['vue', 'js', 'json'],
  moduleNameMapper: {
    "^/(.*)$": "<rootDir>/$1",
  },
  globals: {
    'vue-jest': {babelConfig: true},
  },
  transform: {
    '^.+\\.vue$': 'vue-jest',
    ".*\\.(js)$": "babel-jest",
  },
  collectCoverage: true,
  coverageProvider: 'v8',
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
