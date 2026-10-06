import { useState, useCallback } from 'react';
import { MainLayout } from './components/layout/MainLayout';
import { MemberEditor } from './pages/MemberEditor';
import { FamilyTree } from './pages/FamilyTree';
import { BirthdayCalendar } from './pages/BirthdayCalendar';
import { KinshipCalculator } from './components/tools/KinshipCalculator';
import { PinAuthGate } from './components/auth/PinAuthGate';
import { fetchAndProcessCloudData } from './utils/csvHelpers';
import { useFamilyStore } from './store/useFamilyStore';

function App() {
  const [currentView, setCurrentView] = useState<'members' | 'tree' | 'calendar'>('tree');
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeSheetUrl, setActiveSheetUrl] = useState<string | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  const setBatchFamilyData = useFamilyStore((state) => state.setBatchFamilyData);

  const handleSyncData = useCallback(async (url: string, isInitial = false) => {
    if (!url) return;
    if (isInitial) {
      setIsLoadingData(true);
    } else {
      setIsSyncing(true);
    }

    try {
      const { membersMap, relationships } = await fetchAndProcessCloudData(url);
      setBatchFamilyData(membersMap, relationships);
      setLastSyncTime(new Date());
    } catch (err) {
      console.error('Failed to sync cloud data:', err);
      if (!isInitial) {
        alert('雲端資料同步失敗，請確認網路連線或試算表權限。');
      }
    } finally {
      if (isInitial) {
        setIsLoadingData(false);
      } else {
        setIsSyncing(false);
      }
    }
  }, [setBatchFamilyData]);

  const handleAuthSuccess = async (resolvedUrl: string) => {
    setActiveSheetUrl(resolvedUrl);
    await handleSyncData(resolvedUrl, true);
    setIsAuthenticated(true);
  };

  const handleManualSync = () => {
    if (activeSheetUrl) {
      handleSyncData(activeSheetUrl, false);
    } else {
      const savedUrl = localStorage.getItem('family_tree_cloud_url');
      if (savedUrl) {
        handleSyncData(savedUrl, false);
      }
    }
  };

  const handleLock = () => {
    localStorage.removeItem('family_tree_saved_pin');
    setIsAuthenticated(false);
    setActiveSheetUrl(null);
  };

  if (!isAuthenticated) {
    return <PinAuthGate onSuccess={handleAuthSuccess} isLoadingData={isLoadingData} />;
  }

  return (
    <MainLayout
      currentView={currentView}
      onViewChange={setCurrentView}
      onToggleCalculator={() => setIsCalculatorOpen(true)}
      onManualSync={handleManualSync}
      onLock={handleLock}
      isSyncing={isSyncing}
      lastSyncTime={lastSyncTime}
    >
      {currentView === 'members' ? (
        <MemberEditor />
      ) : currentView === 'tree' ? (
        <FamilyTree />
      ) : (
        <BirthdayCalendar />
      )}

      <KinshipCalculator isOpen={isCalculatorOpen} onClose={() => setIsCalculatorOpen(false)} />
    </MainLayout>
  );
}

export default App;
