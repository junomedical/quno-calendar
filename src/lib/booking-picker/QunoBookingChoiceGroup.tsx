import { forwardRef, type JSX, type ReactNode } from "react";

export type QunoBookingChoiceGroupProps = {
  children: ReactNode;
  className?: string;
  layout?: "responsive" | "stack";
};

/** Shared layout for booking choices such as doctors and appointment times. */
export const QunoBookingChoiceGroup = forwardRef<HTMLDivElement, QunoBookingChoiceGroupProps>(
  ({ children, className, layout = "responsive" }, ref): JSX.Element => (
    <div ref={ref} className={["quno-booking-choice-group", className].filter(Boolean).join(" ")} data-layout={layout}>
      {children}
    </div>
  )
);

QunoBookingChoiceGroup.displayName = "QunoBookingChoiceGroup";
