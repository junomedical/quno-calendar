import { createDateInputAnalyzer as createDateAnalyzer } from "./dateInputDateParser";
import { tokenizeDateInput } from "./dateInputTokenizer";
import { parseTimeInput } from "./dateInputTimeParser";
import type { DateInputParseOptions, DateInputParseResult } from "./dateInputTypes";

export { tokenizeDateInput };
export type { DateInputAnalysis, DateInputAnalyzer } from "./dateInputDateParser";

export const createDateInputAnalyzer = (options: DateInputParseOptions) =>
  createDateAnalyzer({
    ...options,
    tokenize: tokenizeDateInput,
    parse: options.recognizeTime ? parseTimeInput : undefined
  });

export const parseDateInput = ({ text, ...options }: { text: string } & DateInputParseOptions): DateInputParseResult =>
  createDateInputAnalyzer(options).analyze({ text }).result;
