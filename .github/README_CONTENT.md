## 🌩 Installation

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

## 👀 Examples

### Full Report

By default, a report of every Error or Warning in the Codebase is displayed:

![screenshot](static/screenshot.png)

### Personalised Reports

When an `emailRegExp` is provided such as `/you@yours.com/`, a report is shown
that relates only to changes you yourself have made.

1. Create a file in your project which follows the structure below.

   ```js
   const gitLogFormatter = require('eslint-formatter-git-log');

   module.exports = gitLogFormatter.withConfig({
     emailRegExp: /you@yours.com/,
   });
   ```

2. Set ESLint's
   [`--format`](https://eslint.org/docs/user-guide/command-line-interface#-f---format)
   option to your customised version instead of `git-log`:

   ```
   eslint --format ./path/to/your/custom-formatter.js './src/**/*.js'
   ```

![screenshot](static/screenshot-when-filtered.png)

### Contributor Reports

To extend personalised reports to your Team, the Git Committer Email is needed.

#### `gitLogFormatter.getUserEmail()`

An optional helper is available at `gitLogFormatter.getUserEmail()` which reads
`git config user.email` and feeds it through `git check-mailmap`.

```js
const gitLogFormatter = require('eslint-formatter-git-log');

module.exports = gitLogFormatter.withConfig({
  emailRegExp: new RegExp(gitLogFormatter.getUserEmail()),
});
```

#### `$GIT_COMMITTER_EMAIL`

Alternatively, if your Team each have their `$GIT_COMMITTER_EMAIL` Environment
Variable exported and reachable, then the following is enough.

```js
const gitLogFormatter = require('eslint-formatter-git-log');

module.exports = gitLogFormatter.withConfig({
  emailRegExp: new RegExp(process.env.GIT_COMMITTER_EMAIL),
});
```

#### References

- [First-time git setup](https://git-scm.com/book/en/v2/Getting-Started-First-Time-Git-Setup)
- [Setting your commit email address](https://help.github.com/en/articles/setting-your-commit-email-address)
- [Configure git to not guess `user.email`](https://stackoverflow.com/questions/19821895/can-i-configure-git-so-it-does-not-guess-user-email-configuration-settings)
- [`git config`](https://git-scm.com/docs/git-config)
- [`git check-mailmap`](https://www.git-scm.com/docs/git-check-mailmap)
- [`$GIT_COMMITTER_EMAIL`](https://git-scm.com/book/en/v2/Git-Internals-Environment-Variables)

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
    banner: 'REPORT COMPLETE',
    totalFiles: 'Files',
    totalAssignees: 'Assignees',
    totalWarningsByEmail: `Warnings assigned to %s`,
    totalErrorsByEmail: `Errors assigned to %s`,
    totalWarnings: 'Warnings',
    totalErrors: 'Errors',
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
