export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="card max-w-md text-center">
        <div className="text-5xl">404</div>
        <h1 className="mt-4 text-2xl font-black text-slate-900">Page not found</h1>
        <p className="mt-2 text-slate-600">The route you requested does not exist.</p>
      </div>
    </div>
  );
}
