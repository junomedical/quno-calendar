import type { ReactNode } from "react";
import "./componentDemo.css";

type ComponentDemoShellProps = {
  children: ReactNode;
  guideHref: string;
  title: string;
  description: string;
};

export function ComponentDemoShell({ children, description, guideHref, title }: ComponentDemoShellProps) {
  return (
    <main className="component-demo">
      <header className="component-demo__header">
        <div>
          <p>Quno Calendar · Demo</p>
          <h1>{title}</h1>
          <span>{description}</span>
        </div>
        <nav aria-label="Demo navigation">
          <a href={guideHref}>Field guide</a>
          <a href="/">All components</a>
        </nav>
      </header>
      <section className="component-demo__stage">{children}</section>
    </main>
  );
}
