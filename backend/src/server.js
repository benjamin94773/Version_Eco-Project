import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { app } from './app.js';

dotenv.config();
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)) });
}

// Solo escucha en local; en Vercel se exporta el app como handler
if (!process.env.VERCEL) {
  const port = Number(process.env.PORT || 4000);
  app.listen(port, () => {
    console.log(`API escuchando en http://localhost:${port}`);
  });
}

export default app;
