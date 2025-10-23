import logo from '@/assets/logo.png';

export const Topbar = () => {
  return (
    <header className="w-full bg-gradient-primary shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-6 md:py-8">
        <div className="flex items-center gap-6">
          <img src={logo} alt="Before/After Logo" className="w-28 h-28 md:w-36 md:h-36 drop-shadow-lg" />
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
              Before / After
            </h1>
            <p className="text-base md:text-lg text-white/90 mt-2">
              Turn every job into a story worth showing.
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
