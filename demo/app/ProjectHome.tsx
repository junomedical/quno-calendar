import "./projectHome.css";

const projects = [
  {
    title: "Infinite calendar",
    description: "Move through endless schedules, dense resources, and live event updates without losing your place.",
    href: "/guide/infinite-calendar",
    label: "Explore the calendar guide"
  },
  {
    title: "Date range input",
    description: "Paint, resize, and move timezone-free ranges in one stable, direct-manipulation calendar.",
    href: "/guide/date-range-input",
    label: "Explore the date range guide"
  },
  {
    title: "Date input field",
    description: "Turn natural phrases and typed dates into clear, validated ranges people can edit quickly.",
    href: "/guide/date-input-field",
    label: "Explore the date input guide"
  }
] as const;

export function ProjectHome() {
  return (
    <main className="project-home">
      <section className="project-home__content">
        <p className="project-home__eyebrow">@quno/calendar</p>
        <h1>Three focused tools for dates and schedules.</h1>
        <p className="project-home__intro">
          Start with the part you need. Each field guide explains the product thinking, lets you try the important
          interactions, and links to a focused demo.
        </p>
        <div className="project-home__cards">
          {projects.map((project, index) => (
            <a className="project-home__card" href={project.href} key={project.href} aria-label={project.label}>
              <span className="project-home__number">0{index + 1}</span>
              <h2>{project.title}</h2>
              <p>{project.description}</p>
              <strong>
                Open field guide <span aria-hidden="true">→</span>
              </strong>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
