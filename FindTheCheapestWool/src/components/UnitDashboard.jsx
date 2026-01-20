import React from 'react';
import { motion } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { X, ShoppingBag, Cpu, Package, Coins } from 'lucide-react';
import useStore from '../store';

const UNIT_GROUPS = [
  {
    title: '额度/点卡 (虚拟价值)',
    icon: <Coins size={16} />,
    units: ['美元额度', '人民币额度', '点数', '积分']
  },
  {
    title: '开发者/资源',
    icon: <Cpu size={16} />,
    units: ['Token', '请求', '核心', '小时', '学分', '题目']
  },
  {
    title: '数码/网络',
    icon: <Package size={16} />,
    units: ['GB', 'TB', 'Mbps', '月', '年']
  },
  {
    title: '日常通用',
    icon: <ShoppingBag size={16} />,
    units: ['个', '台', '件', '斤', '克', 'kg', '升', 'ml']
  }
];

const UnitDashboard = ({ onClose }) => {
  const { setUnit, currentUnit, setNormalization } = useStore();

  const handleSelect = (u) => {
    setUnit(u);
    // Auto-set normalization
    if (['Token', '请求', '核心'].includes(u)) {
       setNormalization(1000000); // Default to 1M for tokens
    } else {
       setNormalization(1);
    }
    onClose();
  };

  return (
    <motion.div 
      className="overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="unit-dashboard glass-panel"
        initial={{ y: 50, scale: 0.9 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 50, scale: 0.9 }}
      >
        <div className="dashboard-header">
          <h3>选择计算单位</h3>
          <button onClick={onClose} className="close-btn"><X size={20} /></button>
        </div>

        <div className="unit-groups">
          {UNIT_GROUPS.map((group) => (
            <div key={group.title} className="unit-group">
              <div className="group-title">
                {group.icon}
                <span>{group.title}</span>
              </div>
              <div className="unit-buttons">
                {group.units.map((u) => (
                  <button
                    key={u}
                    className={`unit-btn ${currentUnit === u ? 'active' : ''}`}
                    onClick={() => handleSelect(u)}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default UnitDashboard;
