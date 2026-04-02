interface GuideViewProps {
  appName: string;
}

export function GuideView({ appName }: GuideViewProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-9">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Guida rapida</h2>
          <p className="text-sm text-slate-500">{appName} e locale, personale e non richiede alcuna login.</p>
        </div>
        <a href="/GUIDA.html" target="_blank" rel="noreferrer" className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
          Apri guida completa
        </a>
      </div>
      <iframe src="/GUIDA.html" title={`Guida ${appName}`} className="h-[720px] w-full rounded-2xl border border-slate-200" />
    </section>
  );
}
