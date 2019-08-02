import chalk from 'chalk';
import { execSync } from 'child_process';
import { getIn } from './lib/get-in';

type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};

interface EslintMessage {
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

interface EslintResult {
  errorCount: number;
  filePath: string;
  fixableErrorCount: number;
  fixableWarningCount: number;
  messages: EslintMessage[];
  warningCount: number;
  output?: string;
  source?: string;
}

interface FinalConfig {
  /** Whitespace to insert between items when formatting */
  gutter: string;
  /** Translations for plain text used when formatting */
  label: {
    /** @example "error" */
    error: string;
    /** @example "warning" */
    warning: string;
  };
  /** Increase if you have files with 1000s of lines */
  locationColumnWidth: number;
  /** Which methods of https://github.com/chalk/chalk to use when formatting */
  style: {
    /** @example "error" */
    error: typeof chalk;
    /** @example "/Users/guybrush/Dev/grogrates/src/index.js" */
    filePath: typeof chalk;
    /** @example "warning" */
    warning: typeof chalk;
    /** @example "161:12" */
    location: typeof chalk;
    /** @example "no-process-exit" */
    rule: typeof chalk;
    /** @example "bda304e570" */
    commit: typeof chalk;
    /** @example "(1 year, 2 months ago)" */
    date: typeof chalk;
    /** @example "<guybrush@threepwood.grog>" */
    email: typeof chalk;
  };
}

export type Config = DeepPartial<FinalConfig>;

export interface GitLogFormatter {
  (results: EslintResult[]): string;
  defaultConfig: Config;
  withConfig: CreateGitLogFormatter;
}

export type CreateGitLogFormatter = (config: Config) => GitLogFormatter;

export const defaultConfig: FinalConfig = Object.freeze({
  gutter: '  ',
  label: {
    error: 'error',
    warning: 'warning',
  },
  locationColumnWidth: 8,
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
});

/** Create an instance of the Formatter with your own alternative config */
export const createGitLogFormatter: CreateGitLogFormatter = (config) => {
  const formatter = (results: EslintResult[]) => {
    const getConfig = (path: string) =>
      getIn(path, config) || getIn(path, defaultConfig);

    const gutter = getConfig('gutter');
    const locationColumnWidth = getConfig('locationColumnWidth');
    const errorLabel = getConfig('label.error');
    const warningLabel = getConfig('label.warning');
    const styledError = getConfig('style.error');
    const styledFilePath = getConfig('style.filePath');
    const styledWarning = getConfig('style.warning');
    const styledLocation = getConfig('style.location');
    const styledRule = getConfig('style.rule');
    const styledCommit = getConfig('style.commit');
    const styledDate = getConfig('style.date');
    const styledEmail = getConfig('style.email');
    const WARNING = styledWarning(warningLabel);
    const ERROR = styledError(errorLabel);

    return results.reduce((output, { filePath, messages }) => {
      if (messages.length > 0) {
        output += `\n${styledFilePath(filePath)}\n`;
        messages.forEach(({ ruleId, severity, message, line, column }) => {
          const command = `git blame --date=relative --show-email -L ${line},${line} -- "${filePath}"`;
          const blame = execSync(command, { encoding: 'utf8' });
          const rawLocation = `${line}:${column}`;
          const status = severity === 1 ? WARNING : ERROR;
          const commitMatch = blame.match(/^[^ ]+/) || [''];
          const dateMatch = blame.match(/> (.+ ago)/) || ['', ''];
          const emailMatch = blame.match(/<([^>]+)>/) || ['', ''];
          const rightAlignLocations = ' '.repeat(
            locationColumnWidth - rawLocation.length,
          );
          const leftAlignCommitsWithStatuses = ' '.repeat(
            rightAlignLocations.length + rawLocation.length + gutter.length,
          );
          const location = styledLocation(rawLocation);
          const rule = ruleId ? styledRule(ruleId) : '';
          const commit = styledCommit(`${commitMatch[0]}`);
          const date = styledDate(`(${dateMatch[1].trim()})`);
          const email = styledEmail(`<${emailMatch[1]}>`);
          output += `${rightAlignLocations}${location}${gutter}${status}${gutter}${message}${gutter}${rule}\n`;
          output += `${leftAlignCommitsWithStatuses}${commit} ${email} ${date}\n`;
        });
      }
      return output;
    }, '');
  };
  formatter.defaultConfig = defaultConfig;
  formatter.withConfig = createGitLogFormatter;
  return formatter;
};

export const gitLogFormatter = createGitLogFormatter(defaultConfig);
