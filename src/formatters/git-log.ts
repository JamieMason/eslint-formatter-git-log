import type { Chalk } from 'chalk';
import chalk from 'chalk';
import { execSync } from 'child_process';
import { getUserEmail } from './get-user-email';
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

interface ResultItem {
  commit: string;
  date: string;
  email: string;
  message: EslintMessage;
  result: EslintResult;
}

interface FinalConfig {
  /** If set, show only results for Emails matching this pattern */
  emailRegExp?: RegExp;
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
    error: Chalk;
    /** @example "/Users/guybrush/Dev/grogrates/src/index.js" */
    filePath: Chalk;
    /** @example "warning" */
    warning: Chalk;
    /** @example "161:12" */
    location: Chalk;
    /** @example "no-process-exit" */
    rule: Chalk;
    /** @example "bda304e570" */
    commit: Chalk;
    /** @example "(1 year, 2 months ago)" */
    date: Chalk;
    /** @example "<guybrush@threepwood.grog>" */
    email: Chalk;
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
  emailRegExp: undefined,
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
    const getConfig = <T>(path: string) =>
      getIn<T>(path, config) || (getIn<T>(path, defaultConfig) as T);

    const emailRegExp = getIn<RegExp | undefined>('emailRegExp', config);
    const gutter = getConfig<string>('gutter');
    const locationColumnWidth = getConfig<number>('locationColumnWidth');
    const errorLabel = getConfig<string>('label.error');
    const warningLabel = getConfig<string>('label.warning');
    const styledError = getConfig<Chalk>('style.error');
    const styledFilePath = getConfig<Chalk>('style.filePath');
    const styledWarning = getConfig<Chalk>('style.warning');
    const styledLocation = getConfig<Chalk>('style.location');
    const styledRule = getConfig<Chalk>('style.rule');
    const styledCommit = getConfig<Chalk>('style.commit');
    const styledDate = getConfig<Chalk>('style.date');
    const styledEmail = getConfig<Chalk>('style.email');
    const WARNING = styledWarning(warningLabel);
    const ERROR = styledError(errorLabel);

    const mergeMessageWith =
      (result: EslintResult) =>
      (message: EslintMessage): ResultItem => {
        const { filePath } = result;
        const { line } = message;
        const command = `git blame --date=relative --show-email -L ${line},${line} -- "${filePath}"`;
        const blame = execSync(command, { encoding: 'utf8' });
        const commitMatch = blame.match(/^[^ ]+/) || [''];
        const dateMatch = blame.match(/> (.+ ago)/) || ['', ''];
        const emailMatch = blame.match(/<([^>]+)>/) || ['', ''];
        const commit = commitMatch[0];
        const date = dateMatch[1].trim();
        const email = emailMatch[1];
        return {
          commit,
          date,
          email,
          message,
          result,
        };
      };

    const rightAlignToCol1 = (col1Contents: string) =>
      ' '.repeat(locationColumnWidth - col1Contents.length);

    const leftAlignToCol2 = (col1Contents: string) =>
      ' '.repeat(
        rightAlignToCol1(col1Contents).length +
          col1Contents.length +
          gutter.length,
      );

    const formatMessage = ({
      commit: rawCommit,
      date: rawDate,
      email: rawEmail,
      message: { ruleId, severity, message, line, column },
    }: ResultItem) => {
      const rawLocation = `${line}:${column}`;
      const status = severity === 1 ? WARNING : ERROR;
      const headIndent = rightAlignToCol1(rawLocation);
      const footIndent = leftAlignToCol2(rawLocation);
      const location = styledLocation(rawLocation);
      const rule = ruleId ? styledRule(ruleId) : '';
      const commit = styledCommit(`${rawCommit}`);
      const date = styledDate(`(${rawDate})`);
      const email = styledEmail(`<${rawEmail}>`);
      let output = '';
      output += `${headIndent}${location}${gutter}${status}${gutter}${message}${gutter}${rule}\n`;
      output += `${footIndent}${commit} ${email} ${date}\n`;
      return output;
    };

    const isIncluded = ({ email }: ResultItem) =>
      emailRegExp ? emailRegExp.test(email) : true;

    const authors = new Set();

    const body = results.reduce((output, result) => {
      if (result.messages.length > 0) {
        const items = result.messages
          .map((message) => {
            message.column = message.column || 1;
            message.line = message.line || 1;
            return message;
          })
          .map(mergeMessageWith(result))
          .map((item) => {
            authors.add(item.email);
            return item;
          })
          .filter(isIncluded);

        if (items.length > 0) {
          output += `\n${styledFilePath(result.filePath)}\n`;
          output += items.reduce<string>(
            (str: string, item: ResultItem) => `${str}${formatMessage(item)}`,
            '',
          );
        }
      }
      return output;
    }, '');

    return body;
  };

  formatter.defaultConfig = defaultConfig;
  formatter.getUserEmail = getUserEmail;
  formatter.withConfig = createGitLogFormatter;
  return formatter;
};

export const gitLogFormatter = createGitLogFormatter(defaultConfig);
