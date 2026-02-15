# 🔧 Backend Refactor Plan

> **Створено:** 2026-02-15  
> **Базова оцінка:** 8.2/10  
> **Ціль:** Підготувати бекенд до масштабного розширення без міграції БД та без тестів (окремий етап)

---

## Зміст

1. [Використати Pydantic schemas в router](#1-використати-pydantic-schemas-в-router)
2. [Виправити залежність utils → modules](#2-виправити-залежність-utils--modules)
3. [Усунути дублювання Exporter / Service](#3-усунути-дублювання-exporter--service)
4. [Закешувати properties конфігів](#4-закешувати-properties-конфігів)
5. [Замінити global _update_state на клас](#5-замінити-global-_update_state-на-клас)
6. [Додати пагінацію до screener](#6-додати-пагінацію-до-screener)
7. [Паралелізувати завантаження цін](#7-паралелізувати-завантаження-цін)
8. [Виправити N+1 в exporter](#8-виправити-n1-в-exporter)
9. [Усунути circular import у cot/scheduler.py](#9-усунути-circular-import-у-cotschedulerpy)
10. [Додати lazy eviction у TTLCache](#10-додати-lazy-eviction-у-ttlcache)

---

## 1. Використати Pydantic schemas в router

**Файли:** `app/modules/cot/router.py`, `app/modules/cot/schemas.py`

### Проблема

Зараз `schemas.py` містить гарні Pydantic моделі (`MarketDetailResponse`, `MarketMeta`, `WeekData` тощо), але жоден endpoint їх не використовує. Всі endpoints повертають сирі `dict`:

```python
# router.py — зараз
@router.get("/markets/{report_type}/{subtype}/{code}")
def get_market(...):
    data = service.get_market_detail(...)
    return data  # ← сирий dict, без валідації
```

Це означає:
- **OpenAPI документація** (`/api/docs`) не показує реальну структуру відповідей
- **Відсутність контракту** — якщо calculator поверне невалідні дані, API мовчки віддасть їх клієнту
- **Відсутність автокомпліту** для фронтенд-розробників, які дивляться на OpenAPI

### Рішення

Додати `response_model=` до кожного endpoint:

```python
# router.py — після
@router.get("/markets/{report_type}/{subtype}/{code}", response_model=MarketDetailResponse)
def get_market(...):
    data = service.get_market_detail(...)
    return data  # ← тепер FastAPI валідує через Pydantic
```

### Чому саме так

- **Не треба міняти Service/Calculator** — вони вже повертають dict'и правильної структури
- FastAPI автоматично серіалізує dict через Pydantic модель
- `extra="allow"` у `WeekData` та `StatsBlock` вже передбачений для динамічних g1-g5 полів
- Це zero-cost зміна — тільки додаємо `response_model=` параметр

### Додаткові schemas які потрібно створити

```python
# Для list_markets
class MarketsListResponse(BaseModel):
    __root__: list[MarketMeta]  # або просто response_model=list[MarketMeta]

# Для screener — потрібна нова модель
class ScreenerRow(BaseModel):
    model_config = ConfigDict(extra="allow")
    code: str
    name: str
    category: str
    date: str | None = None
    open_interest: float | None = None
    signals: list[dict] | None = None

# Для status endpoint
class StatusResponse(BaseModel):
    data: dict
    scheduler: dict
```

### Обсяг роботи
- `schemas.py` — додати 3-4 моделі (~30 рядків)
- `router.py` — додати `response_model=` до 5 endpoints (~5 рядків)

---

## 2. Виправити залежність utils → modules

**Файли:** `app/utils/categories.py`, `app/modules/cot/config.py`

### Проблема

`categories.py` знаходиться у `utils/` (shared utilities), але імпортує `cot_settings`:

```python
# utils/categories.py
from app.modules.cot.config import cot_settings  # ❌ utils залежить від modules
```

Це порушує принцип напрямку залежностей:
```
core/ ← modules/ ← utils/   ❌ неправильно
core/ ← utils/ ← modules/   ✅ правильно
```

Коли ти додаш новий модуль (наприклад `modules/sentiment/`), він теж потребуватиме `categorize_market()`, але отримає непотрібну залежність від `cot_settings`.

### Рішення

**Варіант: Зробити `categorize_market()` конфігурованою — передавати categories як параметр.**

```python
# utils/categories.py — після
def categorize_market(name: str, categories: dict[str, dict]) -> tuple[str, str]:
    """Визначає категорію ринку за назвою.

    Args:
        name: Назва ринку (e.g. "GOLD - COMEX")
        categories: Словник категорій {key: {"keywords": [...], "display": "..."}}
    """
    upper = name.upper()
    for cat_key, cat_info in categories.items():
        for kw in cat_info["keywords"]:
            if kw in upper:
                return cat_key, cat_info["display"]
    return "other", "Other"


def build_market_meta(
    code: str, name: str, exchange: str,
    report_type: str, subtype: str,
    categories: dict[str, dict],
    display_names: dict[str, str],
    subtype_names: dict[str, str],
) -> dict:
    ...
```

### Чому саме так, а не перенести в modules/cot/

- `build_market_meta()` і `build_screener_row()` використовуються і в `Exporter`, і в `Service` — вони **реально** shared utilities
- Коли з'явиться `modules/forex/` або `modules/sentiment/`, вони зможуть передати свої `categories`
- Ми **не хочемо** дублювати цю логіку в кожному модулі

### Альтернатива яку я відкинув

Перенести файл у `modules/cot/categories.py` — простіше, але тоді при створенні нового модуля доведеться або дублювати код, або імпортувати з `cot/`.

### Обсяг роботи

- `utils/categories.py` — змінити сигнатури 3 функцій, прибрати import
- `modules/cot/service.py` — передавати `cot_settings.market_categories` при виклику
- `modules/cot/exporter.py` — аналогічно

---

## 3. Усунути дублювання Exporter / Service

**Файли:** `app/modules/cot/exporter.py`, `app/modules/cot/service.py`

### Проблема

`CotExporter.export_all()` і `CotService.get_market_detail()` мають однакову логіку:

```
Обидва: fetch rows → calc.compute() → build_market_meta() → attach prices → build payload
```

Якщо зміниться формат payload (наприклад, додасться новий ключ), потрібно міняти в **двох місцях**. Це класичне порушення DRY.

### Рішення

Створити спільний **builder**, який формує payload, а Exporter і Service його використовують:

```python
# modules/cot/builder.py (НОВИЙ ФАЙЛ)

class CotPayloadBuilder:
    """Будує уніфіковані payload-и для ринків і screener.
    Використовується і Exporter-ом (для JSON-файлів), і Service-ом (для API)."""

    def __init__(self, store: CotStorage, calc: CotCalculator):
        self.store = store
        self.calc = calc

    def build_market_detail(
        self, code: str, report_type: str, subtype: str,
        prices: list[dict] | None = None,
    ) -> dict | None:
        """Один ринок → повний payload."""
        groups = cot_settings.report_groups[report_type]
        raw_rows = self.store.get_market_data(code, report_type, subtype)
        if not raw_rows:
            return None
        computed = self.calc.compute(raw_rows, report_type)
        # ... build payload ...
        return payload

    def build_screener(
        self, report_type: str, subtype: str,
    ) -> list[dict]:
        """Всі ринки → screener rows."""
        # ... shared logic ...
```

Тоді:
```python
# service.py
class CotService:
    def get_market_detail(self, code, rt, st):
        return self.builder.build_market_detail(code, rt, st, prices=...)

# exporter.py
class CotExporter:
    def export_all(self, rt, st):
        for market in markets:
            payload = self.builder.build_market_detail(market["code"], rt, st, prices=...)
            self._write_json(filename, payload)
```

### Чому новий файл, а не просто метод у Service

- **Service** — API-шар, підключається через DI, має залежність від PriceService
- **Exporter** — batch-шар, працює в pipeline контексті з попередньо завантаженими цінами
- **Builder** — чиста логіка формування payload, не знає про HTTP чи файли

Це **Strategy pattern** — один builder, різні споживачі.

### Обсяг роботи
- Новий файл `builder.py` (~80 рядків — витягнути логіку з service.py + exporter.py)
- `service.py` — спрощується до делегації builder (~-40 рядків)
- `exporter.py` — спрощується до делегації builder (~-30 рядків)

---

## 4. Закешувати properties конфігів

**Файли:** `app/modules/cot/config.py`

### Проблема

`CotSettings` використовує `@property` для `report_groups`, `report_urls`, `market_categories`, `report_display_names`, `subtype_display_names`. Кожен виклик створює новий dict/list:

```python
@property
def report_groups(self) -> dict[str, list[dict]]:
    return {
        "legacy": [
            {"key": "g1", "name": "Large Speculators", ...},  # новий dict кожного разу
            ...
        ],
    }
```

`calculator.py` викликає `cot_settings.report_groups[report_type]` для **кожного ринку** в screener. При 200 ринках = 200 алокацій одних і тих самих даних.

### Рішення

Замінити `@property` на `@functools.cached_property`:

```python
from functools import cached_property

@dataclass(frozen=True)
class CotSettings:
    ...

    @cached_property
    def report_groups(self) -> dict[str, list[dict]]:
        return { ... }

    @cached_property
    def report_urls(self) -> dict:
        return { ... }

    @cached_property
    def market_categories(self) -> dict[str, dict]:
        return { ... }
```

### Чому `cached_property`, а не просто field

- Ці значення **статичні** — не залежать від env-змінних чи runtime стану
- `cached_property` обчислює один раз при першому доступі, потім повертає кешоване
- `frozen=True` dataclass гарантує immutability основних полів
- `cached_property` працює з `frozen=True`, бо він використовує `__dict__` напряму

### Чому не просто dict у module scope

- Залишаємо конфіг інкапсульованим у `CotSettings` — логічна група
- В майбутньому можна зробити підкласи для різних конфігурацій

### Обсяг роботи
- `cot/config.py` — замінити 5× `@property` → `@cached_property`, додати import (~5 рядків)

---

## 5. Замінити global `_update_state` на клас

**Файли:** `app/modules/cot/scheduler.py`

### Проблема

```python
# scheduler.py — зараз
_update_lock = threading.Lock()
_update_state = {        # ← мутабельний глобальний dict
    "running": False,
    "last_run": None,
    ...
}

def _run_pipeline_job(force: bool = False) -> None:
    global _update_state  # ← global state
    with _update_lock:
        if _update_state["running"]:
            ...
```

Проблеми:
- Глобальний мутабельний стан — важко тестувати, easy to break
- Функції `_run_pipeline_job`, `register_scheduled_job`, `get_update_status` — це набір related functions з shared state = класичний кандидат на клас

### Рішення

```python
class CotUpdateManager:
    """Керує запуском та станом COT pipeline оновлень."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._state = {
            "running": False,
            "last_run": None,
            "last_status": None,
            "last_error": None,
            "last_duration_sec": None,
        }

    def run_pipeline(self, force: bool = False) -> None:
        """Запуск pipeline з lock protection."""
        with self._lock:
            if self._state["running"]:
                logger.warning("Pipeline already running")
                return
            self._state["running"] = True
        # ... решта логіки ...

    def register_scheduled_job(self) -> None:
        """Реєструє cron job у core scheduler."""
        core_scheduler.add_cron_job(
            func=self.run_pipeline,
            job_id="weekly_cot_update",
            ...
        )

    def get_status(self) -> dict:
        with self._lock:
            return {**self._state}

# Module singleton
cot_update_manager = CotUpdateManager()
```

### Чому клас, а не просто рефакторинг функцій

- **Інкапсуляція стану** — `_state` і `_lock` належать екземпляру, а не модулю
- **Тестованість** — можна створити окремий `CotUpdateManager()` для тестів без впливу на глобальний
- **Розширюваність** — якщо з'являться інші модулі з своїми update managers, паттерн зрозумілий
- **Type safety** — IDE бачить методи та атрибути

### Обсяг роботи
- `cot/scheduler.py` — переписати в клас (~та сама кількість рядків, просто структурніше)
- `main.py` — змінити `register_scheduled_job()` → `cot_update_manager.register_scheduled_job()`
- `router.py` — змінити `get_update_status()` → `cot_update_manager.get_status()`

---

## 6. Додати пагінацію до screener

**Файли:** `app/modules/cot/router.py`, `app/modules/cot/service.py`, `app/modules/cot/storage.py`

### Проблема

`get_screener()` завжди повертає **всі ринки** (~200). Зараз це OK, але:
- При додаванні нових report types або cross-exchange даних, ринків може стати 500+
- Кожен ринок у screener = ~40 полів → великий JSON response
- Mobile клієнти страждають від великих payloads

### Рішення

Додати query параметри `limit`, `offset`, `category`, `sort_by`:

```python
@router.get("/screener/{report_type}/{subtype}")
def get_screener(
    report_type: ReportType,
    subtype: SubType,
    category: str | None = None,    # фільтр по категорії
    sort_by: str | None = None,     # e.g. "g1_net", "oi_change"
    sort_dir: Literal["asc", "desc"] = "desc",
    limit: int = 100,
    offset: int = 0,
    service: CotService = Depends(get_cot_service),
):
```

### Чому cursor-based пагінацію я відкинув

- Screener — це **tabular view** з сортуванням/фільтрацією, не стрічка
- `limit/offset` простіше інтегрується з таблицею на фронтенді
- Дані не змінюються в реальному часі (оновлення раз на тиждень)

### Чому фільтрацію на рівні API, а не тільки на фронтенді

- Зменшує payload size для мобільних
- Дозволяє кешувати по `category` — різні TTL для різних фільтрів
- Підготовка до server-side rendering або public API

### Обсяг роботи
- `router.py` — додати параметри (~10 рядків)
- `service.py` — додати фільтрацію/сортування у `get_screener()` (~20 рядків)
- Фронтенд — додати query params до API виклику (окреме завдання)

---

## 7. Паралелізувати завантаження цін

**Файли:** `app/modules/prices/service.py`

### Проблема

```python
# service.py — зараз
def download_all(self, cftc_codes: list[str]) -> dict[str, list[dict]]:
    for i, ticker in enumerate(unique_tickers, 1):
        bars = self._downloader.download(ticker)  # ← послідовно, один за одним
```

При 60 тікерах × ~2 секунди на тікер = **~2 хвилини** на повний pipeline. Yahoo Finance API підтримує паралельні запити.

### Рішення

Використати `concurrent.futures.ThreadPoolExecutor`:

```python
from concurrent.futures import ThreadPoolExecutor, as_completed

def download_all(self, cftc_codes: list[str], max_workers: int = 8) -> dict[str, list[dict]]:
    ...
    results: dict[str, list[dict]] = {}

    with ThreadPoolExecutor(max_workers=max_workers) as pool:
        future_to_ticker = {
            pool.submit(self._downloader.download, ticker): ticker
            for ticker in unique_tickers
        }

        for future in as_completed(future_to_ticker):
            ticker = future_to_ticker[future]
            try:
                bars = future.result()
                if bars:
                    for code in ticker_to_codes[ticker]:
                        results[code] = bars
            except Exception as e:
                logger.warning("Failed %s: %s", ticker, e)

    return results
```

### Чому `ThreadPoolExecutor`, а не `asyncio`

- **yfinance** — синхронна бібліотека, не має async API
- `ThreadPoolExecutor` — найпростіший спосіб паралелізувати I/O-bound синхронний код
- Не потребує зміни всього pipeline на async
- `max_workers=8` — достатньо для Yahoo Finance без rate limiting

### Чому не `multiprocessing`

- Це I/O-bound задача (мережеві запити), не CPU-bound
- Threads в Python добре підходять для I/O thanks to GIL release
- Менший overhead ніж processes

### Обсяг роботи
- `prices/service.py` — переписати цикл у `download_all()` (~15 рядків)
- `prices/config.py` — додати `max_download_workers` (~2 рядки)

---

## 8. Виправити N+1 в exporter

**Файли:** `app/modules/cot/exporter.py`

### Проблема

```python
# exporter.py — зараз
def export_all(self, report_type, subtype, price_data):
    markets = self.store.get_all_markets(report_type, subtype)  # 1 запит
    for mkt in markets:
        raw_rows = self.store.get_market_data(mkt["code"], ...)  # N запитів ❌
```

При 200 ринках = 201 SQL запит. А `get_all_market_data_bulk()` вже існує в `CotStorage` і робить **1 запит** для всіх ринків — але exporter його не використовує!

### Рішення

```python
# exporter.py — після
def export_all(self, report_type, subtype, price_data):
    all_data = self.store.get_all_market_data_bulk(report_type, subtype)  # 1 запит ✅

    for code, raw_rows in all_data.items():
        if not raw_rows:
            continue
        computed = self.calc.compute(raw_rows, report_type)
        ...
```

### Чому це не було зроблено з самого початку

Ймовірно, exporter був написаний раніше за `get_all_market_data_bulk()`, або bulk метод був доданий для screener endpoint, а exporter забули оновити. Це типовий випадок «код працює, але неоптимально».

### Чому не зробити ще один bulk метод з LIMIT

- `get_all_market_data_bulk()` вже вирішує проблему N+1
- Exporter працює в batch-режимі (не API), тому пам'ять не критична
- SQLite добре справляється з одним великим SELECT + WAL mode

### Обсяг роботи
- `exporter.py` — замінити цикл з `get_market_data()` на `get_all_market_data_bulk()` (~10 рядків)

---

## 9. Усунути circular import у cot/scheduler.py

**Файли:** `app/modules/cot/scheduler.py`, `app/modules/cot/router.py`

### Проблема

```python
# scheduler.py
def _run_pipeline_job(...):
    ...
    # Lazy import через circular dependency
    from app.modules.cot.router import invalidate_cot_caches  # ❌
    invalidate_cot_caches()
```

`scheduler.py` → `router.py` → `dependencies.py` → `service.py` → ... можливий circular path. Lazy import — це workaround, не рішення.

### Рішення

**Callback pattern** — scheduler не знає про router, а router реєструє свій callback:

```python
# scheduler.py — після
class CotUpdateManager:
    def __init__(self):
        self._on_complete_callbacks: list[Callable] = []

    def on_pipeline_complete(self, callback: Callable) -> None:
        """Реєструє callback який буде викликано після успішного pipeline."""
        self._on_complete_callbacks.append(callback)

    def run_pipeline(self, force=False):
        ...
        # Після успіху
        for cb in self._on_complete_callbacks:
            cb()
```

```python
# router.py
from app.modules.cot.scheduler import cot_update_manager

# При ініціалізації модуля
cot_update_manager.on_pipeline_complete(invalidate_cot_caches)
```

### Чому callback, а не event bus / signals

- **Простота** — один producer (scheduler), один consumer (router caches)
- Event bus (типу `blinker` чи custom) — overkill для одного зв'язку
- Якщо з'являться інші listeners — callback list масштабується природно
- Не додає нових залежностей

### Обсяг роботи
- `cot/scheduler.py` — додати callback list (~8 рядків)
- `cot/router.py` або `main.py` — зареєструвати callback (~3 рядки)

---

## 10. Додати lazy eviction у TTLCache

**Файли:** `app/core/cache.py`

### Проблема

Expired записи видаляються **тільки при `get()`**. Якщо є 10K записів і тільки 100 читаються, решта залишаються в пам'яті нескінченно.

### Рішення

Додати periodic cleanup та `max_size`:

```python
class TTLCache:
    def __init__(self, name="default", default_ttl=300, max_size=10_000):
        self.max_size = max_size
        self._cleanup_counter = 0
        self._cleanup_every = 100  # кожні 100 операцій set()
        ...

    def set(self, key, value, ttl=None):
        ...
        self._cleanup_counter += 1
        if self._cleanup_counter >= self._cleanup_every:
            self._cleanup_expired()
            self._cleanup_counter = 0

    def _cleanup_expired(self):
        """Видаляє всі expired записи."""
        now = time.time()
        with self._lock:
            expired = [k for k, (_, exp) in self._store.items() if now > exp]
            for k in expired:
                del self._store[k]
            if expired:
                logger.debug("[%s] Cleanup: removed %d expired", self.name, len(expired))
```

### Чому не background thread для cleanup

- Кеш вже thread-safe з `_lock`
- Background thread додає складність і ризик deadlock
- Cleanup кожні N операцій — простий і передбачуваний
- Для нашого use case (5-10 cache instances, <1000 записів кожен) цього більш ніж достатньо

### Чому max_size

- Захист від memory leak при неочікуваному навантаженні
- При досягненні max_size — видалити всі expired, якщо все ще over limit — видалити найстаріші

### Обсяг роботи
- `core/cache.py` — додати `_cleanup_expired()` + `max_size` (~25 рядків)

---

## 📊 Порядок виконання

Зміни згруповані за незалежністю — можна робити паралельно в межах групи:

```
Група A (незалежні, можна паралельно):
├── #4  Cached properties у config     ← 5 хв, zero risk
├── #10 TTLCache cleanup               ← 15 хв, low risk
└── #7  Паралельні ціни                 ← 20 хв, medium risk

Група B (залежить від А):
├── #5  UpdateManager клас              ← 30 хв
├── #9  Circular import fix             ← 15 хв (разом з #5)
└── #8  N+1 exporter fix               ← 10 хв

Група C (залежить від B):
├── #3  Builder (Exporter/Service DRY)  ← 40 хв
└── #2  Utils залежність                ← 20 хв

Група D (залежить від C):
├── #1  Pydantic schemas в router       ← 20 хв
└── #6  Пагінація screener             ← 30 хв
```

**Загальний час:** ~3.5 години активної роботи

---

## ⚠️ Що НЕ входить в цей план

| Пункт | Причина |
|-------|---------|
| Міграція на PostgreSQL | Окремий етап, потребує зміни deployment |
| Redis cache | Потрібен тільки при multi-worker, зараз overkill |
| Async endpoints | Потребує async DB driver, великий рефакторинг |
| Тести | Окремий етап (але план писався так, щоб тести було легко додати) |
| Rate limiting | Окремий етап, потребує middleware |
| Auth / API keys | Окремий етап |
