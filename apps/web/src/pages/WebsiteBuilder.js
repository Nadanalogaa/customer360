import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
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
const sectionCopy = {
    hero: {
        id: 'hero',
        title: 'Hero Header',
        summary: 'Large intro block with the brand headline, subheading, hero imagery, and a prominent call-to-action button.'
    },
    sidebar: {
        id: 'sidebar',
        title: 'Sidebar Navigation',
        summary: 'Fixed left column with navigation, contact details, quick links, and optional promo banner.'
    },
    features: {
        id: 'features',
        title: 'Featured Services',
        summary: 'Grid of three feature cards summarising signature products, each with icon, title, and short copy.'
    },
    testimonials: {
        id: 'testimonials',
        title: 'Testimonials',
        summary: 'Carousel or stacked quotes spotlighting happy customers, 5-star ratings, and profile pictures.'
    },
    'cta-footer': {
        id: 'cta-footer',
        title: 'Call-to-Action Footer',
        summary: 'Footer block with newsletter signup, contact info, and second CTA linking to WhatsApp or bookings.'
    }
};
export default function WebsiteBuilder() {
    const [companyName, setCompanyName] = useState('Sunrise Grocers');
    const [layoutParts, setLayoutParts] = useState(['hero', 'sidebar', 'features', 'cta-footer']);
    const [menuText, setMenuText] = useState('Home\nDeals\nCatalog\nTestimonials\nContact');
    const [primaryColor, setPrimaryColor] = useState('#2563eb');
    const [accentColor, setAccentColor] = useState('#f97316');
    const [imageReference, setImageReference] = useState('Bright produce display with shoppers, natural lighting, smiling staff.');
    const [customPrompt, setCustomPrompt] = useState('Design a modern responsive marketing site for a community grocery store focusing on fresh produce and daily offers. Include clear CTAs to order on WhatsApp.');
    const [generatedSite, setGeneratedSite] = useState(null);
    const [previewHtml, setPreviewHtml] = useState(null);
    const [previewWarnings, setPreviewWarnings] = useState([]);
    const [previewError, setPreviewError] = useState(null);
    const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
    const [modelUsed, setModelUsed] = useState(null);
    const [isDeploying, setIsDeploying] = useState(false);
    const [deploymentUrl, setDeploymentUrl] = useState(null);
    const [deploymentInspectorUrl, setDeploymentInspectorUrl] = useState(null);
    const [deploymentError, setDeploymentError] = useState(null);
    const menuItems = useMemo(() => menuText
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean), [menuText]);
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
    const toggleLayoutPart = (id) => {
        setLayoutParts((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
    };
    const buildSitePlan = () => {
        const sections = layoutParts.map((id) => sectionCopy[id]).filter(Boolean);
        const sitePlan = {
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
        }
        catch (error) {
            console.error('[website] preview failed', error);
            setPreviewError(error instanceof Error ? error.message : 'Preview failed. Check the server logs.');
            setPreviewHtml(null);
        }
        finally {
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
        }
        catch (error) {
            console.error('[website] deployment failed', error);
            setDeploymentError(error instanceof Error ? error.message : 'Deployment failed. Check the server logs.');
            setDeploymentUrl(null);
            setDeploymentInspectorUrl(null);
        }
        finally {
            setIsDeploying(false);
        }
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("h1", { className: "text-2xl font-semibold", children: "AI Website Builder" }), _jsx("p", { className: "text-sm text-slate-500", children: "Describe what you want and we will assemble a ready-to-publish microsite for your customer." })] }), _jsxs("div", { className: "grid gap-6 lg:grid-cols-[2fr_1fr]", children: [_jsxs("section", { className: "card p-6 space-y-6", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-lg font-semibold", children: "Prompt configuration" }), _jsx("p", { className: "text-sm text-slate-500", children: "Fill in the details the AI should follow for this tenant\u2019s website." })] }), _jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [_jsxs("label", { className: "space-y-2", children: [_jsx("span", { className: "text-sm font-medium", children: "Company name" }), _jsx("input", { className: "w-full rounded-xl border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none", value: companyName, onChange: (event) => setCompanyName(event.target.value) })] }), _jsxs("label", { className: "space-y-2", children: [_jsx("span", { className: "text-sm font-medium", children: "Primary color" }), _jsx("input", { type: "color", className: "h-10 w-full rounded-xl border border-slate-300 px-3 py-2", value: primaryColor, onChange: (event) => setPrimaryColor(event.target.value) })] }), _jsxs("label", { className: "space-y-2", children: [_jsx("span", { className: "text-sm font-medium", children: "Accent color" }), _jsx("input", { type: "color", className: "h-10 w-full rounded-xl border border-slate-300 px-3 py-2", value: accentColor, onChange: (event) => setAccentColor(event.target.value) })] }), _jsxs("label", { className: "space-y-2", children: [_jsx("span", { className: "text-sm font-medium", children: "Menu items (one per line)" }), _jsx("textarea", { className: "h-28 w-full rounded-xl border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none", value: menuText, onChange: (event) => setMenuText(event.target.value) })] })] }), _jsxs("label", { className: "space-y-2", children: [_jsx("span", { className: "text-sm font-medium", children: "Image or moodboard reference" }), _jsx("textarea", { className: "h-20 w-full rounded-xl border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none", value: imageReference, onChange: (event) => setImageReference(event.target.value) })] }), _jsxs("label", { className: "space-y-2", children: [_jsx("span", { className: "text-sm font-medium", children: "Creative direction / special requests" }), _jsx("textarea", { className: "h-24 w-full rounded-xl border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none", value: customPrompt, onChange: (event) => setCustomPrompt(event.target.value) })] }), _jsxs("div", { className: "space-y-3", children: [_jsx("span", { className: "text-sm font-medium", children: "Required sections" }), _jsx("div", { className: "grid gap-3 md:grid-cols-2", children: layoutOptions.map((option) => {
                                            const selected = layoutParts.includes(option.id);
                                            return (_jsxs("button", { type: "button", onClick: () => toggleLayoutPart(option.id), className: `rounded-xl border px-3 py-3 text-left transition ${selected ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 hover:border-slate-300'}`, children: [_jsx("div", { className: "font-medium", children: option.label }), _jsx("div", { className: "text-xs text-slate-500 mt-1", children: option.blurb })] }, option.id));
                                        }) })] }), _jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [_jsxs("div", { className: "flex flex-wrap gap-2", children: [_jsx("button", { type: "button", className: "inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-500 disabled:opacity-60", onClick: handlePreview, disabled: isGeneratingPreview, children: isGeneratingPreview ? 'Generating preview…' : 'Preview AI website' }), _jsx("button", { type: "button", className: "inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100", onClick: handleGeneratePlan, children: "Generate plan only" })] }), _jsx("div", { className: "text-xs text-slate-500", children: "The compiled AI prompt below updates as you tweak the inputs." })] })] }), _jsxs("aside", { className: "card p-6 space-y-3", children: [_jsx("h2", { className: "text-lg font-semibold", children: "How it works" }), _jsxs("ol", { className: "list-decimal space-y-2 pl-4 text-sm text-slate-600", children: [_jsx("li", { children: "Fill in company, navigation, brand colours, imagery, and layout requirements." }), _jsx("li", { children: "Copy the generated prompt or send it to the automation workflow." }), _jsx("li", { children: "Review the draft site, then publish straight to the customer domain." })] }), _jsx("div", { className: "rounded-xl bg-slate-50 p-4 text-xs text-slate-500", children: "Tip: Include example copy, tone, or references so the AI nails the brand voice on the first try." })] })] }), _jsxs("section", { className: "card p-6 space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-lg font-semibold", children: "Compiled AI prompt" }), _jsx("p", { className: "text-sm text-slate-500", children: "Send this to your automation flow or preferred model to generate the site." })] }), _jsx("span", { className: "rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600", children: "Autoupdates" })] }), _jsx("pre", { className: "whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700", children: compiledPrompt })] }), generatedSite && (_jsxs("section", { className: "card p-6 space-y-6", children: [_jsxs("div", { className: "flex flex-col gap-1", children: [_jsxs("h2", { className: "text-lg font-semibold", children: ["Proposed layout for ", generatedSite.companyName] }), _jsx("p", { className: "text-sm text-slate-500", children: "We will pass this structure to the generator service and create the final website automatically." })] }), _jsxs("div", { className: "grid gap-6 lg:grid-cols-[280px_1fr]", children: [_jsxs("div", { className: "rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700", children: [_jsx("div", { className: "text-xs uppercase tracking-wide text-slate-400", children: "Navigation" }), _jsx("ul", { className: "mt-2 space-y-1 font-medium", children: generatedSite.menu.map((item) => (_jsx("li", { children: item }, item))) }), _jsx("div", { className: "mt-4 text-xs uppercase tracking-wide text-slate-400", children: "Palette" }), _jsx("div", { className: "mt-2 flex gap-3", children: generatedSite.colors.map((color) => (_jsxs("div", { className: "flex flex-col items-center gap-2 text-xs", children: [_jsx("span", { className: "h-10 w-10 rounded-full border border-white shadow", style: { backgroundColor: color } }), color] }, color))) }), _jsx("div", { className: "mt-4 text-xs uppercase tracking-wide text-slate-400", children: "Hero reference" }), _jsx("p", { className: "mt-1 text-xs text-slate-500", children: generatedSite.heroImagePrompt })] }), _jsx("div", { className: "space-y-4", children: generatedSite.sections.map((section) => (_jsxs("div", { className: "rounded-2xl border border-slate-200 p-4", children: [_jsx("div", { className: "text-sm font-semibold text-blue-700", children: section.title }), _jsx("p", { className: "mt-1 text-sm text-slate-600", children: section.summary }), section.callouts && section.callouts.length > 0 && (_jsx("ul", { className: "mt-2 list-disc space-y-1 pl-5 text-xs text-slate-500", children: section.callouts.map((item) => (_jsx("li", { children: item }, item))) }))] }, section.id))) })] }), _jsx("div", { className: "rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700", children: "Ready to publish? Feed this plan into your automation job to build and deploy the storefront automatically." })] })), (previewHtml || previewError || isGeneratingPreview) && (_jsxs("section", { className: "card p-6 space-y-4", children: [_jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("h2", { className: "text-lg font-semibold", children: "AI Website Preview" }), _jsx("p", { className: "text-sm text-slate-500", children: "Review the generated site below. When you are happy, deploy it to Vercel straight from here." })] }), previewWarnings.length > 0 && (_jsx("div", { className: "rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-700", children: previewWarnings.map((warning) => (_jsx("div", { children: warning }, warning))) })), previewError && (_jsx("div", { className: "rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700", children: previewError })), isGeneratingPreview && (_jsx("div", { className: "rounded-xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500", children: "Generating preview with the AI model\u2026" })), previewHtml && !isGeneratingPreview && (_jsx("div", { className: "overflow-hidden rounded-2xl border border-slate-200 shadow-sm", children: _jsx("iframe", { title: "Website preview", className: "h-[720px] w-full bg-white", srcDoc: previewHtml }) })), _jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [_jsx("button", { type: "button", disabled: !previewHtml || isDeploying, onClick: handleDeploy, className: "inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-500 disabled:opacity-60", children: isDeploying ? 'Deploying…' : 'Deploy to Vercel' }), modelUsed && (_jsxs("span", { className: "text-xs text-slate-500", children: ["Model: ", modelUsed] }))] }), deploymentError && (_jsx("div", { className: "rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700", children: deploymentError })), deploymentUrl && (_jsxs("div", { className: "rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 space-y-2", children: [_jsxs("div", { children: ["Deployed! Preview it at ", _jsx("a", { className: "underline", target: "_blank", rel: "noreferrer", href: deploymentUrl, children: deploymentUrl }), "."] }), deploymentInspectorUrl && (_jsxs("div", { children: ["Inspect build details on Vercel: ", _jsx("a", { className: "underline", target: "_blank", rel: "noreferrer", href: deploymentInspectorUrl, children: deploymentInspectorUrl })] }))] }))] }))] }));
}
