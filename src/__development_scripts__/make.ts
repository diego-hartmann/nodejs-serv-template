// scripts/make.ts
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import prompts from 'prompts';

type ArtifactType = 'ship' | 'marketplace' | 'domain' | 'module';

const ROOT = process.cwd();

// Helpers básicos
function toKebabCase(name: string): string {
  return name
    .trim()
    .replace(/[_\s]+/g, '-')
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase();
}

function toPascalCase(name: string): string {
  return name
    .split(/[-_\s]/g)
    .filter(Boolean)
    .map((p) => p[0]?.toUpperCase() + p.slice(1).toLowerCase())
    .join('');
}

function toCamelCase(name: string): string {
  const pascal = toPascalCase(name);
  return pascal[0]??''.toLowerCase() + pascal.slice(1);
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function writeFileIfNotExists(filePath: string, content: string) {
  if (fs.existsSync(filePath)) {
    console.log(`⚠️  Skipping existing file: ${filePath}`);
    return;
  }
  fs.writeFileSync(filePath, content, { encoding: 'utf8' });
  console.log(`✅ Created: ${filePath}`);
}

function runPrettierOn(paths: string[]) {
  try {
    const quoted = paths.map((p) => `"${p}"`).join(' ');
    execSync(`npx prettier --write ${quoted}`, { stdio: 'inherit' });
  } catch (e) {
    console.warn(`⚠️  Prettier failed or not installed. Skipping format. ${e}`);
  }
}

// ─────────────────────────────────────────────────────────────
// TEMPLATES
// ─────────────────────────────────────────────────────────────

function shipIndexTemplate(name: string): string {
  return `export * from './src/${name}.ship';\n`;
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

function simpleModelsTemplate(): string {
  return `// Define aqui os tipos / interfaces usados neste módulo.
`;
}

function simpleMocksTemplate(): string {
  return `// Define aqui mocks / dados fake usados em testes ou desenvolvimento.
`;
}

function shipTestTemplate(pascalName: string, fileName: string): string {
  return `import { ${pascalName}Ship } from '../${fileName}';

describe('${pascalName}Ship', () => {
  it('should echo payload in exampleOperation', async () => {
    const ship = new ${pascalName}Ship();
    const input = { foo: 'bar' };
    const result = await ship.exampleOperation(input);
    expect(result).toEqual(input);
  });
});
`;
}

// Marketplace
function marketplaceIndexTemplate(name: string): string {
  return `export * from './src/${name}.marketplace';\n`;
}

function marketplaceMainTemplate(
  pascalName: string,
  shipImportName: string,
  shipClassName: string
): string {
  return `// ${pascalName}Marketplace
// Ponto único de entrada/saída da app para este contexto.

import { ${shipClassName} } from '../../harbour/ships/${shipImportName}.ship';

export class ${pascalName}Marketplace {
  constructor(private readonly ship: ${shipClassName} = new ${shipClassName}()) {}

  async exampleUseCase(payload: unknown): Promise<unknown> {
    // Aqui poderias chamar domain antes de ship, se necessário.
    return this.ship.exampleOperation(payload);
  }
}
`;
}

function marketplaceTestTemplate(
  pascalName: string,
  shipImportName: string,
  shipClassName: string
): string {
  return `import { ${pascalName}Marketplace } from '../${pascalName}.marketplace';
import { ${shipClassName} } from '../../../harbour/ships/${shipImportName}.ship';

jest.mock('../../../harbour/ships/${shipImportName}.ship');

describe('${pascalName}Marketplace', () => {
  it('delegates to ship.exampleOperation', async () => {
    const payload = { foo: 'bar' };
    const ship = new ${shipClassName}() as jest.Mocked<${shipClassName}>;
    ship.exampleOperation.mockResolvedValueOnce({ ok: true });

    const marketplace = new ${pascalName}Marketplace(ship);
    const result = await marketplace.exampleUseCase(payload);

    expect(ship.exampleOperation).toHaveBeenCalledWith(payload);
    expect(result).toEqual({ ok: true });
  });
});
`;
}

// Domain
function domainIndexTemplate(name: string): string {
  return `export * from './src/${name}.domain';\n`;
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

// HTTP Module
function moduleIndexTemplate(name: string): string {
  return `export * from './src/${name}.router';\n`;
}

function moduleControllerTemplate(
  pascalName: string,
  serviceClassName: string
): string {
  return `import { Request, Response, NextFunction } from 'express';
import { ${serviceClassName} } from './${serviceClassName.replace(
    /^./,
    (c) => c.toLowerCase()
  )}';

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

function moduleServiceTemplate(
  pascalName: string,
  repositoryClassName: string
): string {
  const repoFile = repositoryClassName.replace(/^./, (c) => c.toLowerCase());
  return `import { ${repositoryClassName} } from './${repoFile}';

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

function moduleRouterTemplate(
  pascalName: string,
  camelName: string
): string {
  const controllerClass = `${pascalName}Controller`;
  const controllerFile = `${camelName}.controller`;
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
import { ${serviceClass} } from '../${serviceClass.replace(
    /^./,
    (c) => c.toLowerCase()
  )}';

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

// ─────────────────────────────────────────────────────────────
// ROUTES INJECTION (HTTP MODULE)
// ─────────────────────────────────────────────────────────────

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

  const camelName = toCamelCase(moduleName);
  const routerConst = `${camelName}Router`;
  const moduleImportPath = `../modules/${moduleName}.module`;

  const importLine = `import { ${routerConst} } from '${moduleImportPath}';`;
  const routeLine = `routes.use('/${moduleName}', ${routerConst});`;

  let updated = fileContent;

  // IMPORTS
  const importBlockStart = updated.indexOf(importStart) + importStart.length;
  const importBlockEnd = updated.indexOf(importEnd);
  const importBlock = updated.slice(importBlockStart, importBlockEnd);

  if (!importBlock.includes(importLine)) {
    const newImportBlock =
      importBlock.trimEnd() + '\n' + importLine + '\n\n';
    updated =
      updated.slice(0, importBlockStart) +
      '\n' +
      newImportBlock +
      updated.slice(importBlockEnd);
  }

  // ROUTES
  const routesBlockStart = updated.indexOf(routesStart) + routesStart.length;
  const routesBlockEnd = updated.indexOf(routesEnd);
  const routesBlock = updated.slice(routesBlockStart, routesBlockEnd);

  if (!routesBlock.includes(routeLine)) {
    const newRoutesBlock =
      routesBlock.trimEnd() + '\n' + routeLine + '\n\n';
    updated =
      updated.slice(0, routesBlockStart) +
      '\n' +
      newRoutesBlock +
      updated.slice(routesBlockEnd);
  }

  fs.writeFileSync(routesPath, updated, 'utf8');
  console.log(`✅ Updated routes.ts with module '${moduleName}'`);
}

// ─────────────────────────────────────────────────────────────
// CREATORS
// ─────────────────────────────────────────────────────────────

async function createShip(nameInput: string) {
  const rawName = toKebabCase(nameInput);
  const pascal = toPascalCase(rawName);
  const baseDir = path.join(ROOT, 'src', 'harbour', 'ships', `${rawName}.ship`);
  const srcDir = path.join(baseDir, 'src');
  const testsDir = path.join(srcDir, '__tests__');

  ensureDir(srcDir);
  ensureDir(testsDir);

  const mainFileName = `${rawName}.ship`;
  const mainFilePath = path.join(srcDir, `${mainFileName}.ts`);
  const indexPath = path.join(baseDir, 'index.ts');
  const modelsPath = path.join(srcDir, 'models.ts');
  const mocksPath = path.join(srcDir, 'mocks.ts');
  const testPath = path.join(testsDir, `${mainFileName}.spec.ts`);

  writeFileIfNotExists(indexPath, shipIndexTemplate(rawName));
  writeFileIfNotExists(mainFilePath, shipMainTemplate(pascal, mainFileName));
  writeFileIfNotExists(modelsPath, simpleModelsTemplate());
  writeFileIfNotExists(mocksPath, simpleMocksTemplate());
  writeFileIfNotExists(testPath, shipTestTemplate(pascal, `../${mainFileName}`));

  runPrettierOn([baseDir]);
}

async function createMarketplace(nameInput: string) {
  const rawName = toKebabCase(nameInput);
  const pascal = toPascalCase(rawName);
  const baseDir = path.join(
    ROOT,
    'src',
    'harbour',
    'marketplaces',
    `${rawName}.marketplace`
  );
  const srcDir = path.join(baseDir, 'src');
  const testsDir = path.join(srcDir, '__tests__');

  ensureDir(srcDir);
  ensureDir(testsDir);

  const mainFileName = `${pascal}.marketplace`;
  const mainFilePath = path.join(srcDir, `${mainFileName}.ts`);
  const indexPath = path.join(baseDir, 'index.ts');
  const modelsPath = path.join(srcDir, 'models.ts');
  const mocksPath = path.join(srcDir, 'mocks.ts');
  const testPath = path.join(testsDir, `${mainFileName}.spec.ts`);

  // Ship assumido com mesmo nome base (podes mudar manualmente depois)
  const shipImportName = rawName;
  const shipClassName = `${pascal}Ship`;

  writeFileIfNotExists(indexPath, marketplaceIndexTemplate(rawName));
  writeFileIfNotExists(
    mainFilePath,
    marketplaceMainTemplate(pascal, shipImportName, shipClassName)
  );
  writeFileIfNotExists(modelsPath, simpleModelsTemplate());
  writeFileIfNotExists(mocksPath, simpleMocksTemplate());
  writeFileIfNotExists(
    testPath,
    marketplaceTestTemplate(pascal, shipImportName, shipClassName)
  );

  runPrettierOn([baseDir]);
}

async function createDomain(nameInput: string) {
  const rawName = toKebabCase(nameInput);
  const pascal = toPascalCase(rawName);
  const baseDir = path.join(ROOT, 'src', 'domains', `${rawName}.domain`);
  const srcDir = path.join(baseDir, 'src');
  const testsDir = path.join(srcDir, '__tests__');

  ensureDir(srcDir);
  ensureDir(testsDir);

  const mainFileName = `${rawName}.domain`;
  const mainFilePath = path.join(srcDir, `${mainFileName}.ts`);
  const indexPath = path.join(baseDir, 'index.ts');
  const modelsPath = path.join(srcDir, 'models.ts');
  const mocksPath = path.join(srcDir, 'mocks.ts');
  const testPath = path.join(testsDir, `${mainFileName}.spec.ts`);

  writeFileIfNotExists(indexPath, domainIndexTemplate(rawName));
  writeFileIfNotExists(mainFilePath, domainMainTemplate(pascal));
  writeFileIfNotExists(modelsPath, simpleModelsTemplate());
  writeFileIfNotExists(mocksPath, simpleMocksTemplate());
  writeFileIfNotExists(testPath, domainTestTemplate(pascal, `../${mainFileName}`));

  runPrettierOn([baseDir]);
}

async function createHttpModule(nameInput: string) {
  const rawName = toKebabCase(nameInput);
  const pascal = toPascalCase(rawName);
  const camel = toCamelCase(rawName);

  const baseDir = path.join(ROOT, 'src', 'modules', `${rawName}.module`);
  const srcDir = path.join(baseDir, 'src');
  const testsDir = path.join(srcDir, '__tests__');

  ensureDir(srcDir);
  ensureDir(testsDir);

  const indexPath = path.join(baseDir, 'index.ts');
  const controllerFileName = `${camel}.controller.ts`;
  const serviceFileName = `${camel}.service.ts`;
  const repositoryFileName = `${camel}.repository.ts`;
  const routerFileName = `${camel}.router.ts`;
  const modelsPath = path.join(srcDir, 'models.ts');
  const mocksPath = path.join(srcDir, 'mocks.ts');
  const testPath = path.join(
    testsDir,
    `${camel}.router.spec.ts`
  );

  // index
  writeFileIfNotExists(indexPath, moduleIndexTemplate(camel));

  const serviceClassName = `${pascal}Service`;
  const repositoryClassName = `${pascal}Repository`;
  const routerConst = `${camel}Router`;

  // controller
  writeFileIfNotExists(
    path.join(srcDir, controllerFileName),
    moduleControllerTemplate(pascal, serviceClassName)
  );

  // service
  writeFileIfNotExists(
    path.join(srcDir, serviceFileName),
    moduleServiceTemplate(pascal, repositoryClassName)
  );

  // repository
  writeFileIfNotExists(
    path.join(srcDir, repositoryFileName),
    moduleRepositoryTemplate(pascal)
  );

  // router
  writeFileIfNotExists(
    path.join(srcDir, routerFileName),
    moduleRouterTemplate(pascal, camel)
  );

  // tests
  writeFileIfNotExists(
    testPath,
    moduleTestTemplate(
      pascal,
      serviceClassName,
      routerConst,
      `../${routerFileName}`
    )
  );

  // extra files
  writeFileIfNotExists(modelsPath, simpleModelsTemplate());
  writeFileIfNotExists(mocksPath, simpleMocksTemplate());

  // inject in http/routes.ts
  injectModuleIntoHttpRoutes(rawName);

  runPrettierOn([baseDir]);
}

// ─────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────

async function main() {
  const { type } = await prompts({
    type: 'select',
    name: 'type',
    message: 'O que deseja criar?',
    choices: [
      { title: 'Ship', value: 'ship' },
      { title: 'Marketplace', value: 'marketplace' },
      { title: 'Domain', value: 'domain' },
      { title: 'HTTP Module', value: 'module' }
    ]
  });

  if (!type) {
    console.log('Cancelado.');
    process.exit(0);
  }

  const { name } = await prompts({
    type: 'text',
    name: 'name',
    message: 'Nome (ex: user, lead, consultant):',
    validate: (value) =>
      !value || !value.trim()
        ? 'Nome não pode ser vazio.'
        : true
  });

  const trimmed = String(name).trim();
  if (!trimmed) {
    console.log('Nome inválido. Abortando.');
    process.exit(1);
  }

  const artifactType = type as ArtifactType;

  switch (artifactType) {
    case 'ship':
      await createShip(trimmed);
      break;
    case 'marketplace':
      await createMarketplace(trimmed);
      break;
    case 'domain':
      await createDomain(trimmed);
      break;
    case 'module':
      await createHttpModule(trimmed);
      break;
    default:
      console.log('Tipo inválido.');
  }

  console.log('✨ Done.');
}

main().catch((err) => {
  console.error('Erro ao executar make.ts:', err);
  process.exit(1);
});
