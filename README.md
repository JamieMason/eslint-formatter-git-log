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

To use the default configuration, set ESLint's
[`--format`](https://eslint.org/docs/user-guide/command-line-interface#-f---format)
option to `git-log` as follows:

```
eslint --format git-log './src/**/*.js'
```

## Examples

### Full Report

By default the formatter will display a report of every error or warning in the
codebase:

![screenshot](static/screenshot.png)

### Personalised Reports

If you work with a lot of Developers in a large Organisation or Codebase —
introducing new rules is a great way to codify conventions and ensure quality at
scale. However, when a new rule applies to a particularly prevalent coding
pattern, it can result in every Developer being presented with a huge list of
warnings.

Rather than disabling these rules completely, an alternative can be to only
present each Developer with Errors and Warnings that relate to changes they
themselves have made.

1. Create a file in your project which follows the structure below.

   ```js
   const gitLogFormatter = require('eslint-formatter-git-log');

   module.exports = gitLogFormatter.withConfig({
     emailRegExp: new RegExp(process.env.GIT_COMMITTER_EMAIL),
   });
   ```

   In this example we require that the
   [Git Environment Variable](https://git-scm.com/book/en/v2/Git-Internals-Environment-Variables)
   `GIT_COMMITTER_EMAIL` is exported and reachable but, since this is an
   ordinary Node.js Script, the Email Address can be retrieved from the current
   Contributor's Machine in any way you prefer.

2. Set ESLint's
   [`--format`](https://eslint.org/docs/user-guide/command-line-interface#-f---format)
   option to your customised version instead of `git-log`:

   ```
   eslint --format ./path/to/your/custom-formatter.js './src/**/*.js'
   ```

![screenshot](static/screenshot-when-filtered.png)

## ⚖️ Configuration

This example lists every available option with its corresponding default value.
You don't need to provide a value for every configuration item, just the ones
you want to change.

```js
const chalk = require('chalk');
const gitLogFormatter = require('eslint-formatter-git-log');

module.exports = gitLogFormatter.withConfig({
  // If set, only show result when Author Email matches this pattern
  emailRegExp: undefined,
  // Whitespace to insert between items when formatting
  gutter: '  ',
  // Translations for plain text used when formatting
  label: {
    error: 'error',
    warning: 'warning',
  },
  // Increase if you have files with 1000s of lines
  locationColumnWidth: 8,
  // Which methods of https://github.com/chalk/chalk to use when formatting
  style: {
    // eg. "error"
    error: chalk.red,
    // eg. "/Users/guybrush/Dev/grogrates/src/index.js"
    filePath: chalk.underline,
    // eg. "warning"
    warning: chalk.yellow,
    // eg. "161:12"
    location: chalk.dim,
    // eg. "no-process-exit"
    rule: chalk.dim,
    // eg. "bda304e570"
    commit: chalk.magenta,
    // eg. "(1 year, 2 months ago)"
    date: chalk.greenBright,
    // eg. "<guybrush@threepwood.grog>"
    email: chalk.blueBright,
  },
});
```

## ❓ Getting Help

- Get help with issues by creating a
  [Bug Report](https://github.com/JamieMason/eslint-formatter-git-log/issues/new?template=bug_report.md).
- Discuss ideas by opening a
  [Feature Request](https://github.com/JamieMason/eslint-formatter-git-log/issues/new?template=feature_request.md).
