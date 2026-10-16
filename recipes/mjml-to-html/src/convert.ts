import mjml2html from "mjml";

export type RenderError = {
  message: string;
  line?: number;
};

export type RenderResult = {
  html: string;
  errors: RenderError[];
};

export async function render(source: string): Promise<RenderResult> {
  const { html, errors } = await mjml2html(source, { validationLevel: "soft" });
  return {
    html,
    errors: (errors ?? []).map((error: { message: string; line?: number }) => ({
      message: error.message,
      line: error.line,
    })),
  };
}
