import ejs from "ejs";

export type PageLocals = {
  title: string;
  subtitle: string;
  items: string[];
};

export const strictOptions = {
  strict: true,
  localsName: "locals",
  _with: false,
};

export function renderString(template: string, locals: PageLocals): string {
  return ejs.render(template, locals, { ...strictOptions });
}

export function renderTemplateFile(
  filename: string,
  locals: PageLocals,
  root: string,
): Promise<string> {
  return new Promise((resolve, reject) => {
    ejs.renderFile(
      filename,
      locals,
      { ...strictOptions, root },
      (err, rendered) => {
        if (err) {
          reject(err);
        } else {
          resolve(rendered);
        }
      },
    );
  });
}
