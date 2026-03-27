import 'dotenv/config';
import { loadConfig } from './config';
import { buildServer } from './server';

async function main() {
  const config = loadConfig();
  const server = await buildServer(config);

  await server.listen({ port: config.port, host: config.host });
  console.log(`Encryption service running on http://${config.host}:${config.port}`);
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
