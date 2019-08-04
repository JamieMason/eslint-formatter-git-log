import chalk from 'chalk';
import { execSync } from 'child_process';

export const getUserEmail = () => {
  try {
    const mailmap = execSync(
      'echo "<$(git config user.email)>" | git check-mailmap --stdin',
      { encoding: 'utf8', stdio: ['pipe', null, null] },
    );
    return (mailmap.match(/<([^>]+)>\s?$/) || [])[1] || '';
  } catch (err) {
    console.error(
      chalk.red(
        `
ERROR: No Git Committer Email could be found.

Possible Reasons
1. git config user.email did not return a valid Email.
2. git check-mailmap did not return a valid Email.

https://github.com/JamieMason/eslint-formatter-git-log
`.replace(/^\s+/, ''),
      ),
    );
    throw err;
  }
};
