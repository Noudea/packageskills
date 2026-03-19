import Handlebars from "handlebars";

export interface TemplateData {
  generatedCommandName: string;
  packageName: string;
}

export function renderTemplate(
  templateSource: string,
  templateData: TemplateData,
): string {
  const template = Handlebars.compile(templateSource, {
    noEscape: true,
  });

  return template(templateData);
}
