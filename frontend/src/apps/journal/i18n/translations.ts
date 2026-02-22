/**
 * Journal i18n translations — 3 languages: uk, en, ru.
 * Ported from Fundamental frontend.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export type LangKey = 'uk' | 'en' | 'ru';

interface TransObj {
    uk: string;
    en: string;
    ru: string;
}

type TransFn = {
    uk: (...args: any[]) => string;
    en: (...args: any[]) => string;
    ru: (...args: any[]) => string;
};

interface MetricLangData {
    title: string;
    description: string;
    interpretation: string[];
    formula: string;
}

export const translations = {
    settings: {
        title: { uk: 'Налаштування', en: 'Settings', ru: 'Настройки' } as TransObj,
        tabs: {
            profile: { uk: 'Профіль', en: 'Profile', ru: 'Профиль' } as TransObj,
            portfolios: { uk: 'Портфелі', en: 'Portfolios', ru: 'Портфели' } as TransObj,
            database: { uk: 'Дані', en: 'Data', ru: 'Данные' } as TransObj,
        },
        profile: {
            nicknameTitle: { uk: 'Нікнейм', en: 'Nickname', ru: 'Никнейм' } as TransObj,
            nicknameLabel: { uk: "Нікнейм (необов'язково)", en: 'Nickname (optional)', ru: 'Никнейм (необязательно)' } as TransObj,
            nicknamePlaceholder: { uk: 'Введіть ваш нікнейм', en: 'Enter your nickname', ru: 'Введите ваш никнейм' } as TransObj,
            save: { uk: 'Зберегти', en: 'Save', ru: 'Сохранить' } as TransObj,
            clear: { uk: 'Очистити', en: 'Clear', ru: 'Очистить' } as TransObj,
            nicknameSaved: { uk: 'Нікнейм успішно збережено', en: 'Nickname saved successfully', ru: 'Никнейм успешно сохранён' } as TransObj,
            nicknameCleared: { uk: 'Нікнейм очищено', en: 'Nickname cleared', ru: 'Никнейм очищен' } as TransObj,
            languageTitle: { uk: 'Мова інтерфейсу', en: 'Interface Language', ru: 'Язык интерфейса' } as TransObj,
        },
        portfolios: {
            fillRequired: { uk: 'Заповніть назву та початковий капітал', en: 'Fill in name and initial capital', ru: 'Заполните название и начальный капитал' } as TransObj,
            createSuccess: { uk: 'Портфель успішно створено', en: 'Portfolio created successfully', ru: 'Портфель успешно создан' } as TransObj,
            createNew: { uk: 'Створити новий портфель', en: 'Create new portfolio', ru: 'Создать новый портфель' } as TransObj,
            portfolioName: { uk: 'Назва портфеля', en: 'Portfolio name', ru: 'Название портфеля' } as TransObj,
            initialCapital: { uk: 'Початковий капітал ($)', en: 'Initial capital ($)', ru: 'Начальный капитал ($)' } as TransObj,
            description: { uk: "Опис (необов'язково)", en: 'Description (optional)', ru: 'Описание (необязательно)' } as TransObj,
            cancel: { uk: 'Скасувати', en: 'Cancel', ru: 'Отменить' } as TransObj,
            create: { uk: 'Створити', en: 'Create', ru: 'Создать' } as TransObj,
            editPortfolio: { uk: 'Редагувати портфель', en: 'Edit portfolio', ru: 'Редактировать портфель' } as TransObj,
            saveChanges: { uk: 'Зберегти', en: 'Save', ru: 'Сохранить' } as TransObj,
            currentCapital: { uk: 'Поточний капітал', en: 'Current capital', ru: 'Текущий капитал' } as TransObj,
            totalProfit: { uk: 'Загальний прибуток', en: 'Total profit', ru: 'Общая прибыль' } as TransObj,
            tradeCount: { uk: 'Кількість трейдів', en: 'Trade count', ru: 'Количество трейдов' } as TransObj,
            deleteWarning: { uk: 'Увага!', en: 'Warning!', ru: 'Внимание!' } as TransObj,
            deleteConfirmText: { uk: 'Ви дійсно хочете видалити цей портфель?', en: 'Are you sure you want to delete this portfolio?', ru: 'Вы действительно хотите удалить этот портфель?' } as TransObj,
            confirmDelete: { uk: 'Так, видалити', en: 'Yes, delete', ru: 'Да, удалить' } as TransObj,
            viewInactiveTrades: { uk: 'Переглянути трейди без активного портфелю', en: 'View trades without active portfolio', ru: 'Просмотреть трейды без активного портфеля' } as TransObj,
        },
        database: {
            exportTitle: { uk: 'Експорт конфігурації', en: 'Export configuration', ru: 'Экспорт конфигурации' } as TransObj,
            exportDesc: { uk: 'Завантажити повний бекап: трейди, фото, портфелі, налаштування профілю', en: 'Download full backup: trades, photos, portfolios, profile settings', ru: 'Скачать полный бекап: трейды, фото, портфели, настройки профиля' } as TransObj,
            exportBtn: { uk: 'Експортувати конфігурацію', en: 'Export configuration', ru: 'Экспортировать конфигурацию' } as TransObj,
            exporting: { uk: 'Експортуємо...', en: 'Exporting...', ru: 'Экспортируем...' } as TransObj,
            importTitle: { uk: 'Імпорт конфігурації', en: 'Import configuration', ru: 'Импорт конфигурации' } as TransObj,
            importDesc: { uk: 'Відновити з бекапу: трейди, фото, портфелі, налаштування профілю', en: 'Restore from backup: trades, photos, portfolios, profile settings', ru: 'Восстановить из бекапа: трейды, фото, портфели, настройки профиля' } as TransObj,
            importBtn: { uk: 'Імпортувати конфігурацію', en: 'Import configuration', ru: 'Импортировать конфигурацию' } as TransObj,
            importing: { uk: 'Імпортуємо...', en: 'Importing...', ru: 'Импортируем...' } as TransObj,
            clearTitle: { uk: 'Очистити базу даних', en: 'Clear database', ru: 'Очистить базу данных' } as TransObj,
            clearDesc: { uk: 'Видалити всі трейди та фото з бази даних.', en: 'Delete all trades and photos from database.', ru: 'Удалить все трейды и фото из базы данных.' } as TransObj,
            clearBtn: { uk: 'Очистити базу даних', en: 'Clear database', ru: 'Очистить базу данных' } as TransObj,
            clearWarning: { uk: 'Увага! Ця дія незворотна!', en: 'Warning! This action is irreversible!', ru: 'Внимание! Это действие необратимо!' } as TransObj,
            clearConfirm: { uk: 'Так, видалити все', en: 'Yes, delete all', ru: 'Да, удалить всё' } as TransObj,
            clearCancel: { uk: 'Скасувати', en: 'Cancel', ru: 'Отменить' } as TransObj,
            clearing: { uk: 'Очищаємо...', en: 'Clearing...', ru: 'Очищаем...' } as TransObj,
            clearSuccess: {
                uk: (trades: number, images: number) => `Видалено ${trades} трейдів та ${images} фото.`,
                en: (trades: number, images: number) => `Deleted ${trades} trades and ${images} photos.`,
                ru: (trades: number, images: number) => `Удалено ${trades} трейдов и ${images} фото.`,
            } as TransFn,
        },
    },
    metricInfo: {
        descriptionHeader: { uk: 'Опис метрики', en: 'Metric Description', ru: 'Описание метрики' } as TransObj,
        interpretationHeader: { uk: 'Інтерпретація значень', en: 'Value Interpretation', ru: 'Интерпретация значений' } as TransObj,
        formulaHeader: { uk: 'Формула розрахунку', en: 'Calculation Formula', ru: 'Формула расчёта' } as TransObj,
    },
    modal: {
        imageCopied: { uk: 'Зображення скопійовано!', en: 'Image copied!', ru: 'Изображение скопировано!' } as TransObj,
        creatingImage: { uk: 'Створюємо зображення...', en: 'Creating image...', ru: 'Создаём изображение...' } as TransObj,
        copyCard: { uk: 'Скопіювати картку', en: 'Copy card', ru: 'Скопировать карточку' } as TransObj,
        copyChart: { uk: 'Скопіювати графік', en: 'Copy chart', ru: 'Скопировать график' } as TransObj,
    },
    // Metric descriptions by title key - simplified structure
    metrics: {
        'TOTAL PROFIT': {
            uk: {
                title: 'Total Profit (Realized P&L)',
                description: 'Сукупний реалізований прибуток або збиток від усіх закритих позицій. Згідно з GIPS® (Global Investment Performance Standards), реалізований P&L враховує тільки фактично закриті угоди та відображає грошовий результат торгової діяльності.',
                interpretation: [
                    'Інтерпретація значення:',
                    '• Позитивне значення: Чистий прибуток від торгівлі',
                    '• Нульове значення: Беззбитковий результат',
                    '• Негативне значення: Чистий збиток від торгівлі',
                    '',
                    'Графік Daily Returns:',
                    'Відображає щоденну відсоткову зміну вартості портфеля (NAV) у вигляді стовпчикової діаграми. Зелені стовпці — прибуткові дні, червоні — збиткові. Висота стовпця пропорційна величині відсоткової зміни.',
                    '',
                    'Практичне застосування:',
                    '• Аналіз розподілу прибутковості в часі',
                    '• Ідентифікація патернів (найприбутковіші дні тижня)',
                    '• Оцінка волатильності щоденних результатів'
                ],
                formula: 'Total P&L = Σ(Realized Profit/Loss) = Σ[(Exit Price - Entry Price) × Position Size - Fees]'
            },
            en: {
                title: 'Total Profit (Realized P&L)',
                description: 'Cumulative realized profit or loss from all closed positions. According to GIPS® (Global Investment Performance Standards), realized P&L accounts only for actually closed trades and reflects the monetary result of trading activity.',
                interpretation: [
                    'Value interpretation:',
                    '• Positive value: Net profit from trading',
                    '• Zero value: Break-even result',
                    '• Negative value: Net loss from trading',
                    '',
                    'Daily Returns chart:',
                    'Displays daily percentage change of portfolio value (NAV) as a bar chart. Green bars — profitable days, red — losing days. Bar height is proportional to the percentage change magnitude.',
                    '',
                    'Practical application:',
                    '• Analysis of profitability distribution over time',
                    '• Pattern identification (most profitable days of the week)',
                    '• Assessment of daily results volatility'
                ],
                formula: 'Total P&L = Σ(Realized Profit/Loss) = Σ[(Exit Price - Entry Price) × Position Size - Fees]'
            },
            ru: {
                title: 'Total Profit (Realized P&L)',
                description: 'Совокупная реализованная прибыль или убыток от всех закрытых позиций. Согласно GIPS® (Global Investment Performance Standards), реализованный P&L учитывает только фактически закрытые сделки и отражает денежный результат торговой деятельности.',
                interpretation: [
                    'Интерпретация значения:',
                    '• Положительное значение: Чистая прибыль от торговли',
                    '• Нулевое значение: Безубыточный результат',
                    '• Отрицательное значение: Чистый убыток от торговли',
                    '',
                    'График Daily Returns:',
                    'Отображает ежедневное процентное изменение стоимости портфеля (NAV) в виде столбчатой диаграммы. Зелёные столбцы — прибыльные дни, красные — убыточные. Высота столбца пропорциональна величине процентного изменения.',
                    '',
                    'Практическое применение:',
                    '• Анализ распределения прибыльности во времени',
                    '• Идентификация паттернов (наиболее прибыльные дни недели)',
                    '• Оценка волатильности ежедневных результатов'
                ],
                formula: 'Total P&L = Σ(Realized Profit/Loss) = Σ[(Exit Price - Entry Price) × Position Size - Fees]'
            }
        },
        'EXCESS RETURN': {
            uk: {
                title: 'Excess Return',
                description: 'Надлишкова дохідність портфеля понад дохідність бенчмарку (BTC). Показує арифметичну різницю між кумулятивною дохідністю портфеля та бенчмарку. Не є Jensen\'s Alpha (яка коригує на систематичний ризик β), а простий excess return — пряме порівняння результатів.',
                interpretation: [
                    'Інтерпретація значення:',
                    '• Excess > 0: Стратегія перевершує бенчмарк — активне управління виправдане',
                    '• Excess = 0: Результат відповідає пасивній стратегії HODL',
                    '• Excess < 0: Стратегія відстає від бенчмарку — краще було б тримати BTC',
                    '',
                    'Графік Alpha Curve (Cumulative Excess Return):',
                    'Показує накопичену надлишкову дохідність у динаміці.',
                    '• Висхідний тренд: Послідовне перевершення ринку',
                    '• Низхідний тренд: Систематичне відставання від бенчмарку',
                    '• Флет: Результат близький до пасивного інвестування',
                    '',
                    'Примітка: Для оцінки з урахуванням ризику використовуйте Information Ratio або порівнюйте з CAPM Expected Return.'
                ],
                formula: 'Excess Return = Rₚ - Rᵦ\nде Rₚ = Portfolio Return (%), Rᵦ = Benchmark Return (BTC, %)'
            },
            en: {
                title: 'Excess Return',
                description: 'Portfolio\'s excess return over benchmark (BTC) return. Shows the arithmetic difference between cumulative portfolio return and benchmark return. This is not Jensen\'s Alpha (which adjusts for systematic risk β), but a simple excess return — direct comparison of results.',
                interpretation: [
                    'Value interpretation:',
                    '• Excess > 0: Strategy outperforms the benchmark — active management is justified',
                    '• Excess = 0: Result matches passive HODL strategy',
                    '• Excess < 0: Strategy lags the benchmark — holding BTC would be better',
                    '',
                    'Alpha Curve chart (Cumulative Excess Return):',
                    'Shows cumulative excess return over time.',
                    '• Upward trend: Consistent market outperformance',
                    '• Downward trend: Systematic underperformance vs benchmark',
                    '• Flat: Result close to passive investing',
                    '',
                    'Note: For risk-adjusted evaluation, use Information Ratio or compare with CAPM Expected Return.'
                ],
                formula: 'Excess Return = Rₚ - Rᵦ\nwhere Rₚ = Portfolio Return (%), Rᵦ = Benchmark Return (BTC, %)'
            },
            ru: {
                title: 'Excess Return',
                description: 'Избыточная доходность портфеля сверх доходности бенчмарка (BTC). Показывает арифметическую разницу между кумулятивной доходностью портфеля и бенчмарка. Это не Jensen\'s Alpha (которая корректирует на систематический риск β), а простой excess return — прямое сравнение результатов.',
                interpretation: [
                    'Интерпретация значения:',
                    '• Excess > 0: Стратегия превосходит бенчмарк — активное управление оправдано',
                    '• Excess = 0: Результат соответствует пассивной стратегии HODL',
                    '• Excess < 0: Стратегия отстаёт от бенчмарка — лучше было бы держать BTC',
                    '',
                    'График Alpha Curve (Cumulative Excess Return):',
                    'Показывает накопленную избыточную доходность в динамике.',
                    '• Восходящий тренд: Последовательное превосходство над рынком',
                    '• Нисходящий тренд: Систематическое отставание от бенчмарка',
                    '• Флэт: Результат близок к пассивному инвестированию',
                    '',
                    'Примечание: Для оценки с учётом риска используйте Information Ratio или сравнивайте с CAPM Expected Return.'
                ],
                formula: 'Excess Return = Rₚ - Rᵦ\nгде Rₚ = Portfolio Return (%), Rᵦ = Benchmark Return (BTC, %)'
            }
        },
        'CURRENT NAV': {
            uk: {
                title: 'Net Asset Value (NAV)',
                description: 'Чиста вартість активів портфеля — ключовий показник для оцінки інвестиційної ефективності згідно GIPS®. NAV відображає поточну вартість портфеля з урахуванням реалізованих прибутків/збитків від закритих угод.',
                interpretation: [
                    'Інтерпретація значення:',
                    '• NAV > Initial Balance: Портфель у прибутку',
                    '• NAV = Initial Balance: Беззбитковий стан',
                    '• NAV < Initial Balance: Портфель у збитку',
                    '',
                    'Графік NAV History:',
                    'Лінійний графік динаміки вартості портфеля в часі.',
                    '• Висхідний тренд: Зростання капіталу',
                    '• Волатильність кривої: Ризик стратегії',
                    '• Порівняння з HWM: Поточний drawdown',
                    '',
                    'Практичне застосування:',
                    '• База для розрахунку всіх return-based метрик',
                    '• Порівняння з High Watermark для оцінки просадки',
                    '• Моніторинг динаміки зростання капіталу'
                ],
                formula: 'NAV = Initial Capital + Σ(Realized P&L)'
            },
            en: {
                title: 'Net Asset Value (NAV)',
                description: 'Net asset value of the portfolio — a key metric for evaluating investment performance according to GIPS®. NAV reflects the current market value of all positions, accounting for realized profits/losses from closed trades.',
                interpretation: [
                    'Value interpretation:',
                    '• NAV > Initial Balance: Portfolio is in profit',
                    '• NAV = Initial Balance: Break-even state',
                    '• NAV < Initial Balance: Portfolio is at a loss',
                    '',
                    'NAV History chart:',
                    'Line chart of portfolio value dynamics over time.',
                    '• Upward trend: Capital growth',
                    '• Curve volatility: Strategy risk',
                    '• Comparison with HWM: Current drawdown',
                    '',
                    'Practical application:',
                    '• Base for calculating all return-based metrics',
                    '• Comparison with High Watermark for drawdown assessment',
                    '• Monitoring capital growth dynamics'
                ],
                formula: 'NAV = Initial Capital + Σ(Realized P&L)'
            },
            ru: {
                title: 'Net Asset Value (NAV)',
                description: 'Чистая стоимость активов портфеля — ключевой показатель для оценки инвестиционной эффективности согласно GIPS®. NAV отражает текущую стоимость портфеля с учётом реализованных прибылей/убытков от закрытых сделок.',
                interpretation: [
                    'Интерпретация значения:',
                    '• NAV > Initial Balance: Портфель в прибыли',
                    '• NAV = Initial Balance: Безубыточное состояние',
                    '• NAV < Initial Balance: Портфель в убытке',
                    '',
                    'График NAV History:',
                    'Линейный график динамики стоимости портфеля во времени.',
                    '• Восходящий тренд: Рост капитала',
                    '• Волатильность кривой: Риск стратегии',
                    '• Сравнение с HWM: Текущая просадка',
                    '',
                    'Практическое применение:',
                    '• База для расчёта всех return-based метрик',
                    '• Сравнение с High Watermark для оценки просадки',
                    '• Мониторинг динамики роста капитала'
                ],
                formula: 'NAV = Initial Capital + Σ(Realized P&L)'
            }
        },
        'SHARPE RATIO': {
            uk: {
                title: 'Sharpe Ratio',
                description: 'Класичний показник ефективності з поправкою на ризик, розроблений Нобелівським лауреатом William Sharpe (1966). Вимірює надлишкову дохідність на одиницю загального ризику (волатильності). Є золотим стандартом для порівняння інвестиційних стратегій.',
                interpretation: [
                    'Інтерпретація значення (за Sharpe, 1994):',
                    '• SR < 0: Дохідність нижча за безризикову ставку — неефективна стратегія',
                    '• 0 < SR < 1: Субоптимальна risk-adjusted дохідність',
                    '• 1 < SR < 2: Добрий результат — типовий для професійних фондів',
                    '• 2 < SR < 3: Відмінний результат — топ-квартиль хедж-фондів',
                    '• SR > 3: Виняткова ефективність (підозра на overfitting або luck)',
                    '',
                    'Графік Risk-Adjusted Comparison:',
                    'Порівняння Sharpe Ratio стратегії з бенчмарком (BTC). Дозволяє оцінити, чи виправдовує додатковий ризик активного трейдингу отриману дохідність.',
                    '',
                    'Обмеження: Sharpe Ratio карає як за негативну, так і за позитивну волатильність.',
                    '',
                    'Джерело: Sharpe W. (1994) "The Sharpe Ratio", Journal of Portfolio Management.'
                ],
                formula: 'SR = (Rₚ - Rᶠ) / σₚ × √365\nде Rₚ = Portfolio Return, Rᶠ = Risk-Free Rate, σₚ = Portfolio Volatility'
            },
            en: {
                title: 'Sharpe Ratio',
                description: 'Classic risk-adjusted performance measure developed by Nobel laureate William Sharpe (1966). Measures excess return per unit of total risk (volatility). It is the gold standard for comparing investment strategies.',
                interpretation: [
                    'Value interpretation (Sharpe, 1994):',
                    '• SR < 0: Return below risk-free rate — inefficient strategy',
                    '• 0 < SR < 1: Suboptimal risk-adjusted return',
                    '• 1 < SR < 2: Good result — typical for professional funds',
                    '• 2 < SR < 3: Excellent result — top quartile of hedge funds',
                    '• SR > 3: Exceptional performance (suspicion of overfitting or luck)',
                    '',
                    'Risk-Adjusted Comparison chart:',
                    'Comparison of strategy\'s Sharpe Ratio with benchmark (BTC). Allows evaluating whether the additional risk of active trading justifies the return.',
                    '',
                    'Limitation: Sharpe Ratio penalizes both negative and positive volatility.',
                    '',
                    'Source: Sharpe W. (1994) "The Sharpe Ratio", Journal of Portfolio Management.'
                ],
                formula: 'SR = (Rₚ - Rᶠ) / σₚ × √365\nwhere Rₚ = Portfolio Return, Rᶠ = Risk-Free Rate, σₚ = Portfolio Volatility'
            },
            ru: {
                title: 'Sharpe Ratio',
                description: 'Классический показатель эффективности с поправкой на риск, разработанный нобелевским лауреатом William Sharpe (1966). Измеряет избыточную доходность на единицу общего риска (волатильности). Является золотым стандартом для сравнения инвестиционных стратегий.',
                interpretation: [
                    'Интерпретация значения (Sharpe, 1994):',
                    '• SR < 0: Доходность ниже безрисковой ставки — неэффективная стратегия',
                    '• 0 < SR < 1: Субоптимальная risk-adjusted доходность',
                    '• 1 < SR < 2: Хороший результат — типичный для профессиональных фондов',
                    '• 2 < SR < 3: Отличный результат — топ-квартиль хедж-фондов',
                    '• SR > 3: Исключительная эффективность (подозрение на overfitting или luck)',
                    '',
                    'График Risk-Adjusted Comparison:',
                    'Сравнение Sharpe Ratio стратегии с бенчмарком (BTC). Позволяет оценить, оправдывает ли дополнительный риск активной торговли полученную доходность.',
                    '',
                    'Ограничение: Sharpe Ratio наказывает как за негативную, так и за позитивную волатильность.',
                    '',
                    'Источник: Sharpe W. (1994) "The Sharpe Ratio", Journal of Portfolio Management.'
                ],
                formula: 'SR = (Rₚ - Rᶠ) / σₚ × √365\nгде Rₚ = Portfolio Return, Rᶠ = Risk-Free Rate, σₚ = Portfolio Volatility'
            }
        },
        'SORTINO RATIO': {
            uk: {
                title: 'Sortino Ratio',
                description: 'Модифікація Sharpe Ratio, запропонована Frank Sortino (1991), яка враховує тільки downside ризик. На відміну від Sharpe, не карає за позитивну волатильність, що робить його більш релевантним для асиметричних розподілів (криптовалюти, опціонні стратегії).',
                interpretation: [
                    'Інтерпретація значення:',
                    '• Sortino < 0: Негативна дохідність з поправкою на downside ризик',
                    '• 0 < Sortino < 1: Прийнятний рівень ефективності',
                    '• 1 < Sortino < 2: Добре управління downside ризиком',
                    '• Sortino > 2: Відмінний захист від просадок',
                    '',
                    'Графік Risk-Adjusted Comparison:',
                    'Порівняння Sortino Ratio стратегії з бенчмарком. Вищий Sortino при аналогічному Sharpe вказує на асиметричний профіль ризику — більше позитивних «викидів».',
                    '',
                    'Коли використовувати:',
                    '• Для стратегій з позитивною асиметрією (upside > downside)',
                    '• Коли важливий саме захист від втрат, а не загальна волатильність',
                    '',
                    'Джерело: Sortino F., van der Meer R. (1991) "Downside Risk", Journal of Portfolio Management.'
                ],
                formula: 'Sortino = (Rₚ - Rᶠ) / σᵈ × √365\nде σᵈ = Downside Deviation = √(1/N × Σ min(Rᵢ, 0)²)'
            },
            en: {
                title: 'Sortino Ratio',
                description: 'Modification of Sharpe Ratio proposed by Frank Sortino (1991) that only accounts for downside risk. Unlike Sharpe, it does not penalize positive volatility, making it more relevant for asymmetric distributions (cryptocurrencies, option strategies).',
                interpretation: [
                    'Value interpretation:',
                    '• Sortino < 0: Negative return adjusted for downside risk',
                    '• 0 < Sortino < 1: Acceptable efficiency level',
                    '• 1 < Sortino < 2: Good downside risk management',
                    '• Sortino > 2: Excellent drawdown protection',
                    '',
                    'Risk-Adjusted Comparison chart:',
                    'Comparison of strategy\'s Sortino Ratio with benchmark. Higher Sortino with similar Sharpe indicates asymmetric risk profile — more positive "outliers".',
                    '',
                    'When to use:',
                    '• For strategies with positive skewness (upside > downside)',
                    '• When loss protection matters more than overall volatility',
                    '',
                    'Source: Sortino F., van der Meer R. (1991) "Downside Risk", Journal of Portfolio Management.'
                ],
                formula: 'Sortino = (Rₚ - Rᶠ) / σᵈ × √365\nwhere σᵈ = Downside Deviation = √(1/N × Σ min(Rᵢ, 0)²)'
            },
            ru: {
                title: 'Sortino Ratio',
                description: 'Модификация Sharpe Ratio, предложенная Frank Sortino (1991), которая учитывает только downside риск. В отличие от Sharpe, не наказывает за положительную волатильность, что делает его более релевантным для асимметричных распределений (криптовалюты, опционные стратегии).',
                interpretation: [
                    'Интерпретация значения:',
                    '• Sortino < 0: Отрицательная доходность с поправкой на downside риск',
                    '• 0 < Sortino < 1: Приемлемый уровень эффективности',
                    '• 1 < Sortino < 2: Хорошее управление downside риском',
                    '• Sortino > 2: Отличная защита от просадок',
                    '',
                    'График Risk-Adjusted Comparison:',
                    'Сравнение Sortino Ratio стратегии с бенчмарком. Более высокий Sortino при аналогичном Sharpe указывает на асимметричный профиль риска — больше положительных «выбросов».',
                    '',
                    'Когда использовать:',
                    '• Для стратегий с положительной асимметрией (upside > downside)',
                    '• Когда важна именно защита от потерь, а не общая волатильность',
                    '',
                    'Источник: Sortino F., van der Meer R. (1991) "Downside Risk", Journal of Portfolio Management.'
                ],
                formula: 'Sortino = (Rₚ - Rᶠ) / σᵈ × √365\nгде σᵈ = Downside Deviation = √(1/N × Σ min(Rᵢ, 0)²)'
            }
        },
        'INFO RATIO': {
            uk: {
                title: 'Information Ratio (IR)',
                description: 'Показник ефективності активного управління, що вимірює стабільність генерації Alpha відносно бенчмарку. За визначенням CFA Institute, IR показує наскільки послідовно менеджер перевершує бенчмарк з поправкою на tracking risk.',
                interpretation: [
                    'Інтерпретація значення (за Grinold & Kahn, 1999):',
                    '• IR < 0: Систематичне відставання від бенчмарку',
                    '• 0 < IR < 0.5: Середній рівень активного управління',
                    '• 0.5 < IR < 0.75: Добрий результат',
                    '• 0.75 < IR < 1.0: Дуже добрий результат',
                    '• IR > 1.0: Виняткова ефективність (топ-дециль менеджерів)',
                    '',
                    'Графік Rolling Information Ratio:',
                    'Динаміка IR за ковзаючим вікном (20 періодів). Показує стабільність генерації Alpha в часі.',
                    '• Стабільний IR: Послідовна стратегія',
                    '• Волатильний IR: Результати залежать від ринкових умов',
                    '',
                    'Джерело: Grinold R., Kahn R. (1999) "Active Portfolio Management", McGraw-Hill.'
                ],
                formula: 'IR = (Rₚ - Rᵦ) / TE × √365\nде TE = Tracking Error = StdDev(Rₚ - Rᵦ)'
            },
            en: {
                title: 'Information Ratio (IR)',
                description: 'Active management efficiency metric that measures the consistency of Alpha generation relative to benchmark. Per CFA Institute definition, IR shows how consistently a manager outperforms the benchmark adjusted for tracking risk.',
                interpretation: [
                    'Value interpretation (Grinold & Kahn, 1999):',
                    '• IR < 0: Systematic underperformance vs benchmark',
                    '• 0 < IR < 0.5: Average level of active management',
                    '• 0.5 < IR < 0.75: Good result',
                    '• 0.75 < IR < 1.0: Very good result',
                    '• IR > 1.0: Exceptional efficiency (top decile of managers)',
                    '',
                    'Rolling Information Ratio chart:',
                    'IR dynamics over a rolling window (20 periods). Shows consistency of Alpha generation over time.',
                    '• Stable IR: Consistent strategy',
                    '• Volatile IR: Results depend on market conditions',
                    '',
                    'Source: Grinold R., Kahn R. (1999) "Active Portfolio Management", McGraw-Hill.'
                ],
                formula: 'IR = (Rₚ - Rᵦ) / TE × √365\nwhere TE = Tracking Error = StdDev(Rₚ - Rᵦ)'
            },
            ru: {
                title: 'Information Ratio (IR)',
                description: 'Показатель эффективности активного управления, измеряющий стабильность генерации Alpha относительно бенчмарка. По определению CFA Institute, IR показывает, насколько последовательно менеджер превосходит бенчмарк с поправкой на tracking risk.',
                interpretation: [
                    'Интерпретация значения (Grinold & Kahn, 1999):',
                    '• IR < 0: Систематическое отставание от бенчмарка',
                    '• 0 < IR < 0.5: Средний уровень активного управления',
                    '• 0.5 < IR < 0.75: Хороший результат',
                    '• 0.75 < IR < 1.0: Очень хороший результат',
                    '• IR > 1.0: Исключительная эффективность (топ-дециль менеджеров)',
                    '',
                    'График Rolling Information Ratio:',
                    'Динамика IR за скользящим окном (20 периодов). Показывает стабильность генерации Alpha во времени.',
                    '• Стабильный IR: Последовательная стратегия',
                    '• Волатильный IR: Результаты зависят от рыночных условий',
                    '',
                    'Источник: Grinold R., Kahn R. (1999) "Active Portfolio Management", McGraw-Hill.'
                ],
                formula: 'IR = (Rₚ - Rᵦ) / TE × √365\nгде TE = Tracking Error = StdDev(Rₚ - Rᵦ)'
            }
        },
        'BETA (β)': {
            uk: {
                title: 'Beta (β) — Systematic Risk',
                description: 'Міра систематичного (ринкового) ризику з Capital Asset Pricing Model (CAPM). Beta показує чутливість портфеля до рухів бенчмарку. Є ключовим параметром для оцінки ринкової експозиції та очікуваної дохідності згідно теорії Sharpe-Lintner.',
                interpretation: [
                    'Інтерпретація значення (за CAPM):',
                    '• β = 1.0: Портфель рухається синхронно з ринком',
                    '• β > 1.0: Агресивна стратегія — підсилює ринкові рухи',
                    '  (β = 1.5: при +10% BTC портфель дає +15%)',
                    '• β < 1.0: Консервативна стратегія — згладжує ринкові рухи',
                    '  (β = 0.5: при +10% BTC портфель дає +5%)',
                    '• β ≈ 0: Market-neutral стратегія',
                    '• β < 0: Контртрендова стратегія (шорт-bias)',
                    '',
                    'Графік Rolling Beta & Correlation:',
                    'Динаміка Beta та кореляції з BTC за ковзаючим вікном.',
                    '• Стабільна Beta: Консистентна ринкова експозиція',
                    '• Волатильна Beta: Адаптивна або непослідовна стратегія',
                    '',
                    'Джерело: Sharpe W. (1964) "Capital Asset Prices", Journal of Finance.'
                ],
                formula: 'β = Cov(Rₚ, Rᵦ) / Var(Rᵦ)\nде Cov = коваріація, Var = дисперсія'
            },
            en: {
                title: 'Beta (β) — Systematic Risk',
                description: 'Measure of systematic (market) risk from Capital Asset Pricing Model (CAPM). Beta shows portfolio sensitivity to benchmark movements. It is a key parameter for evaluating market exposure and expected return according to Sharpe-Lintner theory.',
                interpretation: [
                    'Value interpretation (CAPM):',
                    '• β = 1.0: Portfolio moves in sync with the market',
                    '• β > 1.0: Aggressive strategy — amplifies market moves',
                    '  (β = 1.5: at +10% BTC, portfolio yields +15%)',
                    '• β < 1.0: Conservative strategy — smooths market moves',
                    '  (β = 0.5: at +10% BTC, portfolio yields +5%)',
                    '• β ≈ 0: Market-neutral strategy',
                    '• β < 0: Counter-trend strategy (short-bias)',
                    '',
                    'Rolling Beta & Correlation chart:',
                    'Beta and BTC correlation dynamics over a rolling window.',
                    '• Stable Beta: Consistent market exposure',
                    '• Volatile Beta: Adaptive or inconsistent strategy',
                    '',
                    'Source: Sharpe W. (1964) "Capital Asset Prices", Journal of Finance.'
                ],
                formula: 'β = Cov(Rₚ, Rᵦ) / Var(Rᵦ)\nwhere Cov = covariance, Var = variance'
            },
            ru: {
                title: 'Beta (β) — Systematic Risk',
                description: 'Мера систематического (рыночного) риска из Capital Asset Pricing Model (CAPM). Beta показывает чувствительность портфеля к движениям бенчмарка. Является ключевым параметром для оценки рыночной экспозиции и ожидаемой доходности согласно теории Sharpe-Lintner.',
                interpretation: [
                    'Интерпретация значения (CAPM):',
                    '• β = 1.0: Портфель движется синхронно с рынком',
                    '• β > 1.0: Агрессивная стратегия — усиливает рыночные движения',
                    '  (β = 1.5: при +10% BTC портфель даёт +15%)',
                    '• β < 1.0: Консервативная стратегия — сглаживает рыночные движения',
                    '  (β = 0.5: при +10% BTC портфель даёт +5%)',
                    '• β ≈ 0: Market-neutral стратегия',
                    '• β < 0: Контртрендовая стратегия (шорт-bias)',
                    '',
                    'График Rolling Beta & Correlation:',
                    'Динамика Beta и корреляции с BTC за скользящим окном.',
                    '• Стабильная Beta: Консистентная рыночная экспозиция',
                    '• Волатильная Beta: Адаптивная или непоследовательная стратегия',
                    '',
                    'Источник: Sharpe W. (1964) "Capital Asset Prices", Journal of Finance.'
                ],
                formula: 'β = Cov(Rₚ, Rᵦ) / Var(Rᵦ)\nгде Cov = ковариация, Var = дисперсия'
            }
        },
        'EXP. RETURN': {
            uk: {
                title: 'Expected Return (CAPM)',
                description: 'Теоретично очікувана дохідність портфеля на основі Capital Asset Pricing Model. CAPM, розроблена Sharpe (1964) та Lintner (1965), постулює лінійну залежність між очікуваною дохідністю та систематичним ризиком (Beta).',
                interpretation: [
                    'Інтерпретація графіка Expected vs Actual:',
                    '• Actual > Expected: Позитивна Alpha — стратегія генерує надлишкову дохідність',
                    '• Actual = Expected: Нульова Alpha — дохідність відповідає прийнятому ризику',
                    '• Actual < Expected: Негативна Alpha — стратегія не компенсує ризик',
                    '',
                    'Компоненти CAPM:',
                    '• Risk-Free Rate (Rᶠ): Дохідність безризикового активу',
                    '• Market Risk Premium: Rₘ - Rᶠ (премія за ринковий ризик)',
                    '• Beta: Чутливість до ринкового ризику',
                    '',
                    'Обмеження CAPM:',
                    '• Передбачає ефективний ринок',
                    '• Не враховує інші фактори ризику (size, value, momentum)',
                    '',
                    'Джерело: Sharpe W. (1964), Lintner J. (1965) — CAPM originators.'
                ],
                formula: 'E(Rₚ) = Rᶠ + β × (Rₘ - Rᶠ)\nде Rₘ = Market Return (BTC), Rᶠ = Risk-Free Rate'
            },
            en: {
                title: 'Expected Return (CAPM)',
                description: 'Theoretically expected portfolio return based on Capital Asset Pricing Model. CAPM, developed by Sharpe (1964) and Lintner (1965), postulates a linear relationship between expected return and systematic risk (Beta).',
                interpretation: [
                    'Expected vs Actual chart interpretation:',
                    '• Actual > Expected: Positive Alpha — strategy generates excess return',
                    '• Actual = Expected: Zero Alpha — return matches the risk taken',
                    '• Actual < Expected: Negative Alpha — strategy doesn\'t compensate for risk',
                    '',
                    'CAPM components:',
                    '• Risk-Free Rate (Rᶠ): Return of risk-free asset',
                    '• Market Risk Premium: Rₘ - Rᶠ (market risk premium)',
                    '• Beta: Sensitivity to market risk',
                    '',
                    'CAPM limitations:',
                    '• Assumes efficient market',
                    '• Does not account for other risk factors (size, value, momentum)',
                    '',
                    'Source: Sharpe W. (1964), Lintner J. (1965) — CAPM originators.'
                ],
                formula: 'E(Rₚ) = Rᶠ + β × (Rₘ - Rᶠ)\nwhere Rₘ = Market Return (BTC), Rᶠ = Risk-Free Rate'
            },
            ru: {
                title: 'Expected Return (CAPM)',
                description: 'Теоретически ожидаемая доходность портфеля на основе Capital Asset Pricing Model. CAPM, разработанная Sharpe (1964) и Lintner (1965), постулирует линейную зависимость между ожидаемой доходностью и систематическим риском (Beta).',
                interpretation: [
                    'Интерпретация графика Expected vs Actual:',
                    '• Actual > Expected: Положительная Alpha — стратегия генерирует избыточную доходность',
                    '• Actual = Expected: Нулевая Alpha — доходность соответствует принятому риску',
                    '• Actual < Expected: Отрицательная Alpha — стратегия не компенсирует риск',
                    '',
                    'Компоненты CAPM:',
                    '• Risk-Free Rate (Rᶠ): Доходность безрискового актива',
                    '• Market Risk Premium: Rₘ - Rᶠ (премия за рыночный риск)',
                    '• Beta: Чувствительность к рыночному риску',
                    '',
                    'Ограничения CAPM:',
                    '• Предполагает эффективный рынок',
                    '• Не учитывает другие факторы риска (size, value, momentum)',
                    '',
                    'Источник: Sharpe W. (1964), Lintner J. (1965) — CAPM originators.'
                ],
                formula: 'E(Rₚ) = Rᶠ + β × (Rₘ - Rᶠ)\nгде Rₘ = Market Return (BTC), Rᶠ = Risk-Free Rate'
            }
        },
        'WIN RATE': {
            uk: {
                title: 'Win Rate (Hit Ratio)',
                description: 'Відсоток прибуткових угод від загальної кількості закритих позицій. Базова метрика точності торгової системи. Важливо: Win Rate сам по собі не визначає прибутковість — потрібно аналізувати разом з Profit Factor та Average Win/Loss.',
                interpretation: [
                    'Інтерпретація значення:',
                    '• < 40%: Низька точність — потребує високого Reward/Risk',
                    '• 40-50%: Типово для трендових стратегій',
                    '• 50-60%: Добра точність',
                    '• > 60%: Висока точність (типово для mean-reversion)',
                    '',
                    'Графік Rolling Win Rate:',
                    'Динаміка Win Rate за ковзаючим вікном.',
                    '• Стабільний Win Rate: Надійна торгова система',
                    '• Волатильний: Залежність від ринкових умов',
                    '',
                    'Важливо розуміти:',
                    '• Win Rate 40% може бути прибутковим (якщо Avg Win >> Avg Loss)',
                    '• Win Rate 60% може бути збитковим (якщо Avg Loss >> Avg Win)',
                    '• Для повної картини аналізуйте разом з Expectancy та Profit Factor'
                ],
                formula: 'Win Rate = (Кількість прибуткових угод / Загальна кількість угод) × 100%'
            },
            en: {
                title: 'Win Rate (Hit Ratio)',
                description: 'Percentage of profitable trades out of total closed positions. Basic accuracy metric for a trading system. Important: Win Rate alone does not determine profitability — it must be analyzed together with Profit Factor and Average Win/Loss.',
                interpretation: [
                    'Value interpretation:',
                    '• < 40%: Low accuracy — requires high Reward/Risk',
                    '• 40-50%: Typical for trend-following strategies',
                    '• 50-60%: Good accuracy',
                    '• > 60%: High accuracy (typical for mean-reversion)',
                    '',
                    'Rolling Win Rate chart:',
                    'Win Rate dynamics over a rolling window.',
                    '• Stable Win Rate: Reliable trading system',
                    '• Volatile: Dependence on market conditions',
                    '',
                    'Important to understand:',
                    '• 40% Win Rate can be profitable (if Avg Win >> Avg Loss)',
                    '• 60% Win Rate can be unprofitable (if Avg Loss >> Avg Win)',
                    '• For the full picture, analyze together with Expectancy and Profit Factor'
                ],
                formula: 'Win Rate = (Number of profitable trades / Total number of trades) × 100%'
            },
            ru: {
                title: 'Win Rate (Hit Ratio)',
                description: 'Процент прибыльных сделок от общего количества закрытых позиций. Базовая метрика точности торговой системы. Важно: Win Rate сам по себе не определяет прибыльность — необходимо анализировать вместе с Profit Factor и Average Win/Loss.',
                interpretation: [
                    'Интерпретация значения:',
                    '• < 40%: Низкая точность — требует высокого Reward/Risk',
                    '• 40-50%: Типично для трендовых стратегий',
                    '• 50-60%: Хорошая точность',
                    '• > 60%: Высокая точность (типично для mean-reversion)',
                    '',
                    'График Rolling Win Rate:',
                    'Динамика Win Rate за скользящим окном.',
                    '• Стабильный Win Rate: Надёжная торговая система',
                    '• Волатильный: Зависимость от рыночных условий',
                    '',
                    'Важно понимать:',
                    '• Win Rate 40% может быть прибыльным (если Avg Win >> Avg Loss)',
                    '• Win Rate 60% может быть убыточным (если Avg Loss >> Avg Win)',
                    '• Для полной картины анализируйте вместе с Expectancy и Profit Factor'
                ],
                formula: 'Win Rate = (Количество прибыльных сделок / Общее количество сделок) × 100%'
            }
        },
        'MAX DRAWDOWN': {
            uk: {
                title: 'Maximum Drawdown (MDD)',
                description: 'Найбільше відносне падіння вартості портфеля від історичного піку до наступного мінімуму. Згідно CFA Institute та GIPS®, MDD є критичною метрикою ризику, що показує максимальні потенційні втрати та «tail risk» стратегії.',
                interpretation: [
                    'Інтерпретація значення (за Burke, 1994):',
                    '• 0% до -10%: Консервативна стратегія з низьким ризиком',
                    '• -10% до -20%: Помірний ризик',
                    '• -20% до -30%: Агресивна стратегія',
                    '• > -30%: Високий ризик — потенційно катастрофічні втрати',
                    '',
                    'Графік Underwater (Drawdown Chart):',
                    'Візуалізує всі просадки відносно High Watermark.',
                    '• Глибина: Величина максимальної втрати',
                    '• Тривалість: Час "під водою" до відновлення',
                    '• Частота: Як часто відбуваються просадки',
                    '',
                    'Порівняння з BTC:',
                    'Дозволяє оцінити, чи стратегія захищає від ринкових падінь.',
                    '',
                    'Джерело: Magdon-Ismail M., Atiya A. (2004) "Maximum Drawdown", Risk Magazine.'
                ],
                formula: 'MDD = min[(NAVₜ - Peak NAV) / Peak NAV] × 100%\nде Peak NAV = max(NAV₀, NAV₁, ..., NAVₜ)'
            },
            en: {
                title: 'Maximum Drawdown (MDD)',
                description: 'Largest relative decline in portfolio value from historical peak to subsequent trough. Per CFA Institute and GIPS®, MDD is a critical risk metric showing maximum potential losses and "tail risk" of the strategy.',
                interpretation: [
                    'Value interpretation (Burke, 1994):',
                    '• 0% to -10%: Conservative strategy with low risk',
                    '• -10% to -20%: Moderate risk',
                    '• -20% to -30%: Aggressive strategy',
                    '• > -30%: High risk — potentially catastrophic losses',
                    '',
                    'Underwater chart (Drawdown Chart):',
                    'Visualizes all drawdowns relative to High Watermark.',
                    '• Depth: Maximum loss magnitude',
                    '• Duration: Time "underwater" until recovery',
                    '• Frequency: How often drawdowns occur',
                    '',
                    'Comparison with BTC:',
                    'Allows evaluating whether the strategy protects against market declines.',
                    '',
                    'Source: Magdon-Ismail M., Atiya A. (2004) "Maximum Drawdown", Risk Magazine.'
                ],
                formula: 'MDD = min[(NAVₜ - Peak NAV) / Peak NAV] × 100%\nwhere Peak NAV = max(NAV₀, NAV₁, ..., NAVₜ)'
            },
            ru: {
                title: 'Maximum Drawdown (MDD)',
                description: 'Наибольшее относительное падение стоимости портфеля от исторического пика до последующего минимума. Согласно CFA Institute и GIPS®, MDD является критической метрикой риска, показывающей максимальные потенциальные потери и «tail risk» стратегии.',
                interpretation: [
                    'Интерпретация значения (Burke, 1994):',
                    '• 0% до -10%: Консервативная стратегия с низким риском',
                    '• -10% до -20%: Умеренный риск',
                    '• -20% до -30%: Агрессивная стратегия',
                    '• > -30%: Высокий риск — потенциально катастрофические потери',
                    '',
                    'График Underwater (Drawdown Chart):',
                    'Визуализирует все просадки относительно High Watermark.',
                    '• Глубина: Величина максимальной потери',
                    '• Длительность: Время «под водой» до восстановления',
                    '• Частота: Как часто происходят просадки',
                    '',
                    'Сравнение с BTC:',
                    'Позволяет оценить, защищает ли стратегия от рыночных падений.',
                    '',
                    'Источник: Magdon-Ismail M., Atiya A. (2004) "Maximum Drawdown", Risk Magazine.'
                ],
                formula: 'MDD = min[(NAVₜ - Peak NAV) / Peak NAV] × 100%\nгде Peak NAV = max(NAV₀, NAV₁, ..., NAVₜ)'
            }
        },
        'DD OUTPERFORM': {
            uk: {
                title: 'Drawdown Outperformance',
                description: 'Різниця між максимальною просадкою портфеля та бенчмарку (BTC). Показує наскільки ефективно стратегія захищає капітал під час ринкових падінь. Позитивне значення означає меншу просадку порівняно з пасивним утриманням BTC.',
                interpretation: [
                    'Інтерпретація значення:',
                    '• > 0: Портфель стабільніший за BTC — краще управління ризиком',
                    '• = 0: Аналогічний рівень просадок',
                    '• < 0: Портфель просідає глибше за BTC — вищий ризик',
                    '',
                    'Графік Comparative Drawdown:',
                    'Накладені графіки просадок портфеля (фіолетовий) та BTC (сірий).',
                    '• Портфель вище нуля, BTC нижче: Захист від падіння ринку',
                    '• Обидва падають синхронно: Висока Beta, немає захисту',
                    '• Портфель падає глибше: Стратегія підсилює втрати',
                    '',
                    'Практичне застосування:',
                    '• Оцінка ефективності хеджування',
                    '• Аналіз поведінки стратегії в кризові періоди',
                    '• Визначення доданої вартості risk management'
                ],
                formula: 'DD Outperformance = Portfolio MDD - BTC MDD\n(позитивне = краще, бо MDD завжди негативний)'
            },
            en: {
                title: 'Drawdown Outperformance',
                description: 'Difference between portfolio\'s maximum drawdown and benchmark (BTC) drawdown. Shows how effectively the strategy protects capital during market declines. Positive value means smaller drawdown compared to passively holding BTC.',
                interpretation: [
                    'Value interpretation:',
                    '• > 0: Portfolio more stable than BTC — better risk management',
                    '• = 0: Similar drawdown level',
                    '• < 0: Portfolio draws down deeper than BTC — higher risk',
                    '',
                    'Comparative Drawdown chart:',
                    'Overlaid drawdown charts of portfolio (purple) and BTC (gray).',
                    '• Portfolio above zero, BTC below: Protection from market decline',
                    '• Both falling in sync: High Beta, no protection',
                    '• Portfolio falls deeper: Strategy amplifies losses',
                    '',
                    'Practical application:',
                    '• Hedging effectiveness evaluation',
                    '• Strategy behavior analysis during crisis periods',
                    '• Determining added value of risk management'
                ],
                formula: 'DD Outperformance = Portfolio MDD - BTC MDD\n(positive = better, since MDD is always negative)'
            },
            ru: {
                title: 'Drawdown Outperformance',
                description: 'Разница между максимальной просадкой портфеля и бенчмарка (BTC). Показывает, насколько эффективно стратегия защищает капитал во время рыночных падений. Положительное значение означает меньшую просадку по сравнению с пассивным удержанием BTC.',
                interpretation: [
                    'Интерпретация значения:',
                    '• > 0: Портфель стабильнее BTC — лучшее управление риском',
                    '• = 0: Аналогичный уровень просадок',
                    '• < 0: Портфель просаживается глубже BTC — выше риск',
                    '',
                    'График Comparative Drawdown:',
                    'Наложенные графики просадок портфеля (фиолетовый) и BTC (серый).',
                    '• Портфель выше нуля, BTC ниже: Защита от падения рынка',
                    '• Оба падают синхронно: Высокая Beta, нет защиты',
                    '• Портфель падает глубже: Стратегия усиливает потери',
                    '',
                    'Практическое применение:',
                    '• Оценка эффективности хеджирования',
                    '• Анализ поведения стратегии в кризисные периоды',
                    '• Определение добавленной стоимости risk management'
                ],
                formula: 'DD Outperformance = Portfolio MDD - BTC MDD\n(положительное = лучше, т.к. MDD всегда отрицательный)'
            }
        },
        'HIGH WATERMARK': {
            uk: {
                title: 'High Watermark (HWM)',
                description: 'Історичний максимум чистої вартості активів (NAV) портфеля. Згідно з індустріальним стандартом, HWM використовується для розрахунку performance fee у хедж-фондах — менеджер отримує премію тільки за нові максимуми прибутковості.',
                interpretation: [
                    'Інтерпретація значення:',
                    '• NAV = HWM: Портфель на історичному максимумі',
                    '• NAV < HWM: Портфель у просадці (NAV - HWM = поточний drawdown)',
                    '',
                    'Графік NAV vs High Watermark:',
                    'Лінія NAV (зелена область) та лінія HWM (жовта пунктирна).',
                    '• Зелена зона торкається жовтої: Портфель на піку',
                    '• Зелена зона нижче жовтої: Портфель у просадці',
                    '• Відстань між лініями: Величина поточної просадки',
                    '',
                    'Над графіком відображаються:',
                    '• NAV: Поточна вартість портфеля',
                    '• HWM: Історичний максимум вартості'
                ],
                formula: 'HWM = max(NAV₀, NAV₁, NAV₂, ..., NAVₜ)\nCurrent Drawdown = (NAV - HWM) / HWM × 100%'
            },
            en: {
                title: 'High Watermark (HWM)',
                description: 'Historical maximum of portfolio\'s net asset value (NAV). Per industry standard, HWM is used to calculate performance fees in hedge funds — the manager receives a bonus only for new profitability peaks.',
                interpretation: [
                    'Value interpretation:',
                    '• NAV = HWM: Portfolio at historical maximum',
                    '• NAV < HWM: Portfolio in drawdown (NAV - HWM = current drawdown)',
                    '',
                    'NAV vs High Watermark chart:',
                    'NAV line (green area) and HWM line (yellow dashed).',
                    '• Green zone touches yellow: Portfolio at peak',
                    '• Green zone below yellow: Portfolio in drawdown',
                    '• Distance between lines: Current drawdown magnitude',
                    '',
                    'Above the chart:',
                    '• NAV: Current portfolio value',
                    '• HWM: Historical peak value'
                ],
                formula: 'HWM = max(NAV₀, NAV₁, NAV₂, ..., NAVₜ)\nCurrent Drawdown = (NAV - HWM) / HWM × 100%'
            },
            ru: {
                title: 'High Watermark (HWM)',
                description: 'Исторический максимум чистой стоимости активов (NAV) портфеля. Согласно индустриальному стандарту, HWM используется для расчёта performance fee в хедж-фондах — менеджер получает премию только за новые максимумы прибыльности.',
                interpretation: [
                    'Интерпретация значения:',
                    '• NAV = HWM: Портфель на историческом максимуме',
                    '• NAV < HWM: Портфель в просадке (NAV - HWM = текущая просадка)',
                    '',
                    'График NAV vs High Watermark:',
                    'Линия NAV (зелёная область) и линия HWM (жёлтая пунктирная).',
                    '• Зелёная зона касается жёлтой: Портфель на пике',
                    '• Зелёная зона ниже жёлтой: Портфель в просадке',
                    '• Расстояние между линиями: Величина текущей просадки',
                    '',
                    'Над графиком отображаются:',
                    '• NAV: Текущая стоимость портфеля',
                    '• HWM: Исторический максимум стоимости'
                ],
                formula: 'HWM = max(NAV₀, NAV₁, NAV₂, ..., NAVₜ)\nCurrent Drawdown = (NAV - HWM) / HWM × 100%'
            }
        },
        'TRACKING ERROR': {
            uk: {
                title: 'Tracking Error (TE)',
                description: 'Волатильність різниці дохідностей портфеля та бенчмарку. За CFA Institute, TE вимірює «активний ризик» — наскільки результати портфеля відхиляються від бенчмарку. Є знаменником у формулі Information Ratio.',
                interpretation: [
                    'Інтерпретація значення (за Grinold & Kahn):',
                    '• TE ≈ 0%: Index-tracking стратегія (passive)',
                    '• TE < 5%: Низький активний ризик (enhanced index)',
                    '• 5% < TE < 10%: Помірний активний ризик',
                    '• 10% < TE < 15%: Високий активний ризик',
                    '• TE > 15%: Агресивна активна стратегія',
                    '',
                    'Графік Rolling Tracking Error:',
                    'Динаміка TE за ковзаючим вікном.',
                    '• Стабільний TE: Послідовний рівень активності',
                    '• Зростаючий TE: Стратегія стає більш агресивною',
                    '• Спадаючий TE: Конвергенція до бенчмарку',
                    '',
                    'Зв\'язок з IR: Information Ratio = Alpha / Tracking Error.',
                    '',
                    'Джерело: CFA Institute, GIPS® Standards.'
                ],
                formula: 'TE = σ(Rₚ - Rᵦ) × √365\nде σ = стандартне відхилення excess returns'
            },
            en: {
                title: 'Tracking Error (TE)',
                description: 'Volatility of the difference between portfolio and benchmark returns. Per CFA Institute, TE measures "active risk" — how much portfolio results deviate from the benchmark. It is the denominator in the Information Ratio formula.',
                interpretation: [
                    'Value interpretation (Grinold & Kahn):',
                    '• TE ≈ 0%: Index-tracking strategy (passive)',
                    '• TE < 5%: Low active risk (enhanced index)',
                    '• 5% < TE < 10%: Moderate active risk',
                    '• 10% < TE < 15%: High active risk',
                    '• TE > 15%: Aggressive active strategy',
                    '',
                    'Rolling Tracking Error chart:',
                    'TE dynamics over a rolling window.',
                    '• Stable TE: Consistent activity level',
                    '• Rising TE: Strategy becoming more aggressive',
                    '• Declining TE: Convergence to benchmark',
                    '',
                    'Relationship with IR: Information Ratio = Alpha / Tracking Error.',
                    '',
                    'Source: CFA Institute, GIPS® Standards.'
                ],
                formula: 'TE = σ(Rₚ - Rᵦ) × √365\nwhere σ = standard deviation of excess returns'
            },
            ru: {
                title: 'Tracking Error (TE)',
                description: 'Волатильность разницы доходностей портфеля и бенчмарка. По CFA Institute, TE измеряет «активный риск» — насколько результаты портфеля отклоняются от бенчмарка. Является знаменателем в формуле Information Ratio.',
                interpretation: [
                    'Интерпретация значения (Grinold & Kahn):',
                    '• TE ≈ 0%: Index-tracking стратегия (passive)',
                    '• TE < 5%: Низкий активный риск (enhanced index)',
                    '• 5% < TE < 10%: Умеренный активный риск',
                    '• 10% < TE < 15%: Высокий активный риск',
                    '• TE > 15%: Агрессивная активная стратегия',
                    '',
                    'График Rolling Tracking Error:',
                    'Динамика TE за скользящим окном.',
                    '• Стабильный TE: Последовательный уровень активности',
                    '• Растущий TE: Стратегия становится более агрессивной',
                    '• Снижающийся TE: Конвергенция к бенчмарку',
                    '',
                    'Связь с IR: Information Ratio = Alpha / Tracking Error.',
                    '',
                    'Источник: CFA Institute, GIPS® Standards.'
                ],
                formula: 'TE = σ(Rₚ - Rᵦ) × √365\nгде σ = стандартное отклонение excess returns'
            }
        },
        'TOTAL R MULTIPLE': {
            uk: {
                title: 'Total R-Multiple',
                description: 'Сукупний прибуток виражений у одиницях ризику (R), де R = запланований ризик на угоду (стоп-лосс). Концепція популяризована Van Tharp у «Trade Your Way to Financial Freedom». Дозволяє стандартизувати результати незалежно від розміру позицій.',
                interpretation: [
                    'Інтерпретація значення:',
                    '• R < 0: Загальний збиток у одиницях ризику',
                    '• 0 < R < 10: Слабкий результат',
                    '• 10 < R < 30: Хороший результат',
                    '• 30 < R < 50: Дуже хороший результат',
                    '• R > 50: Відмінний результат',
                    '',
                    'Графік R-Multiple Distribution:',
                    'Розподіл результатів окремих угод у одиницях R.',
                    '• Зелені стовпці: Прибуткові угоди (+R)',
                    '• Червоні стовпці: Збиткові угоди (-R)',
                    '• Форма розподілу: Показує асиметрію результатів',
                    '',
                    'Практичне застосування:',
                    '• Оцінка якості управління ризиком',
                    '• Аналіз співвідношення великих виграшів до програшів',
                    '• Стандартизоване порівняння різних стратегій',
                    '',
                    'Джерело: Van Tharp (1998) "Trade Your Way to Financial Freedom".'
                ],
                formula: 'R-Multiple = P&L / Initial Risk (Stop-Loss)\nTotal R = Σ(Individual R-Multiples)'
            },
            en: {
                title: 'Total R-Multiple',
                description: 'Cumulative profit expressed in risk units (R), where R = planned risk per trade (stop-loss). Concept popularized by Van Tharp in "Trade Your Way to Financial Freedom". Allows standardizing results regardless of position sizes.',
                interpretation: [
                    'Value interpretation:',
                    '• R < 0: Overall loss in risk units',
                    '• 0 < R < 10: Weak result',
                    '• 10 < R < 30: Good result',
                    '• 30 < R < 50: Very good result',
                    '• R > 50: Excellent result',
                    '',
                    'R-Multiple Distribution chart:',
                    'Distribution of individual trade results in R units.',
                    '• Green bars: Profitable trades (+R)',
                    '• Red bars: Losing trades (-R)',
                    '• Distribution shape: Shows asymmetry of results',
                    '',
                    'Practical application:',
                    '• Risk management quality assessment',
                    '• Analysis of big wins to losses ratio',
                    '• Standardized comparison of different strategies',
                    '',
                    'Source: Van Tharp (1998) "Trade Your Way to Financial Freedom".'
                ],
                formula: 'R-Multiple = P&L / Initial Risk (Stop-Loss)\nTotal R = Σ(Individual R-Multiples)'
            },
            ru: {
                title: 'Total R-Multiple',
                description: 'Совокупная прибыль, выраженная в единицах риска (R), где R = запланированный риск на сделку (стоп-лосс). Концепция популяризирована Van Tharp в «Trade Your Way to Financial Freedom». Позволяет стандартизировать результаты независимо от размера позиций.',
                interpretation: [
                    'Интерпретация значения:',
                    '• R < 0: Общий убыток в единицах риска',
                    '• 0 < R < 10: Слабый результат',
                    '• 10 < R < 30: Хороший результат',
                    '• 30 < R < 50: Очень хороший результат',
                    '• R > 50: Отличный результат',
                    '',
                    'График R-Multiple Distribution:',
                    'Распределение результатов отдельных сделок в единицах R.',
                    '• Зелёные столбцы: Прибыльные сделки (+R)',
                    '• Красные столбцы: Убыточные сделки (-R)',
                    '• Форма распределения: Показывает асимметрию результатов',
                    '',
                    'Практическое применение:',
                    '• Оценка качества управления риском',
                    '• Анализ соотношения крупных выигрышей к проигрышам',
                    '• Стандартизированное сравнение различных стратегий',
                    '',
                    'Источник: Van Tharp (1998) "Trade Your Way to Financial Freedom".'
                ],
                formula: 'R-Multiple = P&L / Initial Risk (Stop-Loss)\nTotal R = Σ(Individual R-Multiples)'
            }
        },
    } as Record<string, Record<LangKey, MetricLangData>>,

    // ==================== CHART LABELS & SUBTITLES ====================
    charts: {
        alphaCurve: {
            above: { uk: 'Перевищення над BTC', en: 'Outperforming BTC', ru: 'Превышение над BTC' },
            below: { uk: 'Відставання від BTC', en: 'Underperforming BTC', ru: 'Отставание от BTC' },
        },
        rollingTrackingError: {
            subtitle: {
                uk: 'Поточна волатильність відхилення від BTC',
                en: 'Current deviation volatility from BTC',
                ru: 'Текущая волатильность отклонения от BTC'
            },
        },
        rMultiple: {
            yAxisLabel: { uk: 'Кількість трейдів', en: 'Number of trades', ru: 'Количество трейдов' },
            subtitle: {
                uk: 'Розподіл трейдів за R-мультиплікатором (Risk/Reward)',
                en: 'Trade distribution by R-multiple (Risk/Reward)',
                ru: 'Распределение трейдов по R-мультипликатору (Risk/Reward)'
            },
        },
        navHistory: {
            subtitle: { uk: 'Поточна вартість портфеля', en: 'Current portfolio value', ru: 'Текущая стоимость портфеля' },
        },
        comparativeDrawdown: {
            subtitle: {
                uk: 'Порівняння просадок: Портфель vs BTC',
                en: 'Drawdown comparison: Portfolio vs BTC',
                ru: 'Сравнение просадок: Портфель vs BTC'
            },
        },
        dailyReturns: {
            subtitle: { uk: 'Денні прибутки/збитки портфеля', en: 'Daily portfolio profits/losses', ru: 'Дневные прибыли/убытки портфеля' },
            stableTrading: { uk: '🟢 Стабільна торгівля', en: '🟢 Stable trading', ru: '🟢 Стабильная торговля' },
            moderateVolatility: { uk: '🟡 Помірна волатильність', en: '🟡 Moderate volatility', ru: '🟡 Умеренная волатильность' },
            highVolatility: { uk: '🔴 Висока волатильність', en: '🔴 High volatility', ru: '🔴 Высокая волатильность' },
        },
        rollingInformationRatio: {
            subtitle: { uk: 'Поточний Information Ratio', en: 'Current Information Ratio', ru: 'Текущий Information Ratio' },
        },
        expectedVsActual: {
            subtitle: {
                uk: 'Порівняння CAPM прогнозу з реальним результатом',
                en: 'Comparing CAPM forecast with actual result',
                ru: 'Сравнение CAPM прогноза с реальным результатом'
            },
        },
        riskAdjusted: {
            subtitle: {
                uk: 'Порівняння risk-adjusted метрик: Портфель vs BTC',
                en: 'Risk-adjusted metrics comparison: Portfolio vs BTC',
                ru: 'Сравнение risk-adjusted метрик: Портфель vs BTC'
            },
        },
    },
} as const;

export const languageNames: Record<LangKey, TransObj> = {
    uk: { uk: 'Українська', en: 'Ukrainian', ru: 'Украинский' },
    en: { uk: 'Англійська', en: 'English', ru: 'Английский' },
    ru: { uk: 'Російська', en: 'Russian', ru: 'Русский' },
};

/** Get translation for current language */
export function getTranslation(obj: any, lang: LangKey): any {
    if (!obj) return '';
    if (typeof obj === 'function') return obj;
    if (typeof obj === 'object' && obj[lang] !== undefined) return obj[lang];
    return obj;
}

/** Hook-like helper: get t() for a language */
export function createT(lang: LangKey) {
    return (obj: any): any => getTranslation(obj, lang);
}
