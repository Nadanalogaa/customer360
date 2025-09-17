export default function Dashboard(){
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-4">
        <div className="card p-5"><div className="text-sm text-slate-500">Images left</div><div className="text-3xl font-semibold">5</div></div>
        <div className="card p-5"><div className="text-sm text-slate-500">Scheduled posts</div><div className="text-3xl font-semibold">2</div></div>
        <div className="card p-5"><div className="text-sm text-slate-500">Website status</div><div className="text-3xl font-semibold">Published</div></div>
      </div>
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Quick actions</h2>
        </div>
        <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="btn">Generate Image</button>
          <button className="btn">Create Post</button>
          <button className="btn">Edit Website</button>
          <button className="btn">Connect Social</button>
        </div>
      </div>
    </div>
  );
}
