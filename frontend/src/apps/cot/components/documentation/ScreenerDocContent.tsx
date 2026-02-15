import { Formula, Note, L } from './DocComponents';

export default function ScreenerDocContent({ lang }: { lang: string }) {
    return (
        <div className="prose-dark">
            <section id="scr-overview" className="doc-section">
                <h2>{L(lang, 'Огляд Screener', 'Screener Overview')}</h2>
                <p>{L(lang,
                    'Screener — таблиця з оглядом усіх ринків одночасно. Для кожного ринку показано структуру позицій кожної групи трейдерів: загальну кількість, розподіл Long/Short, зміни та частку від Open Interest.',
                    'Screener is a table providing an overview of all markets simultaneously. For each market it shows the position structure of each trader group: total count, Long/Short distribution, changes, and share of Open Interest.'
                )}</p>
                <p>{L(lang,
                    'Натискання на рядок ринку відкриває детальні графіки для аналізу.',
                    'Clicking a market row opens detailed charts for analysis.'
                )}</p>
            </section>

            <section id="scr-columns" className="doc-section">
                <h2>{L(lang, 'Колонки скринера', 'Screener Columns')}</h2>

                <article id="scr-col-fixed" className="doc-article">
                    <h3>{L(lang, 'Загальні колонки', 'Fixed Columns')}</h3>
                    <div className="my-4 space-y-3 text-[11.5px]">
                        {[
                            ['Market', L(lang, 'Назва ринку (актив). Відображається лише назва інструменту без біржі.', 'Market name (asset). Shows instrument name without exchange.')],
                            ['Category', L(lang, 'Категорія: FX, Crypto, Energy, Metals, Grains, Softs, Indices, Rates, Livestock, Other', 'Category: FX, Crypto, Energy, Metals, Grains, Softs, Indices, Rates, Livestock, Other')],
                            ['Date', L(lang, 'Дата останнього тижневого звіту CFTC', 'Date of last weekly CFTC report')],
                        ].map(([col, desc], i) => (
                            <div key={i} className="flex gap-3">
                                <span className="text-primary font-semibold min-w-[80px] flex-shrink-0">{col}</span>
                                <span className="text-text-secondary">{desc}</span>
                            </div>
                        ))}
                    </div>
                </article>

                <article id="scr-col-group" className="doc-article">
                    <h3>{L(lang, 'Колонки по групах учасників', 'Per-Group Columns')}</h3>
                    <p>{L(lang,
                        'Для кожної групи трейдерів (кількість груп залежить від типу звіту) відображається набір з 5 колонок:',
                        'For each trader group (number of groups depends on report type) a set of 5 columns is displayed:'
                    )}</p>
                    <div className="my-4 space-y-3 text-[11.5px]">
                        {[
                            ['Pos', L(lang, 'Загальна кількість позицій групи (Long + Short). Показує масштаб присутності групи на ринку.', 'Total positions of the group (Long + Short). Shows the scale of group presence in the market.')],
                            ['L/S', L(lang, 'Візуальна шкала пропорції Long (зелений) та Short (червоний). При наведенні — tooltip з точною кількістю Long/Short позицій, їх відсотками та тижневими змінами.', 'Visual bar showing Long (green) and Short (red) proportion. On hover — tooltip with exact Long/Short counts, percentages, and weekly changes.')],
                            ['Δ', L(lang, 'Тижнева зміна загальної кількості позицій (Δ Long + Δ Short). Зелений — зростання, червоний — скорочення.', 'Weekly change in total positions (Δ Long + Δ Short). Green — increase, red — decrease.')],
                            ['% OI', L(lang, 'Загальна кількість позицій групи як відсоток від Open Interest. Показує частку ринку, яку займає ця група.', 'Total group positions as percentage of Open Interest. Shows the market share occupied by this group.')],
                            ['Δ%', L(lang, 'Тижнева зміна частки % OI. Показує чи група нарощує або скорочує свою присутність на ринку.', 'Weekly change in % OI share. Shows whether the group is increasing or decreasing its market presence.')],
                        ].map(([col, desc], i) => (
                            <div key={i} className="flex gap-3">
                                <span className="text-primary font-semibold min-w-[50px] flex-shrink-0">{col}</span>
                                <span className="text-text-secondary">{desc}</span>
                            </div>
                        ))}
                    </div>
                    <Formula>{`Pos = Long + Short
Δ = Δ Long + Δ Short
% OI = (Pos / Open Interest) × 100
Δ% = % OI${L(lang, ' поточний', ' current')} − % OI${L(lang, ' минулий тиждень', ' previous week')}`}</Formula>
                </article>

                <article id="scr-col-oi" className="doc-article">
                    <h3>Open Interest</h3>
                    <p>{L(lang,
                        'Блок Open Interest розташований в кінці таблиці після колонок усіх груп:',
                        'Open Interest block is located at the end of the table after all group columns:'
                    )}</p>
                    <div className="my-4 space-y-3 text-[11.5px]">
                        {[
                            ['OI', L(lang, 'Загальна кількість відкритих контрактів на ринку.', 'Total number of open contracts in the market.')],
                            ['Δ OI', L(lang, 'Тижнева зміна Open Interest. Зростання = нові позиції відкриваються, зменшення = позиції закриваються.', 'Weekly Open Interest change. Increase = new positions opening, decrease = positions closing.')],
                        ].map(([col, desc], i) => (
                            <div key={i} className="flex gap-3">
                                <span className="text-primary font-semibold min-w-[50px] flex-shrink-0">{col}</span>
                                <span className="text-text-secondary">{desc}</span>
                            </div>
                        ))}
                    </div>
                </article>

                <article id="scr-col-total" className="doc-article">
                    <h3>Total L/S</h3>
                    <p>{L(lang,
                        'Окрема секція з загальним баром Long/Short по всьому ринку — сумує позиції всіх груп учасників. Показує загальний баланс бичачого та ведмежого позиціонування на ринку.',
                        'Separate section with an overall Long/Short bar across all groups. Shows the total balance of bullish and bearish positioning in the market.'
                    )}</p>
                    <p>{L(lang,
                        'При наведенні — tooltip із сумарними Long та Short позиціями всіх груп та їх змінами за тиждень.',
                        'On hover — tooltip with total Long and Short positions across all groups and their weekly changes.'
                    )}</p>
                </article>
            </section>

            <section id="scr-filters" className="doc-section">
                <h2>{L(lang, 'Фільтри та сортування', 'Filters & Sorting')}</h2>
                <div className="my-4 space-y-3 text-[11.5px]">
                    <div className="flex gap-3">
                        <span className="text-primary font-semibold min-w-[120px]">{L(lang, 'Категорії', 'Categories')}</span>
                        <span className="text-text-secondary">{L(lang, 'Фільтрація за типом активу (FX, Crypto, Energy, Metals тощо). Кожна кнопка показує кількість ринків у категорії.', 'Filter by asset type (FX, Crypto, Energy, Metals etc.). Each button shows the number of markets in the category.')}</span>
                    </div>
                    <div className="flex gap-3">
                        <span className="text-primary font-semibold min-w-[120px]">{L(lang, 'Сортування', 'Sorting')}</span>
                        <span className="text-text-secondary">{L(lang, 'Натисніть на заголовок будь-якої колонки для сортування (▲ asc / ▼ desc). Колонка L/S сортує по частці Short позицій.', 'Click any column header to sort (▲ asc / ▼ desc). L/S column sorts by Short position ratio.')}</span>
                    </div>
                </div>
                <Note>
                    {L(lang,
                        'За замовчуванням таблиця сортується по Open Interest (найбільші ринки зверху). Натискання на L/S будь-якої групи дозволяє знайти ринки з найбільш шортовим або лонговим позиціонуванням.',
                        'By default the table is sorted by Open Interest (largest markets first). Clicking L/S of any group helps find markets with the most short or long positioning.'
                    )}
                </Note>
            </section>
        </div>
    );
}
