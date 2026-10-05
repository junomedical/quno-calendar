import { resolveAbsoluteDateCandidates } from "./dateInputAbsoluteResolver";
import { resolveRelativeDateRange } from "./dateInputRelativeResolver";
import type { DateInputResolveOptions, DateInputToken, ResolvedDateCandidate } from "./dateInputTypes";
import type { DateInputVocabulary } from "./dateInputVocabulary";

export type DateEndpointContext = {
  tokens: DateInputToken[];
  options: DateInputResolveOptions;
  vocabulary: DateInputVocabulary;
};

export const endpointCandidates = ({ tokens, options, vocabulary }: DateEndpointContext): ResolvedDateCandidate[] => {
  const relative = resolveRelativeDateRange({ tokens, options, vocabulary });
  if (relative) return relative.start === relative.end ? [{ date: relative.start, localePenalty: 0 }] : [];
  return resolveAbsoluteDateCandidates({ tokens, options, vocabulary });
};
