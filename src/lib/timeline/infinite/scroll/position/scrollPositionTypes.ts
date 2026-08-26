/** Date-local position retained while a bounded date window is rebuilt. */
export type PendingScrollTarget = {
  dateKey: string;
  offsetWithinDate: number;
  eagerRange?: boolean;
};
