import { Topbar } from '@/components/Topbar';
import { UploadZone } from '@/components/UploadZone';
import { PairList } from '@/components/PairList';
import { BrandingPanel } from '@/components/BrandingPanel';
import { PreviewCanvas } from '@/components/PreviewCanvas';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Topbar />
      
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Upload & Pairs */}
          <div className="lg:col-span-2 space-y-6">
            <UploadZone />
            <PairList />
          </div>

          {/* Right column - Branding */}
          <div className="space-y-6">
            <BrandingPanel />
          </div>
        </div>

        {/* Full width preview */}
        <div className="mt-6">
          <PreviewCanvas />
        </div>
      </main>
    </div>
  );
};

export default Index;
