import { products, type ProductId } from "./scenarioCatalog";
import calendarIntroduction from "./calendarIntroduction.json";
import datepickerIntroduction from "./datepickerIntroduction.json";
import dateInputIntroduction from "./dateInputIntroduction.json";
export type Introduction = { title: string; paragraphs: string[] };
const introductions: Partial<Record<ProductId, Introduction>> = {
  "infinite-calendar": calendarIntroduction,
  datepicker: datepickerIntroduction,
  "date-input": dateInputIntroduction
};
export function tourIntroduction(product: ProductId): Introduction {
  const metadata = products.find((item) => item.id === product)!;
  return introductions[product] ?? { title: metadata.label, paragraphs: [metadata.description] };
}
export function contentsLabel(product: ProductId) {
  return `All ${products.find((item) => item.id === product)!.label.toLowerCase()} demos`;
}
