export function ConceptParagraphs({ paragraphs }: { paragraphs: string[] }) {
  return (
    <div className="concept-explanation">
      {paragraphs.map((text) => (
        <p key={text}>
          {text.split(/(\[shift-scroll\])/g).map((part, index) =>
            part === "[shift-scroll]" ? (
              <kbd className="concept-gesture-tag" key={index}>
                Shift + scroll
              </kbd>
            ) : (
              part
            )
          )}
        </p>
      ))}
    </div>
  );
}
