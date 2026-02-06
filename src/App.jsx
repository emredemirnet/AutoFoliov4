import React, { useState } from 'react';
import LandingPage from './LandingPage.jsx';
import AutoFolio from './AutoFolio.jsx';
import Dashboard from './Dashboard.jsx';

const App = () => {
  const [currentView, setCurrentView] = useState('landing');
  const [selectedStrategy, setSelectedStrategy] = useState(null);

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
    />
  );
};

export default App;
