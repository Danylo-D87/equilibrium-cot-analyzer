"""One-time script: split Crypto trades 50/50 into Futures and Option."""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy import text

DB = "postgresql+asyncpg://equilibrium:dev_password@localhost:5432/equilibrium_db"

async def main():
    engine = create_async_engine(DB)
    async with AsyncSession(engine) as s:
        r = await s.execute(text("SELECT id FROM trades WHERE type = 'Crypto' ORDER BY id"))
        ids = [row[0] for row in r.all()]
        total = len(ids)
        print(f"Found {total} Crypto trades")

        if total == 0:
            print("Nothing to update")
            await engine.dispose()
            return

        half = total // 2
        futures_ids = ids[:half]
        option_ids = ids[half:]

        if futures_ids:
            for tid in futures_ids:
                await s.execute(text("UPDATE trades SET type = 'Futures' WHERE id = :tid"), {"tid": tid})
            print(f"Updated {len(futures_ids)} trades -> Futures")

        if option_ids:
            for tid in option_ids:
                await s.execute(text("UPDATE trades SET type = 'Option' WHERE id = :tid"), {"tid": tid})
            print(f"Updated {len(option_ids)} trades -> Option")

        await s.commit()
        print("Done!")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
