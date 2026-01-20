import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { Plus, Settings2, ChevronDown, Check } from 'lucide-react';
import useStore from '../store';
import confetti from 'canvas-confetti';
import UnitDashboard from './UnitDashboard';

const NORMALIZATION_OPTIONS = [
  { label: '按 1 单位', value: 1 },
  { label: '按 1 万 (10k)', value: 10000 },
  { label: '按 1 百万 (1M)', value: 1000000 },
  { label: '按 1 亿', value: 100000000 },
];

const CURRENCIES = ['¥', '$', '€', '£'];

const WoolCalculator = ({ onCalculate }) => {
  const { currentUnit, normalization, currency, setCurrency, setNormalization, addRecord } = useStore();
  const [showUnitSelector, setShowUnitSelector] = useState(false);
  const priceInputRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    quantity: '',
  });

  const calculateUnitPrice = () => {
    const p = parseFloat(formData.price);
    const q = parseFloat(formData.quantity);
    if (!p || !q) return 0;
    
    // Price per 1 Base Unit * Normalization Factor
    return (p / q) * normalization;
  };


  const handleSubmit = (e) => {
    e.preventDefault();
    const unitPrice = calculateUnitPrice();
    if (!unitPrice) return;

    const newRecord = {
      id: Date.now(),
      name: formData.name || `商品 ${new Date().toLocaleTimeString()}`,
      price: parseFloat(formData.price),
      quantity: parseFloat(formData.quantity),
      unit: currentUnit,
      currency,
      normalization,
      unitPrice,
      timestamp: new Date().toISOString(),
    };

    addRecord(newRecord);
    
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#818cf8', '#c084fc', '#22d3ee']
    });

    setFormData(prev => ({ ...prev, price: '', quantity: '' })); // Keep name, clear inputs
    onCalculate();
    
    // Auto focus back to price for rapid entry
    if (priceInputRef.current) {
        priceInputRef.current.focus();
    }
  };

  return (
    <motion.div 
      className="calculator-container glass-panel"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <form onSubmit={handleSubmit} className="calc-form">
        <div className="input-group full-width">
          <label>商品/服务名称</label>
          <input 
            type="text" 
            placeholder="例如: GPT-4 API / 二手 iPad" 
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
          />
        </div>
        
        <div className="input-row">
          <div className="input-group">
            <label>总价格</label>
            <div className="input-with-action">
               <select 
                 className="currency-select"
                 value={currency}
                 onChange={(e) => setCurrency(e.target.value)}
               >
                 {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
               </select>
               <input 
                ref={priceInputRef}
                type="number" 
                step="0.0000001" 
                placeholder="0.00" 
                required
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
              />
            </div>
          </div>

          <div className="input-group">
            <label>
              {(['美元额度', '人民币额度', '点数', '积分'].some(u => currentUnit.includes(u))) 
                ? '包含额度/面值' 
                : '总量/包含量'}
            </label>
            <div className="input-with-action">
              <input 
                type="number" 
                step="0.0000001"
                placeholder="0" 
                required
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: e.target.value})}
              />
              <button 
                type="button"
                className="unit-trigger-btn"
                onClick={() => setShowUnitSelector(true)}
              >
                {currentUnit} <ChevronDown size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Normalization Settings */}
        <div className="normalization-bar">
           <div className="norm-label"><Settings2 size={12}/> 计算基准:</div>
           <div className="norm-options">
             {NORMALIZATION_OPTIONS.map(opt => (
               <button
                 key={opt.value}
                 type="button"
                 className={`norm-btn ${normalization === opt.value ? 'active' : ''}`}
                 onClick={() => setNormalization(opt.value)}
               >
                 {opt.label}
               </button>
             ))}
           </div>
        </div>

        {/* Dynamic Results Preview */}
        <div className="result-preview">
          <div className="preview-row">
            <div className="preview-item main">
              <div className="preview-label">预期单价</div>
              <div className="preview-value">
                <span className="unit-symbol">{currency}</span>
                {calculateUnitPrice() < 0.0001 && calculateUnitPrice() > 0 
                  ? calculateUnitPrice().toExponential(4) 
                  : calculateUnitPrice().toLocaleString(undefined, { maximumFractionDigits: 6 })}
                <span className="unit-label">
                  / {NORMALIZATION_OPTIONS.find(n => n.value === normalization)?.label.replace('按 ', '')} {currentUnit}
                </span>
              </div>
            </div>
          </div>
        </div>

        <button type="submit" className="button-primary">
          <Plus size={20} />
          <span>加入对比方案</span>
        </button>
      </form>

      {showUnitSelector && (
        <UnitDashboard onClose={() => setShowUnitSelector(false)} />
      )}
    </motion.div>
  );
};

export default WoolCalculator;
