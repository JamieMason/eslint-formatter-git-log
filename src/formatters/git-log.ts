import chalk from 'chalk';
import { execSync } from 'child_process';

export interface EslintMessage {
  column: number;
  endColumn?: number;
  endLine?: number;
  fatal?: boolean;
  fix?: {
    range: [number, number];
    text: string;
  };
  line: number;
  message: string;
  nodeType: string;
  ruleId: string | null;
  severity: number;
}

export interface EslintResult {
  errorCount: number;
  filePath: string;
  fixableErrorCount: number;
  fixableWarningCount: number;
  messages: EslintMessage[];
  warningCount: number;
  output?: string;
  source?: string;
}

export const gitLogFormatter = (results: EslintResult[]) => {
  const {
    dim,
    red,
    underline,
    yellow,
    magenta,
    greenBright,
    blueBright
  } = chalk;
  const errorLabel = 'error';
  const warningLabel = 'warning';
  const GUTTER = '  ';
  const WARNING = yellow(warningLabel);
  const ERROR = red(errorLabel);

  return results.reduce((output, { filePath, messages }) => {
    if (messages.length > 0) {
      output += `\n${underline(filePath)}\n`;
      messages.forEach(
        ({ ruleId, severity, message, line, column, endLine }) => {
          const command = `git blame --date=relative --show-email -L ${line},${endLine} ${filePath}`;
          const blame = execSync(command, { encoding: 'utf8' });
          const rawLocation = `${line}:${column}`;
          const status = severity === 1 ? WARNING : ERROR;
          const location = dim(rawLocation);
          const rule = ruleId ? dim(ruleId) : '';
          const commitMatch = blame.match(/^[^ ]+/) || [''];
          const dateMatch = blame.match(/> (.+ ago)/) || ['', ''];
          const emailMatch = blame.match(/<([^>]+)>/) || ['', ''];
          const commit = magenta(`${commitMatch[0]}`);
          const date = greenBright(`(${dateMatch[1].trim()})`);
          const email = blueBright(`<${emailMatch[1]}>`);
          const locationColumnWith = 8;
          const rightAlignLocations = ' '.repeat(
            locationColumnWith - rawLocation.length
          );
          const leftAlignCommitsWithStatuses = ' '.repeat(
            rightAlignLocations.length + rawLocation.length + GUTTER.length
          );
          output += `${rightAlignLocations}${location}${GUTTER}${status}${GUTTER}${message}${GUTTER}${rule}\n`;
          output += `${leftAlignCommitsWithStatuses}${commit} ${email} ${date}\n`;
        }
      );
    }
    return output;
  }, '');
};
