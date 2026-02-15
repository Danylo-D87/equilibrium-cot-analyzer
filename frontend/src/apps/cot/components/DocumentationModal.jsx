import React, { useState, useEffect, useRef } from 'react';
import Modal from '@/components/ui/Modal';

/* =====================================================
   Bilingual content helper
   ===================================================== */

const T = {
    docTitle: { ua: 'Документація', en: 'Documentation' },
    docSubtitle: { ua: 'Довідковий посібник', en: 'Reference Guide' },
    headerLabel: { ua: 'Equilibrium COT Analyzer — Довідковий посібник', en: 'Equilibrium COT Analyzer — Reference Guide' },
    closeTitle: { ua: 'Закрити (Esc)', en: 'Close (Esc)' },
    tabReport: { ua: 'Report', en: 'Report' },
    tabCharts: { ua: 'Charts', en: 'Charts' },
    tabScreener: { ua: 'Screener', en: 'Screener' },
};

/* =====================================================
   Section navigation definitions
   ===================================================== */

const SECTIONS = {
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
                { id: 'col-change-long', title: 'Ch (Long)' },
                { id: 'col-change-short', title: 'Ch (Short)' },
                { id: 'col-pct-net-oi', title: '% net/OI' },
                { id: 'col-change', title: 'Change' },
                { id: 'col-net', title: 'Net Position' },
            ]
        },
        {
            id: 'open-interest', title: 'Open Interest', icon: '◇', children: [
                { id: 'oi-pct', title: '% OI' },
                { id: 'oi-change', title: 'Change' },
                { id: 'oi-value', title: 'OI' },
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
                { id: 'scr-col-total', title: 'Total L/S' },
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

/* =====================================================
   Reusable helper components
   ===================================================== */

function Formula({ children }) {
    return (
        <div className="my-3 px-4 py-3 bg-surface border border-border rounded-sm font-mono text-[11.5px] text-text-secondary leading-relaxed whitespace-pre-wrap">
            {children}
        </div>
    );
}

function Tag({ color = 'emerald', children }) {
    const colors = {
        emerald: 'bg-white/5 text-text-primary border-border',
        red: 'bg-red-500/10 text-red-400 border-red-500/20',
        amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        blue: 'bg-white/[0.04] text-text-secondary border-border',
        gray: 'bg-surface text-muted border-border',
        green: 'bg-green-500/10 text-green-400 border-green-500/20',
        purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    };
    return (
        <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-sm border uppercase tracking-wider ${colors[color]}`}>
            {children}
        </span>
    );
}

function Note({ children }) {
    return (
        <div className="my-4 px-4 py-3 bg-surface border-l-2 border-border-hover rounded-r-sm text-[11.5px] text-text-secondary leading-relaxed">
            <span className="text-text-primary font-semibold mr-1.5">📌</span>
            {children}
        </div>
    );
}

function InfoTable({ rows }) {
    return (
        <div className="my-4 space-y-2 text-[11.5px]">
            {rows.map((r, i) => (
                <div key={i} className="flex gap-3">
                    <span className="text-muted min-w-[140px] flex-shrink-0">{r[0]}</span>
                    <span className="text-text-primary">{r[1]}</span>
                </div>
            ))}
        </div>
    );
}

function ParticipantCard({ name, tag, tagColor, description }) {
    return (
        <div className="px-4 py-3 bg-white/[0.02] border border-border rounded-sm mb-3">
            <div className="flex items-center gap-2 mb-2">
                <Tag color={tagColor}>{tag}</Tag>
                <span className="text-text-primary font-semibold text-[12px]">{name}</span>
            </div>
            <div className="text-[11.5px] text-text-secondary leading-relaxed">{description}</div>
        </div>
    );
}

/* =====================================================
   Report documentation tab
   ===================================================== */

function ReportDocContent({ lang }) {
    const L = (ua, en) => lang === 'ua' ? ua : en;

    return (
        <div className="prose-dark">

            {/* ── OVERVIEW ── */}
            <section id="overview" className="doc-section">
                <h2>{L('Огляд', 'Overview')}</h2>
                <p>
                    <strong>Commitments of Traders (COT)</strong> — {L(
                        'офіційний звіт Комісії з торгівлі товарними ф\'ючерсами США (CFTC), який розкриває структуру позиціонування учасників ф\'ючерсних ринків. Публікується щоп\'ятниці о 15:30 ET, із даними станом на вівторок поточного тижня.',
                        'an official report by the U.S. Commodity Futures Trading Commission (CFTC) that discloses the positioning structure of futures market participants. Published every Friday at 3:30 PM ET, with data as of Tuesday of the same week.'
                    )}
                </p>
                <p>
                    {L(
                        'CFTC публікує три типи COT-звітів, кожен з яких класифікує учасників ринку за різними методологіями. Крім того, кожен тип звіту доступний у двох підтипах — Futures Only та Futures + Options Combined.',
                        'CFTC publishes three types of COT reports, each classifying market participants using different methodologies. Additionally, each report type is available in two subtypes — Futures Only and Futures + Options Combined.'
                    )}
                </p>
                <p>
                    {L(
                        'Equilibrium COT Analyzer автоматично збирає, обробляє та візуалізує дані з усіх трьох типів звітів. Система розраховує похідні метрики — COT Index, Williams Commercial Index (WCI), Crowded Level — та відображає їх через градієнтну кольорову карту (heatmap).',
                        'Equilibrium COT Analyzer automatically collects, processes and visualizes data from all three report types. The system computes derived metrics — COT Index, Williams Commercial Index (WCI), Crowded Level — and displays them via a gradient heatmap.'
                    )}
                </p>
            </section>

            {/* ── REPORT TYPES ── */}
            <section id="report-types" className="doc-section">
                <h2>{L('Типи звітів CFTC', 'CFTC Report Types')}</h2>
                <p>
                    {L(
                        'CFTC класифікує одних і тих самих учасників ринку трьома різними способами. Кожен тип звіту надає іншу перспективу на структуру позиціонування.',
                        'CFTC classifies the same market participants in three different ways. Each report type provides a different perspective on position structure.'
                    )}
                </p>

                <article id="rt-legacy" className="doc-article">
                    <h3><Tag color="emerald">Legacy</Tag> {L('Традиційний звіт', 'Traditional Report')}</h3>
                    <InfoTable rows={[
                        [L('Кількість груп', 'Number of groups'), '3'],
                        [L('Групи', 'Groups'), L('Commercials, Non-Commercials (Large Speculators), Non-Reportable (Small Traders)', 'Commercials, Non-Commercials (Large Speculators), Non-Reportable (Small Traders)')],
                        [L('Покриття', 'Coverage'), L('Усі ф\'ючерсні ринки', 'All futures markets')],
                        [L('Історія', 'History'), L('Найглибша — дані з 1986 року', 'Deepest — data since 1986')],
                    ]} />
                    <p>
                        {L(
                            'Найстаріший та найпоширеніший тип звіту. Класифікує учасників на тих, хто хеджує комерційну діяльність (Commercials), великих спекулянтів (Non-Commercials) та решту учасників, чиї позиції не досягають порогу звітності (Non-Reportable). Простий поділ на 3 групи дає чітку картину балансу сил.',
                            'The oldest and most widely used report type. Classifies participants into those hedging commercial activity (Commercials), large speculators (Non-Commercials), and remaining participants whose positions fall below reporting thresholds (Non-Reportable). Simple 3-group split provides a clear picture of the balance of forces.'
                        )}
                    </p>
                </article>

                <article id="rt-disagg" className="doc-article">
                    <h3><Tag color="amber">Disaggregated</Tag> {L('Деталізований звіт', 'Disaggregated Report')}</h3>
                    <InfoTable rows={[
                        [L('Кількість груп', 'Number of groups'), '5'],
                        [L('Групи', 'Groups'), 'Producer/Merchant, Swap Dealers, Managed Money, Other Reportables, Non-Reportable'],
                        [L('Покриття', 'Coverage'), L('Товарні ринки (commodities)', 'Commodity markets')],
                        [L('Історія', 'History'), L('Дані з 2006 року', 'Data since 2006')],
                    ]} />
                    <p>
                        {L(
                            'Розширена версія Legacy для товарних ринків. Розбиває категорію «Commercials» на Producer/Merchant та Swap Dealers, а «Non-Commercials» — на Managed Money та Other Reportables. Це дає точніше уявлення про те, хто саме тримає позиції.',
                            'Extended version of Legacy for commodity markets. Splits "Commercials" into Producer/Merchant and Swap Dealers, and "Non-Commercials" into Managed Money and Other Reportables. This provides a more precise picture of who exactly holds positions.'
                        )}
                    </p>
                </article>

                <article id="rt-tff" className="doc-article">
                    <h3><Tag color="purple">TFF</Tag> Traders in Financial Futures</h3>
                    <InfoTable rows={[
                        [L('Кількість груп', 'Number of groups'), '4'],
                        [L('Групи', 'Groups'), 'Dealer/Intermediary, Asset Manager, Leveraged Funds, Other Reportables'],
                        [L('Покриття', 'Coverage'), L('Фінансові ринки (валюти, індекси, ставки)', 'Financial markets (currencies, indices, rates)')],
                        [L('Історія', 'History'), L('Дані з 2006 року', 'Data since 2006')],
                    ]} />
                    <p>
                        {L(
                            'Спеціалізований звіт для фінансових ф\'ючерсів. Замість поділу Commercial/Non-Commercial використовує класифікацію за типом фінансової діяльності. Dealer/Intermediary — це маркет-мейкери та дилери, Asset Manager — пенсійні фонди та страхові компанії, Leveraged Funds — хедж-фонди та CTA.',
                            'Specialized report for financial futures. Instead of Commercial/Non-Commercial split, it uses classification by type of financial activity. Dealer/Intermediary are market makers and dealers, Asset Manager are pension funds and insurance companies, Leveraged Funds are hedge funds and CTAs.'
                        )}
                    </p>
                </article>
            </section>

            {/* ── SUBTYPES ── */}
            <section id="subtypes" className="doc-section">
                <h2>{L('Підтипи звітів', 'Report Subtypes')}</h2>
                <p>
                    {L(
                        'Кожен тип звіту (Legacy, Disaggregated, TFF) доступний у двох варіантах:',
                        'Each report type (Legacy, Disaggregated, TFF) is available in two variants:'
                    )}
                </p>

                <div className="px-4 py-3 bg-white/[0.02] border border-[#262626] rounded-sm mb-3">
                    <div className="flex items-center gap-2 mb-2">
                        <Tag color="blue">Futures Only (FO)</Tag>
                    </div>
                    <p className="text-[11.5px] text-[#a3a3a3] leading-relaxed">
                        {L(
                            'Включає лише ф\'ючерсні позиції. Відображає чисте спрямоване позиціонування учасників без впливу опціонних стратегій. Дає більш пряме уявлення про переконаність (conviction) учасників.',
                            'Includes only futures positions. Reflects pure directional positioning of participants without the influence of options strategies. Provides a more direct view of participant conviction.'
                        )}
                    </p>
                </div>

                <div className="px-4 py-3 bg-white/[0.02] border border-[#262626] rounded-sm mb-3">
                    <div className="flex items-center gap-2 mb-2">
                        <Tag color="blue">Futures + Options Combined (CO)</Tag>
                    </div>
                    <p className="text-[11.5px] text-[#a3a3a3] leading-relaxed">
                        {L(
                            'Додає до ф\'ючерсних позицій дельта-еквівалент опціонних позицій. Дає більш повну картину загальної експозиції учасників, включаючи опціонні стратегії. Загальний Open Interest вищий, ніж у Futures Only.',
                            'Adds the delta-equivalent of options positions to futures positions. Provides a more complete picture of total participant exposure, including options strategies. Total Open Interest is higher than in Futures Only.'
                        )}
                    </p>
                </div>

                <Note>
                    {L(
                        'Обидва підтипи є валідними інструментами аналізу. Futures Only дає чистіший сигнал позиціонування, Combined — повнішу картину експозиції. Рекомендується використовувати той самий підтип послідовно для коректного порівняння у часі.',
                        'Both subtypes are valid analytical tools. Futures Only provides a cleaner positioning signal, Combined — a more complete exposure picture. It is recommended to use the same subtype consistently for correct comparison over time.'
                    )}
                </Note>
            </section>

            {/* ── PARTICIPANTS ── */}
            <section id="participants" className="doc-section">
                <h2>{L('Учасники ринку', 'Market Participants')}</h2>
                <p>
                    {L(
                        'Кожен тип звіту класифікує учасників ринку за своєю методологією. Нижче описано всі категорії для кожного типу звіту.',
                        'Each report type classifies market participants using its own methodology. Below are all categories for each report type.'
                    )}
                </p>

                {/* Legacy */}
                <article id="p-legacy" className="doc-article">
                    <h3><Tag color="emerald">Legacy</Tag> — 3 {L('групи', 'groups')}</h3>

                    <ParticipantCard
                        name="Commercials"
                        tag={L('Хеджери', 'Hedgers')}
                        tagColor="green"
                        description={L(
                            'Виробники, переробники, кінцеві споживачі товарів та фінансові інституції, що використовують ф\'ючерси для хеджування ризиків основного бізнесу. Їхні позиції відображають реальний попит та пропозицію на фізичному ринку. Зазвичай діють проти тренду — продають на зростанні (хеджують продаж) та купують на падінні (хеджують закупівлі).',
                            'Producers, processors, end-users of commodities and financial institutions that use futures to hedge risks in their core business. Their positions reflect real demand and supply in the physical market. Typically act counter-trend — selling on rallies (hedging sales) and buying on dips (hedging purchases).'
                        )}
                    />

                    <ParticipantCard
                        name="Non-Commercials (Large Speculators)"
                        tag={L('Великі спекулянти', 'Large Speculators')}
                        tagColor="amber"
                        description={L(
                            'Хедж-фонди, CTA (Commodity Trading Advisors), managed money та інші великі спекулятивні учасники, чиї позиції перевищують пороги звітності CFTC. Переважно є трендовими гравцями (trend-followers). Їхні екстремальні позиції можуть вказувати на пізні стадії тренду.',
                            'Hedge funds, CTAs (Commodity Trading Advisors), managed money and other large speculative participants whose positions exceed CFTC reporting thresholds. Predominantly trend-followers. Their extreme positions may indicate late stages of a trend.'
                        )}
                    />

                    <ParticipantCard
                        name="Non-Reportable (Small Traders)"
                        tag={L('Дрібні трейдери', 'Small Traders')}
                        tagColor="red"
                        description={L(
                            'Учасники, чиї позиції не досягають порогу обов\'язкової звітності CFTC. Розраховуються як залишок: Open Interest − (Commercials + Non-Commercials). Включають роздрібних трейдерів та невеликі інституції.',
                            'Participants whose positions fall below CFTC mandatory reporting thresholds. Calculated as residual: Open Interest − (Commercials + Non-Commercials). Includes retail traders and small institutions.'
                        )}
                    />

                    <Formula>{L(
                        'Commercials + Non-Commercials + Non-Reportable ≈ Open Interest\n(Сума всіх нетто-позицій трьох груп = 0)',
                        'Commercials + Non-Commercials + Non-Reportable ≈ Open Interest\n(Sum of all three groups\' net positions = 0)'
                    )}</Formula>
                </article>

                {/* Disaggregated */}
                <article id="p-disagg" className="doc-article">
                    <h3><Tag color="amber">Disaggregated</Tag> — 5 {L('груп', 'groups')}</h3>

                    <ParticipantCard
                        name="Producer/Merchant/Processor/User"
                        tag={L('Виробники та споживачі', 'Producers & Users')}
                        tagColor="green"
                        description={L(
                            'Суб\'єкти, що безпосередньо виробляють, переробляють або споживають фізичний товар. Використовують ф\'ючерси для хеджування цінових ризиків своєї основної діяльності. Аналог Commercials у Legacy, але без Swap Dealers.',
                            'Entities that directly produce, process, or consume physical commodities. Use futures to hedge price risks of their core business. Analogous to Commercials in Legacy, but without Swap Dealers.'
                        )}
                    />

                    <ParticipantCard
                        name="Swap Dealers"
                        tag={L('Своп-дилери', 'Swap Dealers')}
                        tagColor="blue"
                        description={L(
                            'Фінансові інституції, що використовують ф\'ючерси для хеджування ризиків своїх позицій на позабіржовому (OTC) ринку свопів. Їхні позиції часто відображають агреговані потреби їхніх клієнтів (пенсійних фондів, корпорацій тощо).',
                            'Financial institutions that use futures to hedge risks of their over-the-counter (OTC) swap positions. Their positions often reflect aggregated needs of their clients (pension funds, corporations, etc.).'
                        )}
                    />

                    <ParticipantCard
                        name="Managed Money"
                        tag={L('Керовані гроші', 'Managed Money')}
                        tagColor="amber"
                        description={L(
                            'CTA, CPO (Commodity Pool Operators) та фонди, що активно управляють капіталом у ф\'ючерсних ринках. Найчастіше — систематичні трендові стратегії. Аналог Non-Commercials у Legacy, але без Other Reportables.',
                            'CTAs, CPOs (Commodity Pool Operators) and funds that actively manage capital in futures markets. Most commonly — systematic trend-following strategies. Analogous to Non-Commercials in Legacy, but without Other Reportables.'
                        )}
                    />

                    <ParticipantCard
                        name="Other Reportables"
                        tag={L('Інші звітні', 'Other Reportables')}
                        tagColor="gray"
                        description={L(
                            'Решта великих учасників, що не входять в жодну з трьох попередніх категорій. Можуть включати хедж-фонди з комерційною компонентою, пропрайєтарні торгові фірми та інших гравців, що не піддаються чіткій класифікації.',
                            'Remaining large participants that do not fit into any of the three previous categories. May include hedge funds with commercial components, proprietary trading firms, and other players that resist clear classification.'
                        )}
                    />

                    <ParticipantCard
                        name="Non-Reportable"
                        tag={L('Дрібні трейдери', 'Small Traders')}
                        tagColor="red"
                        description={L(
                            'Аналогічно Legacy — позиції нижче порогу звітності. Розраховуються як залишок від загального Open Interest.',
                            'Same as Legacy — positions below reporting thresholds. Calculated as residual from total Open Interest.'
                        )}
                    />
                </article>

                {/* TFF */}
                <article id="p-tff" className="doc-article">
                    <h3><Tag color="purple">TFF</Tag> — 4 {L('групи', 'groups')}</h3>
                    <p className="text-[11.5px] text-[#a3a3a3] mb-3">
                        {L(
                            'TFF використовує окрему класифікацію, спеціально розроблену для фінансових ф\'ючерсів (валюти, фондові індекси, процентні ставки).',
                            'TFF uses a separate classification specifically designed for financial futures (currencies, equity indices, interest rates).'
                        )}
                    </p>

                    <ParticipantCard
                        name="Dealer/Intermediary"
                        tag={L('Дилери', 'Dealers')}
                        tagColor="green"
                        description={L(
                            'Sell-side учасники — великі банки та дилери, що виконують роль маркет-мейкерів, створюючи ліквідність для клієнтів. Їхні ф\'ючерсні позиції переважно є хеджем для OTC-зобов\'язань перед клієнтами.',
                            'Sell-side participants — large banks and dealers acting as market makers, providing liquidity for clients. Their futures positions are predominantly hedges for OTC obligations to clients.'
                        )}
                    />

                    <ParticipantCard
                        name="Asset Manager/Institutional"
                        tag={L('Інституціонали', 'Institutionals')}
                        tagColor="blue"
                        description={L(
                            'Buy-side учасники — пенсійні фонди, страхові компанії, ендаументи, суверенні фонди. Використовують ф\'ючерси для стратегічного розподілу активів, валютного хеджування та управління дюрацією портфеля.',
                            'Buy-side participants — pension funds, insurance companies, endowments, sovereign wealth funds. Use futures for strategic asset allocation, currency hedging, and portfolio duration management.'
                        )}
                    />

                    <ParticipantCard
                        name="Leveraged Funds"
                        tag={L('Леверидж-фонди', 'Leveraged Funds')}
                        tagColor="amber"
                        description={L(
                            'Хедж-фонди, CTA та інші учасники, що використовують кредитне плече. Ведуть активну, часто спекулятивну торгівлю. Найбільш волатильна група за зміною позицій.',
                            'Hedge funds, CTAs and other participants that use leverage. Conduct active, often speculative trading. The most volatile group in terms of position changes.'
                        )}
                    />

                    <ParticipantCard
                        name="Other Reportables"
                        tag={L('Інші звітні', 'Other Reportables')}
                        tagColor="gray"
                        description={L(
                            'Великі звітні учасники, що не входять в жодну з трьох попередніх категорій TFF. Включають корпорації, центральні банки та інші інституції, що використовують фінансові ф\'ючерси.',
                            'Large reportable participants that do not fit into any of the three previous TFF categories. Include corporations, central banks, and other institutions using financial futures.'
                        )}
                    />
                </article>
            </section>

            {/* ── COLUMNS ── */}
            <section id="columns" className="doc-section">
                <h2>{L('Колонки таблиці', 'Table Columns')}</h2>
                <p>
                    {L(
                        'Для кожної групи учасників у таблиці відображається набір з 5 колонок. Нижче описано значення кожної з них. Назви груп змінюються залежно від обраного типу звіту.',
                        'For each participant group, the table displays a set of 5 columns. Below is a description of each. Group names change depending on the selected report type.'
                    )}
                </p>

                <article id="col-change-long" className="doc-article">
                    <h3>Ch (Long) — {L('Зміна довгих позицій', 'Change in Long Positions')}</h3>
                    <div className="doc-meta">
                        <Tag color="gray">{L('Колонка', 'Column')}</Tag>
                        <Tag color="blue">{L('Дані CFTC', 'CFTC Data')}</Tag>
                    </div>
                    <h4>{L('Визначення', 'Definition')}</h4>
                    <p>{L(
                        'Тижнева зміна кількості відкритих Long-контрактів групи. Значення надається безпосередньо CFTC.',
                        'Weekly change in the number of open Long contracts for the group. Value provided directly by CFTC.'
                    )}</p>
                    <h4>{L('Візуалізація', 'Visualization')}</h4>
                    <p>{L(
                        'Моно-кольорова заливка — завжди зелена, яскравість пропорційна абсолютній величині зміни відносно максимуму в колонці.',
                        'Mono-color fill — always green, brightness proportional to the absolute value of the change relative to the column maximum.'
                    )}</p>
                </article>

                <article id="col-change-short" className="doc-article">
                    <h3>Ch (Short) — {L('Зміна коротких позицій', 'Change in Short Positions')}</h3>
                    <div className="doc-meta">
                        <Tag color="gray">{L('Колонка', 'Column')}</Tag>
                        <Tag color="blue">{L('Дані CFTC', 'CFTC Data')}</Tag>
                    </div>
                    <h4>{L('Визначення', 'Definition')}</h4>
                    <p>{L(
                        'Тижнева зміна кількості відкритих Short-контрактів групи. Значення надається безпосередньо CFTC.',
                        'Weekly change in the number of open Short contracts for the group. Value provided directly by CFTC.'
                    )}</p>
                    <h4>{L('Візуалізація', 'Visualization')}</h4>
                    <p>{L(
                        'Моно-кольорова заливка — завжди червона, яскравість пропорційна абсолютній величині зміни.',
                        'Mono-color fill — always red, brightness proportional to the absolute value of the change.'
                    )}</p>
                </article>

                <article id="col-pct-net-oi" className="doc-article">
                    <h3>% net/OI — {L('Нетто як % від Open Interest', 'Net as % of Open Interest')}</h3>
                    <div className="doc-meta">
                        <Tag color="gray">{L('Колонка', 'Column')}</Tag>
                        <Tag color="emerald">{L('Розрахункова', 'Calculated')}</Tag>
                    </div>
                    <h4>{L('Визначення', 'Definition')}</h4>
                    <p>{L(
                        'Чиста позиція групи, виражена як відсоток від загального Open Interest. Нормалізує позиціонування відносно розміру ринку.',
                        'Net position of the group expressed as a percentage of total Open Interest. Normalizes positioning relative to market size.'
                    )}</p>
                    <Formula>% net/OI = (Net Position / Open Interest) × 100</Formula>
                    <h4>{L('Інтерпретація', 'Interpretation')}</h4>
                    <p>{L(
                        'Усуває проблему порівняння абсолютних чисел у часі. Показує наскільки велика позиція групи відносно загальної ліквідності ринку.',
                        'Eliminates the problem of comparing absolute numbers over time. Shows how large the group\'s position is relative to total market liquidity.'
                    )}</p>
                </article>

                <article id="col-change" className="doc-article">
                    <h3>Change — {L('Зміна чистої позиції', 'Net Position Change')}</h3>
                    <div className="doc-meta">
                        <Tag color="gray">{L('Колонка', 'Column')}</Tag>
                        <Tag color="emerald">{L('Розрахункова', 'Calculated')}</Tag>
                    </div>
                    <h4>{L('Визначення', 'Definition')}</h4>
                    <p>{L(
                        'Тижнева зміна Net Position групи. Показує напрямок та швидкість зміни позиціонування.',
                        'Weekly change in the group\'s Net Position. Shows the direction and speed of positioning change.'
                    )}</p>
                    <Formula>Change = Ch (Long) − Ch (Short)</Formula>
                    <h4>{L('Візуалізація', 'Visualization')}</h4>
                    <p>{L(
                        'Двокольорова заливка: позитивне значення — зелена, від\'ємне — червона. Яскравість пропорційна абсолютній величині.',
                        'Two-color fill: positive value — green, negative — red. Brightness proportional to absolute value.'
                    )}</p>
                </article>

                <article id="col-net" className="doc-article">
                    <h3>Net Position — {L('Чиста позиція', 'Net Position')}</h3>
                    <div className="doc-meta">
                        <Tag color="gray">{L('Колонка', 'Column')}</Tag>
                        <Tag color="emerald">{L('Розрахункова', 'Calculated')}</Tag>
                    </div>
                    <h4>{L('Визначення', 'Definition')}</h4>
                    <p>{L(
                        'Різниця між усіма Long та Short контрактами групи. Основний показник спрямованості позиціонування.',
                        'Difference between all Long and Short contracts of the group. Primary indicator of positioning directionality.'
                    )}</p>
                    <Formula>Net Position = Long − Short</Formula>
                    <h4>{L('Інтерпретація', 'Interpretation')}</h4>
                    <p>{L(
                        'Позитивне значення (Net Long) означає перевагу довгих позицій. Від\'ємне (Net Short) — перевагу коротких. Абсолютна величина сама по собі малоінформативна — значущість визначається через нормалізацію (COT Index) або відносно OI (% net/OI).',
                        'Positive value (Net Long) means dominance of long positions. Negative (Net Short) — dominance of short positions. Absolute value alone is not very informative — significance is determined through normalization (COT Index) or relative to OI (% net/OI).'
                    )}</p>
                </article>
            </section>

            {/* ── OPEN INTEREST ── */}
            <section id="open-interest" className="doc-section">
                <h2>Open Interest</h2>
                <p>{L(
                    'Open Interest (OI) — загальна кількість відкритих (невиконаних) ф\'ючерсних контрактів на ринку. Кожен контракт має покупця та продавця, тому OI рахується один раз. Це міра ліквідності та залученості учасників.',
                    'Open Interest (OI) — the total number of open (outstanding) futures contracts in the market. Each contract has a buyer and a seller, so OI is counted once. It measures liquidity and participant engagement.'
                )}</p>

                <article id="oi-pct" className="doc-article">
                    <h3>% OI — {L('Тижнева зміна OI у відсотках', 'Weekly OI Change in Percent')}</h3>
                    <div className="doc-meta"><Tag color="gray">{L('Колонка', 'Column')}</Tag> <Tag color="emerald">{L('Розрахункова', 'Calculated')}</Tag></div>
                    <Formula>% OI = (OI Change / OI) × 100</Formula>
                    <p>{L(
                        'Показує відносну зміну Open Interest за тиждень. Позитивне значення — нові позиції відкриваються, від\'ємне — позиції закриваються.',
                        'Shows relative change in Open Interest for the week. Positive — new positions opening, negative — positions closing.'
                    )}</p>
                </article>

                <article id="oi-change" className="doc-article">
                    <h3>Change — {L('Абсолютна зміна OI', 'Absolute OI Change')}</h3>
                    <div className="doc-meta"><Tag color="gray">{L('Колонка', 'Column')}</Tag> <Tag color="blue">{L('Дані CFTC', 'CFTC Data')}</Tag></div>
                    <p>{L('Абсолютна тижнева зміна Open Interest у контрактах.', 'Absolute weekly change in Open Interest in contracts.')}</p>
                    <div className="my-3 text-[11.5px] space-y-1">
                        <div className="flex gap-2"><span className="text-green-400">▲ OI + ▲ Price</span> <span className="text-[#a3a3a3]">→ {L('Тренд підтверджений новими позиціями', 'Trend confirmed by new positions')}</span></div>
                        <div className="flex gap-2"><span className="text-green-400">▲ OI + ▼ Price</span> <span className="text-[#a3a3a3]">→ {L('Нові короткі позиції входять', 'New short positions entering')}</span></div>
                        <div className="flex gap-2"><span className="text-red-400">▼ OI + ▲ Price</span> <span className="text-[#a3a3a3]">→ {L('Short covering (закриття шортів)', 'Short covering')}</span></div>
                        <div className="flex gap-2"><span className="text-red-400">▼ OI + ▼ Price</span> <span className="text-[#a3a3a3]">→ {L('Long liquidation (закриття лонгів)', 'Long liquidation')}</span></div>
                    </div>
                </article>

                <article id="oi-value" className="doc-article">
                    <h3>OI — {L('Абсолютне значення', 'Absolute Value')}</h3>
                    <div className="doc-meta"><Tag color="gray">{L('Колонка', 'Column')}</Tag> <Tag color="blue">{L('Дані CFTC', 'CFTC Data')}</Tag></div>
                    <p>{L(
                        'Загальна кількість відкритих ф\'ючерсних контрактів. Чим вищий OI, тим ліквідніший ринок і тим надійніші аналітичні сигнали.',
                        'Total number of open futures contracts. Higher OI means more liquid market and more reliable analytical signals.'
                    )}</p>
                </article>
            </section>

            {/* ── INDICATORS ── */}
            <section id="indicators" className="doc-section">
                <h2>{L('Індикатори', 'Indicators')}</h2>
                <p>{L(
                    'Система розраховує три ключових похідних індикатора для кожної групи учасників. Всі три нормалізують Net Position різними способами.',
                    'The system calculates three key derived indicators for each participant group. All three normalize Net Position in different ways.'
                )}</p>

                <article id="ind-wci" className="doc-article">
                    <h3>WCI — Williams Commercial Index (26w)</h3>
                    <div className="doc-meta">
                        <Tag color="emerald">{L('Розрахункова', 'Calculated')}</Tag>
                        <Tag color="amber">{L('Фіксований період: 26 тижнів', 'Fixed period: 26 weeks')}</Tag>
                    </div>
                    <p>{L(
                        'Індикатор, створений Ларрі Вільямсом. Нормалізує чисту позицію відносно діапазону за фіксований період 26 тижнів (≈ 6 місяців). Застосовується до кожної групи учасників.',
                        'Indicator created by Larry Williams. Normalizes net position relative to the range over a fixed 26-week period (≈ 6 months). Applied to each participant group.'
                    )}</p>
                    <Formula>{`WCI = ((Net − Min Net₂₆w) / (Max Net₂₆w − Min Net₂₆w)) × 100

${L('Результат', 'Result')}: 0% — 100%
${L('Якщо Max = Min → WCI = 50%', 'If Max = Min → WCI = 50%')}`}</Formula>
                    <div className="my-3 text-[11.5px] space-y-1">
                        <div className="flex gap-2"><span className="text-green-400 min-w-[90px]">{'WCI > 80%'}</span> <span className="text-[#a3a3a3]">{L('— Позиціонування на верхньому екстремумі за 6 місяців', '— Positioning at upper extreme for 6 months')}</span></div>
                        <div className="flex gap-2"><span className="text-[#a3a3a3] min-w-[90px]">{'WCI ≈ 50%'}</span> <span className="text-[#a3a3a3]">{L('— Нейтральне (середина діапазону)', '— Neutral (mid-range)')}</span></div>
                        <div className="flex gap-2"><span className="text-red-400 min-w-[90px]">{'WCI < 20%'}</span> <span className="text-[#a3a3a3]">{L('— Позиціонування на нижньому екстремумі за 6 місяців', '— Positioning at lower extreme for 6 months')}</span></div>
                    </div>
                </article>

                <article id="ind-cot-index" className="doc-article">
                    <h3>COT Index</h3>
                    <div className="doc-meta">
                        <Tag color="emerald">{L('Розрахункова', 'Calculated')}</Tag>
                        <Tag color="blue">{L('3 періоди × N груп', '3 periods × N groups')}</Tag>
                    </div>
                    <p>{L(
                        'Стохастичний осцилятор позиціонування. Показує де знаходиться поточна Net Position відносно мінімуму та максимуму за визначений lookback-період. Розраховується для кожної групи та для трьох часових горизонтів.',
                        'Stochastic oscillator of positioning. Shows where current Net Position sits relative to minimum and maximum over a defined lookback period. Calculated for each group and for three time horizons.'
                    )}</p>
                    <div className="my-3 text-[11.5px] space-y-1">
                        <div className="flex gap-2"><span className="text-[#a3a3a3] min-w-[60px]">3m</span> <span className="text-[#a3a3a3]">= 13 {L('тижнів', 'weeks')} (≈ {L('квартал', 'quarter')})</span></div>
                        <div className="flex gap-2"><span className="text-[#a3a3a3] min-w-[60px]">1y</span> <span className="text-[#a3a3a3]">= 52 {L('тижні', 'weeks')} ({L('рік', 'year')})</span></div>
                        <div className="flex gap-2"><span className="text-[#a3a3a3] min-w-[60px]">3y</span> <span className="text-[#a3a3a3]">= 156 {L('тижнів', 'weeks')} (3 {L('роки', 'years')})</span></div>
                    </div>
                    <Formula>{`COT Index = ((Net − Min Net over N weeks) / (Max Net over N weeks − Min Net over N weeks)) × 100

${L('Результат', 'Result')}: 0% — 100%`}</Formula>
                    <div className="my-3 text-[11.5px] space-y-1">
                        <div className="flex gap-2"><span className="text-green-400 font-semibold min-w-[50px]">100%</span> <span className="text-[#a3a3a3]">{L('— Net Position на максимумі за період', '— Net Position at period maximum')}</span></div>
                        <div className="flex gap-2"><span className="text-[#a3a3a3] min-w-[50px]">50%</span> <span className="text-[#a3a3a3]">{L('— Середина діапазону', '— Mid-range')}</span></div>
                        <div className="flex gap-2"><span className="text-red-400 font-semibold min-w-[50px]">0%</span> <span className="text-[#a3a3a3]">{L('— Net Position на мінімумі за період', '— Net Position at period minimum')}</span></div>
                    </div>
                    <Note>
                        {L(
                            'Різні періоди дають різну перспективу. COT Index (3m) — тактичний, швидко реагує. COT Index (3y) — стратегічний, фільтрує шум. Найсильніший сигнал — коли всі три періоди вирівняні.',
                            'Different periods provide different perspectives. COT Index (3m) — tactical, reacts quickly. COT Index (3y) — strategic, filters noise. Strongest signal — when all three periods are aligned.'
                        )}
                    </Note>
                </article>

                <article id="ind-crowded" className="doc-article">
                    <h3>Crowded Level (%)</h3>
                    <div className="doc-meta">
                        <Tag color="emerald">{L('Розрахункова', 'Calculated')}</Tag>
                        <Tag color="red">{L('Генерує сигнали', 'Generates signals')}</Tag>
                    </div>
                    <p>{L(
                        'Поточне значення COT Index (1Y) для групи. На відміну від WCI (26 тижнів), використовує річний lookback. При досягненні екстремальних рівнів генеруються сигнали BUY/SELL.',
                        'Current value of COT Index (1Y) for the group. Unlike WCI (26 weeks), uses yearly lookback. When extreme levels are reached, BUY/SELL signals are generated.'
                    )}</p>
                    <div className="my-4 space-y-3">
                        <div className="px-4 py-3 bg-white/[0.02] border border-[#262626] rounded-sm">
                            <div className="text-green-400 font-bold text-[12px] mb-1">{L('Комерційна / хеджерська група', 'Commercial / hedger group')}</div>
                            <div className="text-[11.5px] text-[#a3a3a3] space-y-1">
                                <div>≥ 80% → <span className="text-green-400 font-semibold">BUY</span></div>
                                <div>≤ 20% → <span className="text-red-400 font-semibold">SELL</span></div>
                            </div>
                        </div>
                        <div className="px-4 py-3 bg-white/[0.02] border border-[#262626] rounded-sm">
                            <div className="text-amber-400 font-bold text-[12px] mb-1">{L('Спекулятивна група — інвертована логіка', 'Speculative group — inverted logic')}</div>
                            <div className="text-[11.5px] text-[#a3a3a3] space-y-1">
                                <div>≥ 80% → <span className="text-red-400 font-semibold">SELL</span> ({L('контраріанський', 'contrarian')})</div>
                                <div>≤ 20% → <span className="text-green-400 font-semibold">BUY</span> ({L('контраріанський', 'contrarian')})</div>
                            </div>
                        </div>
                    </div>
                    <Note>
                        {L(
                            'Логіка для комерційних/хеджерських груп — пряма (високе позиціонування = BUY), для спекулятивних — інвертована (контраріанська). Яка група належить до якого типу визначається конфігурацією системи для кожного типу звіту.',
                            'Logic for commercial/hedger groups is direct (high positioning = BUY), for speculative groups — inverted (contrarian). Which group belongs to which type is determined by system configuration for each report type.'
                        )}
                    </Note>
                </article>
            </section>

            {/* ── STAT ROWS ── */}
            <section id="stat-rows" className="doc-section">
                <h2>{L('Статистичні рядки', 'Statistical Rows')}</h2>
                <p>{L(
                    'У верхній частині таблиці розташовані статистичні рядки, що надають контекст для кожної числової колонки:',
                    'At the top of the table, statistical rows provide context for each numerical column:'
                )}</p>
                <div className="my-4 space-y-3 text-[11.5px]">
                    {[
                        ['Max.', (ua, en) => lang === 'ua' ? 'Абсолютний максимум за весь доступний період' : 'Absolute maximum over entire available period'],
                        ['Min.', (ua, en) => lang === 'ua' ? 'Абсолютний мінімум за весь доступний період' : 'Absolute minimum over entire available period'],
                        ['Max. 5y', (ua, en) => lang === 'ua' ? 'Максимум за останні 5 років (260 тижнів)' : 'Maximum over last 5 years (260 weeks)'],
                        ['Min. 5y', (ua, en) => lang === 'ua' ? 'Мінімум за останні 5 років (260 тижнів)' : 'Minimum over last 5 years (260 weeks)'],
                        ['13 week avg', (ua, en) => lang === 'ua' ? 'Середнє арифметичне за останні 13 тижнів (≈ квартал)' : 'Arithmetic average over last 13 weeks (≈ quarter)'],
                    ].map(([label, descFn], i) => (
                        <div key={i} className="flex gap-3">
                            <span className="text-[#a3a3a3] font-semibold min-w-[100px]">{label}</span>
                            <span className="text-[#a3a3a3]">{descFn()}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── HEATMAP ── */}
            <section id="heatmap" className="doc-section">
                <h2>{L('Кольорова карта (Heatmap)', 'Heatmap')}</h2>
                <p>{L(
                    'Кожна клітинка таблиці має градієнтну кольорову заливку для швидкої візуальної ідентифікації напрямку та інтенсивності значень.',
                    'Each table cell has a gradient color fill for quick visual identification of direction and intensity of values.'
                )}</p>

                <h3 className="mt-5">Net Position, Change, % net/OI</h3>
                <div className="my-3 text-[11.5px] space-y-1">
                    <div className="flex items-center gap-3">
                        <span className="inline-block w-5 h-3 rounded" style={{ backgroundColor: 'rgba(0,176,80,0.7)' }} />
                        <span className="text-[#a3a3a3]">{L('Позитивне значення → зелений', 'Positive value → green')}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="inline-block w-5 h-3 rounded" style={{ backgroundColor: 'rgba(220,53,69,0.7)' }} />
                        <span className="text-[#a3a3a3]">{L('Від\'ємне значення → червоний', 'Negative value → red')}</span>
                    </div>
                </div>

                <h3 className="mt-5">Ch (Long) / Ch (Short)</h3>
                <div className="my-3 text-[11.5px] space-y-1">
                    <div className="flex items-center gap-3">
                        <span className="inline-block w-5 h-3 rounded" style={{ backgroundColor: 'rgba(0,176,80,0.7)' }} />
                        <span className="text-[#a3a3a3]">Ch (Long) — {L('завжди зелений', 'always green')}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="inline-block w-5 h-3 rounded" style={{ backgroundColor: 'rgba(220,53,69,0.7)' }} />
                        <span className="text-[#a3a3a3]">Ch (Short) — {L('завжди червоний', 'always red')}</span>
                    </div>
                </div>

                <h3 className="mt-5">COT Index, WCI, Crowded Level ({L('центровані на 50%', 'centered on 50%')})</h3>
                <div className="my-3 text-[11.5px] space-y-1">
                    <div className="flex items-center gap-3">
                        <span className="inline-block w-5 h-3 rounded" style={{ backgroundColor: 'rgba(0,176,80,0.7)' }} />
                        <span className="text-[#a3a3a3]">{'>'} 50% → {L('зелений', 'green')}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="inline-block w-5 h-3 rounded bg-transparent border border-[#333]" />
                        <span className="text-[#a3a3a3]">= 50% → {L('нейтральний', 'neutral')}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="inline-block w-5 h-3 rounded" style={{ backgroundColor: 'rgba(220,53,69,0.7)' }} />
                        <span className="text-[#a3a3a3]">{'<'} 50% → {L('червоний', 'red')}</span>
                    </div>
                </div>
                <Formula>{`opacity = 0.05 + (|${L('значення', 'value')}| / max) × 0.80
${L('Діапазон', 'Range')}: 0.05 (${L('ледь видимий', 'barely visible')}) — 0.85 (${L('насичений', 'saturated')})`}</Formula>
            </section>

            {/* ── SIGNALS ── */}
            <section id="signals" className="doc-section">
                <h2>{L('Сигнали BUY / SELL', 'BUY / SELL Signals')}</h2>
                <p>{L(
                    'Сигнали генеруються автоматично на основі Crowded Level (COT Index 1Y). Коли позиціонування групи досягає екстремальних рівнів (≥ 80% або ≤ 20%), система відображає відповідний сигнал.',
                    'Signals are generated automatically based on Crowded Level (COT Index 1Y). When a group\'s positioning reaches extreme levels (≥ 80% or ≤ 20%), the system displays the corresponding signal.'
                )}</p>
                <Note>
                    {L(
                        'Сигнали є інформаційними індикаторами екстремального позиціонування. Вони вказують на потенційно значущі рівні, але не є торговими рекомендаціями. Контекст ринку, ліквідність та підтвердження через інші інструменти завжди необхідні для прийняття рішень.',
                        'Signals are informational indicators of extreme positioning. They point to potentially significant levels but are not trading recommendations. Market context, liquidity, and confirmation through other tools are always necessary for decision-making.'
                    )}
                </Note>
            </section>

            {/* ── DATA SOURCE ── */}
            <section id="data-source" className="doc-section">
                <h2>{L('Джерело даних', 'Data Source')}</h2>
                <p>{L(
                    'Усі дані отримуються безпосередньо з офіційного сайту CFTC (cftc.gov).',
                    'All data is sourced directly from the official CFTC website (cftc.gov).'
                )}</p>
                <InfoTable rows={[
                    [L('Джерело', 'Source'), 'U.S. Commodity Futures Trading Commission (CFTC)'],
                    [L('Історичні дані', 'Historical data'), L('Річні ZIP-архіви з CSV (5 років)', 'Yearly ZIP archives with CSV (5 years)')],
                    [L('Поточний тиждень', 'Current week'), L('TXT-файли без заголовків (оновлюються щоп\'ятниці)', 'TXT files without headers (updated every Friday)')],
                    [L('Оновлення', 'Updates'), L('Щоп\'ятниці ~15:30 ET (дані станом на вівторок)', 'Every Friday ~3:30 PM ET (data as of Tuesday)')],
                    [L('Дані про ціни', 'Price data'), 'Yahoo Finance (3 years)'],
                ]} />

                <h3 className="mt-5">{L('Файли по типах звітів', 'Files by Report Types')}</h3>
                <div className="my-3 text-[11.5px] space-y-2">
                    <div className="flex gap-3"><Tag color="emerald">Legacy FO</Tag><span className="text-[#a3a3a3] font-mono text-[10px]">{'deacot{YYYY}.zip / deacom.txt'}</span></div>
                    <div className="flex gap-3"><Tag color="emerald">Legacy CO</Tag><span className="text-[#a3a3a3] font-mono text-[10px]">{'deacot{YYYY}.zip / deacom.txt'}</span></div>
                    <div className="flex gap-3"><Tag color="amber">Disagg FO</Tag><span className="text-[#a3a3a3] font-mono text-[10px]">{'fut_disagg_txt_{YYYY}.zip / f_year.txt'}</span></div>
                    <div className="flex gap-3"><Tag color="amber">Disagg CO</Tag><span className="text-[#a3a3a3] font-mono text-[10px]">{'com_disagg_txt_{YYYY}.zip / f_year.txt'}</span></div>
                    <div className="flex gap-3"><Tag color="purple">TFF FO</Tag><span className="text-[#a3a3a3] font-mono text-[10px]">{'fut_fin_txt_{YYYY}.zip / FinFutYY.txt'}</span></div>
                    <div className="flex gap-3"><Tag color="purple">TFF CO</Tag><span className="text-[#a3a3a3] font-mono text-[10px]">{'com_fin_txt_{YYYY}.zip / FinComYY.txt'}</span></div>
                </div>
            </section>
        </div>
    );
}

/* =====================================================
   Screener documentation tab
   ===================================================== */

function ScreenerDocContent({ lang }) {
    const L = (ua, en) => lang === 'ua' ? ua : en;

    return (
        <div className="prose-dark">
            <section id="scr-overview" className="doc-section">
                <h2>{L('Огляд Screener', 'Screener Overview')}</h2>
                <p>{L(
                    'Screener — таблиця з оглядом усіх ринків одночасно. Для кожного ринку показано структуру позицій кожної групи трейдерів: загальну кількість, розподіл Long/Short, зміни та частку від Open Interest.',
                    'Screener is a table providing an overview of all markets simultaneously. For each market it shows the position structure of each trader group: total count, Long/Short distribution, changes, and share of Open Interest.'
                )}</p>
                <p>{L(
                    'Натискання на рядок ринку відкриває детальні графіки для аналізу.',
                    'Clicking a market row opens detailed charts for analysis.'
                )}</p>
            </section>

            <section id="scr-columns" className="doc-section">
                <h2>{L('Колонки скринера', 'Screener Columns')}</h2>

                <article id="scr-col-fixed" className="doc-article">
                    <h3>{L('Загальні колонки', 'Fixed Columns')}</h3>
                    <div className="my-4 space-y-3 text-[11.5px]">
                        {[
                            ['Market', L('Назва ринку (актив). Відображається лише назва інструменту без біржі.', 'Market name (asset). Shows instrument name without exchange.')],
                            ['Category', L('Категорія: FX, Crypto, Energy, Metals, Grains, Softs, Indices, Rates, Livestock, Other', 'Category: FX, Crypto, Energy, Metals, Grains, Softs, Indices, Rates, Livestock, Other')],
                            ['Date', L('Дата останнього тижневого звіту CFTC', 'Date of last weekly CFTC report')],
                        ].map(([col, desc], i) => (
                            <div key={i} className="flex gap-3">
                                <span className="text-[#e5e5e5] font-semibold min-w-[80px] flex-shrink-0">{col}</span>
                                <span className="text-[#a3a3a3]">{desc}</span>
                            </div>
                        ))}
                    </div>
                </article>

                <article id="scr-col-group" className="doc-article">
                    <h3>{L('Колонки по групах учасників', 'Per-Group Columns')}</h3>
                    <p>{L(
                        'Для кожної групи трейдерів (кількість груп залежить від типу звіту) відображається набір з 5 колонок:',
                        'For each trader group (number of groups depends on report type) a set of 5 columns is displayed:'
                    )}</p>
                    <div className="my-4 space-y-3 text-[11.5px]">
                        {[
                            ['Pos', L('Загальна кількість позицій групи (Long + Short). Показує масштаб присутності групи на ринку.', 'Total positions of the group (Long + Short). Shows the scale of group presence in the market.')],
                            ['L/S', L('Візуальна шкала пропорції Long (зелений) та Short (червоний). При наведенні — tooltip з точною кількістю Long/Short позицій, їх відсотками та тижневими змінами.', 'Visual bar showing Long (green) and Short (red) proportion. On hover — tooltip with exact Long/Short counts, percentages, and weekly changes.')],
                            ['Δ', L('Тижнева зміна загальної кількості позицій (Δ Long + Δ Short). Зелений — зростання, червоний — скорочення.', 'Weekly change in total positions (Δ Long + Δ Short). Green — increase, red — decrease.')],
                            ['% OI', L('Загальна кількість позицій групи як відсоток від Open Interest. Показує частку ринку, яку займає ця група.', 'Total group positions as percentage of Open Interest. Shows the market share occupied by this group.')],
                            ['Δ%', L('Тижнева зміна частки % OI. Показує чи група нарощує або скорочує свою присутність на ринку.', 'Weekly change in % OI share. Shows whether the group is increasing or decreasing its market presence.')],
                        ].map(([col, desc], i) => (
                            <div key={i} className="flex gap-3">
                                <span className="text-[#e5e5e5] font-semibold min-w-[50px] flex-shrink-0">{col}</span>
                                <span className="text-[#a3a3a3]">{desc}</span>
                            </div>
                        ))}
                    </div>
                    <Formula>{`Pos = Long + Short
Δ = Δ Long + Δ Short
% OI = (Pos / Open Interest) × 100
Δ% = % OI${L(' поточний', ' current')} − % OI${L(' минулий тиждень', ' previous week')}`}</Formula>
                </article>

                <article id="scr-col-oi" className="doc-article">
                    <h3>Open Interest</h3>
                    <p>{L(
                        'Блок Open Interest розташований в кінці таблиці після колонок усіх груп:',
                        'Open Interest block is located at the end of the table after all group columns:'
                    )}</p>
                    <div className="my-4 space-y-3 text-[11.5px]">
                        {[
                            ['OI', L('Загальна кількість відкритих контрактів на ринку.', 'Total number of open contracts in the market.')],
                            ['Δ OI', L('Тижнева зміна Open Interest. Зростання = нові позиції відкриваються, зменшення = позиції закриваються.', 'Weekly Open Interest change. Increase = new positions opening, decrease = positions closing.')],
                        ].map(([col, desc], i) => (
                            <div key={i} className="flex gap-3">
                                <span className="text-[#e5e5e5] font-semibold min-w-[50px] flex-shrink-0">{col}</span>
                                <span className="text-[#a3a3a3]">{desc}</span>
                            </div>
                        ))}
                    </div>
                </article>

                <article id="scr-col-total" className="doc-article">
                    <h3>Total L/S</h3>
                    <p>{L(
                        'Окрема секція з загальним баром Long/Short по всьому ринку — сумує позиції всіх груп учасників. Показує загальний баланс бичачого та ведмежого позиціонування на ринку.',
                        'Separate section with an overall Long/Short bar across all groups. Shows the total balance of bullish and bearish positioning in the market.'
                    )}</p>
                    <p>{L(
                        'При наведенні — tooltip із сумарними Long та Short позиціями всіх груп та їх змінами за тиждень.',
                        'On hover — tooltip with total Long and Short positions across all groups and their weekly changes.'
                    )}</p>
                </article>
            </section>

            <section id="scr-filters" className="doc-section">
                <h2>{L('Фільтри та сортування', 'Filters & Sorting')}</h2>
                <div className="my-4 space-y-3 text-[11.5px]">
                    <div className="flex gap-3">
                        <span className="text-[#e5e5e5] font-semibold min-w-[120px]">{L('Категорії', 'Categories')}</span>
                        <span className="text-[#a3a3a3]">{L('Фільтрація за типом активу (FX, Crypto, Energy, Metals тощо). Кожна кнопка показує кількість ринків у категорії.', 'Filter by asset type (FX, Crypto, Energy, Metals etc.). Each button shows the number of markets in the category.')}</span>
                    </div>
                    <div className="flex gap-3">
                        <span className="text-[#e5e5e5] font-semibold min-w-[120px]">{L('Сортування', 'Sorting')}</span>
                        <span className="text-[#a3a3a3]">{L('Натисніть на заголовок будь-якої колонки для сортування (▲ asc / ▼ desc). Колонка L/S сортує по частці Short позицій.', 'Click any column header to sort (▲ asc / ▼ desc). L/S column sorts by Short position ratio.')}</span>
                    </div>
                </div>
                <Note>
                    {L(
                        'За замовчуванням таблиця сортується по Open Interest (найбільші ринки зверху). Натискання на L/S будь-якої групи дозволяє знайти ринки з найбільш шортовим або лонговим позиціонуванням.',
                        'By default the table is sorted by Open Interest (largest markets first). Clicking L/S of any group helps find markets with the most short or long positioning.'
                    )}
                </Note>
            </section>
        </div>
    );
}

/* =====================================================
   Charts documentation tab
   ===================================================== */

function ChartsDocContent({ lang }) {
    const L = (ua, en) => lang === 'ua' ? ua : en;

    return (
        <div className="prose-dark">
            <section id="ch-overview" className="doc-section">
                <h2>{L('Огляд графіків', 'Charts Overview')}</h2>
                <p>{L(
                    'Модальне вікно Charts надає інтерактивну візуалізацію даних COT для обраного ринку. Доступні три режими відображення та часові діапазони (6M, 1Y, 2Y, ALL).',
                    'The Charts modal provides interactive visualization of COT data for the selected market. Three view modes and time ranges (6M, 1Y, 2Y, ALL) are available.'
                )}</p>
                <div className="my-4 space-y-2 text-[11.5px]">
                    <div className="flex gap-3">
                        <span className="text-[#e5e5e5] font-semibold min-w-[100px]">Bubbles</span>
                        <span className="text-[#a3a3a3]">{L('Ціна + бульбашки Net Position + Delta Histogram', 'Price + Net Position bubbles + Delta Histogram')}</span>
                    </div>
                    <div className="flex gap-3">
                        <span className="text-[#e5e5e5] font-semibold min-w-[100px]">Net Positions</span>
                        <span className="text-[#a3a3a3]">{L('Лінійний графік Net Position для кожної групи', 'Line chart of Net Position for each group')}</span>
                    </div>
                    <div className="flex gap-3">
                        <span className="text-[#e5e5e5] font-semibold min-w-[100px]">Indicators</span>
                        <span className="text-[#a3a3a3]">{L('Ціна (зверху) + індикатор WCI/COT Index (знизу)', 'Price (top) + WCI/COT Index indicator (bottom)')}</span>
                    </div>
                </div>
                <p>{L(
                    'У верхній частині відображається назва ринку та код біржі. Панель управління дозволяє обрати режим відображення, часовий діапазон та перемикати групи трейдерів.',
                    'The top displays market name and exchange code. The control panel allows selecting view mode, time range, and toggling trader groups.'
                )}</p>
            </section>

            <section id="ch-net" className="doc-section">
                <h2>Net Position Chart</h2>
                <p>{L(
                    'Лінійний графік Net Position для кожної групи учасників. Дозволяє візуально оцінити динаміку та тренди позиціонування. Кожна група відображається окремою лінією з унікальним кольором.',
                    'Line chart of Net Position for each participant group. Allows visual assessment of positioning dynamics and trends. Each group is displayed as a separate line with a unique color.'
                )}</p>
                <Note>
                    {L(
                        'При наведенні на графік з\'являється tooltip з точними значеннями для кожної групи на обрану дату.',
                        'Hovering over the chart shows a tooltip with exact values for each group at the selected date.'
                    )}
                </Note>
            </section>

            <section id="ch-indicators" className="doc-section">
                <h2>{L('Режим Indicators', 'Indicators Mode')}</h2>
                <p>{L(
                    'Двопанельний режим: верхня панель (65%) — графік ціни, нижня панель (35%) — лінійний графік обраного індикатора для кожної групи. Доступні перемикачі груп трейдерів для фільтрації ліній.',
                    'Dual-panel mode: top panel (65%) — price chart, bottom panel (35%) — line chart of the selected indicator for each group. Group toggle switches available for filtering lines.'
                )}</p>

                <article id="ch-ind-cot" className="doc-article">
                    <h3>COT Index</h3>
                    <div className="doc-meta">
                        <Tag color="emerald">{L('Розрахункова', 'Calculated')}</Tag>
                        <Tag color="blue">{L('3 періоди', '3 periods')}</Tag>
                    </div>
                    <p>{L(
                        'Стохастичний осцилятор позиціонування. Показує де знаходиться поточна Net Position відносно діапазону за lookback-період. Горизонтальні лінії на 20% та 80% позначають зони екстремумів.',
                        'Stochastic oscillator of positioning. Shows where current Net Position sits relative to the range over a lookback period. Horizontal lines at 20% and 80% mark extreme zones.'
                    )}</p>
                    <div className="my-3 text-[11.5px] space-y-1">
                        <div className="flex gap-2"><span className="text-[#a3a3a3] min-w-[60px]">3m</span> <span className="text-[#a3a3a3]">= 13 {L('тижнів', 'weeks')} (≈ {L('квартал', 'quarter')})</span></div>
                        <div className="flex gap-2"><span className="text-[#a3a3a3] min-w-[60px]">1y</span> <span className="text-[#a3a3a3]">= 52 {L('тижні', 'weeks')} ({L('рік', 'year')})</span></div>
                        <div className="flex gap-2"><span className="text-[#a3a3a3] min-w-[60px]">3y</span> <span className="text-[#a3a3a3]">= 156 {L('тижнів', 'weeks')} (3 {L('роки', 'years')})</span></div>
                    </div>
                    <Formula>{`COT Index = ((Net − Min Net) / (Max Net − Min Net)) × 100
${L('Діапазон', 'Range')}: 0% — 100%`}</Formula>
                </article>

                <article id="ch-ind-wci" className="doc-article">
                    <h3>WCI — Williams Commercial Index (26w)</h3>
                    <div className="doc-meta">
                        <Tag color="emerald">{L('Розрахункова', 'Calculated')}</Tag>
                        <Tag color="amber">{L('Фіксований період: 26 тижнів', 'Fixed period: 26 weeks')}</Tag>
                    </div>
                    <p>{L(
                        'Індикатор Ларрі Вільямса. Та сама формула що й COT Index, але з фіксованим lookback-періодом 26 тижнів (≈ 6 місяців).',
                        'Larry Williams\' indicator. Same formula as COT Index, but with a fixed 26-week lookback period (≈ 6 months).'
                    )}</p>
                    <Formula>{`WCI = ((Net − Min Net₂₆w) / (Max Net₂₆w − Min Net₂₆w)) × 100`}</Formula>
                </article>

                <Note>
                    {L(
                        'В режимі Indicators доступні перемикачі груп трейдерів (аналогічно режиму Bubbles), які дозволяють показувати/приховувати окремі групи на графіку індикатора.',
                        'In Indicators mode, trader group toggles are available (similar to Bubbles mode), allowing you to show/hide individual groups on the indicator chart.'
                    )}
                </Note>
            </section>

            <section id="ch-price" className="doc-section">
                <h2>{L('Графік ціни', 'Price Chart')}</h2>
                <p>{L(
                    'Лінійний графік ціни активу (дані Yahoo Finance). Колір лінії змінюється залежно від COT-сигналу (8 COT Signals). Відображається тільки якщо для даного ринку доступні цінові дані.',
                    'Line chart of asset price (Yahoo Finance data). Line color changes based on COT signal (8 COT Signals). Displayed only when price data is available for the market.'
                )}</p>
            </section>

            <section id="ch-8signals" className="doc-section">
                <h2>8 COT Signals</h2>
                <p>{L(
                    'Система 8 сигналів аналізує три змінні: напрямок ціни, зміну довгих та зміну коротких позицій. Кожна комбінація (↑/↓) створює унікальний сигнал:',
                    'The 8-signal system analyzes three variables: price direction, change in longs, and change in shorts. Each combination (↑/↓) creates a unique signal:'
                )}</p>
                <div className="my-4 space-y-2 text-[11.5px]">
                    {[
                        ['1. Strong Bullish', 'Price↑  Long↑  Short↓', '#22c55e', L('Бичачий тренд підтверджений позиціонуванням', 'Bullish trend confirmed by positioning')],
                        ['2. Accumulation', 'Price↓  Long↑  Short↓', '#10b981', L('Накопичення позицій на просіданні ціни', 'Position accumulation on price dip')],
                        ['3. Floor Building', 'Price↓  Long↑  Short↑', '#84cc16', L('Формування підтримки — нові позиції з обох сторін', 'Support building — new positions on both sides')],
                        ['4. Strong Bearish', 'Price↓  Long↓  Short↑', '#ef4444', L('Ведмежий тренд підтверджений позиціонуванням', 'Bearish trend confirmed by positioning')],
                        ['5. Distribution', 'Price↑  Long↓  Short↑', '#dc2626', L('Розподіл — продаж на зростанні ціни', 'Distribution — selling into price rally')],
                        ['6. Topping Out', 'Price↑  Long↑  Short↑', '#f97316', L('Формування вершини — нові позиції з обох сторін', 'Top forming — new positions on both sides')],
                        ['7. Profit Taking', 'Price↑  Long↓  Short↓', '#38bdf8', L('Фіксація прибутку — позиції закриваються', 'Profit taking — positions closing')],
                        ['8. Liquidation', 'Price↓  Long↓  Short↓', '#a855f7', L('Ліквідація — масове закриття позицій', 'Liquidation — mass position closing')],
                    ].map(([name, combo, color, desc], i) => (
                        <div key={i} className="flex items-start gap-3">
                            <span className="inline-block w-3 h-3 rounded-full flex-shrink-0 mt-0.5" style={{ backgroundColor: color }} />
                            <div>
                                <span className="text-[#e5e5e5] font-semibold">{name}</span>
                                <span className="text-[#525252] font-mono text-[10px] ml-2">{combo}</span>
                                <div className="text-[#a3a3a3] text-[10.5px] mt-0.5">{desc}</div>
                            </div>
                        </div>
                    ))}
                </div>
                <Note>
                    {L(
                        'Сигнали 8 COT відображаються як зміна кольору лінії ціни на графіку. Кожен тиждень ціновий графік розфарбовується відповідно до поточного сигналу.',
                        '8 COT signals are displayed as price line color changes on the chart. Each week the price chart is colored according to the current signal.'
                    )}
                </Note>
            </section>

            <section id="ch-bubbles" className="doc-section">
                <h2>{L('Режим Bubbles', 'Bubbles View')}</h2>
                <p>{L(
                    'Поєднує ціновий графік з бульбашками Net Position. Розмір бульбашки пропорційний абсолютному значенню Net Position групи. Колір — зелений для net long, червоний для net short.',
                    'Combines price chart with Net Position bubbles. Bubble size is proportional to the absolute value of group Net Position. Color — green for net long, red for net short.'
                )}</p>
                <p>{L(
                    'Додатково відображається Delta Histogram — гістограма тижневої зміни Net Position (Change). Дозволяє бачити momentum позиціонування.',
                    'Additionally displays Delta Histogram — bar chart of weekly Net Position change (Change). Shows positioning momentum.'
                )}</p>
            </section>

            <section id="ch-positions" className="doc-section">
                <h2>{L('Режим Positions', 'Positions View')}</h2>
                <p>{L(
                    'Детальний графік для кожної групи окремо: Long, Short позиції та їх зміни як бари. Дозволяє аналізувати структуру позиціонування кожної групи окремо.',
                    'Detailed chart for each group separately: Long, Short positions and their changes as bars. Allows analyzing the position structure of each group individually.'
                )}</p>
            </section>
        </div>
    );
}

/* =====================================================
   Modal wrapper
   ===================================================== */

export default function DocumentationModal({ isOpen, onClose }) {
    const [activeSection, setActiveSection] = useState('overview');
    const [expandedGroups, setExpandedGroups] = useState({});
    const [docTab, setDocTab] = useState('report');
    const [lang, setLang] = useState(() => {
        try { return localStorage.getItem('docLang') || 'ua'; } catch { return 'ua'; }
    });
    const contentRef = useRef(null);

    // Persist language choice
    useEffect(() => {
        try { localStorage.setItem('docLang', lang); } catch { }
    }, [lang]);

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

    const switchDocTab = (tab) => {
        setDocTab(tab);
        const firstSection = SECTIONS[tab]?.(lang)?.[0];
        setActiveSection(firstSection?.id || 'overview');
        setExpandedGroups({});
        if (contentRef.current) contentRef.current.scrollTop = 0;
    };

    const toggleGroup = (id) => {
        setExpandedGroups(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const scrollTo = (id) => {
        if (!contentRef.current) return;
        const el = contentRef.current.querySelector(`#${id}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg" backdropBlur="md">
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
                        {['report', 'charts', 'screener'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => switchDocTab(tab)}
                                className={`flex-1 px-2 py-1.5 rounded-sm text-[10px] font-semibold tracking-widest uppercase transition-all duration-200 ${docTab === tab
                                    ? 'bg-text-primary text-black'
                                    : 'text-muted hover:text-text-secondary hover:bg-surface-hover'
                                    }`}
                            >
                                {tab === 'report' ? T.tabReport[lang] : tab === 'charts' ? T.tabCharts[lang] : T.tabScreener[lang]}
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
                    </div>
                </div>
        </Modal>
    );
}
