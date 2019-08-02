# eslint-formatter-git-log

> ESLint Formatter featuring Git Author, Date, and Hash.

[![NPM version](http://img.shields.io/npm/v/eslint-formatter-git-log.svg?style=flat-square)](https://www.npmjs.com/package/eslint-formatter-git-log)
[![NPM downloads](http://img.shields.io/npm/dm/eslint-formatter-git-log.svg?style=flat-square)](https://www.npmjs.com/package/eslint-formatter-git-log)
[![Build Status](http://img.shields.io/travis/JamieMason/eslint-formatter-git-log/master.svg?style=flat-square)](https://travis-ci.org/JamieMason/eslint-formatter-git-log)
[![Maintainability](https://api.codeclimate.com/v1/badges/12697dca45d1de3f1bfc/maintainability)](https://codeclimate.com/github/JamieMason/eslint-formatter-git-log/maintainability)
[![Gitter Chat](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/JamieMason/eslint-formatter-git-log)
[![Donate via PayPal](https://img.shields.io/badge/donate-paypal-blue.svg)](https://www.paypal.me/foldleft)
[![Backers](https://opencollective.com/fold_left/backers/badge.svg)](https://opencollective.com/fold_left#backer)
[![Sponsors](https://opencollective.com/fold_left/sponsors/badge.svg)](https://opencollective.com/fold_left#sponsors)
[![Analytics](https://ga-beacon.appspot.com/UA-45466560-5/eslint-formatter-git-log?flat&useReferer)](https://github.com/igrigorik/ga-beacon)
[![Follow JamieMason on GitHub](https://img.shields.io/github/followers/JamieMason.svg?style=social&label=Follow)](https://github.com/JamieMason)
[![Follow fold_left on Twitter](https://img.shields.io/twitter/follow/fold_left.svg?style=social&label=Follow)](https://twitter.com/fold_left)

## ☁️ Installation

```
npm install --save-dev eslint eslint-formatter-git-log
```

## 🕹 Usage

```
eslint --format 'git-log' file.js
```

## ⚖️ Configuration

This formatter is written to be as customisable as possible. To create a
customised version of the formatter you can create a file somewhere in your
project which follows the structure below.

For this example I am using the default values. You do not need to provide a
value for every configuration item, only those you want to change.

```js
const gitLogFormatter = require('eslint-formatter-git-log');
const chalk = require('chalk');

module.exports = gitLogFormatter.withConfig({
  style: {
    error: chalk.red,
    filePath: chalk.underline,
    warning: chalk.yellow,
    location: chalk.dim,
    rule: chalk.dim,
    commit: chalk.magenta,
    date: chalk.greenBright,
    email: chalk.blueBright,
  },
  gutter: '  ',
  label: {
    error: 'error',
    warning: 'warning',
  },
  locationColumnWidth: 8,
});
```

Then point at your custom formatter instead of the default like so:

```
eslint --format './path-to-your-custom-formatter.js' file.js
```

## ❓ Getting Help

- Get help with issues by creating a
  [Bug Report](https://github.com/JamieMason/eslint-formatter-git-log/issues/new?template=bug_report.md).
- Discuss ideas by opening a
  [Feature Request](https://github.com/JamieMason/eslint-formatter-git-log/issues/new?template=feature_request.md).
