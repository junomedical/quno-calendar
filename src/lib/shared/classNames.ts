type ClassValue = string | false | null | undefined;

export const classNames = ({ values }: { values: ClassValue[] }): string => values.filter(Boolean).join(" ");
