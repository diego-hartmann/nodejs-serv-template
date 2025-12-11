import path from 'path';
import ROOT from '../../../utils/ROOT';
import { ensureDir } from '../../../utils/dir';
import { writeFileIfNotExists } from '../../../utils/create-file';
import { indexTemplate, runPrettierOn, simpleMocksTemplate, simpleModelsTemplate } from '../shared';
import { toCase } from '../../../utils/case';

export default async function createShip(nameInput: string) {
  const { kebab, pascal } = toCase(nameInput);

  const baseDir = path.join(ROOT, 'src', 'harbour', 'ships', `${kebab}.ship`);
  const srcDir = path.join(baseDir, 'src');
  const testsDir = path.join(srcDir, 'tests');

  ensureDir(srcDir);
  ensureDir(testsDir);

  const mainFileName = `${kebab}.ship`;
  const mainFilePath = path.join(srcDir, `${mainFileName}.ts`);
  const indexPath = path.join(baseDir, `index.ts`);
  const modelsPath = path.join(srcDir, `${mainFileName}.models.ts`);
  const mocksPath = path.join(srcDir, `${mainFileName}.mocks.ts`);
  const testPath = path.join(testsDir, `${mainFileName}.spec.ts`);

  writeFileIfNotExists(indexPath, indexTemplate(kebab, 'ship'));
  writeFileIfNotExists(mainFilePath, shipMainTemplate(pascal, mainFileName));
  writeFileIfNotExists(modelsPath, simpleModelsTemplate());
  writeFileIfNotExists(mocksPath, simpleMocksTemplate());
  writeFileIfNotExists(testPath, shipTestTemplate(pascal, mainFileName));

  runPrettierOn([baseDir]);
}

function shipMainTemplate(pascalName: string, fileName: string): string {
  return `// ${fileName}.ts
// Ship: integração externa (API, SDK, etc.)
export class ${pascalName}Ship {
  async exampleOperation(payload: unknown): Promise<unknown> {
    // TODO: implementar chamada externa real
    return payload;
  }
}
`;
}

function shipTestTemplate(pascalName: string, fileName: string): string {
  return `import { ${pascalName}Ship } from '../${fileName}';
  import { describe, it, expect, jest } from '@jest/globals';
describe('${pascalName}Ship', () => {
  it('should echo payload in exampleOperation', async () => {
    const fn = jest.fn();
    fn();

    const ship = new ${pascalName}Ship();
    const input = { foo: 'bar' };
    const result = await ship.exampleOperation(input);
    expect(result).toEqual(input);
  });
});
`;
}
