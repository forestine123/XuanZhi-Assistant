import { buildApp } from './app.js';

const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? '127.0.0.1';

const app = buildApp();

await app.listen({ host, port });
console.log(`Xuanzhi API listening on http://${host}:${port}`);
