import path from 'path';
import ROOT from '../../../utils/ROOT';
import { ensureDir } from '../../../utils/dir';
import { writeFileIfNotExists } from '../../../utils/create-file';
import { indexTemplate, runPrettierOn, simpleMocksTemplate, simpleModelsTemplate } from '../shared';
import { toCase } from '../../../utils/case';

export default async function createMarketplace(nameInput: string) {
  const { kebab, pascal } = toCase(nameInput);

  const baseDir = path.join(ROOT, 'src', 'harbour', 'marketplaces', `${kebab}.marketplace`);
  const srcDir = path.join(baseDir, 'src');
  const testsDir = path.join(srcDir, 'tests');

  ensureDir(srcDir);
  ensureDir(testsDir);

  const mainFileName = `${kebab}.marketplace`;
  const mainFilePath = path.join(srcDir, `${mainFileName}.ts`);
  const indexPath = path.join(baseDir, `index.ts`);
  const modelsPath = path.join(srcDir, `${mainFileName}.models.ts`);
  const mocksPath = path.join(srcDir, `${mainFileName}.mocks.ts`);
  const testPath = path.join(testsDir, `${mainFileName}.spec.ts`);

  const shipImportName = kebab;

  writeFileIfNotExists(indexPath, indexTemplate(kebab, 'marketplace'));
  writeFileIfNotExists(mainFilePath, marketplaceMainTemplate(pascal));
  writeFileIfNotExists(modelsPath, simpleModelsTemplate());
  writeFileIfNotExists(mocksPath, simpleMocksTemplate());
  writeFileIfNotExists(testPath, marketplaceTestTemplate(shipImportName, pascal));

  runPrettierOn([baseDir]);
}

function marketplaceMainTemplate(pascalName: string): string {
  return `// ${pascalName}Marketplace
// Ponto único de entrada/saída da app para este contexto.


export class ${pascalName}Marketplace {
  constructor() {}

  export async exampleUseCase(payload: unknown) {
    console.log(payload)
  }
}
`;
}

function marketplaceTestTemplate(rawName: string, pascalName: string): string {
  return `import { ${pascalName}Marketplace } from '../${rawName}.marketplace';

    import { describe, it, expect, jest } from '@jest/globals';

    describe('${pascalName}Marketplace', () => {

      it('should create an instance', () => {
        const fn = jest.fn();
        fn();

        const mkt = new ${pascalName}Marketplace();
        expect(mkt).not.toBeNull();
        expect(mkt.exampleUseCase({})).not.toBeNull();
      })

    });
`;
}
