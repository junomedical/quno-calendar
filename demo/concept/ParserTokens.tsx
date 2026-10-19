import { tokenizeDateInput } from "@quno/calendar/date-parser";
import { tokenMeaning } from "./parserVocabulary";
export function ParserTokens({ text, clocks }: { text: string; clocks: boolean }) {
  const tokens = tokenizeDateInput({ text, recognizeTime: clocks }).filter((token) => token.raw.trim());
  return (
    <section className="concept-parser-tokens" aria-label="Tokens">
      <h2>Tokens</h2>
      {tokens.length ? (
        <ol aria-label="Parsed tokens">
          {tokens.map((token, index) => {
            const meaning = tokenMeaning({ token, clocks, previous: tokens[index - 1], next: tokens[index + 1] });
            return (
              <li
                key={`${token.start}-${token.end}`}
                data-token-type={token.type}
                data-known={meaning.known}
                title={`Token type: ${token.type}`}
              >
                <code>{token.raw}</code>
                <small>{meaning.label}</small>
              </li>
            );
          })}
        </ol>
      ) : (
        <p>Type a phrase to see its parts.</p>
      )}
    </section>
  );
}
