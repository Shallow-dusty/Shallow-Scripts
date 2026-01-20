import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { 
  TrendingDown, 
  Cpu, 
  Sparkles
} from 'lucide-react';
import useStore from './store';
import './App.css';
import './components.css';

import WoolCalculator from './components/WoolCalculator';
import RecordList from './components/RecordList';
import AIAssistant from './components/AIAssistant';
import UnitDashboard from './components/UnitDashboard';

function App() {
  const { theme, records, currentUnit } = useStore();
  const [showUnits, setShowUnits] = useState(false);

  const cheapest = records.length > 0 ? records[0] : null;

  return (
    <div className={`app-container theme-${theme}`}>
      <header className="main-header">
        <div className="logo">
          <Sparkles className="icon-primary" />
          <h1 className="title-gradient">WoolMaster</h1>
          <span className="version">v1.1</span>
        </div>
        
        <div className="header-status">
            {cheapest && (
            <motion.div 
              className="best-match-pill glass-panel glow-success"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <TrendingDown size={14} />
              <span>当前最优: <strong>{cheapest.name}</strong></span>
              <span className="pill-price">{cheapest.currency}{Number(cheapest.unitPrice.toFixed(4))} / {cheapest.unit}</span>
            </motion.div>
          )}
        </div>

        <div className="header-actions">
           <button className="theme-toggle glass-panel" onClick={() => setShowUnits(!showUnits)}>
             <Cpu size={18} />
             <span>单位: {currentUnit}</span>
           </button>
        </div>
      </header>

      <main className="main-workspace">
        <section className="workspace-left">
           <WoolCalculator onCalculate={() => {}} />
        </section>
        
        <section className="workspace-right">
           <div className="list-header">
             <h2>方案比对</h2>
           </div>
           <RecordList />
        </section>
      </main>

      <AIAssistant />
      
      <AnimatePresence>
        {showUnits && (
          <UnitDashboard onClose={() => setShowUnits(false)} />
        )}
      </AnimatePresence>

      <div className="bg-decorations">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>
    </div>
  );
}

export default App;
