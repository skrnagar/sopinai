import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  organization: string;
  topic: string;
  message: string;
  receivedAt: string;
}

const INQUIRIES: ContactSubmission[] = [];

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json({ limit: '64kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'sopin-web', timestamp: new Date().toISOString() });
  });

  app.post('/api/contact', (req, res) => {
    const body = req.body as Partial<ContactSubmission> | undefined;
    const name = String(body?.name || '').trim();
    const email = String(body?.email || '').trim();
    const organization = String(body?.organization || '').trim();
    const topic = String(body?.topic || 'Design Partner Access').trim();
    const message = String(body?.message || '').trim();

    if (!name || name.length > 120) {
      res.status(400).json({ error: 'Please provide your name (max 120 characters).' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 180) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }
    if (message.length < 15 || message.length > 4000) {
      res.status(400).json({
        error: 'Please include a summary of your inquiry or use case (15–4000 characters).',
      });
      return;
    }

    const record: ContactSubmission = {
      id: `inq_${Date.now().toString(36)}`,
      name,
      email,
      organization,
      topic,
      message,
      receivedAt: new Date().toISOString(),
    };
    INQUIRIES.push(record);
    if (INQUIRIES.length > 250) {
      INQUIRIES.shift();
    }

    res.status(201).json({
      ok: true,
      referenceId: record.id,
      receivedAt: record.receivedAt,
      topic: record.topic,
    });
  });

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build output not found.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SOPIN server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start SOPIN server:', err);
  process.exit(1);
});
