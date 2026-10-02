export function deviceLanguage(): string | undefined {
  if (typeof document === "undefined") return undefined;
  return navigator.language.split("-")[0];
}
