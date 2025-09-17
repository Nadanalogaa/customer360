import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { db } from '@retail/db';
import * as schema from '@retail/db/src/schema';
import { eq, desc } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';

const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-1.5-flash';

const app = express();
app.use(cors({ origin: process.env.WEB_ORIGIN, credentials: true }));
app.use(express.json({ limit: '5mb' }));
app.use(cookieParser());

// Health
app.get('/health', (_req: Request, res: Response) => res.json({ ok: true }));

// Demo login (binds to first tenant or creates one)
app.post('/api/auth/login', async (req: Request, res: Response) => {
  const { email } = req.body;
  let tenant = (await db.select().from(schema.tenants).limit(1))[0];
  if (!tenant) {
    const inserted = await db.insert(schema.tenants).values({ name: 'Demo Tenant', subdomain: 'demo' }).returning();
    tenant = inserted[0];
    await db.insert(schema.brandProfiles).values({ tenantId: tenant.id, companyName: 'Demo Co.' });
  }
  return res.json({ user: { id: 'demo', name: 'Demo', email, role: 'owner', tenantId: tenant.id } });
});

// Brand profile
app.get('/api/brand', async (req: Request, res: Response) => {
  const tenantId = String(req.query.tid || '');
  if (!tenantId) return res.status(400).json({ error: 'missing tid' });
  const row = (await db.select().from(schema.brandProfiles).where(eq(schema.brandProfiles.tenantId, tenantId)).limit(1))[0];
  res.json(row || null);
});

app.put('/api/brand', async (req: Request, res: Response) => {
  const { tenantId, companyName, tagline, description, contact, address, primaryColor, secondaryColor, fontPrimary, fontSecondary, logoUrl } = req.body;
  const existing = (await db.select().from(schema.brandProfiles).where(eq(schema.brandProfiles.tenantId, tenantId)).limit(1))[0];
  if (existing) {
    await db.update(schema.brandProfiles).set({ companyName, tagline, description, contact, address, primaryColor, secondaryColor, fontPrimary, fontSecondary, logoUrl }).where(eq(schema.brandProfiles.id, existing.id));
  } else {
    await db.insert(schema.brandProfiles).values({ tenantId, companyName, tagline, description, contact, address, primaryColor, secondaryColor, fontPrimary, fontSecondary, logoUrl });
  }
  res.json({ ok: true });
});

// Image templates
app.get('/api/image-templates', async (_req: Request, res: Response) => {
  res.json([
    { id: 'sale', name: 'Sale Flyer', aspectRatio: '1:1' },
    { id: 'arrival', name: 'New Arrival', aspectRatio: '4:5' }
  ]);
});

// Generated images
app.get('/api/generated-images', async (req: Request, res: Response) => {
  const tenantId = String(req.query.tid || '');
  const rows = await db.select().from(schema.generatedImages).where(eq(schema.generatedImages.tenantId, tenantId)).orderBy(desc(schema.generatedImages.createdAt));
  res.json(rows);
});

app.post('/api/generate-image', async (req: Request, res: Response) => {
  const { tenantId, templateId, title, caption, hashtags } = req.body;
  const outUrl = `https://picsum.photos/seed/${encodeURIComponent(title || 'promo')}/1024/1024`;
  const inserted = await db.insert(schema.generatedImages).values({ tenantId, templateId, title, caption, hashtags, outUrl, aspectRatio: '1:1', width: 1024, height: 1024 }).returning();
  res.json(inserted[0]);
});

// Posts
app.get('/api/posts', async (req: Request, res: Response) => {
  const tenantId = String(req.query.tid || '');
  const rows = await db.select().from(schema.posts).where(eq(schema.posts.tenantId, tenantId)).orderBy(desc(schema.posts.createdAt));
  res.json(rows);
});

app.post('/api/posts', async (req: Request, res: Response) => {
  const { tenantId, platform, mediaUrl, caption, hashtags, scheduledAt } = req.body;
  const row = (await db.insert(schema.posts).values({ tenantId, platform, mediaUrl, caption, hashtags, scheduledAt, status: scheduledAt ? 'queued' : 'draft' }).returning())[0];
  res.json(row);
});

app.post('/api/website/generate', async (req: Request, res: Response) => {
  const { prompt, companyName, menu, layoutParts, palette } = req.body ?? {};
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'prompt is required' });
  }

  try {
    const generation = await buildWebsiteHtml(String(prompt), {
      companyName: typeof companyName === 'string' ? companyName : undefined,
      menu: Array.isArray(menu) ? menu : undefined,
      layout: Array.isArray(layoutParts) ? layoutParts : undefined,
      palette: Array.isArray(palette) ? palette : undefined
    });

    res.json(generation);
  } catch (error) {
    console.error('[api] website generation failed', error);
    res.status(500).json({ error: 'Failed to generate website HTML' });
  }
});

app.post('/api/website/deploy', async (req: Request, res: Response) => {
  const { html, companyName, prompt: sourcePrompt } = req.body ?? {};
  if (!html || typeof html !== 'string') {
    return res.status(400).json({ error: 'html is required' });
  }

  try {
    const deployment = await deployToVercel(html, {
      companyName: typeof companyName === 'string' ? companyName : undefined,
      prompt: typeof sourcePrompt === 'string' ? sourcePrompt : undefined
    });

    res.json(deployment);
  } catch (error) {
    console.error('[api] website deploy failed', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to deploy to Vercel' });
  }
});

const port = Number(process.env.PORT || 4000);
app.listen(port, () => console.log(`[API] http://localhost:${port}`));

type BuildOptions = {
  companyName?: string;
  menu?: string[];
  layout?: string[];
  palette?: string[];
};

type DeploymentOptions = {
  companyName?: string;
  prompt?: string;
};

async function buildWebsiteHtml(prompt: string, options: BuildOptions) {
  const apiKey = process.env.GEMINI_API_KEY;
  const basePrompt = [
    'You are an AI assistant that generates complete responsive marketing websites as a single HTML document.',
    'Respond with production ready HTML and CSS only. Inline CSS is acceptable. Do not wrap the response in code fences.',
    'Embed a simple CSS reset and typography styles. Use flex and grid layouts as needed.',
    options.companyName ? `Company name: ${options.companyName}.` : null,
    options.menu && options.menu.length ? `Navigation items: ${options.menu.join(', ')}.` : null,
    options.layout && options.layout.length ? `Requested sections: ${options.layout.join(', ')}.` : null,
    options.palette && options.palette.length ? `Preferred colours: ${options.palette.join(', ')}.` : null,
    'Follow the user instructions below to guide the content and tone.',
    'END OF SYSTEM PROMPT.'
  ]
    .filter(Boolean)
    .join('\n');

  if (!apiKey) {
    return {
      model: 'fallback-template',
      html: fallbackWebsiteHtml(prompt, options),
      warnings: ['GEMINI_API_KEY is not set. Returned fallback template instead of a real AI response.']
    };
  }

  const requestPayload = {
    contents: [
      {
        role: 'user',
        parts: [{ text: `${basePrompt}\n\nUSER REQUEST:\n${prompt}` }]
      }
    ],
    generationConfig: {
      temperature: 0.5,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 2048
    }
  };

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestPayload)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gemini error ${response.status}: ${text}`);
  }

  const data: any = await response.json();
  const chunks: string[] = Array.isArray(data?.candidates)
    ? data.candidates.flatMap((candidate: any) =>
        Array.isArray(candidate?.content?.parts)
          ? candidate.content.parts.map((part: any) => (typeof part?.text === 'string' ? part.text : '')).filter(Boolean)
          : []
      )
    : [];

  const combined = chunks.join('\n');
  const cleaned = cleanModelHtml(combined);

  return {
    model: data?.model ?? GEMINI_MODEL,
    html: cleaned,
    warnings: [] as string[]
  };
}

function cleanModelHtml(text: string) {
  if (!text) return fallbackWebsiteHtml('No content generated.', {});

  const fenceMatch = text.match(/```(?:html)?\s*([\s\S]*?)```/i);
  const raw = fenceMatch ? fenceMatch[1] : text;
  const trimmed = raw.trim();

  if (/<!doctype html/i.test(trimmed) || /<html/i.test(trimmed)) {
    return trimmed;
  }

  return wrapHtml(trimmed);
}

function wrapHtml(content: string) {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Generated Website</title>
    <style>
      * { box-sizing: border-box; }
      body { margin: 0; font-family: 'Inter', Arial, sans-serif; color: #1f2937; background: #f8fafc; }
      a { color: inherit; }
    </style>
  </head>
  <body>
    ${content}
  </body>
</html>`;
}

function fallbackWebsiteHtml(prompt: string, options: BuildOptions) {
  const menu = (options.menu ?? ['Home', 'About', 'Contact']).map((item) => `<a href="#">${escapeHtml(item)}</a>`).join('');
  const colors = options.palette ?? ['#2563eb', '#f97316'];
  const safePrompt = escapeHtml(prompt);
  const safeName = escapeHtml(options.companyName ?? 'AI Website');

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${safeName}</title>
    <style>
      :root { --primary: ${colors[0]}; --accent: ${colors[1] ?? colors[0]}; }
      * { box-sizing: border-box; }
      body { font-family: 'Inter', Arial, sans-serif; margin: 0; padding: 0; background: #f8fafc; color: #1f2937; }
      header { background: var(--primary); color: white; padding: 48px 24px; }
      nav { display: flex; gap: 16px; justify-content: center; margin-top: 16px; }
      nav a { color: white; text-decoration: none; font-weight: 500; }
      main { padding: 48px 24px; max-width: 960px; margin: 0 auto; }
      .card { background: white; border-radius: 24px; padding: 32px; box-shadow: 0 20px 45px rgba(15, 23, 42, 0.08); margin-bottom: 32px; }
      footer { background: #0f172a; color: white; padding: 32px 24px; text-align: center; }
    </style>
  </head>
  <body>
    <header>
      <h1>${safeName}</h1>
      <p>${safePrompt}</p>
      <nav>${menu}</nav>
    </header>
    <main>
      <div class="card">
        <h2>Website generator is not fully configured</h2>
        <p>Add your <strong>GEMINI_API_KEY</strong> to enable live AI output.</p>
        <p>The site prompt was:</p>
        <pre style="white-space: pre-wrap; background: #f1f5f9; padding: 16px; border-radius: 16px;">${safePrompt}</pre>
      </div>
    </main>
    <footer>Powered by Retail Promo Automation MVP</footer>
  </body>
</html>`;
}

async function deployToVercel(html: string, options: DeploymentOptions) {
  const token = process.env.VERCEL_TOKEN;
  if (!token) {
    throw new Error('VERCEL_TOKEN is not configured');
  }

  const nameSource = options.companyName ?? 'promo-site';
  const deploymentName = `${slugify(nameSource)}-${randomUUID().slice(0, 6)}`;
  const payload: Record<string, any> = {
    name: deploymentName,
    files: [
      {
        file: 'index.html',
        data: Buffer.from(html, 'utf-8').toString('base64'),
        encoding: 'base64'
      },
      {
        file: 'vercel.json',
        data: Buffer.from(
          JSON.stringify({ rewrites: [{ source: '/(.*)', destination: '/index.html' }] }, null, 2),
          'utf-8'
        ).toString('base64'),
        encoding: 'base64'
      }
    ],
    projectSettings: {
      framework: null,
      buildCommand: null,
      devCommand: null,
      outputDirectory: null
    }
  };

  const projectId = process.env.VERCEL_PROJECT_ID;
  const projectName = process.env.VERCEL_PROJECT_NAME;
  if (projectId) {
    payload.projectId = projectId;
  } else if (projectName) {
    payload.project = projectName;
  }

  if (options.prompt) {
    payload.meta = { sourcePrompt: options.prompt.slice(0, 1024) };
  }

  const url = new URL('https://api.vercel.com/v13/deployments');
  if (process.env.VERCEL_TEAM_ID) {
    url.searchParams.set('teamId', process.env.VERCEL_TEAM_ID);
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Vercel API ${response.status}: ${text}`);
  }

  const data: any = await response.json();
  const deploymentUrl: string | null = data?.url ? `https://${data.url}` : null;

  return {
    id: data?.id ?? null,
    url: deploymentUrl,
    inspectorUrl: data?.inspectorUrl ?? null
  };
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'site';
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
