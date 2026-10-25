// tsc cannot read .astro files (only Astro's editor tooling can), so type .astro imports
// as the component the Container API renders. Types only: Vite compiles the real component.
declare module "*.astro" {
  const component: Parameters<import("astro/container").experimental_AstroContainer["renderToString"]>[0];
  export default component;
}
