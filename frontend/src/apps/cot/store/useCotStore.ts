import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ReportType, Subtype, DisplayRange } from '../types';

interface CotState {
    // Persisted
    reportType: ReportType;
    subtype: Subtype;
    selectedMarketCode: string | null;

    // Dashboard
    displayRange: DisplayRange;

    // Transient
    fitMode: boolean;
    docsOpen: boolean;
    chartOpen: boolean;
    /** Report types available for the current market (set by DashboardPage). */
    availableReports: ReportType[];

    // Actions
    setReportType: (rt: ReportType) => void;
    setSubtype: (st: Subtype) => void;
    setSelectedMarketCode: (code: string | null) => void;
    setFitMode: (fit: boolean) => void;
    toggleFitMode: () => void;
    setDocsOpen: (open: boolean) => void;
    setChartOpen: (open: boolean) => void;
    setDisplayRange: (range: DisplayRange) => void;
    setAvailableReports: (reports: ReportType[]) => void;
}

export const useCotStore = create<CotState>()(
    persist(
        (set) => ({
            // Persisted defaults
            reportType: 'legacy',
            subtype: 'fo',
            selectedMarketCode: null,

            // Dashboard defaults
            displayRange: '2Y',

            // Transient defaults
            fitMode: false,
            docsOpen: false,
            chartOpen: false,
            availableReports: [],

            // Actions
            setReportType: (reportType) => set({ reportType }),
            setSubtype: (subtype) => set({ subtype }),
            setSelectedMarketCode: (code) => set({ selectedMarketCode: code }),
            setFitMode: (fit) => set({ fitMode: fit }),
            toggleFitMode: () => set((s) => ({ fitMode: !s.fitMode })),
            setDocsOpen: (open) => set({ docsOpen: open }),
            setChartOpen: (open) => set({ chartOpen: open }),
            setDisplayRange: (displayRange) => set({ displayRange }),
            setAvailableReports: (availableReports) => set({ availableReports }),
        }),
        {
            name: 'equilibrium-cot',
            partialize: (state) => ({
                reportType: state.reportType,
                subtype: state.subtype,
                selectedMarketCode: state.selectedMarketCode,
                displayRange: state.displayRange,
            }),
        },
    ),
);
