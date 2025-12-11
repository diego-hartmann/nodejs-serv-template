import prompts from 'prompts';
import { ArtifactType } from './src/models';
import createShip from './src/module-types/ship';
import createMarketplace from './src/module-types/marketplace';
import createDomain from './src/module-types/domain';
import createHttpModule from './src/module-types/http-module';

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
    validate: (value) => (!value || !value.trim() ? 'Nome não pode ser vazio.' : true)
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
