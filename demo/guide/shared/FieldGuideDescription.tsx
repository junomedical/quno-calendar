import type { ReactNode } from "react";

type FieldGuideDescriptionProps = {
  children: ReactNode;
  instruction?: ReactNode;
  noteClassName?: string;
};

export function FieldGuideDescription({
  children,
  instruction,
  noteClassName = "field-guide__try"
}: FieldGuideDescriptionProps) {
  return (
    <div className="field-guide__description">
      <div className="field-guide__copy">{children}</div>
      {instruction && (
        <aside className={noteClassName}>
          <strong>Try it</strong>
          {instruction}
        </aside>
      )}
    </div>
  );
}
