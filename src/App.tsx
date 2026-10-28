import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Navbar } from './components/ui/Navbar.tsx';
import { HeroSection } from './components/ui/HeroSection.tsx';
import { UploadWorkspace } from './components/upload/UploadWorkspace.tsx';
import { DownloadPage } from './components/download/DownloadPage.tsx';
import { SecurityDashboard } from './components/dashboard/SecurityDashboard.tsx';
import { FeaturesSection } from './components/ui/FeaturesSection.tsx';
import { ShowcaseSection } from './components/ui/ShowcaseSection.tsx';
import { Footer } from './components/ui/Footer.tsx';
import { CyberBackground } from './components/3d/CyberBackground.tsx';
import type { ActiveTab } from './types/index.ts';
import './App.css';

export function App() {
  const getInitialTab = (): ActiveTab => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      if (hash === 'dashboard') return 'dashboard';
      if (hash === 'download') return 'download';
      if (hash === 'features') return 'features';
      if (hash === 'upload') return 'upload';
    }
    return 'upload';
  };

  const [activeTab, setActiveTab] = useState<ActiveTab>(getInitialTab);
  const [targetShareCode, setTargetShareCode] = useState<string>('SEC-8942-ALPHA');

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      if (hash === 'dashboard' || hash === 'download' || hash === 'features' || hash === 'upload') {
        setActiveTab(hash as ActiveTab);
      }
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const handleOpenDownload = (code: string) => {
    setTargetShareCode(code);
    setActiveTab('download');
    window.location.hash = 'download';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    window.location.hash = tab;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="relative min-h-screen bg-navy-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-300">
      {/* Dynamic 3D / Shader Cyber Background */}
      <CyberBackground />

      {/* Top Fixed / Sticky Navigation */}
      <Navbar activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Main Content Area with Motion Transitions */}
      <div className="relative z-10 flex-1">
        <AnimatePresence mode="wait">
          {activeTab === 'upload' && (
            <motion.div
              key="tab-upload"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
            >
              <HeroSection onNavigate={handleTabChange} />
              <div id="upload-anchor">
                <UploadWorkspace onOpenDownload={handleOpenDownload} />
              </div>
              <ShowcaseSection />
              <FeaturesSection />
            </motion.div>
          )}

          {activeTab === 'dashboard' && (
            <motion.div
              key="tab-dashboard"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
            >
              <SecurityDashboard
                activeTab={activeTab}
                onTabChange={handleTabChange}
                onOpenDownload={handleOpenDownload}
              />
            </motion.div>
          )}

          {activeTab === 'download' && (
            <motion.div
              key="tab-download"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              className="pt-6"
            >
              <DownloadPage
                initialCode={targetShareCode}
                onNavigateToUpload={() => handleTabChange('upload')}
              />
            </motion.div>
          )}

          {activeTab === 'features' && (
            <motion.div
              key="tab-features"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              className="pt-8"
            >
              <ShowcaseSection />
              <FeaturesSection />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Global Security Footer */}
      <Footer onNavigate={handleTabChange} />
    </div>
  );
}

export default App;
