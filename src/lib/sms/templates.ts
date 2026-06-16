import { segmentCount } from "@/lib/utils";

export type TemplateVariables = Record<string, string | number | null | undefined>;

const variablePattern = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;

export function renderTemplate(template: string, variables: TemplateVariables) {
  const missing = new Set<string>();
  const body = template.replace(variablePattern, (_, key: string) => {
    const value = variables[key];
    if (value === null || value === undefined || value === "") {
      missing.add(key);
      return "";
    }
    return String(value);
  });

  return {
    body,
    missingVariables: Array.from(missing),
    segmentCount: segmentCount(body),
  };
}

export function ensureComplianceFooter(body: string, footer = "Reply STOP to unsubscribe.") {
  if (/stop/i.test(body)) return body;
  return `${body.trim()} ${footer}`;
}

