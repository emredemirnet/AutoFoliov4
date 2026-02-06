import React, { useState } from 'react';
import LandingPage from './LandingPage';
import AutoFolio from './AutoFolio';

function App() {
  const [currentView, setCurrentView] = useState('landing'); // 'landing' or 'builder'
  const [selectedStrategy, setSelectedStrategy] = useState(null);

  const handleSelectStrategy = (strategy) => {
    setSelectedStrategy(strategy);
    setCurrentView('builder');
  };

  const handleCustomize = () => {
    setSelectedStrategy(null); // No preset, start from scratch
    setCurrentView('builder');
  };

  const handleBackToLanding = () => {
    setCurrentView('landing');
    setSelectedStrategy(null);
  };

  return (
    <div className="min-h-screen">
      {currentView === 'landing' ? (
        <LandingPage 
          onSelectStrategy={handleSelectStrategy}
          onCustomize={handleCustomize}
        />
      ) : (
        <div>
          {/* Back button */}
          <div className="fixed top-4 left-4 z-50">
            <button
              onClick={handleBackToLanding}
              className="px-4 py-2 bg-gray-800/80 backdrop-blur-lg border border-cyan-400/30 text-cyan-400 rounded-lg hover:bg-cyan-400/10 transition-all flex items-center gap-2"
            >
              ← Back to Strategies
            </button>
          </div>

          <AutoFolio 
            presetStrategy={selectedStrategy}
          />
        </div>
      )}
    </div>
  );
}

export default App;
