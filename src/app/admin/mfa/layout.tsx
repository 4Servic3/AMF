export default function MFALayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f5f5f7] flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <p className="text-center font-serif text-3xl text-[#0a7a74]">AMF</p>
        <h2 className="mt-2 text-center text-[28px] font-bold tracking-tight text-[#1d1d1f]">
          Verificação em duas etapas
        </h2>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-[20px] bg-white px-5 py-8 shadow-[0_1px_2px_rgba(0,0,0,.04),0_8px_28px_rgba(0,0,0,.06)] sm:px-10">
          {children}
        </div>
      </div>
    </div>
  );
}
