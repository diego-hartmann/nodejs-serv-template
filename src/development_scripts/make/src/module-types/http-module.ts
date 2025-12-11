import { toCase } from '../../../utils/case';
import path from 'path';
import ROOT from '../../../utils/ROOT';
import { ensureDir } from '../../../utils/dir';
import { writeFileIfNotExists } from '../../../utils/create-file';
import { indexTemplate, runPrettierOn, simpleMocksTemplate, simpleModelsTemplate } from '../shared';
import fs from 'fs';

export default async function createHttpModule(nameInput: string) {
  const { kebab, pascal, camel } = toCase(nameInput);

  const baseDir = path.join(ROOT, 'src', 'http-modules', `${kebab}.http-module`);
  const srcDir = path.join(baseDir, 'src');
  const testsDir = path.join(srcDir, 'tests');

  ensureDir(srcDir);
  ensureDir(testsDir);

  const mainFileName = `${kebab}.http-module`;
  const mainClassName = `${pascal}HttpModule`;
  // const mainCamelName = `${camel}HttpModule`;

  const indexPath = path.join(baseDir, 'index.ts');
  const controllerFileName = `${mainFileName}.controller.ts`;
  const serviceFileName = `${mainFileName}.service.ts`;
  const repositoryFileName = `${mainFileName}.repository.ts`;
  const routerFileName = `${mainFileName}.router.ts`;
  const modelsPath = path.join(srcDir, `${mainFileName}.models.ts`);
  const mocksPath = path.join(srcDir, `${mainFileName}.mocks.ts`);
  const testPath = path.join(testsDir, `${mainFileName}.router.spec.ts`);

  // index
  writeFileIfNotExists(indexPath, indexTemplate(kebab, 'http-module'));

  const serviceImportName = `${mainFileName}.service`;
  const serviceClassName = `${mainClassName}Service`;

  const repositoryImportName = `${mainFileName}.repository`;
  const repositoryClassName = `${mainClassName}Repository`;

  const routerConst = `${camel}Router`;

  // controller
  writeFileIfNotExists(
    path.join(srcDir, controllerFileName),
    moduleControllerTemplate(pascal, serviceImportName, serviceClassName)
  );

  // service
  writeFileIfNotExists(
    path.join(srcDir, serviceFileName),
    moduleServiceTemplate(pascal, repositoryImportName, repositoryClassName)
  );

  // repository
  writeFileIfNotExists(path.join(srcDir, repositoryFileName), moduleRepositoryTemplate(pascal));

  // router
  writeFileIfNotExists(
    path.join(srcDir, routerFileName),
    moduleRouterTemplate(pascal, camel, kebab)
  );

  // tests
  writeFileIfNotExists(
    testPath,
    moduleTestTemplate(pascal, serviceClassName, routerConst, routerFileName)
  );

  // extra files
  writeFileIfNotExists(modelsPath, simpleModelsTemplate());
  writeFileIfNotExists(mocksPath, simpleMocksTemplate());

  // inject in http/routes.ts
  injectModuleIntoHttpRoutes(kebab);

  runPrettierOn([baseDir]);
}

function moduleServiceTemplate(
  pascalName: string,
  repositoryImportName: string,
  repositoryClassName: string
): string {
  return `import { ${repositoryClassName} } from './${repositoryImportName}';

export class ${pascalName}Service {
  constructor(private readonly repository: ${repositoryClassName} = new ${repositoryClassName}()) {}

  async list() {
    return this.repository.findAll();
  }

  async create(data: unknown) {
    return this.repository.create(data);
  }

  async getById(id: string) {
    return this.repository.findById(id);
  }

  async update(id: string, data: unknown) {
    return this.repository.update(id, data);
  }

  async remove(id: string) {
    return this.repository.delete(id);
  }
}
`;
}

function injectModuleIntoHttpRoutes(moduleName: string) {
  const routesPath = path.join(ROOT, 'src', 'http', 'src', 'routes.ts');
  if (!fs.existsSync(routesPath)) {
    console.warn('⚠️  src/http/routes.ts not found. Skipping auto-injection.');
    return;
  }

  const fileContent = fs.readFileSync(routesPath, 'utf8');

  const importStart = '// AUTO-IMPORTS';
  const importEnd = '// AUTO-IMPORTS-END';
  const routesStart = '// AUTO-ROUTES';
  const routesEnd = '// AUTO-ROUTES-END';

  if (
    !fileContent.includes(importStart) ||
    !fileContent.includes(importEnd) ||
    !fileContent.includes(routesStart) ||
    !fileContent.includes(routesEnd)
  ) {
    console.warn('⚠️  Markers not found in routes.ts. Skipping auto-injection.');
    return;
  }

  const camelName = toCase(moduleName).camel;
  const routerConst = `${camelName}Router`;
  const moduleImportPath = `../../http-modules/${moduleName}.http-module`;

  const importLine = `import { ${routerConst} } from '${moduleImportPath}';`;
  const routeLine = `routes.use('/${moduleName}', ${routerConst});`;

  let updated = fileContent;

  // IMPORTS
  const importBlockStart = updated.indexOf(importStart) + importStart.length;
  const importBlockEnd = updated.indexOf(importEnd);
  const importBlock = updated.slice(importBlockStart, importBlockEnd);

  if (!importBlock.includes(importLine)) {
    const newImportBlock = importBlock.trimEnd() + '\n' + importLine + '\n\n';
    updated =
      updated.slice(0, importBlockStart) + '\n' + newImportBlock + updated.slice(importBlockEnd);
  }

  // ROUTES
  const routesBlockStart = updated.indexOf(routesStart) + routesStart.length;
  const routesBlockEnd = updated.indexOf(routesEnd);
  const routesBlock = updated.slice(routesBlockStart, routesBlockEnd);

  if (!routesBlock.includes(routeLine)) {
    const newRoutesBlock = routesBlock.trimEnd() + '\n' + routeLine + '\n\n';
    updated =
      updated.slice(0, routesBlockStart) + '\n' + newRoutesBlock + updated.slice(routesBlockEnd);
  }

  fs.writeFileSync(routesPath, updated, 'utf8');
  console.log(`✅ Updated routes.ts with http-module '${moduleName}'`);
}

function moduleControllerTemplate(
  pascalName: string,
  serviceImportName: string,
  serviceClassName: string
): string {
  return `import { Request, Response, NextFunction } from 'express';
import { ${serviceClassName} } from './${serviceImportName}';

const service = new ${serviceClassName}();

export class ${pascalName}Controller {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.list();
      res.json(data);
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const created = await service.create(req.body);
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await service.getById(req.params.id);
      if (!item) {
        return res.status(404).json({ message: '${pascalName} not found' });
      }
      res.json(item);
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await service.update(req.params.id, req.body);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await service.remove(req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
}
`;
}

function moduleRepositoryTemplate(pascalName: string): string {
  return `// ${pascalName}Repository
// Repositório simples in-memory para começar. Troca depois por DB real.

export class ${pascalName}Repository {
  private store = new Map<string, unknown>();

  async findAll(): Promise<unknown[]> {
    return Array.from(this.store.values());
  }

  async findById(id: string): Promise<unknown | undefined> {
    return this.store.get(id);
  }

  async create(data: unknown): Promise<unknown> {
    const id = String(this.store.size + 1);
    const record = { id, ...((data as object) || {}) };
    this.store.set(id, record);
    return record;
  }

  async update(id: string, data: unknown): Promise<unknown> {
    const existing = this.store.get(id) || {};
    const updated = { ...existing, ...((data as object) || {}), id };
    this.store.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }
}
`;
}

function moduleRouterTemplate(pascalName: string, camelName: string, rawName: string): string {
  const controllerClass = `${pascalName}Controller`;
  const controllerFile = `${rawName}.controller`;
  const routerConst = `${camelName}Router`;

  return `import { Router } from 'express';
import { ${controllerClass} } from './${controllerFile}';

export const ${routerConst} = Router();
const controller = new ${controllerClass}();

${routerConst}.get('/', controller.list.bind(controller));
${routerConst}.post('/', controller.create.bind(controller));
${routerConst}.get('/:id', controller.getById.bind(controller));
${routerConst}.put('/:id', controller.update.bind(controller));
${routerConst}.delete('/:id', controller.remove.bind(controller));
`;
}

function moduleTestTemplate(
  pascalName: string,
  serviceClass: string,
  routerConst: string,
  routerFileName: string
): string {
  return `import request from 'supertest';
import express from 'express';
import { ${routerConst} } from '../${routerFileName}';
import { ${serviceClass} } from '../${serviceClass.replace(/^./, (c) => c.toLowerCase())}';

 import { describe, it, expect, jest } from '@jest/globals';

jest.mock('../${serviceClass.replace(/^./, (c) => c.toLowerCase())}');

describe('${pascalName} HTTP module', () => {
  const app = express();
  app.use(express.json());
  app.use('/test', ${routerConst});

  it('GET /test returns list from service', async () => {
    const mockService = ${serviceClass} as jest.MockedClass<typeof ${serviceClass}>;
    const instance = new mockService() as jest.Mocked<InstanceType<typeof ${serviceClass}>>;
    instance.list.mockResolvedValueOnce([{ id: '1' }]);

    const res = await request(app).get('/test');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: '1' }]);
  });
});
`;
}
