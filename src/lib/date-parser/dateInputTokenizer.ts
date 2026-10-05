import { clockToken } from "./dateInputClock";
import { tokenizeDateTokens } from "./dateInputDateTokenizer";

export const tokenizeDateInput = ({ text, recognizeTime = false }: { text: string; recognizeTime?: boolean }) =>
  tokenizeDateTokens({ text, clock: recognizeTime ? clockToken : undefined });
