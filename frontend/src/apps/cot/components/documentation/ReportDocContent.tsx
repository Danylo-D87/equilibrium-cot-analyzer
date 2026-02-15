import { Formula, Tag, Note, InfoTable, ParticipantCard, L } from './DocComponents';

export default function ReportDocContent({ lang }: { lang: string }) {
    return (
        <div className="prose-dark">

            {/* ── OVERVIEW ── */}
            <section id="overview" className="doc-section">
                <h2>{L(lang, 'Огляд', 'Overview')}</h2>
                <p>
                    <strong>Commitments of Traders (COT)</strong> — {L(lang,
                        'офіційний звіт Комісії з торгівлі товарними ф\'ючерсами США (CFTC), який розкриває структуру позиціонування учасників ф\'ючерсних ринків. Публікується щоп\'ятниці о 15:30 ET, із даними станом на вівторок поточного тижня.',
                        'an official report by the U.S. Commodity Futures Trading Commission (CFTC) that discloses the positioning structure of futures market participants. Published every Friday at 3:30 PM ET, with data as of Tuesday of the same week.'
                    )}
                </p>
                <p>
                    {L(lang,
                        'CFTC публікує три типи COT-звітів, кожен з яких класифікує учасників ринку за різними методологіями. Крім того, кожен тип звіту доступний у двох підтипах — Futures Only та Futures + Options Combined.',
                        'CFTC publishes three types of COT reports, each classifying market participants using different methodologies. Additionally, each report type is available in two subtypes — Futures Only and Futures + Options Combined.'
                    )}
                </p>
                <p>
                    {L(lang,
                        'Equilibrium COT Analyzer автоматично збирає, обробляє та візуалізує дані з усіх трьох типів звітів. Система розраховує похідні метрики — COT Index, Williams Commercial Index (WCI), Crowded Level — та відображає їх через градієнтну кольорову карту (heatmap).',
                        'Equilibrium COT Analyzer automatically collects, processes and visualizes data from all three report types. The system computes derived metrics — COT Index, Williams Commercial Index (WCI), Crowded Level — and displays them via a gradient heatmap.'
                    )}
                </p>
            </section>

            {/* ── REPORT TYPES ── */}
            <section id="report-types" className="doc-section">
                <h2>{L(lang, 'Типи звітів CFTC', 'CFTC Report Types')}</h2>
                <p>
                    {L(lang,
                        'CFTC класифікує одних і тих самих учасників ринку трьома різними способами. Кожен тип звіту надає іншу перспективу на структуру позиціонування.',
                        'CFTC classifies the same market participants in three different ways. Each report type provides a different perspective on position structure.'
                    )}
                </p>

                <article id="rt-legacy" className="doc-article">
                    <h3><Tag color="emerald">Legacy</Tag> {L(lang, 'Традиційний звіт', 'Traditional Report')}</h3>
                    <InfoTable rows={[
                        [L(lang, 'Кількість груп', 'Number of groups'), '3'],
                        [L(lang, 'Групи', 'Groups'), L(lang, 'Commercials, Non-Commercials (Large Speculators), Non-Reportable (Small Traders)', 'Commercials, Non-Commercials (Large Speculators), Non-Reportable (Small Traders)')],
                        [L(lang, 'Покриття', 'Coverage'), L(lang, 'Усі ф\'ючерсні ринки', 'All futures markets')],
                        [L(lang, 'Історія', 'History'), L(lang, 'Найглибша — дані з 1986 року', 'Deepest — data since 1986')],
                    ]} />
                    <p>
                        {L(lang,
                            'Найстаріший та найпоширеніший тип звіту. Класифікує учасників на тих, хто хеджує комерційну діяльність (Commercials), великих спекулянтів (Non-Commercials) та решту учасників, чиї позиції не досягають порогу звітності (Non-Reportable). Простий поділ на 3 групи дає чітку картину балансу сил.',
                            'The oldest and most widely used report type. Classifies participants into those hedging commercial activity (Commercials), large speculators (Non-Commercials), and remaining participants whose positions fall below reporting thresholds (Non-Reportable). Simple 3-group split provides a clear picture of the balance of forces.'
                        )}
                    </p>
                </article>

                <article id="rt-disagg" className="doc-article">
                    <h3><Tag color="amber">Disaggregated</Tag> {L(lang, 'Деталізований звіт', 'Disaggregated Report')}</h3>
                    <InfoTable rows={[
                        [L(lang, 'Кількість груп', 'Number of groups'), '5'],
                        [L(lang, 'Групи', 'Groups'), 'Producer/Merchant, Swap Dealers, Managed Money, Other Reportables, Non-Reportable'],
                        [L(lang, 'Покриття', 'Coverage'), L(lang, 'Товарні ринки (commodities)', 'Commodity markets')],
                        [L(lang, 'Історія', 'History'), L(lang, 'Дані з 2006 року', 'Data since 2006')],
                    ]} />
                    <p>
                        {L(lang,
                            'Розширена версія Legacy для товарних ринків. Розбиває категорію «Commercials» на Producer/Merchant та Swap Dealers, а «Non-Commercials» — на Managed Money та Other Reportables. Це дає точніше уявлення про те, хто саме тримає позиції.',
                            'Extended version of Legacy for commodity markets. Splits "Commercials" into Producer/Merchant and Swap Dealers, and "Non-Commercials" into Managed Money and Other Reportables. This provides a more precise picture of who exactly holds positions.'
                        )}
                    </p>
                </article>

                <article id="rt-tff" className="doc-article">
                    <h3><Tag color="purple">TFF</Tag> Traders in Financial Futures</h3>
                    <InfoTable rows={[
                        [L(lang, 'Кількість груп', 'Number of groups'), '4'],
                        [L(lang, 'Групи', 'Groups'), 'Dealer/Intermediary, Asset Manager, Leveraged Funds, Other Reportables'],
                        [L(lang, 'Покриття', 'Coverage'), L(lang, 'Фінансові ринки (валюти, індекси, ставки)', 'Financial markets (currencies, indices, rates)')],
                        [L(lang, 'Історія', 'History'), L(lang, 'Дані з 2006 року', 'Data since 2006')],
                    ]} />
                    <p>
                        {L(lang,
                            'Спеціалізований звіт для фінансових ф\'ючерсів. Замість поділу Commercial/Non-Commercial використовує класифікацію за типом фінансової діяльності. Dealer/Intermediary — це маркет-мейкери та дилери, Asset Manager — пенсійні фонди та страхові компанії, Leveraged Funds — хедж-фонди та CTA.',
                            'Specialized report for financial futures. Instead of Commercial/Non-Commercial split, it uses classification by type of financial activity. Dealer/Intermediary are market makers and dealers, Asset Manager are pension funds and insurance companies, Leveraged Funds are hedge funds and CTAs.'
                        )}
                    </p>
                </article>
            </section>

            {/* ── SUBTYPES ── */}
            <section id="subtypes" className="doc-section">
                <h2>{L(lang, 'Підтипи звітів', 'Report Subtypes')}</h2>
                <p>
                    {L(lang,
                        'Кожен тип звіту (Legacy, Disaggregated, TFF) доступний у двох варіантах:',
                        'Each report type (Legacy, Disaggregated, TFF) is available in two variants:'
                    )}
                </p>

                <div className="px-4 py-3 bg-white/[0.02] border border-border rounded-sm mb-3">
                    <div className="flex items-center gap-2 mb-2">
                        <Tag color="blue">Futures Only (FO)</Tag>
                    </div>
                    <p className="text-[11.5px] text-text-secondary leading-relaxed">
                        {L(lang,
                            'Включає лише ф\'ючерсні позиції. Відображає чисте спрямоване позиціонування учасників без впливу опціонних стратегій. Дає більш пряме уявлення про переконаність (conviction) учасників.',
                            'Includes only futures positions. Reflects pure directional positioning of participants without the influence of options strategies. Provides a more direct view of participant conviction.'
                        )}
                    </p>
                </div>

                <div className="px-4 py-3 bg-white/[0.02] border border-border rounded-sm mb-3">
                    <div className="flex items-center gap-2 mb-2">
                        <Tag color="blue">Futures + Options Combined (CO)</Tag>
                    </div>
                    <p className="text-[11.5px] text-text-secondary leading-relaxed">
                        {L(lang,
                            'Додає до ф\'ючерсних позицій дельта-еквівалент опціонних позицій. Дає більш повну картину загальної експозиції учасників, включаючи опціонні стратегії. Загальний Open Interest вищий, ніж у Futures Only.',
                            'Adds the delta-equivalent of options positions to futures positions. Provides a more complete picture of total participant exposure, including options strategies. Total Open Interest is higher than in Futures Only.'
                        )}
                    </p>
                </div>

                <Note>
                    {L(lang,
                        'Обидва підтипи є валідними інструментами аналізу. Futures Only дає чистіший сигнал позиціонування, Combined — повнішу картину експозиції. Рекомендується використовувати той самий підтип послідовно для коректного порівняння у часі.',
                        'Both subtypes are valid analytical tools. Futures Only provides a cleaner positioning signal, Combined — a more complete exposure picture. It is recommended to use the same subtype consistently for correct comparison over time.'
                    )}
                </Note>
            </section>

            {/* ── PARTICIPANTS ── */}
            <section id="participants" className="doc-section">
                <h2>{L(lang, 'Учасники ринку', 'Market Participants')}</h2>
                <p>
                    {L(lang,
                        'Кожен тип звіту класифікує учасників ринку за своєю методологією. Нижче описано всі категорії для кожного типу звіту.',
                        'Each report type classifies market participants using its own methodology. Below are all categories for each report type.'
                    )}
                </p>

                {/* Legacy */}
                <article id="p-legacy" className="doc-article">
                    <h3><Tag color="emerald">Legacy</Tag> — 3 {L(lang, 'групи', 'groups')}</h3>

                    <ParticipantCard
                        name="Commercials"
                        tag={L(lang, 'Хеджери', 'Hedgers')}
                        tagColor="green"
                        description={L(lang,
                            'Виробники, переробники, кінцеві споживачі товарів та фінансові інституції, що використовують ф\'ючерси для хеджування ризиків основного бізнесу. Їхні позиції відображають реальний попит та пропозицію на фізичному ринку. Зазвичай діють проти тренду — продають на зростанні (хеджують продаж) та купують на падінні (хеджують закупівлі).',
                            'Producers, processors, end-users of commodities and financial institutions that use futures to hedge risks in their core business. Their positions reflect real demand and supply in the physical market. Typically act counter-trend — selling on rallies (hedging sales) and buying on dips (hedging purchases).'
                        )}
                    />

                    <ParticipantCard
                        name="Non-Commercials (Large Speculators)"
                        tag={L(lang, 'Великі спекулянти', 'Large Speculators')}
                        tagColor="amber"
                        description={L(lang,
                            'Хедж-фонди, CTA (Commodity Trading Advisors), managed money та інші великі спекулятивні учасники, чиї позиції перевищують пороги звітності CFTC. Переважно є трендовими гравцями (trend-followers). Їхні екстремальні позиції можуть вказувати на пізні стадії тренду.',
                            'Hedge funds, CTAs (Commodity Trading Advisors), managed money and other large speculative participants whose positions exceed CFTC reporting thresholds. Predominantly trend-followers. Their extreme positions may indicate late stages of a trend.'
                        )}
                    />

                    <ParticipantCard
                        name="Non-Reportable (Small Traders)"
                        tag={L(lang, 'Дрібні трейдери', 'Small Traders')}
                        tagColor="red"
                        description={L(lang,
                            'Учасники, чиї позиції не досягають порогу обов\'язкової звітності CFTC. Розраховуються як залишок: Open Interest − (Commercials + Non-Commercials). Включають роздрібних трейдерів та невеликі інституції.',
                            'Participants whose positions fall below CFTC mandatory reporting thresholds. Calculated as residual: Open Interest − (Commercials + Non-Commercials). Includes retail traders and small institutions.'
                        )}
                    />

                    <Formula>{L(lang,
                        'Commercials + Non-Commercials + Non-Reportable ≈ Open Interest\n(Сума всіх нетто-позицій трьох груп = 0)',
                        'Commercials + Non-Commercials + Non-Reportable ≈ Open Interest\n(Sum of all three groups\' net positions = 0)'
                    )}</Formula>
                </article>

                {/* Disaggregated */}
                <article id="p-disagg" className="doc-article">
                    <h3><Tag color="amber">Disaggregated</Tag> — 5 {L(lang, 'груп', 'groups')}</h3>

                    <ParticipantCard
                        name="Producer/Merchant/Processor/User"
                        tag={L(lang, 'Виробники та споживачі', 'Producers & Users')}
                        tagColor="green"
                        description={L(lang,
                            'Суб\'єкти, що безпосередньо виробляють, переробляють або споживають фізичний товар. Використовують ф\'ючерси для хеджування цінових ризиків своєї основної діяльності. Аналог Commercials у Legacy, але без Swap Dealers.',
                            'Entities that directly produce, process, or consume physical commodities. Use futures to hedge price risks of their core business. Analogous to Commercials in Legacy, but without Swap Dealers.'
                        )}
                    />

                    <ParticipantCard
                        name="Swap Dealers"
                        tag={L(lang, 'Своп-дилери', 'Swap Dealers')}
                        tagColor="blue"
                        description={L(lang,
                            'Фінансові інституції, що використовують ф\'ючерси для хеджування ризиків своїх позицій на позабіржовому (OTC) ринку свопів. Їхні позиції часто відображають агреговані потреби їхніх клієнтів (пенсійних фондів, корпорацій тощо).',
                            'Financial institutions that use futures to hedge risks of their over-the-counter (OTC) swap positions. Their positions often reflect aggregated needs of their clients (pension funds, corporations, etc.).'
                        )}
                    />

                    <ParticipantCard
                        name="Managed Money"
                        tag={L(lang, 'Керовані гроші', 'Managed Money')}
                        tagColor="amber"
                        description={L(lang,
                            'CTA, CPO (Commodity Pool Operators) та фонди, що активно управляють капіталом у ф\'ючерсних ринках. Найчастіше — систематичні трендові стратегії. Аналог Non-Commercials у Legacy, але без Other Reportables.',
                            'CTAs, CPOs (Commodity Pool Operators) and funds that actively manage capital in futures markets. Most commonly — systematic trend-following strategies. Analogous to Non-Commercials in Legacy, but without Other Reportables.'
                        )}
                    />

                    <ParticipantCard
                        name="Other Reportables"
                        tag={L(lang, 'Інші звітні', 'Other Reportables')}
                        tagColor="gray"
                        description={L(lang,
                            'Решта великих учасників, що не входять в жодну з трьох попередніх категорій. Можуть включати хедж-фонди з комерційною компонентою, пропрайєтарні торгові фірми та інших гравців, що не піддаються чіткій класифікації.',
                            'Remaining large participants that do not fit into any of the three previous categories. May include hedge funds with commercial components, proprietary trading firms, and other players that resist clear classification.'
                        )}
                    />

                    <ParticipantCard
                        name="Non-Reportable"
                        tag={L(lang, 'Дрібні трейдери', 'Small Traders')}
                        tagColor="red"
                        description={L(lang,
                            'Аналогічно Legacy — позиції нижче порогу звітності. Розраховуються як залишок від загального Open Interest.',
                            'Same as Legacy — positions below reporting thresholds. Calculated as residual from total Open Interest.'
                        )}
                    />
                </article>

                {/* TFF */}
                <article id="p-tff" className="doc-article">
                    <h3><Tag color="purple">TFF</Tag> — 4 {L(lang, 'групи', 'groups')}</h3>
                    <p className="text-[11.5px] text-text-secondary mb-3">
                        {L(lang,
                            'TFF використовує окрему класифікацію, спеціально розроблену для фінансових ф\'ючерсів (валюти, фондові індекси, процентні ставки).',
                            'TFF uses a separate classification specifically designed for financial futures (currencies, equity indices, interest rates).'
                        )}
                    </p>

                    <ParticipantCard
                        name="Dealer/Intermediary"
                        tag={L(lang, 'Дилери', 'Dealers')}
                        tagColor="green"
                        description={L(lang,
                            'Sell-side учасники — великі банки та дилери, що виконують роль маркет-мейкерів, створюючи ліквідність для клієнтів. Їхні ф\'ючерсні позиції переважно є хеджем для OTC-зобов\'язань перед клієнтами.',
                            'Sell-side participants — large banks and dealers acting as market makers, providing liquidity for clients. Their futures positions are predominantly hedges for OTC obligations to clients.'
                        )}
                    />

                    <ParticipantCard
                        name="Asset Manager/Institutional"
                        tag={L(lang, 'Інституціонали', 'Institutionals')}
                        tagColor="blue"
                        description={L(lang,
                            'Buy-side учасники — пенсійні фонди, страхові компанії, ендаументи, суверенні фонди. Використовують ф\'ючерси для стратегічного розподілу активів, валютного хеджування та управління дюрацією портфеля.',
                            'Buy-side participants — pension funds, insurance companies, endowments, sovereign wealth funds. Use futures for strategic asset allocation, currency hedging, and portfolio duration management.'
                        )}
                    />

                    <ParticipantCard
                        name="Leveraged Funds"
                        tag={L(lang, 'Леверидж-фонди', 'Leveraged Funds')}
                        tagColor="amber"
                        description={L(lang,
                            'Хедж-фонди, CTA та інші учасники, що використовують кредитне плече. Ведуть активну, часто спекулятивну торгівлю. Найбільш волатильна група за зміною позицій.',
                            'Hedge funds, CTAs and other participants that use leverage. Conduct active, often speculative trading. The most volatile group in terms of position changes.'
                        )}
                    />

                    <ParticipantCard
                        name="Other Reportables"
                        tag={L(lang, 'Інші звітні', 'Other Reportables')}
                        tagColor="gray"
                        description={L(lang,
                            'Великі звітні учасники, що не входять в жодну з трьох попередніх категорій TFF. Включають корпорації, центральні банки та інші інституції, що використовують фінансові ф\'ючерси.',
                            'Large reportable participants that do not fit into any of the three previous TFF categories. Include corporations, central banks, and other institutions using financial futures.'
                        )}
                    />
                </article>
            </section>

            {/* ── COLUMNS ── */}
            <section id="columns" className="doc-section">
                <h2>{L(lang, 'Колонки таблиці', 'Table Columns')}</h2>
                <p>
                    {L(lang,
                        'Для кожної групи учасників у таблиці відображається набір з 5 колонок. Нижче описано значення кожної з них. Назви груп змінюються залежно від обраного типу звіту.',
                        'For each participant group, the table displays a set of 5 columns. Below is a description of each. Group names change depending on the selected report type.'
                    )}
                </p>

                <article id="col-change-long" className="doc-article">
                    <h3>Long Change — {L(lang, 'Зміна довгих позицій', 'Change in Long Positions')}</h3>
                    <div className="doc-meta">
                        <Tag color="gray">{L(lang, 'Колонка', 'Column')}</Tag>
                        <Tag color="blue">{L(lang, 'Дані CFTC', 'CFTC Data')}</Tag>
                    </div>
                    <h4>{L(lang, 'Визначення', 'Definition')}</h4>
                    <p>{L(lang,
                        'Тижнева зміна кількості відкритих Long-контрактів групи. Значення надається безпосередньо CFTC.',
                        'Weekly change in the number of open Long contracts for the group. Value provided directly by CFTC.'
                    )}</p>
                    <h4>{L(lang, 'Візуалізація', 'Visualization')}</h4>
                    <p>{L(lang,
                        'Моно-кольорова заливка — завжди зелена, яскравість пропорційна абсолютній величині зміни відносно максимуму в колонці.',
                        'Mono-color fill — always green, brightness proportional to the absolute value of the change relative to the column maximum.'
                    )}</p>
                </article>

                <article id="col-change-short" className="doc-article">
                    <h3>Short Change — {L(lang, 'Зміна коротких позицій', 'Change in Short Positions')}</h3>
                    <div className="doc-meta">
                        <Tag color="gray">{L(lang, 'Колонка', 'Column')}</Tag>
                        <Tag color="blue">{L(lang, 'Дані CFTC', 'CFTC Data')}</Tag>
                    </div>
                    <h4>{L(lang, 'Визначення', 'Definition')}</h4>
                    <p>{L(lang,
                        'Тижнева зміна кількості відкритих Short-контрактів групи. Значення надається безпосередньо CFTC.',
                        'Weekly change in the number of open Short contracts for the group. Value provided directly by CFTC.'
                    )}</p>
                    <h4>{L(lang, 'Візуалізація', 'Visualization')}</h4>
                    <p>{L(lang,
                        'Моно-кольорова заливка — завжди червона, яскравість пропорційна абсолютній величині зміни.',
                        'Mono-color fill — always red, brightness proportional to the absolute value of the change.'
                    )}</p>
                </article>

                <article id="col-pct-net-oi" className="doc-article">
                    <h3>Net / OI % — {L(lang, 'Нетто як % від Open Interest', 'Net as % of Open Interest')}</h3>
                    <div className="doc-meta">
                        <Tag color="gray">{L(lang, 'Колонка', 'Column')}</Tag>
                        <Tag color="emerald">{L(lang, 'Розрахункова', 'Calculated')}</Tag>
                    </div>
                    <h4>{L(lang, 'Визначення', 'Definition')}</h4>
                    <p>{L(lang,
                        'Чиста позиція групи, виражена як відсоток від загального Open Interest. Нормалізує позиціонування відносно розміру ринку.',
                        'Net position of the group expressed as a percentage of total Open Interest. Normalizes positioning relative to market size.'
                    )}</p>
                    <Formula>% net/OI = (Net Position / Open Interest) × 100</Formula>
                    <h4>{L(lang, 'Інтерпретація', 'Interpretation')}</h4>
                    <p>{L(lang,
                        'Усуває проблему порівняння абсолютних чисел у часі. Показує наскільки велика позиція групи відносно загальної ліквідності ринку.',
                        'Eliminates the problem of comparing absolute numbers over time. Shows how large the group\'s position is relative to total market liquidity.'
                    )}</p>
                </article>

                <article id="col-change" className="doc-article">
                    <h3>Net Change — {L(lang, 'Зміна чистої позиції', 'Net Position Change')}</h3>
                    <div className="doc-meta">
                        <Tag color="gray">{L(lang, 'Колонка', 'Column')}</Tag>
                        <Tag color="emerald">{L(lang, 'Розрахункова', 'Calculated')}</Tag>
                    </div>
                    <h4>{L(lang, 'Визначення', 'Definition')}</h4>
                    <p>{L(lang,
                        'Тижнева зміна Net Position групи. Показує напрямок та швидкість зміни позиціонування.',
                        'Weekly change in the group\'s Net Position. Shows the direction and speed of positioning change.'
                    )}</p>
                    <Formula>Net Change = Long Change − Short Change</Formula>
                    <h4>{L(lang, 'Візуалізація', 'Visualization')}</h4>
                    <p>{L(lang,
                        'Двокольорова заливка: позитивне значення — зелена, від\'ємне — червона. Яскравість пропорційна абсолютній величині.',
                        'Two-color fill: positive value — green, negative — red. Brightness proportional to absolute value.'
                    )}</p>
                </article>

                <article id="col-net" className="doc-article">
                    <h3>Net Position — {L(lang, 'Чиста позиція', 'Net Position')}</h3>
                    <div className="doc-meta">
                        <Tag color="gray">{L(lang, 'Колонка', 'Column')}</Tag>
                        <Tag color="emerald">{L(lang, 'Розрахункова', 'Calculated')}</Tag>
                    </div>
                    <h4>{L(lang, 'Визначення', 'Definition')}</h4>
                    <p>{L(lang,
                        'Різниця між усіма Long та Short контрактами групи. Основний показник спрямованості позиціонування.',
                        'Difference between all Long and Short contracts of the group. Primary indicator of positioning directionality.'
                    )}</p>
                    <Formula>Net Position = Long − Short</Formula>
                    <h4>{L(lang, 'Інтерпретація', 'Interpretation')}</h4>
                    <p>{L(lang,
                        'Позитивне значення (Net Long) означає перевагу довгих позицій. Від\'ємне (Net Short) — перевагу коротких. Абсолютна величина сама по собі малоінформативна — значущість визначається через нормалізацію (COT Index) або відносно OI (% net/OI).',
                        'Positive value (Net Long) means dominance of long positions. Negative (Net Short) — dominance of short positions. Absolute value alone is not very informative — significance is determined through normalization (COT Index) or relative to OI (% net/OI).'
                    )}</p>
                </article>
            </section>

            {/* ── OPEN INTEREST ── */}
            <section id="open-interest" className="doc-section">
                <h2>Open Interest</h2>
                <p>{L(lang,
                    'Open Interest (OI) — загальна кількість відкритих (невиконаних) ф\'ючерсних контрактів на ринку. Кожен контракт має покупця та продавця, тому OI рахується один раз. Це міра ліквідності та залученості учасників.',
                    'Open Interest (OI) — the total number of open (outstanding) futures contracts in the market. Each contract has a buyer and a seller, so OI is counted once. It measures liquidity and participant engagement.'
                )}</p>

                <article id="oi-pct" className="doc-article">
                    <h3>OI % — {L(lang, 'Тижнева зміна OI у відсотках', 'Weekly OI Change in Percent')}</h3>
                    <div className="doc-meta"><Tag color="gray">{L(lang, 'Колонка', 'Column')}</Tag> <Tag color="emerald">{L(lang, 'Розрахункова', 'Calculated')}</Tag></div>
                    <Formula>% OI = (OI Change / OI) × 100</Formula>
                    <p>{L(lang,
                        'Показує відносну зміну Open Interest за тиждень. Позитивне значення — нові позиції відкриваються, від\'ємне — позиції закриваються.',
                        'Shows relative change in Open Interest for the week. Positive — new positions opening, negative — positions closing.'
                    )}</p>
                </article>

                <article id="oi-change" className="doc-article">
                    <h3>OI Change — {L(lang, 'Абсолютна зміна OI', 'Absolute OI Change')}</h3>
                    <div className="doc-meta"><Tag color="gray">{L(lang, 'Колонка', 'Column')}</Tag> <Tag color="blue">{L(lang, 'Дані CFTC', 'CFTC Data')}</Tag></div>
                    <p>{L(lang, 'Абсолютна тижнева зміна Open Interest у контрактах.', 'Absolute weekly change in Open Interest in contracts.')}</p>
                    <div className="my-3 text-[11.5px] space-y-1">
                        <div className="flex gap-2"><span className="text-green-400">▲ OI + ▲ Price</span> <span className="text-text-secondary">→ {L(lang, 'Тренд підтверджений новими позиціями', 'Trend confirmed by new positions')}</span></div>
                        <div className="flex gap-2"><span className="text-green-400">▲ OI + ▼ Price</span> <span className="text-text-secondary">→ {L(lang, 'Нові короткі позиції входять', 'New short positions entering')}</span></div>
                        <div className="flex gap-2"><span className="text-red-400">▼ OI + ▲ Price</span> <span className="text-text-secondary">→ {L(lang, 'Short covering (закриття шортів)', 'Short covering')}</span></div>
                        <div className="flex gap-2"><span className="text-red-400">▼ OI + ▼ Price</span> <span className="text-text-secondary">→ {L(lang, 'Long liquidation (закриття лонгів)', 'Long liquidation')}</span></div>
                    </div>
                </article>

                <article id="oi-value" className="doc-article">
                    <h3>Open Interest — {L(lang, 'Абсолютне значення', 'Absolute Value')}</h3>
                    <div className="doc-meta"><Tag color="gray">{L(lang, 'Колонка', 'Column')}</Tag> <Tag color="blue">{L(lang, 'Дані CFTC', 'CFTC Data')}</Tag></div>
                    <p>{L(lang,
                        'Загальна кількість відкритих ф\'ючерсних контрактів. Чим вищий OI, тим ліквідніший ринок і тим надійніші аналітичні сигнали.',
                        'Total number of open futures contracts. Higher OI means more liquid market and more reliable analytical signals.'
                    )}</p>
                </article>
            </section>

            {/* ── INDICATORS ── */}
            <section id="indicators" className="doc-section">
                <h2>{L(lang, 'Індикатори', 'Indicators')}</h2>
                <p>{L(lang,
                    'Система розраховує три ключових похідних індикатора для кожної групи учасників. Всі три нормалізують Net Position різними способами.',
                    'The system calculates three key derived indicators for each participant group. All three normalize Net Position in different ways.'
                )}</p>

                <article id="ind-wci" className="doc-article">
                    <h3>WCI — Williams Commercial Index (26w)</h3>
                    <div className="doc-meta">
                        <Tag color="emerald">{L(lang, 'Розрахункова', 'Calculated')}</Tag>
                        <Tag color="amber">{L(lang, 'Фіксований період: 26 тижнів', 'Fixed period: 26 weeks')}</Tag>
                    </div>
                    <p>{L(lang,
                        'Індикатор, створений Ларрі Вільямсом. Нормалізує чисту позицію відносно діапазону за фіксований період 26 тижнів (≈ 6 місяців). Застосовується до кожної групи учасників.',
                        'Indicator created by Larry Williams. Normalizes net position relative to the range over a fixed 26-week period (≈ 6 months). Applied to each participant group.'
                    )}</p>
                    <Formula>{`WCI = ((Net − Min Net₂₆w) / (Max Net₂₆w − Min Net₂₆w)) × 100

${L(lang, 'Результат', 'Result')}: 0% — 100%
${L(lang, 'Якщо Max = Min → WCI = 50%', 'If Max = Min → WCI = 50%')}`}</Formula>
                    <div className="my-3 text-[11.5px] space-y-1">
                        <div className="flex gap-2"><span className="text-green-400 min-w-[90px]">{'WCI > 80%'}</span> <span className="text-text-secondary">{L(lang, '— Позиціонування на верхньому екстремумі за 6 місяців', '— Positioning at upper extreme for 6 months')}</span></div>
                        <div className="flex gap-2"><span className="text-text-secondary min-w-[90px]">{'WCI ≈ 50%'}</span> <span className="text-text-secondary">{L(lang, '— Нейтральне (середина діапазону)', '— Neutral (mid-range)')}</span></div>
                        <div className="flex gap-2"><span className="text-red-400 min-w-[90px]">{'WCI < 20%'}</span> <span className="text-text-secondary">{L(lang, '— Позиціонування на нижньому екстремумі за 6 місяців', '— Positioning at lower extreme for 6 months')}</span></div>
                    </div>
                </article>

                <article id="ind-cot-index" className="doc-article">
                    <h3>COT Index</h3>
                    <div className="doc-meta">
                        <Tag color="emerald">{L(lang, 'Розрахункова', 'Calculated')}</Tag>
                        <Tag color="blue">{L(lang, '3 періоди × N груп', '3 periods × N groups')}</Tag>
                    </div>
                    <p>{L(lang,
                        'Стохастичний осцилятор позиціонування. Показує де знаходиться поточна Net Position відносно мінімуму та максимуму за визначений lookback-період. Розраховується для кожної групи та для трьох часових горизонтів.',
                        'Stochastic oscillator of positioning. Shows where current Net Position sits relative to minimum and maximum over a defined lookback period. Calculated for each group and for three time horizons.'
                    )}</p>
                    <div className="my-3 text-[11.5px] space-y-1">
                        <div className="flex gap-2"><span className="text-text-secondary min-w-[60px]">3m</span> <span className="text-text-secondary">= 13 {L(lang, 'тижнів', 'weeks')} (≈ {L(lang, 'квартал', 'quarter')})</span></div>
                        <div className="flex gap-2"><span className="text-text-secondary min-w-[60px]">1y</span> <span className="text-text-secondary">= 52 {L(lang, 'тижні', 'weeks')} ({L(lang, 'рік', 'year')})</span></div>
                        <div className="flex gap-2"><span className="text-text-secondary min-w-[60px]">3y</span> <span className="text-text-secondary">= 156 {L(lang, 'тижнів', 'weeks')} (3 {L(lang, 'роки', 'years')})</span></div>
                    </div>
                    <Formula>{`COT Index = ((Net − Min Net over N weeks) / (Max Net over N weeks − Min Net over N weeks)) × 100

${L(lang, 'Результат', 'Result')}: 0% — 100%`}</Formula>
                    <div className="my-3 text-[11.5px] space-y-1">
                        <div className="flex gap-2"><span className="text-green-400 font-semibold min-w-[50px]">100%</span> <span className="text-text-secondary">{L(lang, '— Net Position на максимумі за період', '— Net Position at period maximum')}</span></div>
                        <div className="flex gap-2"><span className="text-text-secondary min-w-[50px]">50%</span> <span className="text-text-secondary">{L(lang, '— Середина діапазону', '— Mid-range')}</span></div>
                        <div className="flex gap-2"><span className="text-red-400 font-semibold min-w-[50px]">0%</span> <span className="text-text-secondary">{L(lang, '— Net Position на мінімумі за період', '— Net Position at period minimum')}</span></div>
                    </div>
                    <Note>
                        {L(lang,
                            'Різні періоди дають різну перспективу. COT Index (3m) — тактичний, швидко реагує. COT Index (3y) — стратегічний, фільтрує шум. Найсильніший сигнал — коли всі три періоди вирівняні.',
                            'Different periods provide different perspectives. COT Index (3m) — tactical, reacts quickly. COT Index (3y) — strategic, filters noise. Strongest signal — when all three periods are aligned.'
                        )}
                    </Note>
                </article>

                <article id="ind-crowded" className="doc-article">
                    <h3>Crowded Level (%)</h3>
                    <div className="doc-meta">
                        <Tag color="emerald">{L(lang, 'Розрахункова', 'Calculated')}</Tag>
                        <Tag color="red">{L(lang, 'Генерує сигнали', 'Generates signals')}</Tag>
                    </div>
                    <p>{L(lang,
                        'Поточне значення COT Index (1Y) для групи. На відміну від WCI (26 тижнів), використовує річний lookback. При досягненні екстремальних рівнів генеруються сигнали BUY/SELL.',
                        'Current value of COT Index (1Y) for the group. Unlike WCI (26 weeks), uses yearly lookback. When extreme levels are reached, BUY/SELL signals are generated.'
                    )}</p>
                    <div className="my-4 space-y-3">
                        <div className="px-4 py-3 bg-white/[0.02] border border-border rounded-sm">
                            <div className="text-green-400 font-bold text-[12px] mb-1">{L(lang, 'Комерційна / хеджерська група', 'Commercial / hedger group')}</div>
                            <div className="text-[11.5px] text-text-secondary space-y-1">
                                <div>≥ 80% → <span className="text-green-400 font-semibold">BUY</span></div>
                                <div>≤ 20% → <span className="text-red-400 font-semibold">SELL</span></div>
                            </div>
                        </div>
                        <div className="px-4 py-3 bg-white/[0.02] border border-border rounded-sm">
                            <div className="text-amber-400 font-bold text-[12px] mb-1">{L(lang, 'Спекулятивна група — інвертована логіка', 'Speculative group — inverted logic')}</div>
                            <div className="text-[11.5px] text-text-secondary space-y-1">
                                <div>≥ 80% → <span className="text-red-400 font-semibold">SELL</span> ({L(lang, 'контраріанський', 'contrarian')})</div>
                                <div>≤ 20% → <span className="text-green-400 font-semibold">BUY</span> ({L(lang, 'контраріанський', 'contrarian')})</div>
                            </div>
                        </div>
                    </div>
                    <Note>
                        {L(lang,
                            'Логіка для комерційних/хеджерських груп — пряма (високе позиціонування = BUY), для спекулятивних — інвертована (контраріанська). Яка група належить до якого типу визначається конфігурацією системи для кожного типу звіту.',
                            'Logic for commercial/hedger groups is direct (high positioning = BUY), for speculative groups — inverted (contrarian). Which group belongs to which type is determined by system configuration for each report type.'
                        )}
                    </Note>
                </article>
            </section>

            {/* ── STAT ROWS ── */}
            <section id="stat-rows" className="doc-section">
                <h2>{L(lang, 'Статистичні рядки', 'Statistical Rows')}</h2>
                <p>{L(lang,
                    'У верхній частині таблиці розташовані статистичні рядки, що надають контекст для кожної числової колонки:',
                    'At the top of the table, statistical rows provide context for each numerical column:'
                )}</p>
                <div className="my-4 space-y-3 text-[11.5px]">
                    {([
                        ['Max.', L(lang, 'Абсолютний максимум за весь доступний період', 'Absolute maximum over entire available period')],
                        ['Min.', L(lang, 'Абсолютний мінімум за весь доступний період', 'Absolute minimum over entire available period')],
                        ['Max. 5y', L(lang, 'Максимум за останні 5 років (260 тижнів)', 'Maximum over last 5 years (260 weeks)')],
                        ['Min. 5y', L(lang, 'Мінімум за останні 5 років (260 тижнів)', 'Minimum over last 5 years (260 weeks)')],
                        ['Avg 13w', L(lang, 'Середнє арифметичне за останні 13 тижнів (≈ квартал)', 'Arithmetic average over last 13 weeks (≈ quarter)')],
                    ] as [string, string][]).map(([label, desc], i) => (
                        <div key={i} className="flex gap-3">
                            <span className="text-text-secondary font-semibold min-w-[100px]">{label}</span>
                            <span className="text-text-secondary">{desc}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── HEATMAP ── */}
            <section id="heatmap" className="doc-section">
                <h2>{L(lang, 'Кольорова карта (Heatmap)', 'Heatmap')}</h2>
                <p>{L(lang,
                    'Кожна клітинка таблиці має градієнтну кольорову заливку для швидкої візуальної ідентифікації напрямку та інтенсивності значень.',
                    'Each table cell has a gradient color fill for quick visual identification of direction and intensity of values.'
                )}</p>

                <h3 className="mt-5">Net Position, Net Change, Net / OI %</h3>
                <div className="my-3 text-[11.5px] space-y-1">
                    <div className="flex items-center gap-3">
                        <span className="inline-block w-5 h-3 rounded" style={{ backgroundColor: 'rgba(0,176,80,0.7)' }} />
                        <span className="text-text-secondary">{L(lang, 'Позитивне значення → зелений', 'Positive value → green')}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="inline-block w-5 h-3 rounded" style={{ backgroundColor: 'rgba(220,53,69,0.7)' }} />
                        <span className="text-text-secondary">{L(lang, 'Від\'ємне значення → червоний', 'Negative value → red')}</span>
                    </div>
                </div>

                <h3 className="mt-5">Long Change / Short Change</h3>
                <div className="my-3 text-[11.5px] space-y-1">
                    <div className="flex items-center gap-3">
                        <span className="inline-block w-5 h-3 rounded" style={{ backgroundColor: 'rgba(0,176,80,0.7)' }} />
                        <span className="text-text-secondary">Long Change — {L(lang, 'завжди зелений', 'always green')}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="inline-block w-5 h-3 rounded" style={{ backgroundColor: 'rgba(220,53,69,0.7)' }} />
                        <span className="text-text-secondary">Short Change — {L(lang, 'завжди червоний', 'always red')}</span>
                    </div>
                </div>

                <h3 className="mt-5">COT Index, WCI, Crowded Level ({L(lang, 'центровані на 50%', 'centered on 50%')})</h3>
                <div className="my-3 text-[11.5px] space-y-1">
                    <div className="flex items-center gap-3">
                        <span className="inline-block w-5 h-3 rounded" style={{ backgroundColor: 'rgba(0,176,80,0.7)' }} />
                        <span className="text-text-secondary">{'>'} 50% → {L(lang, 'зелений', 'green')}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="inline-block w-5 h-3 rounded bg-transparent border border-border" />
                        <span className="text-text-secondary">= 50% → {L(lang, 'нейтральний', 'neutral')}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="inline-block w-5 h-3 rounded" style={{ backgroundColor: 'rgba(220,53,69,0.7)' }} />
                        <span className="text-text-secondary">{'<'} 50% → {L(lang, 'червоний', 'red')}</span>
                    </div>
                </div>
                <Formula>{`opacity = 0.05 + (|${L(lang, 'значення', 'value')}| / max) × 0.80
${L(lang, 'Діапазон', 'Range')}: 0.05 (${L(lang, 'ледь видимий', 'barely visible')}) — 0.85 (${L(lang, 'насичений', 'saturated')})`}</Formula>
            </section>

            {/* ── SIGNALS ── */}
            <section id="signals" className="doc-section">
                <h2>{L(lang, 'Сигнали BUY / SELL', 'BUY / SELL Signals')}</h2>
                <p>{L(lang,
                    'Сигнали генеруються автоматично на основі Crowded Level (COT Index 1Y). Коли позиціонування групи досягає екстремальних рівнів (≥ 80% або ≤ 20%), система відображає відповідний сигнал.',
                    'Signals are generated automatically based on Crowded Level (COT Index 1Y). When a group\'s positioning reaches extreme levels (≥ 80% or ≤ 20%), the system displays the corresponding signal.'
                )}</p>
                <Note>
                    {L(lang,
                        'Сигнали є інформаційними індикаторами екстремального позиціонування. Вони вказують на потенційно значущі рівні, але не є торговими рекомендаціями. Контекст ринку, ліквідність та підтвердження через інші інструменти завжди необхідні для прийняття рішень.',
                        'Signals are informational indicators of extreme positioning. They point to potentially significant levels but are not trading recommendations. Market context, liquidity, and confirmation through other tools are always necessary for decision-making.'
                    )}
                </Note>
            </section>

            {/* ── DATA SOURCE ── */}
            <section id="data-source" className="doc-section">
                <h2>{L(lang, 'Джерело даних', 'Data Source')}</h2>
                <p>{L(lang,
                    'Усі дані отримуються безпосередньо з офіційного сайту CFTC (cftc.gov).',
                    'All data is sourced directly from the official CFTC website (cftc.gov).'
                )}</p>
                <InfoTable rows={[
                    [L(lang, 'Джерело', 'Source'), 'U.S. Commodity Futures Trading Commission (CFTC)'],
                    [L(lang, 'Історичні дані', 'Historical data'), L(lang, 'Річні ZIP-архіви з CSV (5 років)', 'Yearly ZIP archives with CSV (5 years)')],
                    [L(lang, 'Поточний тиждень', 'Current week'), L(lang, 'TXT-файли без заголовків (оновлюються щоп\'ятниці)', 'TXT files without headers (updated every Friday)')],
                    [L(lang, 'Оновлення', 'Updates'), L(lang, 'Щоп\'ятниці ~15:30 ET (дані станом на вівторок)', 'Every Friday ~3:30 PM ET (data as of Tuesday)')],
                    [L(lang, 'Дані про ціни', 'Price data'), 'Yahoo Finance (3 years)'],
                ]} />

                <h3 className="mt-5">{L(lang, 'Файли по типах звітів', 'Files by Report Types')}</h3>
                <div className="my-3 text-[11.5px] space-y-2">
                    <div className="flex gap-3"><Tag color="emerald">Legacy FO</Tag><span className="text-text-secondary font-mono text-[10px]">{'deacot{YYYY}.zip / deacom.txt'}</span></div>
                    <div className="flex gap-3"><Tag color="emerald">Legacy CO</Tag><span className="text-text-secondary font-mono text-[10px]">{'deacot{YYYY}.zip / deacom.txt'}</span></div>
                    <div className="flex gap-3"><Tag color="amber">Disagg FO</Tag><span className="text-text-secondary font-mono text-[10px]">{'fut_disagg_txt_{YYYY}.zip / f_year.txt'}</span></div>
                    <div className="flex gap-3"><Tag color="amber">Disagg CO</Tag><span className="text-text-secondary font-mono text-[10px]">{'com_disagg_txt_{YYYY}.zip / f_year.txt'}</span></div>
                    <div className="flex gap-3"><Tag color="purple">TFF FO</Tag><span className="text-text-secondary font-mono text-[10px]">{'fut_fin_txt_{YYYY}.zip / FinFutYY.txt'}</span></div>
                    <div className="flex gap-3"><Tag color="purple">TFF CO</Tag><span className="text-text-secondary font-mono text-[10px]">{'com_fin_txt_{YYYY}.zip / FinComYY.txt'}</span></div>
                </div>
            </section>
        </div>
    );
}
