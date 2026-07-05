const unitConfig = require('./jest.config.cjs');

module.exports = {
  ...unitConfig,
  testRegex: 'test/integration/.*\\.integration-spec\\.ts$',
  collectCoverageFrom: [],
  coverageDirectory: 'coverage/integration',
};
