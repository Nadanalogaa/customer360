import { useMemo, useState } from 'react';

type GeneratedSection = {
  id: string;
  title: string;
  summary: string;
  callouts?: string[];
};

type GeneratedSite = {
  companyName: string;
  menu: string[];
  colors: string[];
  heroImagePrompt: string;
  customPrompt: string;
  sections: GeneratedSection[];
  compiledPrompt: string;
};

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

const layoutOptions = [
  {
    id: 'hero',
    label: 'Hero Header',
    blurb: 'Bold hero with headline, CTA button, and hero image.'
  },
  {
    id: 'sidebar',
    label: 'Sidebar Menu',
    blurb: 'Left sidebar navigation with quick contact block.'
  },
  {
    id: 'features',
    label: 'Featured Services',
    blurb: 'Three highlight cards for core offers or promotions.'
  },
  {
    id: 'testimonials',
    label: 'Testimonials',
    blurb: 'Customer quotes with star ratings and photos.'
  },
  {
    id: 'cta-footer',
    label: 'CTA Footer',
    blurb: 'Footer with newsletter capture and social links.'
  }
];

const sectionCopy: Record<string, GeneratedSection> = {
  hero: {
    id: 'hero',
    title: 'Hero Header',
    summary:
      'Large intro block with the brand headline, subheading, hero imagery, and a prominent call-to-action button.'
  },
  sidebar: {
    id: 'sidebar',
    title: 'Sidebar Navigation',
    summary:
      'Fixed left column with navigation, contact details, quick links, and optional promo banner.'
  },
  features: {
    id: 'features',
    title: 'Featured Services',
    summary:
      'Grid of three feature cards summarising signature products, each with icon, title, and short copy.'
  },
  testimonials: {
    id: 'testimonials',
    title: 'Testimonials',
    summary:
      'Carousel or stacked quotes spotlighting happy customers, 5-star ratings, and profile pictures.'
  },
  'cta-footer': {
    id: 'cta-footer',
    title: 'Call-to-Action Footer',
    summary:
      'Footer block with newsletter signup, contact info, and second CTA linking to WhatsApp or bookings.'
  }
};

export default function WebsiteBuilder() {
  const [companyName, setCompanyName] = useState('Sunrise Grocers');
  const [layoutParts, setLayoutParts] = useState<string[]>(['hero', 'sidebar', 'features', 'cta-footer']);
  const [menuText, setMenuText] = useState('Home\nDeals\nCatalog\nTestimonials\nContact');
  const [primaryColor, setPrimaryColor] = useState('#2563eb');
  const [accentColor, setAccentColor] = useState('#f97316');
  const [imageReference, setImageReference] = useState('Bright produce display with shoppers, natural lighting, smiling staff.');
  const [customPrompt, setCustomPrompt] = useState(
    'Design a modern responsive marketing site for a community grocery store focusing on fresh produce and daily offers. Include clear CTAs to order on WhatsApp.'
  );
  const [generatedSite, setGeneratedSite] = useState<GeneratedSite | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewWarnings, setPreviewWarnings] = useState<string[]>([]);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [modelUsed, setModelUsed] = useState<string | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentUrl, setDeploymentUrl] = useState<string | null>(null);
  const [deploymentInspectorUrl, setDeploymentInspectorUrl] = useState<string | null>(null);
  const [deploymentError, setDeploymentError] = useState<string | null>(null);

  const menuItems = useMemo(
    () =>
      menuText
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean),
    [menuText]
  );

  const compiledPrompt = useMemo(() => {
    const layoutSentence = layoutParts
      .map((id) => sectionCopy[id]?.title ?? id)
      .join(', ');

    return [
      `Company name: ${companyName}.`,
      `Navigation items: ${menuItems.join(', ') || 'Home, About, Contact'}.`,
      `Layout requirements: ${layoutSentence || 'Hero, Services, Footer'}.`,
      `Brand palette: primary ${primaryColor}, accent ${accentColor}.`,
      `Hero image reference: ${imageReference}.`,
      `Creative direction: ${customPrompt}`
    ].join('\n');
  }, [companyName, menuItems, layoutParts, primaryColor, accentColor, imageReference, customPrompt]);

  const toggleLayoutPart = (id: string) => {
    setLayoutParts((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  };

  const buildSitePlan = () => {
    const sections = layoutParts.map((id) => sectionCopy[id]).filter(Boolean) as GeneratedSection[];
    const sitePlan: GeneratedSite = {
      companyName,
      menu: menuItems,
      colors: [primaryColor, accentColor],
      heroImagePrompt: imageReference,
      customPrompt,
      sections,
      compiledPrompt
    };
    setGeneratedSite(sitePlan);
    return sitePlan;
  };

  const handleGeneratePlan = () => {
    buildSitePlan();
    setPreviewError(null);
  };

  const handlePreview = async () => {
    const sitePlan = buildSitePlan();
    setIsGeneratingPreview(true);
    setPreviewError(null);
    setPreviewWarnings([]);
    setModelUsed(null);
    setDeploymentUrl(null);
    setDeploymentInspectorUrl(null);
    setDeploymentError(null);

    try {
      const response = await fetch(`${API_BASE}/api/website/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: compiledPrompt,
          companyName: sitePlan.companyName,
          menu: sitePlan.menu,
          layoutParts,
          palette: sitePlan.colors
        })
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Generation failed (${response.status})`);
      }

      const data = await response.json();
      setPreviewHtml(data.html ?? null);
      setPreviewWarnings(Array.isArray(data.warnings) ? data.warnings : []);
      setModelUsed(typeof data.model === 'string' ? data.model : null);
    } catch (error) {
      console.error('[website] preview failed', error);
      setPreviewError(error instanceof Error ? error.message : 'Preview failed. Check the server logs.');
      setPreviewHtml(null);
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  const handleDeploy = async () => {
    if (!previewHtml) {
      setDeploymentError('Generate a preview first.');
      return;
    }

    setIsDeploying(true);
    setDeploymentError(null);

    try {
      const response = await fetch(`${API_BASE}/api/website/deploy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html: previewHtml,
          companyName,
          prompt: compiledPrompt
        })
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Deployment failed (${response.status})`);
      }

      const data = await response.json();
      setDeploymentUrl(typeof data.url === 'string' ? data.url : null);
      setDeploymentInspectorUrl(typeof data.inspectorUrl === 'string' ? data.inspectorUrl : null);
    } catch (error) {
      console.error('[website] deployment failed', error);
      setDeploymentError(error instanceof Error ? error.message : 'Deployment failed. Check the server logs.');
      setDeploymentUrl(null);
      setDeploymentInspectorUrl(null);
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">AI Website Builder</h1>
        <p className="text-sm text-slate-500">
          Describe what you want and we will assemble a ready-to-publish microsite for your customer.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <section className="card p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold">Prompt configuration</h2>
            <p className="text-sm text-slate-500">Fill in the details the AI should follow for this tenant’s website.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium">Company name</span>
              <input
                className="w-full rounded-xl border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                value={companyName}
                onChange={(event) => setCompanyName(event.target.value)}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium">Primary color</span>
              <input
                type="color"
                className="h-10 w-full rounded-xl border border-slate-300 px-3 py-2"
                value={primaryColor}
                onChange={(event) => setPrimaryColor(event.target.value)}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium">Accent color</span>
              <input
                type="color"
                className="h-10 w-full rounded-xl border border-slate-300 px-3 py-2"
                value={accentColor}
                onChange={(event) => setAccentColor(event.target.value)}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium">Menu items (one per line)</span>
              <textarea
                className="h-28 w-full rounded-xl border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                value={menuText}
                onChange={(event) => setMenuText(event.target.value)}
              />
            </label>
          </div>

          <label className="space-y-2">
            <span className="text-sm font-medium">Image or moodboard reference</span>
            <textarea
              className="h-20 w-full rounded-xl border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              value={imageReference}
              onChange={(event) => setImageReference(event.target.value)}
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">Creative direction / special requests</span>
            <textarea
              className="h-24 w-full rounded-xl border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              value={customPrompt}
              onChange={(event) => setCustomPrompt(event.target.value)}
            />
          </label>

          <div className="space-y-3">
            <span className="text-sm font-medium">Required sections</span>
            <div className="grid gap-3 md:grid-cols-2">
              {layoutOptions.map((option) => {
                const selected = layoutParts.includes(option.id);
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => toggleLayoutPart(option.id)}
                    className={`rounded-xl border px-3 py-3 text-left transition ${
                      selected ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-medium">{option.label}</div>
                    <div className="text-xs text-slate-500 mt-1">{option.blurb}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-500 disabled:opacity-60"
                onClick={handlePreview}
                disabled={isGeneratingPreview}
              >
                {isGeneratingPreview ? 'Generating preview…' : 'Preview AI website'}
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                onClick={handleGeneratePlan}
              >
                Generate plan only
              </button>
            </div>
            <div className="text-xs text-slate-500">
              The compiled AI prompt below updates as you tweak the inputs.
            </div>
          </div>
        </section>

        <aside className="card p-6 space-y-3">
          <h2 className="text-lg font-semibold">How it works</h2>
          <ol className="list-decimal space-y-2 pl-4 text-sm text-slate-600">
            <li>Fill in company, navigation, brand colours, imagery, and layout requirements.</li>
            <li>Copy the generated prompt or send it to the automation workflow.</li>
            <li>Review the draft site, then publish straight to the customer domain.</li>
          </ol>
          <div className="rounded-xl bg-slate-50 p-4 text-xs text-slate-500">
            Tip: Include example copy, tone, or references so the AI nails the brand voice on the first try.
          </div>
        </aside>
      </div>

      <section className="card p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Compiled AI prompt</h2>
            <p className="text-sm text-slate-500">Send this to your automation flow or preferred model to generate the site.</p>
          </div>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
            Autoupdates
          </span>
        </div>
        <pre className="whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          {compiledPrompt}
        </pre>
      </section>

      {generatedSite && (
        <section className="card p-6 space-y-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold">Proposed layout for {generatedSite.companyName}</h2>
            <p className="text-sm text-slate-500">
              We will pass this structure to the generator service and create the final website automatically.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
              <div className="text-xs uppercase tracking-wide text-slate-400">Navigation</div>
              <ul className="mt-2 space-y-1 font-medium">
                {generatedSite.menu.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <div className="mt-4 text-xs uppercase tracking-wide text-slate-400">Palette</div>
              <div className="mt-2 flex gap-3">
                {generatedSite.colors.map((color) => (
                  <div key={color} className="flex flex-col items-center gap-2 text-xs">
                    <span
                      className="h-10 w-10 rounded-full border border-white shadow"
                      style={{ backgroundColor: color }}
                    />
                    {color}
                  </div>
                ))}
              </div>
              <div className="mt-4 text-xs uppercase tracking-wide text-slate-400">Hero reference</div>
              <p className="mt-1 text-xs text-slate-500">{generatedSite.heroImagePrompt}</p>
            </div>

            <div className="space-y-4">
              {generatedSite.sections.map((section) => (
                <div key={section.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="text-sm font-semibold text-blue-700">{section.title}</div>
                  <p className="mt-1 text-sm text-slate-600">{section.summary}</p>
                  {section.callouts && section.callouts.length > 0 && (
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-500">
                      {section.callouts.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
            Ready to publish? Feed this plan into your automation job to build and deploy the storefront automatically.
          </div>
        </section>
      )}

      {(previewHtml || previewError || isGeneratingPreview) && (
        <section className="card p-6 space-y-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold">AI Website Preview</h2>
            <p className="text-sm text-slate-500">
              Review the generated site below. When you are happy, deploy it to Vercel straight from here.
            </p>
          </div>

          {previewWarnings.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-700">
              {previewWarnings.map((warning) => (
                <div key={warning}>{warning}</div>
              ))}
            </div>
          )}

          {previewError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {previewError}
            </div>
          )}

          {isGeneratingPreview && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
              Generating preview with the AI model…
            </div>
          )}

          {previewHtml && !isGeneratingPreview && (
            <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
              <iframe title="Website preview" className="h-[720px] w-full bg-white" srcDoc={previewHtml} />
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={!previewHtml || isDeploying}
              onClick={handleDeploy}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-500 disabled:opacity-60"
            >
              {isDeploying ? 'Deploying…' : 'Deploy to Vercel'}
            </button>
            {modelUsed && (
              <span className="text-xs text-slate-500">Model: {modelUsed}</span>
            )}
          </div>

          {deploymentError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {deploymentError}
            </div>
          )}

          {deploymentUrl && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 space-y-2">
              <div>Deployed! Preview it at <a className="underline" target="_blank" rel="noreferrer" href={deploymentUrl}>{deploymentUrl}</a>.</div>
              {deploymentInspectorUrl && (
                <div>
                  Inspect build details on Vercel: <a className="underline" target="_blank" rel="noreferrer" href={deploymentInspectorUrl}>{deploymentInspectorUrl}</a>
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
