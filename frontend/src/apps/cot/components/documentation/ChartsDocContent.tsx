import { Formula, Tag, Note, L } from './DocComponents';

export default function ChartsDocContent({ lang }: { lang: string }) {
    return (
        <div className="prose-dark">
            <section id="ch-overview" className="doc-section">
                <h2>{L(lang, 'Огляд графіків', 'Charts Overview')}</h2>
                <p>{L(lang,
                    'Модальне вікно Charts надає інтерактивну візуалізацію даних COT для обраного ринку. Доступні три режими відображення та часові діапазони (6M, 1Y, 2Y, ALL).',
                    'The Charts modal provides interactive visualization of COT data for the selected market. Three view modes and time ranges (6M, 1Y, 2Y, ALL) are available.'
                )}</p>
                <div className="my-4 space-y-2 text-[11.5px]">
                    <div className="flex gap-3">
                        <span className="text-primary font-semibold min-w-[100px]">Bubbles</span>
                        <span className="text-text-secondary">{L(lang, 'Ціна + бульбашки Net Position + Delta Histogram', 'Price + Net Position bubbles + Delta Histogram')}</span>
                    </div>
                    <div className="flex gap-3">
                        <span className="text-primary font-semibold min-w-[100px]">Net Positions</span>
                        <span className="text-text-secondary">{L(lang, 'Лінійний графік Net Position для кожної групи', 'Line chart of Net Position for each group')}</span>
                    </div>
                    <div className="flex gap-3">
                        <span className="text-primary font-semibold min-w-[100px]">Indicators</span>
                        <span className="text-text-secondary">{L(lang, 'Ціна (зверху) + індикатор WCI/COT Index (знизу)', 'Price (top) + WCI/COT Index indicator (bottom)')}</span>
                    </div>
                </div>
                <p>{L(lang,
                    'У верхній частині відображається назва ринку та код біржі. Панель управління дозволяє обрати режим відображення, часовий діапазон та перемикати групи трейдерів.',
                    'The top displays market name and exchange code. The control panel allows selecting view mode, time range, and toggling trader groups.'
                )}</p>
            </section>

            <section id="ch-net" className="doc-section">
                <h2>Net Position Chart</h2>
                <p>{L(lang,
                    'Лінійний графік Net Position для кожної групи учасників. Дозволяє візуально оцінити динаміку та тренди позиціонування. Кожна група відображається окремою лінією з унікальним кольором.',
                    'Line chart of Net Position for each participant group. Allows visual assessment of positioning dynamics and trends. Each group is displayed as a separate line with a unique color.'
                )}</p>
                <Note>
                    {L(lang,
                        'При наведенні на графік з\'являється tooltip з точними значеннями для кожної групи на обрану дату.',
                        'Hovering over the chart shows a tooltip with exact values for each group at the selected date.'
                    )}
                </Note>
            </section>

            <section id="ch-indicators" className="doc-section">
                <h2>{L(lang, 'Режим Indicators', 'Indicators Mode')}</h2>
                <p>{L(lang,
                    'Двопанельний режим: верхня панель (65%) — графік ціни, нижня панель (35%) — лінійний графік обраного індикатора для кожної групи. Доступні перемикачі груп трейдерів для фільтрації ліній.',
                    'Dual-panel mode: top panel (65%) — price chart, bottom panel (35%) — line chart of the selected indicator for each group. Group toggle switches available for filtering lines.'
                )}</p>

                <article id="ch-ind-cot" className="doc-article">
                    <h3>COT Index</h3>
                    <div className="doc-meta">
                        <Tag color="emerald">{L(lang, 'Розрахункова', 'Calculated')}</Tag>
                        <Tag color="blue">{L(lang, '3 періоди', '3 periods')}</Tag>
                    </div>
                    <p>{L(lang,
                        'Стохастичний осцилятор позиціонування. Показує де знаходиться поточна Net Position відносно діапазону за lookback-період. Горизонтальні лінії на 20% та 80% позначають зони екстремумів.',
                        'Stochastic oscillator of positioning. Shows where current Net Position sits relative to the range over a lookback period. Horizontal lines at 20% and 80% mark extreme zones.'
                    )}</p>
                    <div className="my-3 text-[11.5px] space-y-1">
                        <div className="flex gap-2"><span className="text-text-secondary min-w-[60px]">3m</span> <span className="text-text-secondary">= 13 {L(lang, 'тижнів', 'weeks')} (≈ {L(lang, 'квартал', 'quarter')})</span></div>
                        <div className="flex gap-2"><span className="text-text-secondary min-w-[60px]">1y</span> <span className="text-text-secondary">= 52 {L(lang, 'тижні', 'weeks')} ({L(lang, 'рік', 'year')})</span></div>
                        <div className="flex gap-2"><span className="text-text-secondary min-w-[60px]">3y</span> <span className="text-text-secondary">= 156 {L(lang, 'тижнів', 'weeks')} (3 {L(lang, 'роки', 'years')})</span></div>
                    </div>
                    <Formula>{`COT Index = ((Net − Min Net) / (Max Net − Min Net)) × 100
${L(lang, 'Діапазон', 'Range')}: 0% — 100%`}</Formula>
                </article>

                <article id="ch-ind-wci" className="doc-article">
                    <h3>WCI — Williams Commercial Index (26w)</h3>
                    <div className="doc-meta">
                        <Tag color="emerald">{L(lang, 'Розрахункова', 'Calculated')}</Tag>
                        <Tag color="amber">{L(lang, 'Фіксований період: 26 тижнів', 'Fixed period: 26 weeks')}</Tag>
                    </div>
                    <p>{L(lang,
                        'Індикатор Ларрі Вільямса. Та сама формула що й COT Index, але з фіксованим lookback-періодом 26 тижнів (≈ 6 місяців).',
                        'Larry Williams\' indicator. Same formula as COT Index, but with a fixed 26-week lookback period (≈ 6 months).'
                    )}</p>
                    <Formula>{`WCI = ((Net − Min Net₂₆w) / (Max Net₂₆w − Min Net₂₆w)) × 100`}</Formula>
                </article>

                <Note>
                    {L(lang,
                        'В режимі Indicators доступні перемикачі груп трейдерів (аналогічно режиму Bubbles), які дозволяють показувати/приховувати окремі групи на графіку індикатора.',
                        'In Indicators mode, trader group toggles are available (similar to Bubbles mode), allowing you to show/hide individual groups on the indicator chart.'
                    )}
                </Note>
            </section>

            <section id="ch-price" className="doc-section">
                <h2>{L(lang, 'Графік ціни', 'Price Chart')}</h2>
                <p>{L(lang,
                    'Лінійний графік ціни активу (дані Yahoo Finance). Колір лінії змінюється залежно від COT-сигналу (8 COT Signals). Відображається тільки якщо для даного ринку доступні цінові дані.',
                    'Line chart of asset price (Yahoo Finance data). Line color changes based on COT signal (8 COT Signals). Displayed only when price data is available for the market.'
                )}</p>
            </section>

            <section id="ch-8signals" className="doc-section">
                <h2>8 COT Signals</h2>
                <p>{L(lang,
                    'Система 8 сигналів аналізує три змінні: напрямок ціни, зміну довгих та зміну коротких позицій. Кожна комбінація (↑/↓) створює унікальний сигнал:',
                    'The 8-signal system analyzes three variables: price direction, change in longs, and change in shorts. Each combination (↑/↓) creates a unique signal:'
                )}</p>
                <div className="my-4 space-y-2 text-[11.5px]">
                    {[
                        ['1. Strong Bullish', 'Price↑  Long↑  Short↓', '#22c55e', L(lang, 'Бичачий тренд підтверджений позиціонуванням', 'Bullish trend confirmed by positioning')],
                        ['2. Accumulation', 'Price↓  Long↑  Short↓', '#10b981', L(lang, 'Накопичення позицій на просіданні ціни', 'Position accumulation on price dip')],
                        ['3. Floor Building', 'Price↓  Long↑  Short↑', '#84cc16', L(lang, 'Формування підтримки — нові позиції з обох сторін', 'Support building — new positions on both sides')],
                        ['4. Strong Bearish', 'Price↓  Long↓  Short↑', '#ef4444', L(lang, 'Ведмежий тренд підтверджений позиціонуванням', 'Bearish trend confirmed by positioning')],
                        ['5. Distribution', 'Price↑  Long↓  Short↑', '#dc2626', L(lang, 'Розподіл — продаж на зростанні ціни', 'Distribution — selling into price rally')],
                        ['6. Topping Out', 'Price↑  Long↑  Short↑', '#f97316', L(lang, 'Формування вершини — нові позиції з обох сторін', 'Top forming — new positions on both sides')],
                        ['7. Profit Taking', 'Price↑  Long↓  Short↓', '#38bdf8', L(lang, 'Фіксація прибутку — позиції закриваються', 'Profit taking — positions closing')],
                        ['8. Liquidation', 'Price↓  Long↓  Short↓', '#a855f7', L(lang, 'Ліквідація — масове закриття позицій', 'Liquidation — mass position closing')],
                    ].map(([name, combo, color, desc], i) => (
                        <div key={i} className="flex items-start gap-3">
                            <span className="inline-block w-3 h-3 rounded-full flex-shrink-0 mt-0.5" style={{ backgroundColor: color }} />
                            <div>
                                <span className="text-primary font-semibold">{name}</span>
                                <span className="text-muted font-mono text-[10px] ml-2">{combo}</span>
                                <div className="text-text-secondary text-[10.5px] mt-0.5">{desc}</div>
                            </div>
                        </div>
                    ))}
                </div>
                <Note>
                    {L(lang,
                        'Сигнали 8 COT відображаються як зміна кольору лінії ціни на графіку. Кожен тиждень ціновий графік розфарбовується відповідно до поточного сигналу.',
                        '8 COT signals are displayed as price line color changes on the chart. Each week the price chart is colored according to the current signal.'
                    )}
                </Note>
            </section>

            <section id="ch-bubbles" className="doc-section">
                <h2>{L(lang, 'Режим Bubbles', 'Bubbles View')}</h2>
                <p>{L(lang,
                    'Поєднує ціновий графік з бульбашками Net Position. Розмір бульбашки пропорційний абсолютному значенню Net Position групи. Колір — зелений для net long, червоний для net short.',
                    'Combines price chart with Net Position bubbles. Bubble size is proportional to the absolute value of group Net Position. Color — green for net long, red for net short.'
                )}</p>
                <p>{L(lang,
                    'Додатково відображається Delta Histogram — гістограма тижневої зміни Net Position (Change). Дозволяє бачити momentum позиціонування.',
                    'Additionally displays Delta Histogram — bar chart of weekly Net Position change (Change). Shows positioning momentum.'
                )}</p>
            </section>

            <section id="ch-positions" className="doc-section">
                <h2>{L(lang, 'Режим Positions', 'Positions View')}</h2>
                <p>{L(lang,
                    'Детальний графік для кожної групи окремо: Long, Short позиції та їх зміни як бари. Дозволяє аналізувати структуру позиціонування кожної групи окремо.',
                    'Detailed chart for each group separately: Long, Short positions and their changes as bars. Allows analyzing the position structure of each group individually.'
                )}</p>
            </section>
        </div>
    );
}
