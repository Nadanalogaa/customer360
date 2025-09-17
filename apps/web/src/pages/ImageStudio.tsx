import { useState } from 'react';

export default function ImageStudio(){
  const [title, setTitle] = useState('Grand Sale');
  const [caption, setCaption] = useState('Up to 50% off this weekend!');
  const [preview, setPreview] = useState<string | null>(null);

  async function generate(){
    const r = await fetch('http://localhost:4000/api/generate-image', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId: 'demo', templateId: 'sale', title, caption })
    });
    const data = await r.json();
    setPreview(data.outUrl);
  }

  return (
    <div className="grid lg:grid-cols-[1fr_420px] gap-6">
      <div className="card p-6 min-h-[420px] flex items-center justify-center">
        {preview ? <img src={preview} className="rounded-2xl max-h-[420px]"/> : <div className="text-slate-500">Preview will appear here</div>}
      </div>
      <div className="card p-6 space-y-3">
        <h2 className="text-lg font-semibold">Content</h2>
        <label className="block text-sm">Title</label>
        <input className="w-full border rounded-xl px-3 py-2" value={title} onChange={e=>setTitle(e.target.value)} />
        <label className="block text-sm mt-2">Caption</label>
        <textarea className="w-full border rounded-xl px-3 py-2" value={caption} onChange={e=>setCaption(e.target.value)} />
        <div className="pt-2"><button className="btn" onClick={generate}>Generate</button></div>
      </div>
    </div>
  );
}
