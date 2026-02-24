import { useState, useEffect, useRef } from 'react';
import Modal from '@/components/ui/Modal';
import { useLocalStorageString } from '@/hooks/useLocalStorage';
import { T, SECTIONS } from './documentation/sections';
import ReportDocContent from './documentation/ReportDocContent';
import ScreenerDocContent from './documentation/ScreenerDocContent';
import ChartsDocContent from './documentation/ChartsDocContent';
import DashboardDocContent from './documentation/DashboardDocContent';

/* =====================================================
   Modal wrapper  (~190 lines — layout + sidebar only)
   Content lives in ./documentation/*
   ===================================================== */

type Lang = 'ua' | 'en';

interface DocumentationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function DocumentationModal({ isOpen, onClose }: DocumentationModalProps) {
    const [activeSection, setActiveSection] = useState('overview');
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
    const [docTab, setDocTab] = useState<string>('report');
    const [lang, setLang] = useLocalStorageString('docLang', 'ua') as [Lang, (v: string) => void];
    const contentRef = useRef<HTMLDivElement>(null);

    // Scroll spy
    useEffect(() => {
        if (!isOpen || !contentRef.current) return;
        const container = contentRef.current;
        const handleScroll = () => {
            const sections = container.querySelectorAll('.doc-section');
            let current = activeSection;
            for (const section of sections) {
                const rect = section.getBoundingClientRect();
                const containerRect = container.getBoundingClientRect();
                if (rect.top - containerRect.top <= 80) {
                    current = section.id;
                }
            }
            setActiveSection(current);
        };
        container.addEventListener('scroll', handleScroll, { passive: true });
        return () => container.removeEventListener('scroll', handleScroll);
    }, [isOpen, activeSection]);

    const sectionBuilder = SECTIONS[docTab];
    const currentSections = sectionBuilder ? sectionBuilder(lang) : [];

    const switchDocTab = (tab: string) => {
        setDocTab(tab);
        const firstSection = SECTIONS[tab]?.(lang)?.[0];
        setActiveSection(firstSection?.id || 'overview');
        setExpandedGroups({});
        if (contentRef.current) contentRef.current.scrollTop = 0;
    };

    const toggleGroup = (id: string) => {
        setExpandedGroups(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const scrollTo = (id: string) => {
        if (!contentRef.current) return;
        const el = contentRef.current.querySelector(`#${id}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg" backdropBlur="md">
            <div className="flex flex-row h-full min-h-0">
                {/* ─── Left sidebar ─── */}
                <nav className="w-[250px] flex-shrink-0 border-r border-border flex flex-col bg-background">
                    <div className="px-5 py-5 border-b border-border">
                        <h2 className="text-[13px] font-bold tracking-widest text-white uppercase">
                            {T.docTitle[lang]}
                        </h2>
                        <p className="text-[10px] text-muted mt-1 tracking-wider uppercase">
                            {T.docSubtitle[lang]}
                        </p>
                    </div>

                    {/* Doc Tab Switcher */}
                    <div className="px-3 py-3 border-b border-border flex gap-1">
                        {['report', 'charts', 'dashboard', 'screener'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => switchDocTab(tab)}
                                className={`flex-1 px-2 py-1.5 rounded-sm text-[10px] font-semibold tracking-widest uppercase transition-all duration-200 ${docTab === tab
                                    ? 'bg-text-primary text-black'
                                    : 'text-muted hover:text-text-secondary hover:bg-surface-hover'
                                    }`}
                            >
                                {tab === 'report' ? T.tabReport[lang]
                                    : tab === 'charts' ? T.tabCharts[lang]
                                    : tab === 'dashboard' ? T.tabDashboard[lang]
                                    : T.tabScreener[lang]}
                            </button>
                        ))}
                    </div>

                    {/* Navigation list */}
                    <div className="flex-1 overflow-y-auto py-2 doc-nav-scrollbar">
                        {currentSections.map(section => (
                            <div key={section.id}>
                                <button
                                    onClick={() => {
                                        scrollTo(section.id);
                                        if (section.children) toggleGroup(section.id);
                                    }}
                                    className={`w-full text-left px-5 py-2 text-[11px] flex items-center gap-2.5 transition-all duration-150 ${activeSection === section.id
                                        ? 'text-white bg-surface-hover border-r-2 border-text-primary'
                                        : 'text-muted hover:text-text-secondary hover:bg-surface-hover'
                                        }`}
                                >
                                    <span className="text-[9px] opacity-60">{section.icon}</span>
                                    <span className="flex-1 truncate font-medium">{section.title}</span>
                                    {section.children && (
                                        <span className={`text-[8px] opacity-50 transition-transform duration-150 ${expandedGroups[section.id] ? 'rotate-90' : ''}`}>▶</span>
                                    )}
                                </button>
                                {section.children && expandedGroups[section.id] && (
                                    <div className="ml-7 border-l border-border">
                                        {section.children.map(child => (
                                            <button
                                                key={child.id}
                                                onClick={() => scrollTo(child.id)}
                                                className={`w-full text-left px-3 py-1.5 text-[10px] transition-colors ${activeSection === child.id
                                                    ? 'text-white font-medium'
                                                    : 'text-muted hover:text-text-secondary'
                                                    }`}
                                            >
                                                {child.title}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </nav>

                {/* ─── Right content area ─── */}
                <div className="flex-1 flex flex-col min-w-0">
                    {/* Header bar */}
                    <div className="flex-shrink-0 h-12 border-b border-border flex items-center justify-between px-6 bg-surface">
                        <span className="text-[11px] text-muted tracking-wider font-medium uppercase">
                            {T.headerLabel[lang]}
                        </span>
                        <div className="flex items-center gap-3">
                            {/* Language toggle */}
                            <div className="flex items-center gap-0.5 bg-background border border-border rounded-sm p-0.5">
                                <button
                                    onClick={() => setLang('ua')}
                                    className={`px-2.5 py-1 rounded-sm text-[10px] font-bold tracking-wider transition-all duration-200 ${lang === 'ua'
                                        ? 'bg-text-primary text-black'
                                        : 'text-muted hover:text-text-secondary'
                                        }`}
                                >
                                    UA
                                </button>
                                <button
                                    onClick={() => setLang('en')}
                                    className={`px-2.5 py-1 rounded-sm text-[10px] font-bold tracking-wider transition-all duration-200 ${lang === 'en'
                                        ? 'bg-text-primary text-black'
                                        : 'text-muted hover:text-text-secondary'
                                        }`}
                                >
                                    EN
                                </button>
                            </div>
                            {/* Close */}
                            <button
                                onClick={onClose}
                                className="w-8 h-8 flex items-center justify-center rounded-sm text-muted hover:text-white hover:bg-surface-hover border border-transparent hover:border-border transition-all duration-200"
                                title={T.closeTitle[lang]}
                            >
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M1 1l12 12M13 1L1 13" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Scrollable content */}
                    <div ref={contentRef} className="flex-1 overflow-y-auto px-8 py-7 doc-content-scrollbar">
                        {docTab === 'report' && <ReportDocContent lang={lang} />}
                        {docTab === 'screener' && <ScreenerDocContent lang={lang} />}
                        {docTab === 'charts' && <ChartsDocContent lang={lang} />}
                        {docTab === 'dashboard' && <DashboardDocContent lang={lang} />}
                    </div>
                </div>
            </div>
        </Modal>
    );
}
