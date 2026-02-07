import React, { useState } from 'react';
import LandingPage from './LandingPage.jsx';
import AutoFolio from './AutoFolio.jsx';
import Dashboard from './Dashboard.jsx';
import Docs from './Docs.jsx';

const App = () => {
  const [currentView, setCurrentView] = useState('landing');
  const [selectedStrategy, setSelectedStrategy] = useState(null);

  if (currentView === 'docs') {
    return <Docs onBack={() => setCurrentView('landing')} />;
  }

  if (currentView === 'dashboard') {
    return <Dashboard onBack={() => setCurrentView('landing')} />;
  }

  if (currentView === 'builder') {
    return (
      <AutoFolio 
        presetStrategy={selectedStrategy}
        onBack={() => setCurrentView('landing')}
        onDashboard={() => setCurrentView('dashboard')}
      />
    );
  }

  return (
    <LandingPage 
      onSelectStrategy={(strategy) => {
        setSelectedStrategy(strategy);
        setCurrentView('builder');
      }}
      onViewDashboard={() => setCurrentView('dashboard')}
      onDocs={() => setCurrentView('docs')}
    />
  );
};

export default App;
