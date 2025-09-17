import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
export default function ImageStudio() {
    const [title, setTitle] = useState('Grand Sale');
    const [caption, setCaption] = useState('Up to 50% off this weekend!');
    const [preview, setPreview] = useState(null);
    async function generate() {
        const r = await fetch('http://localhost:4000/api/generate-image', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tenantId: 'demo', templateId: 'sale', title, caption })
        });
        const data = await r.json();
        setPreview(data.outUrl);
    }
    return (_jsxs("div", { className: "grid lg:grid-cols-[1fr_420px] gap-6", children: [_jsx("div", { className: "card p-6 min-h-[420px] flex items-center justify-center", children: preview ? _jsx("img", { src: preview, className: "rounded-2xl max-h-[420px]" }) : _jsx("div", { className: "text-slate-500", children: "Preview will appear here" }) }), _jsxs("div", { className: "card p-6 space-y-3", children: [_jsx("h2", { className: "text-lg font-semibold", children: "Content" }), _jsx("label", { className: "block text-sm", children: "Title" }), _jsx("input", { className: "w-full border rounded-xl px-3 py-2", value: title, onChange: e => setTitle(e.target.value) }), _jsx("label", { className: "block text-sm mt-2", children: "Caption" }), _jsx("textarea", { className: "w-full border rounded-xl px-3 py-2", value: caption, onChange: e => setCaption(e.target.value) }), _jsx("div", { className: "pt-2", children: _jsx("button", { className: "btn", onClick: generate, children: "Generate" }) })] })] }));
}
