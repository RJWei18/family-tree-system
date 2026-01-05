import { useState } from 'react';
import { MainLayout } from './components/layout/MainLayout';
import { MemberEditor } from './pages/MemberEditor';
import { FamilyTree } from './pages/FamilyTree';

function App() {
  const [currentView, setCurrentView] = useState<'members' | 'tree'>('members');

  return (
    <MainLayout currentView={currentView} onViewChange={setCurrentView}>
      {currentView === 'members' ? (
        <MemberEditor />
      ) : (
        <FamilyTree />
      )}
    </MainLayout>
  );
}

export default App;
