import path from 'path';
import ROOT from '../../../utils/ROOT';
import { ensureDir } from '../../../utils/dir';
import { writeFileIfNotExists } from '../../../utils/create-file';
import { runPrettierOn, simpleMocksTemplate, simpleModelsTemplate } from '../shared';
import { toCase } from '../../../utils/case';

export default async function createDomain(nameInput: string) {
  const { kebab, pascal } = toCase(nameInput);

  const baseDir = path.join(ROOT, 'src', 'domains', `${kebab}.domain`);
  const srcDir = path.join(baseDir, 'src');
  const testsDir = path.join(srcDir, 'tests');

  ensureDir(srcDir);
  ensureDir(testsDir);

  const mainFileName = `${kebab}.domain`;
  const mainFilePath = path.join(srcDir, `${mainFileName}.ts`);
  const indexPath = path.join(baseDir, `index.ts`);
  const modelsPath = path.join(srcDir, `${mainFileName}.models.ts`);
  const mocksPath = path.join(srcDir, `${mainFileName}.mocks.ts`);
  const testPath = path.join(testsDir, `${mainFileName}.spec.ts`);

  writeFileIfNotExists(indexPath, '// this is the index file for the module\n');
  writeFileIfNotExists(mainFilePath, domainMainTemplate(pascal));
  writeFileIfNotExists(modelsPath, simpleModelsTemplate());
  writeFileIfNotExists(mocksPath, simpleMocksTemplate());
  writeFileIfNotExists(testPath, domainTestTemplate(pascal, mainFileName));

  runPrettierOn([baseDir]);
}

function domainMainTemplate(pascalName: string): string {
  return `// ${pascalName}Domain
// Regras de negócio puras, sem Express, HTTP, bots, etc.

export class ${pascalName}Domain {
  // Exemplo de regra de negócio
  validate(input: unknown): boolean {
    // TODO: implementar regra real
    return !!input;
  }
}
`;
}

function domainTestTemplate(pascalName: string, fileName: string): string {
  return `import { ${pascalName}Domain } from '../${fileName}';
 import { describe, it, expect } from '@jest/globals';

describe('${pascalName}Domain', () => {
  it('validates truthy values as true', () => {
    const domain = new ${pascalName}Domain();
    expect(domain.validate({})).toBe(true);
  });

  it('validates falsy values as false', () => {
    const domain = new ${pascalName}Domain();
    expect(domain.validate(null as unknown as object)).toBe(false);
  });
});
`;
}
