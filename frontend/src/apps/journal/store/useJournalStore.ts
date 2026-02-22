/**
 * Zustand store for journal UI state.
 * Replaces DisplayModeContext + local useState management.
 */

import { create } from 'zustand';
import type { DisplayMode, DashboardTab, TradeFilters, Trade } from '../types';

interface JournalStore {
    // Display
    displayMode: DisplayMode;
    toggleDisplayMode: () => void;
    setDisplayMode: (m: DisplayMode) => void;

    // Tabs
    activeTab: DashboardTab;
    setActiveTab: (t: DashboardTab) => void;

    // Filters
    filters: TradeFilters;
    setFilters: (fn: (prev: TradeFilters) => TradeFilters) => void;
    clearFilters: () => void;

    // Modals
    isCreateModalOpen: boolean;
    setCreateModalOpen: (v: boolean) => void;
    isViewModalOpen: boolean;
    setViewModalOpen: (v: boolean) => void;
    selectedTrade: Trade | null;
    setSelectedTrade: (t: Trade | null) => void;
    isSettingsOpen: boolean;
    setSettingsOpen: (v: boolean) => void;
    showEquityCurveModal: boolean;
    setShowEquityCurveModal: (v: boolean) => void;

    // Language (for journal i18n)
    language: string;
    setLanguage: (l: string) => void;

    // Nickname
    nickname: string;
    setNickname: (n: string) => void;
}

export const useJournalStore = create<JournalStore>((set) => ({
    // Display
    displayMode: 'currency',
    toggleDisplayMode: () =>
        set((s) => ({ displayMode: s.displayMode === 'currency' ? 'percentage' : 'currency' })),
    setDisplayMode: (m) => set({ displayMode: m }),

    // Tabs
    activeTab: 'main',
    setActiveTab: (t) => set({ activeTab: t }),

    // Filters
    filters: {},
    setFilters: (fn) => set((s) => ({ filters: fn(s.filters) })),
    clearFilters: () => set({ filters: {} }),

    // Modals
    isCreateModalOpen: false,
    setCreateModalOpen: (v) => set({ isCreateModalOpen: v }),
    isViewModalOpen: false,
    setViewModalOpen: (v) => set({ isViewModalOpen: v }),
    selectedTrade: null,
    setSelectedTrade: (t) => set({ selectedTrade: t }),
    isSettingsOpen: false,
    setSettingsOpen: (v) => set({ isSettingsOpen: v }),
    showEquityCurveModal: false,
    setShowEquityCurveModal: (v) => set({ showEquityCurveModal: v }),

    // Language — read from localStorage, default 'en'
    language: typeof window !== 'undefined'
        ? localStorage.getItem('journal_language') || 'en'
        : 'en',
    setLanguage: (l) => {
        localStorage.setItem('journal_language', l);
        set({ language: l });
    },

    // Nickname — sourced from server (UserJournalSettings), not localStorage
    nickname: '',
    setNickname: (n) => set({ nickname: n }),
}));
