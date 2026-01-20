import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useStore = create(
  persist(
    (set) => ({
      records: [],
      currentUnit: '个',
      normalization: 1, // Default to Per 1 unit
      currency: '¥',
      theme: 'midnight',
      
      addRecord: (record) => set((state) => ({ 
        records: [record, ...state.records].sort((a, b) => a.unitPrice - b.unitPrice) 
      })),
      
      removeRecord: (id) => set((state) => ({
        records: state.records.filter(r => r.id !== id)
      })),
      
      clearRecords: () => set({ records: [] }),
      
      setUnit: (unit) => set({ currentUnit: unit }),
      
      setNormalization: (n) => set({ normalization: n }),
      
      setCurrency: (c) => set({ currency: c }),
      
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'wool-master-storage',
    }
  )
);

export default useStore;
