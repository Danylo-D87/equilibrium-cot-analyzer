import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ReportType, Subtype } from '../types';

interface AppState {
    // Persisted
    reportType: ReportType;
    subtype: Subtype;
    selectedMarketCode: string | null;

    // Transient
    fitMode: boolean;
    docsOpen: boolean;
    chartOpen: boolean;

    // Actions
    setReportType: (rt: ReportType) => void;
    setSubtype: (st: Subtype) => void;
    setSelectedMarketCode: (code: string | null) => void;
    setFitMode: (fit: boolean) => void;
    toggleFitMode: () => void;
    setDocsOpen: (open: boolean) => void;
    setChartOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            // Persisted defaults
            reportType: 'legacy',
            subtype: 'fo',
            selectedMarketCode: null,

            // Transient defaults
            fitMode: false,
            docsOpen: false,
            chartOpen: false,

            // Actions
            setReportType: (reportType) => set({ reportType }),
            setSubtype: (subtype) => set({ subtype }),
            setSelectedMarketCode: (code) => set({ selectedMarketCode: code }),
            setFitMode: (fit) => set({ fitMode: fit }),
            toggleFitMode: () => set((s) => ({ fitMode: !s.fitMode })),
            setDocsOpen: (open) => set({ docsOpen: open }),
            setChartOpen: (open) => set({ chartOpen: open }),
        }),
        {
            name: 'cot-app-store',
            partialize: (state) => ({
                reportType: state.reportType,
                subtype: state.subtype,
                selectedMarketCode: state.selectedMarketCode,
            }),
        },
    ),
);
