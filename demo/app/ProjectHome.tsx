import "./projectHome.css";

const projects = [
  {
    title: "Quno/Infinite Calendar",
    description: "Move through endless schedules, dense resources, and live event updates without losing your place.",
    href: "/guide/infinite-calendar",
    label: "Explore the calendar guide"
  },
  {
    title: "Quno/Datepicker",
    description: "Paint, resize, and move timezone-free ranges in one stable, direct-manipulation calendar.",
    href: "/guide/datepicker",
    label: "Explore the Datepicker guide"
  },
  {
    title: "Quno/Date Input",
    description: "Turn natural phrases and typed dates into clear, validated ranges people can edit quickly.",
    href: "/guide/date-input",
    label: "Explore the Date Input guide"
  },
  {
    title: "Quno/Date Parser",
    description: "Resolve familiar formats, relative phrases, and multilingual ranges without a UI runtime.",
    href: "/guide/date-parser",
    label: "Explore the Date Parser guide"
  }
] as const;

const principles = [
  {
    title: "Clean",
    description: "Remove distractions and make the simplest useful presentation the default."
  },
  {
    title: "Focused",
    description: "Respect limited attention. Keep the current task clear and reveal only what helps."
  },
  {
    title: "Impressive",
    description: "Bring fresh interactions to familiar spaces so moments of surprise still feel intuitive."
  },
  {
    title: "Unbundled",
    description: "Prefer fewer dependencies, independent entry points, and smaller payloads."
  },
  {
    title: "Natural",
    description: "Let interactions follow a person’s intent instead of forcing a rigid sequence."
  },
  {
    title: "Preemptive",
    description: "Make a strong first guess, then make correction quick and obvious."
  }
] as const;

export function ProjectHome() {
  return (
    <main className="project-home">
      <section className="project-home__content">
        <p className="project-home__eyebrow">@quno/calendar</p>
        <h1>Opinionated approach to dates and schedules UI</h1>
        <p className="project-home__intro">
          Four different ideas in the date UI elements wrapped into one package. Read story behind every element and
          interaction in the field guides and see attached demos.
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
        <section className="project-home__principles" aria-labelledby="guiding-principles-title">
          <div className="project-home__principles-intro">
            <h2 id="guiding-principles-title">Guiding principles</h2>
          </div>
          <div className="project-home__principle-grid">
            {principles.map((principle, index) => (
              <article className="project-home__principle" key={principle.title}>
                <span>0{index + 1}</span>
                <h3>{principle.title}</h3>
                <p>{principle.description}</p>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
