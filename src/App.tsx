import { useState } from 'react';
import { MainLayout } from './components/layout/MainLayout';
import { MemberEditor } from './pages/MemberEditor';
import { FamilyTree } from './pages/FamilyTree';
import { BirthdayCalendar } from './pages/BirthdayCalendar';

import { KinshipCalculator } from './components/tools/KinshipCalculator';

function App() {
  const [currentView, setCurrentView] = useState<'members' | 'tree' | 'calendar'>('members');
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);

  return (
    <MainLayout
      currentView={currentView}
      onViewChange={setCurrentView}
      onToggleCalculator={() => setIsCalculatorOpen(true)}
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
