import React from 'react';
import { motion, AnimatePresence } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { Trash2, Clock, Tag } from 'lucide-react';
import useStore from '../store';

const RecordList = () => {
  const { records, removeRecord, clearRecords } = useStore();

  const getNormalizationLabel = (val) => {
    if (val === 1) return '';
    if (val === 10000) return '万';
    if (val === 1000000) return '百万';
    if (val === 100000000) return '亿';
    return val;
  };

  if (records.length === 0) {
    return (
      <div className="empty-state glass-panel">
        <Tag size={48} className="icon-muted" />
        <p>暂无记录，快去计算比价吧！</p>
      </div>
    );
  }

  return (
    <div className="records-container">
      <div className="records-actions">
        <button onClick={clearRecords} className="text-danger-btn">
          <Trash2 size={14} /> 清空所有方案
        </button>
      </div>
      
      <div className="records-grid">
        <AnimatePresence>
          {records.map((record, index) => (
            <motion.div
              key={record.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className={`record-card glass-panel ${index === 0 ? 'optimal' : ''}`}
            >
              {index === 0 && (
                <div className="record-badge">
                  性价比最高
                </div>
              )}
              
              <div className="record-name">{record.name}</div>
              
              <div className="record-details">
                <div className="detail-item">
                  <span className="detail-label">总成本</span>
                  <span className="detail-value">{record.currency}{record.price.toLocaleString()}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">获得量</span>
                  <span className="detail-value">
                    {record.quantity.toLocaleString()} {record.unit}
                  </span>
                </div>
              </div>

              <div className="record-price-tag">
                <span className="price-main">{record.currency}{record.unitPrice < 0.0001 ? record.unitPrice.toExponential(4) : record.unitPrice.toLocaleString(undefined, { maximumFractionDigits: 6 })}</span>
                <span className="price-unit">/{getNormalizationLabel(record.normalization)}{record.unit}</span>
              </div>

              <button 
                className="delete-btn" 
                onClick={() => removeRecord(record.id)}
                title="删除此项"
              >
                <Trash2 size={16} />
              </button>

              <div className="record-footer">
                <Clock size={12} />
                <span>{new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default RecordList;
