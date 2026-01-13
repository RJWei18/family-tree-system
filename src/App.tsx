import { useState } from 'react';
import { MainLayout } from './components/layout/MainLayout';
import { MemberEditor } from './pages/MemberEditor';
import { FamilyTree } from './pages/FamilyTree';
import { BirthdayCalendar } from './pages/BirthdayCalendar';

import { Calculator } from 'lucide-react';
import { KinshipCalculator } from './components/tools/KinshipCalculator';

function App() {
  const [currentView, setCurrentView] = useState<'members' | 'tree' | 'calendar'>('members');
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);

  return (
    <MainLayout currentView={currentView} onViewChange={setCurrentView}>
      {currentView === 'members' ? (
        <MemberEditor />
      ) : currentView === 'tree' ? (
        <FamilyTree />
      ) : (
        <BirthdayCalendar />
      )}

      {/* Floating Tool Button */}
      <div className="absolute bottom-6 right-6 z-20">
        <button
          onClick={() => setIsCalculatorOpen(true)}
          className="p-4 bg-violet-600 hover:bg-violet-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center"
          title="開啟稱謂計算機"
        >
          <Calculator size={24} />
        </button>
      </div>

      <KinshipCalculator isOpen={isCalculatorOpen} onClose={() => setIsCalculatorOpen(false)} />
    </MainLayout>
  );
}

export default App;
