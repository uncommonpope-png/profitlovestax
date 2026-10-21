const fs = require('fs');
const path = require('path');

function bumpVersion(currentVersion) {
  const semver = (currentVersion || '1.0.0').split('.').map(Number);
  semver[2] = (semver[2] || 0) + 1;
  return semver.join('.');
}

module.exports = { bumpVersion };
