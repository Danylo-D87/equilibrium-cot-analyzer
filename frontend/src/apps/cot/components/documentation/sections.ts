/* =====================================================
   Navigation sections & UI labels for DocumentationModal
   ===================================================== */

export interface SectionChild {
    id: string;
    title: string;
}

export interface Section {
    id: string;
    title: string;
    icon: string;
    children?: SectionChild[];
}

export const T = {
    docTitle: { ua: 'Документація', en: 'Documentation' },
    docSubtitle: { ua: 'Довідковий посібник', en: 'Reference Guide' },
    headerLabel: { ua: 'Equilibrium COT Analyzer — Довідковий посібник', en: 'Equilibrium COT Analyzer — Reference Guide' },
    closeTitle: { ua: 'Закрити (Esc)', en: 'Close (Esc)' },
    tabReport: { ua: 'Report', en: 'Report' },
    tabCharts: { ua: 'Charts', en: 'Charts' },
    tabScreener: { ua: 'Screener', en: 'Screener' },
};

export const SECTIONS: Record<string, (lang: string) => Section[]> = {
    report: (lang) => [
        { id: 'overview', title: lang === 'ua' ? 'Огляд' : 'Overview', icon: '◈' },
        {
            id: 'report-types', title: lang === 'ua' ? 'Типи звітів' : 'Report Types', icon: '◉', children: [
                { id: 'rt-legacy', title: 'Legacy' },
                { id: 'rt-disagg', title: 'Disaggregated' },
                { id: 'rt-tff', title: 'TFF' },
            ]
        },
        { id: 'subtypes', title: lang === 'ua' ? 'Підтипи звітів' : 'Report Subtypes', icon: '◎' },
        {
            id: 'participants', title: lang === 'ua' ? 'Учасники ринку' : 'Market Participants', icon: '▣', children: [
                { id: 'p-legacy', title: lang === 'ua' ? 'Legacy (3 групи)' : 'Legacy (3 groups)' },
                { id: 'p-disagg', title: lang === 'ua' ? 'Disaggregated (5 груп)' : 'Disaggregated (5 groups)' },
                { id: 'p-tff', title: 'TFF (4 groups)' },
            ]
        },
        {
            id: 'columns', title: lang === 'ua' ? 'Колонки таблиці' : 'Table Columns', icon: '≡', children: [
                { id: 'col-change-long', title: 'Long Change' },
                { id: 'col-change-short', title: 'Short Change' },
                { id: 'col-pct-net-oi', title: 'Net / OI %' },
                { id: 'col-change', title: 'Net Change' },
                { id: 'col-net', title: 'Net Position' },
            ]
        },
        {
            id: 'open-interest', title: 'Open Interest', icon: '◇', children: [
                { id: 'oi-pct', title: 'OI %' },
                { id: 'oi-change', title: 'OI Change' },
                { id: 'oi-value', title: 'Open Interest' },
            ]
        },
        {
            id: 'indicators', title: lang === 'ua' ? 'Індикатори' : 'Indicators', icon: '◈', children: [
                { id: 'ind-wci', title: 'WCI (26w)' },
                { id: 'ind-cot-index', title: 'COT Index' },
                { id: 'ind-crowded', title: 'Crowded Level' },
            ]
        },
        { id: 'stat-rows', title: lang === 'ua' ? 'Статистичні рядки' : 'Statistical Rows', icon: '≡' },
        { id: 'heatmap', title: lang === 'ua' ? 'Кольорова карта' : 'Heatmap', icon: '◐' },
        { id: 'signals', title: lang === 'ua' ? 'Сигнали BUY / SELL' : 'BUY / SELL Signals', icon: '⚡' },
        { id: 'data-source', title: lang === 'ua' ? 'Джерело даних' : 'Data Source', icon: '◉' },
    ],
    screener: (lang) => [
        { id: 'scr-overview', title: lang === 'ua' ? 'Огляд Screener' : 'Screener Overview', icon: '◈' },
        {
            id: 'scr-columns', title: lang === 'ua' ? 'Колонки скринера' : 'Screener Columns', icon: '≡', children: [
                { id: 'scr-col-fixed', title: lang === 'ua' ? 'Загальні' : 'Fixed' },
                { id: 'scr-col-group', title: lang === 'ua' ? 'По групах' : 'Per Group' },
                { id: 'scr-col-oi', title: 'Open Interest' },
                { id: 'scr-col-total', title: 'Total Long / Short' },
            ]
        },
        { id: 'scr-filters', title: lang === 'ua' ? 'Фільтри та сортування' : 'Filters & Sorting', icon: '⚙' },
    ],
    charts: (lang) => [
        { id: 'ch-overview', title: lang === 'ua' ? 'Огляд графіків' : 'Charts Overview', icon: '◈' },
        { id: 'ch-net', title: 'Net Position Chart', icon: '◉' },
        {
            id: 'ch-indicators', title: lang === 'ua' ? 'Режим Indicators' : 'Indicators Mode', icon: '◎', children: [
                { id: 'ch-ind-cot', title: 'COT Index' },
                { id: 'ch-ind-wci', title: 'WCI' },
            ]
        },
        { id: 'ch-price', title: lang === 'ua' ? 'Графік ціни' : 'Price Chart', icon: '◇' },
        { id: 'ch-8signals', title: '8 COT Signals', icon: '⚡' },
        { id: 'ch-bubbles', title: lang === 'ua' ? 'Режим Bubbles' : 'Bubbles View', icon: '◉' },
        { id: 'ch-positions', title: lang === 'ua' ? 'Режим Positions' : 'Positions View', icon: '▣' },
    ],
};
