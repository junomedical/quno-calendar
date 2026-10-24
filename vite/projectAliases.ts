import { resolve } from "node:path";

export function projectAliases(root: string) {
  return [
    {
      find: /^@quno\/calendar\/infinite-calendar\/styles\.css$/,
      replacement: resolve(root, "src/lib/timeline/infinite/rendering/styles/calendar.css")
    },
    {
      find: /^@quno\/calendar\/infinite-calendar$/,
      replacement: resolve(root, "src/lib/timeline/index.ts")
    },
    { find: /^@quno\/calendar\/timepicker$/, replacement: resolve(root, "src/lib/time-picker/index.ts") },
    { find: /^@quno\/calendar\/datepicker$/, replacement: resolve(root, "src/lib/date-picker/index.ts") },
    { find: /^@quno\/calendar\/date-input$/, replacement: resolve(root, "src/lib/date-input/index.ts") },
    { find: /^@quno\/calendar\/date-parser$/, replacement: resolve(root, "src/lib/date-parser/index.ts") },
    { find: /^@quno\/calendar$/, replacement: resolve(root, "src/lib/index.ts") },
    { find: /^#quno-internal\//, replacement: `${resolve(root, "src/lib")}/` },
    { find: /^#quno-demo\//, replacement: `${resolve(root, "demo")}/` },
    { find: /^#quno-api\/demo-event-service$/, replacement: resolve(root, "demo/server/queryDemoEvents.ts") },
    { find: /^#quno-api\//, replacement: `${resolve(root, "api")}/` },
    { find: /^#quno-e2e\//, replacement: `${resolve(root, "e2e")}/` },
    { find: /^#quno-tests\//, replacement: `${resolve(root, "tests")}/` },
    { find: /^#quno-project\//, replacement: `${resolve(root)}/` }
  ];
}
