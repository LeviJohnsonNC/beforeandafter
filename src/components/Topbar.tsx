import logo from '@/assets/logo.png';

export const Topbar = () => {
  return (
    <header className="w-full bg-gradient-primary shadow-md">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Before/After Logo" className="w-24 h-24" />
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Before / After
            </h1>
            <p className="text-sm text-white/80 mt-0.5">
              Turn every job into a story worth showing.
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
