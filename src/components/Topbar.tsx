import logo from '@/assets/logo.png';

export const Topbar = () => {
  return (
    <header className="w-full bg-gradient-primary shadow-md">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm">
            <img src={logo} alt="Before/After Logo" className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Before/After
          </h1>
        </div>
      </div>
    </header>
  );
};
