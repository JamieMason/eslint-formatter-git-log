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
    const styledError = getConfig<typeof chalk>('style.error');
    const styledFilePath = getConfig<typeof chalk>('style.filePath');
    const styledWarning = getConfig<typeof chalk>('style.warning');
    const styledLocation = getConfig<typeof chalk>('style.location');
    const styledRule = getConfig<typeof chalk>('style.rule');
    const styledCommit = getConfig<typeof chalk>('style.commit');
    const styledDate = getConfig<typeof chalk>('style.date');
    const styledEmail = getConfig<typeof chalk>('style.email');
    const WARNING = styledWarning(warningLabel);
    const ERROR = styledError(errorLabel);

    const mergeMessageWith = (result: EslintResult) => (
      message: EslintMessage,
    ): ResultItem => {
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

    const cols = (col1: string | number, col2: string | number) =>
      `${rightAlignToCol1(`${col1}`)}${col1}${gutter}${col2}`;

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
    const total = {
      all: 0,
      errors: 0,
      userErrors: 0,
      userWarnings: 0,
      visible: 0,
      warnings: 0,
    };

    const body = results.reduce((output, result) => {
      if (result.messages.length > 0) {
        const items = result.messages
          .map(mergeMessageWith(result))
          .map((item) => {
            authors.add(item.email);
            return item;
          })
          .filter(isIncluded)
          .map((item) => {
            if (item.message.severity === 2) {
              total.userErrors++;
            } else if (item.message.severity === 1) {
              total.userWarnings++;
            }
            return item;
          });

        total.errors += result.errorCount;
        total.warnings += result.warningCount;
        total.all += result.messages.length;
        total.visible += items.length;

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

    const banner = chalk.inverse(' REPORT COMPLETE ');

    let footer = '';

    if (emailRegExp) {
      const totalWarnings = `${total.userWarnings}/${total.warnings}`;
      const totalErrors = `${total.userErrors}/${total.errors}`;
      const totalWarningsLabel = `Warnings assigned to ${emailRegExp}`;
      const totalErrorsLabel = `Errors assigned to ${emailRegExp}`;
      footer += `${cols(results.length, 'Files')}\n`;
      footer += `${cols(totalWarnings, totalWarningsLabel)}\n`;
      footer += `${cols(totalErrors, totalErrorsLabel)}\n`;
      footer += `${cols(authors.size, 'Assignees')}\n`;
    } else {
      footer += `${cols(results.length, 'Files')}\n`;
      footer += `${cols(total.warnings, 'Warnings')}\n`;
      footer += `${cols(total.errors, 'Errors')}\n`;
      footer += `${cols(authors.size, 'Assignees')}\n`;
    }

    return `${body}\n${banner}\n\n${footer}`;
  };

  formatter.defaultConfig = defaultConfig;
  formatter.withConfig = createGitLogFormatter;
  return formatter;
};

export const gitLogFormatter = createGitLogFormatter(defaultConfig);
