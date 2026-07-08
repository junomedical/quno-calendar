const sourceBaseUrl = "https://github.com/quno-ai/quno-calendar/blob/main";

type DemoSourceLinksProps = {
  sourcePath: string;
};

export function DemoSourceLinks({ sourcePath }: DemoSourceLinksProps) {
  return (
    <a className="demo-source-link" href={`${sourceBaseUrl}/${sourcePath}`} rel="noreferrer" target="_blank">
      View example source
    </a>
  );
}
