export function toCase(text: string) {
  return {
    kebab: toKebabCase(text),
    pascal: toPascalCase(text),
    camel: toCamelCase(text)
  };
}

function toKebabCase(name: string): string {
  return name
    .trim()
    .replace(/[_\s]+/g, '-')
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/--+/g, '-')
    .toLowerCase();
}

export function toPascalCase(name: string): string {
  return name
    .replace(/[_\s]+/g, '-')
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .split('-')
    .filter(Boolean)
    .map((p) => p[0]!.toUpperCase() + p.slice(1).toLowerCase())
    .join('');
}

function toCamelCase(name: string): string {
  const pascal = toPascalCase(name);
  return pascal[0]?.toLowerCase() + pascal.slice(1);
}
