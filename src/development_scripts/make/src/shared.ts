import { execSync } from 'child_process';
import { ArtifactType } from './models';

export function simpleModelsTemplate(): string {
  return `// Define aqui os tipos / interfaces usados neste módulo.
`;
}

export function simpleMocksTemplate(): string {
  return `// Define aqui mocks / dados fake usados em testes ou desenvolvimento.
`;
}

export function indexTemplate(rawName: string, value: ArtifactType): string {
  return `export * from './src/${rawName}.${value}';\n`;
}

export function runPrettierOn(paths: string[]) {
  try {
    const quoted = paths.map((p) => `"${p}"`).join(' ');
    execSync(`npx prettier --write ${quoted}`, { stdio: 'inherit' });
  } catch (e) {
    console.warn(`⚠️  Prettier failed or not installed. Skipping format. ${e}`);
  }
}
