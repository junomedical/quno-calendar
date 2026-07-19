# Demo Application

The demo is intentionally outside `src/`. Everything under `src/lib` is reusable package code; everything here is application code used to explain or stress the package.

```mermaid
flowchart LR
  App["demo/app<br/>routing and shell"] --> Recipes["demo/examples<br/>focused copyable recipes"]
  App --> Showcase["demo/showcase<br/>stress and product scenarios"]
  Recipes --> Public["quno-calendar<br/>public package surface"]
  Showcase --> Public
  Public --> Library["src/lib<br/>shipped implementation"]
```

## Responsibilities

| Directory                | Purpose                                                                      | Optimization target            |
| ------------------------ | ---------------------------------------------------------------------------- | ------------------------------ |
| [`app`](./app)           | Vite entrypoint, route registry, example navigation, and application styling | Discoverability                |
| [`examples`](./examples) | Small integrations that demonstrate one public contract at a time            | Copyability and teaching       |
| [`showcase`](./showcase) | Dense datasets, product-like controls, external forms, and visual variants   | Stress and exploratory testing |

The demo may use development dependencies and mock transports. Library code must never import from `demo/`.
