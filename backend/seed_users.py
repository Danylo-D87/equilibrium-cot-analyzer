"""
Seed script: clears all users and creates 2 fresh users with portfolios + trades.
  User 1: trader_one@example.com  — 2 portfolios, 50 trades (last 3 months)
  User 2: trader_two@example.com  — 4 portfolios, 100 trades (last 3 months)

Run from the backend/ directory:
    python seed_users.py
"""

import random
import uuid
from datetime import date, timedelta
from decimal import Decimal

import bcrypt
import psycopg2
from psycopg2.extras import execute_values

# ──────────────────────────────────────────────────────────────
# Config
# ──────────────────────────────────────────────────────────────

DB_DSN = "postgresql://equilibrium:dev_password@localhost:5432/equilibrium_db"

TODAY = date(2026, 2, 22)
THREE_MONTHS_AGO = date(2025, 11, 22)

PAIRS = [
    "BTC/USDT", "ETH/USDT", "SOL/USDT", "BNB/USDT", "XRP/USDT",
    "ADA/USDT", "AVAX/USDT", "DOGE/USDT", "LINK/USDT", "DOT/USDT",
    "MATIC/USDT", "LTC/USDT", "UNI/USDT", "ATOM/USDT", "FTM/USDT",
    "INJ/USDT", "ARB/USDT", "OP/USDT", "SUI/USDT", "NEAR/USDT",
]

TYPES      = ["Option", "Futures", "Crypto"]
STYLES     = ["Swing", "Intraday", "Smart Idea"]
DIRECTIONS = ["Long", "Short"]
STATUSES   = ["TP", "SL", "BE", "Active"]
STATUS_WEIGHTS = [40, 35, 15, 10]   # % probability


def hash_pw(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()


def random_date(start: date, end: date) -> date:
    delta = (end - start).days
    return start + timedelta(days=random.randint(0, delta))


def make_trade(user_id: uuid.UUID, portfolio_id: uuid.UUID) -> dict:
    direction = random.choice(DIRECTIONS)
    status    = random.choices(STATUSES, weights=STATUS_WEIGHTS)[0]

    risk    = round(random.uniform(50, 2000), 2)
    rr      = round(random.uniform(0.5, 4.0), 4)

    if status == "TP":
        profit = round(risk * rr, 2)
    elif status == "SL":
        profit = -risk
    elif status == "BE":
        profit = 0.0
    else:                       # Active — no profit yet
        profit = None

    entry = round(random.uniform(0.5, 70000), 4)
    move  = entry * random.uniform(0.005, 0.08)
    if status in ("TP", "Active"):
        exit_price = round(entry + move if direction == "Long" else entry - move, 4) if status == "TP" else None
    elif status == "SL":
        exit_price = round(entry - move if direction == "Long" else entry + move, 4)
    else:
        exit_price = entry   # BE

    notes_pool = [
        "HTF confluence confirmed", "Broke structure to the upside",
        "Choch + fvg entry", "Liquidity sweep before entry",
        "Entered on retest of OB", "Volume spike at entry",
        "News catalyst played well", "Missed ideal entry, still profitable",
        None, None, None,   # leave some trades without notes
    ]

    return {
        "id":           uuid.uuid4(),
        "user_id":      user_id,
        "portfolio_id": portfolio_id,
        "date":         random_date(THREE_MONTHS_AGO, TODAY),
        "pair":         random.choice(PAIRS),
        "type":         random.choice(TYPES),
        "style":        random.choice(STYLES),
        "direction":    direction,
        "status":       status,
        "risk_amount":  risk,
        "profit_amount": profit,
        "rr_ratio":     rr,
        "entry_price":  entry,
        "exit_price":   exit_price,
        "notes":        random.choice(notes_pool),
    }


# ──────────────────────────────────────────────────────────────
# Main
# ──────────────────────────────────────────────────────────────

def main():
    conn = psycopg2.connect(DB_DSN)
    conn.autocommit = False
    cur = conn.cursor()

    print("→ Deleting all existing users (cascade)…")
    cur.execute("DELETE FROM users;")
    print(f"  deleted {cur.rowcount} user(s).")

    users_data = [
        {
            "email":    "trader_one@example.com",
            "password": "Password1!",
            "nickname": "TraderOne",
            "n_portfolios": 2,
            "n_trades":     50,
            "portfolio_names": ["Main Portfolio", "Altcoins"],
            "initial_capitals": [10000, 5000],
        },
        {
            "email":    "trader_two@example.com",
            "password": "Password2!",
            "nickname": "TraderTwo",
            "n_portfolios": 4,
            "n_trades":     100,
            "portfolio_names": ["BTC Futures", "ETH Swing", "Altcoins", "Options Desk"],
            "initial_capitals": [20000, 15000, 8000, 5000],
        },
    ]

    for ud in users_data:
        user_id = uuid.uuid4()
        print(f"\n→ Creating user {ud['email']} (id={user_id})")

        cur.execute(
            """
            INSERT INTO users (id, email, password_hash, nickname, language, timezone,
                               role, is_active, email_verified)
            VALUES (%s, %s, %s, %s, 'en', 'Europe/Kiev', 'user', TRUE, TRUE)
            """,
            (str(user_id), ud["email"], hash_pw(ud["password"]), ud["nickname"]),
        )

        # Permissions: cot + journal
        for perm in ("cot", "journal"):
            cur.execute(
                "INSERT INTO user_permissions (id, user_id, permission) VALUES (%s, %s, %s)",
                (str(uuid.uuid4()), str(user_id), perm),
            )

        # Portfolios
        portfolio_ids = []
        for name, capital in zip(ud["portfolio_names"], ud["initial_capitals"]):
            pid = uuid.uuid4()
            cur.execute(
                """
                INSERT INTO portfolios (id, user_id, name, initial_capital, is_active)
                VALUES (%s, %s, %s, %s, TRUE)
                """,
                (str(pid), str(user_id), name, capital),
            )
            portfolio_ids.append(pid)
            print(f"   portfolio '{name}' (cap={capital})")

        # Trades — distribute evenly across portfolios
        trades = []
        for i in range(ud["n_trades"]):
            p_id = portfolio_ids[i % len(portfolio_ids)]
            t = make_trade(user_id, p_id)
            trades.append(t)

        execute_values(
            cur,
            """
            INSERT INTO trades
              (id, user_id, portfolio_id, date, pair, type, style, direction,
               status, risk_amount, profit_amount, rr_ratio, entry_price, exit_price, notes)
            VALUES %s
            """,
            [
                (
                    str(t["id"]), str(t["user_id"]), str(t["portfolio_id"]),
                    t["date"], t["pair"], t["type"], t["style"], t["direction"],
                    t["status"],
                    t["risk_amount"], t["profit_amount"], t["rr_ratio"],
                    t["entry_price"], t["exit_price"], t["notes"],
                )
                for t in trades
            ],
        )
        print(f"   inserted {len(trades)} trades.")

        # Journal settings (default)
        cur.execute(
            """
            INSERT INTO user_journal_settings (user_id, initial_balance, risk_free_rate,
                                               default_currency, display_mode)
            VALUES (%s, 100000, 0.04, 'USD', 'currency')
            ON CONFLICT (user_id) DO NOTHING
            """,
            (str(user_id),),
        )

    conn.commit()
    cur.close()
    conn.close()
    print("\n✓ Seed complete.")
    print("\nCredentials:")
    for ud in users_data:
        print(f"  {ud['email']}  /  {ud['password']}")


if __name__ == "__main__":
    main()
