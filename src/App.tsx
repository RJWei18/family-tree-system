import { useState } from 'react';
import { MainLayout } from './components/layout/MainLayout';
import { MemberEditor } from './pages/MemberEditor';
import { FamilyTree } from './pages/FamilyTree';
import { BirthdayCalendar } from './pages/BirthdayCalendar';

function App() {
  const [currentView, setCurrentView] = useState<'members' | 'tree' | 'calendar'>('members');

  return (
    <MainLayout currentView={currentView} onViewChange={setCurrentView}>
      {currentView === 'members' ? (
        <MemberEditor />
      ) : currentView === 'tree' ? (
        <FamilyTree />
      ) : (
        <BirthdayCalendar />
      )}
    </MainLayout>
  );
}

export default App;
