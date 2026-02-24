/**
 * Dashboard documentation content — explains all dashboard
 * analytics blocks, indicators, and how to interpret them.
 */

import { Note, L } from './DocComponents';

export default function DashboardDocContent({ lang }: { lang: string }) {
    return (
        <div className="prose-dark">
            {/* Overview */}
            <section id="dash-overview" className="doc-section">
                <h2>{L(lang, 'Огляд Dashboard', 'Dashboard Overview')}</h2>
                <p>{L(lang,
                    'Dashboard — головна аналітична сторінка для обраного активу. Містить 10+ блоків, що покривають позиціонування, динаміку відкритого інтересу, дивергенцію з ціною, FLIP-сигнали та фундаментальний контекст. Кожен блок можна інтерпретувати окремо або в комбінації для побудови торгового тези.',
                    'The Dashboard is the primary analytics page for a selected asset. It contains 10+ blocks covering positioning, open interest dynamics, price divergence, FLIP signals, and fundamental context. Each block can be interpreted individually or combined to build a trading thesis.'
                )}</p>
            </section>

            {/* Net Analysis */}
            <section id="dash-net" className="doc-section">
                <h2>Net Long / Short Analysis</h2>
                <p>{L(lang,
                    'Два парних графіки показують нетто-позиції спекулянтів (лонги та шорти) з перцентильними зонами та Z-Score. Фонові зони: зелена (Short Extremum <10p, потенціал росту), червона (Long Extremum >90p, ризик корекції). Z-Score відображається окремою лінією.',
                    'Two paired charts show speculator net positions (longs and shorts) with percentile zones and Z-Score. Background zones: green (Short Extremum <10p, upside potential), red (Long Extremum >90p, correction risk). Z-Score is displayed as a separate line.'
                )}</p>
                <div className="my-3 text-[11px] space-y-1">
                    <div className="flex gap-2">
                        <span className="text-red-400 font-semibold min-w-[130px]">Long Extreme (&gt;90)</span>
                        <span className="text-text-secondary">{L(lang, 'Перегрів — ризик розвороту вниз', 'Overheated — downside reversal risk')}</span>
                    </div>
                    <div className="flex gap-2">
                        <span className="text-amber-400 font-semibold min-w-[130px]">Above Average (75–90)</span>
                        <span className="text-text-secondary">{L(lang, 'Бичачий нахил', 'Bullish lean')}</span>
                    </div>
                    <div className="flex gap-2">
                        <span className="text-text-secondary font-semibold min-w-[130px]">Neutral (25–75)</span>
                        <span className="text-text-secondary">{L(lang, 'Нема чіткого сигналу', 'No clear signal')}</span>
                    </div>
                    <div className="flex gap-2">
                        <span className="text-blue-400 font-semibold min-w-[130px]">Below Average (10–25)</span>
                        <span className="text-text-secondary">{L(lang, 'Ведмежий нахил', 'Bearish lean')}</span>
                    </div>
                    <div className="flex gap-2">
                        <span className="text-emerald-400 font-semibold min-w-[130px]">Short Extreme (&lt;10)</span>
                        <span className="text-text-secondary">{L(lang, 'Капітуляція — потенціал для зростання', 'Capitulation — upside potential')}</span>
                    </div>
                </div>
            </section>

            {/* Divergence */}
            <section id="dash-divergence" className="doc-section">
                <h2>{L(lang, 'Price vs Positioning (Дивергенція)', 'Price vs Positioning (Divergence)')}</h2>
                <p>{L(lang,
                    'Двопанельний графік: верхня — ціна, нижня — нетто-позиції спекулянтів та комерційних. Бічна панель показує Spread Percentile — різницю між spec та comm позиціями у перцентильних термінах.',
                    'Two-panel chart: top — price, bottom — spec and commercial net positions. The sidebar shows Spread Percentile — the difference between spec and comm positions in percentile terms.'
                )}</p>
                <Note>
                    {L(lang,
                        'Spread P >90 = wide (сильна розбіжність), <10 = narrow (конвергенція). Крайні значення часто передують значним ціновим рухам.',
                        'Spread P >90 = wide (strong divergence), <10 = narrow (convergence). Extreme values often precede significant price moves.'
                    )}
                </Note>
            </section>

            {/* OI Analysis */}
            <section id="dash-oi" className="doc-section">
                <h2>Open Interest Pulse</h2>
                <p>{L(lang,
                    'Графік OI з кольоровою матрицею сигналів на базі зміни OI та ціни:',
                    'OI chart with a color-coded signal matrix based on OI and price changes:'
                )}</p>
                <div className="my-3 text-[11px] space-y-1">
                    <div className="flex gap-2">
                        <span className="text-green-400 font-semibold min-w-[140px]">Strong Demand</span>
                        <span className="text-text-secondary">{L(lang, 'Ціна↑ + OI↑ = нові покупці — бичачий', 'Price↑ + OI↑ = new buyers — bullish')}</span>
                    </div>
                    <div className="flex gap-2">
                        <span className="text-yellow-400 font-semibold min-w-[140px]">Long Liquidation</span>
                        <span className="text-text-secondary">{L(lang, 'Ціна↓ + OI↓ = закриття лонгів', 'Price↓ + OI↓ = closing longs')}</span>
                    </div>
                    <div className="flex gap-2">
                        <span className="text-blue-400 font-semibold min-w-[140px]">Short Covering</span>
                        <span className="text-text-secondary">{L(lang, 'Ціна↑ + OI↓ = закриття шортів', 'Price↑ + OI↓ = closing shorts')}</span>
                    </div>
                    <div className="flex gap-2">
                        <span className="text-red-400 font-semibold min-w-[140px]">New Supply</span>
                        <span className="text-text-secondary">{L(lang, 'Ціна↓ + OI↑ = нові продавці — ведмежий', 'Price↓ + OI↑ = new sellers — bearish')}</span>
                    </div>
                </div>
            </section>

            {/* Distribution */}
            <section id="dash-distribution" className="doc-section">
                <h2>{L(lang, 'Гістограма розподілу', 'Distribution Histogram')}</h2>
                <p>{L(lang,
                    'Гістограма нетто-позиції за обраний lookback період. Вертикальна лінія показує поточну позицію. Допомагає візуально оцінити наскільки "екстремальна" поточна позиція відносно історії.',
                    'Histogram of net positions over the selected lookback period. A vertical line marks the current position. Helps visually assess how "extreme" the current positioning is relative to history.'
                )}</p>
            </section>

            {/* FLIP */}
            <section id="dash-flip" className="doc-section">
                <h2>FLIP Detection</h2>
                <p>{L(lang,
                    'FLIP — перетин нульової позначки нетто-позиції. Зелена бульбашка = перехід у net long (Short → Long), червона = перехід у net short (Long → Short). Розмір бульбашки пропорційний величині зміни позиції.',
                    'FLIP — net position zero crossing. Green bubble = transition to net long (Short → Long), red = transition to net short (Long → Short). Bubble size is proportional to position change magnitude.'
                )}</p>
            </section>

            {/* Market Power */}
            <section id="dash-market-power" className="doc-section">
                <h2>Market Power</h2>
                <p>{L(lang,
                    'Стекований Area Chart, що показує частку лонгів та шортів спекулянтів у загальному OI.',
                    'Stacked Area Chart showing speculator long and short share of total OI.'
                )}</p>
                <div className="my-2 bg-surface rounded p-3 text-[11px] text-text-secondary font-mono">
                    Long Power = Spec Longs / OI × 100%<br />
                    Short Power = Spec Shorts / OI × 100%
                </div>
                <p>{L(lang,
                    'Коли Long Power значно перевищує Short Power — ринок бичачий. Стиснення (зближення) = невизначеність, потенціал для різкого руху.',
                    'When Long Power significantly exceeds Short Power — bullish market. Compression (convergence) = uncertainty, potential for a sharp move.'
                )}</p>
            </section>

            {/* Velocity */}
            <section id="dash-velocity" className="doc-section">
                <h2>{L(lang, 'Position Velocity (Швидкість)', 'Position Velocity')}</h2>
                <p>{L(lang,
                    'Друга похідна нетто-позиції — прискорення зміни. Позитивна швидкість = позиції зростають швидше. Діамант (⚠️) з\'являється коли напрямок швидкості протилежний напрямку нетто-позиції — ранній сигнал розвороту.',
                    'Second derivative of net position — acceleration of change. Positive velocity = positions growing faster. Diamond (⚠️) appears when velocity direction opposes net position direction — early reversal signal.'
                )}</p>
            </section>

            {/* Sentiment Divergence */}
            <section id="dash-sentiment" className="doc-section">
                <h2>{L(lang, 'Sentiment Divergence (Конфлікт)', 'Sentiment Divergence')}</h2>
                <p>{L(lang,
                    'Порівнює перцентилі спекулянтів та комерційних. Дивергенція виникає коли spec >= 90% та comm <= 10% (або навпаки). Потужний контраріан сигнал — "розумні гроші" бачать ринок інакше ніж натовп.',
                    'Compares spec and commercial percentiles. Divergence occurs when spec >= 90% and comm <= 10% (or vice versa). Powerful contrarian signal — "smart money" sees the market differently than the crowd.'
                )}</p>
            </section>

            {/* Concentration */}
            <section id="dash-concentration" className="doc-section">
                <h2>{L(lang, 'Concentration Ratio (Детектор китів)', 'Concentration Ratio (Whale Detector)')}</h2>
                <p>{L(lang,
                    'SVG-спідометр показує частку Top-4 трейдерів у загальній позиції. Три зони:',
                    'SVG gauge shows Top-4 trader share of total position. Three zones:'
                )}</p>
                <div className="my-3 text-[11px] space-y-1">
                    <div className="flex gap-2">
                        <span className="text-green-400 font-semibold min-w-[100px]">{L(lang, 'Здорова', 'Healthy')} (0–40%)</span>
                        <span className="text-text-secondary">{L(lang, 'Диверсифікований ринок', 'Diversified market')}</span>
                    </div>
                    <div className="flex gap-2">
                        <span className="text-yellow-400 font-semibold min-w-[100px]">{L(lang, 'Підвищена', 'Elevated')} (40–60%)</span>
                        <span className="text-text-secondary">{L(lang, 'Помірна концентрація — обережність', 'Moderate concentration — caution')}</span>
                    </div>
                    <div className="flex gap-2">
                        <span className="text-red-400 font-semibold min-w-[100px]">{L(lang, 'Небезпечна', 'Dangerous')} (&gt;60%)</span>
                        <span className="text-text-secondary">{L(lang, 'Рух тримається на 1–2 гравцях', 'Move held by 1–2 players')}</span>
                    </div>
                </div>
            </section>

            {/* Triple Lookback */}
            <section id="dash-triple" className="doc-section">
                <h2>{L(lang, 'Triple Lookback (Адаптивність)', 'Triple Lookback (Adaptivity)')}</h2>
                <p>{L(lang,
                    'Теплова карта-матриця з трьома горизонтами (1Y, 3Y, 5Y) і метриками (Net Position, Percentile, Z-Score). Кольори клітинок відповідають зонам перцентиля. Коли всі три горизонти в одній екстремальній зоні — генерується алерт "Historic Reversal Zone".',
                    'Heatmap matrix with three time horizons (1Y, 3Y, 5Y) and metrics (Net Position, Percentile, Z-Score). Cell colors match percentile zones. When all three horizons are in the same extreme zone — a "Historic Reversal Zone" alert is triggered.'
                )}</p>
                <Note>
                    {L(lang,
                        'Цей алерт — один із найсильніших контраріан сигналів у системі. Поточна позиція є екстремумом одночасно для трьох різних історичних горизонтів.',
                        'This alert is one of the strongest contrarian signals in the system. The current position is extreme simultaneously across three different historical horizons.'
                    )}
                </Note>
            </section>

            {/* Sector Context */}
            <section id="dash-sector" className="doc-section">
                <h2>{L(lang, 'Sector Context (Фундаментальний контекст)', 'Sector Context (Fundamentals)')}</h2>
                <p>{L(lang,
                    'Бічна панель з фундаментальним контекстом для кожного сектора. Містить підказки щодо специфічних факторів: carry trade для FX, сезонність для зернових, yield curve для облігацій, VIX для індексів тощо.',
                    'Sidebar panel with fundamental context per sector. Contains tips about sector-specific factors: carry trade for FX, seasonality for grains, yield curve for bonds, VIX for indices, etc.'
                )}</p>
            </section>

            {/* Range Selector */}
            <section id="dash-range" className="doc-section">
                <h2>{L(lang, 'Селектор діапазону', 'Range Selector')}</h2>
                <p>{L(lang,
                    'Кнопки 1M / 3M / 6M / 1Y / 2Y / 3Y / 5Y контролюють видимий діапазон даних. Lookback (30D / 90D / 180D / 365D) контролює вікно для розрахунку перцентиля та Z-Score.',
                    'Buttons 1M / 3M / 6M / 1Y / 2Y / 3Y / 5Y control the visible data range. Lookback (30D / 90D / 180D / 365D) controls the window for percentile and Z-Score calculation.'
                )}</p>
            </section>
        </div>
    );
}
