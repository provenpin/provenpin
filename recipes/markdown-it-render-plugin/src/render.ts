import MarkdownIt from "markdown-it";

export function createRenderer() {
  const md = new MarkdownIt({ html: false, linkify: true });
  md.use((instance) => {
    const defaultRender =
      instance.renderer.rules.link_open ||
      ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options));
    instance.renderer.rules.link_open = (tokens, idx, options, env, self) => {
      const token = tokens[idx]!;
      const aIndex = token.attrIndex("target");
      if (aIndex < 0) token.attrPush(["target", "_blank"]);
      else token.attrs![aIndex]![1] = "_blank";
      return defaultRender(tokens, idx, options, env, self);
    };
  });
  return md;
}

export function renderMarkdown(source: string) {
  return createRenderer().render(source);
}
