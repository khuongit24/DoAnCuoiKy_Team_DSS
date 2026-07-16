module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/app.js',
    '!src/config/**',
    '!src/models/data.models.js'
  ],
  coverageThreshold: {
    global: {
      lines: 80
    }
  }
};
