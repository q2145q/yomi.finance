"""
Скрипт инициализации: создаёт системные налоговые схемы и суперадмина.
Запуск: python -m app.scripts.seed
"""
import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import AsyncSessionLocal, engine
from app.database import Base
from app.models.user import User
from app.models.tax import TaxScheme, TaxComponent
from app.core.security import hash_password
from app.core.tax_logic import SYSTEM_TAX_SCHEMES


async def seed_tax_schemes(db: AsyncSession):
    """Создаёт системные налоговые схемы, если их ещё нет."""
    for name, components in SYSTEM_TAX_SCHEMES.items():
        result = await db.execute(select(TaxScheme).where(TaxScheme.name == name))
        if result.scalar_one_or_none():
            print(f"  Схема '{name}' уже существует, пропускаем")
            continue

        scheme = TaxScheme(name=name, is_system=True)
        db.add(scheme)
        await db.flush()

        for i, comp in enumerate(components):
            c = TaxComponent(
                scheme_id=scheme.id,
                name=comp["name"],
                rate=comp["rate"],
                type=comp["type"],
                recipient=comp["recipient"],
                sort_order=i,
            )
            db.add(c)

        print(f"  Создана схема '{name}'")

    await db.commit()


async def seed_admin(db: AsyncSession, email: str, password: str, full_name: str):
    """Создаёт суперадмина, если не существует."""
    result = await db.execute(select(User).where(User.email == email))
    if result.scalar_one_or_none():
        print(f"  Пользователь {email} уже существует, пропускаем")
        return

    user = User(
        email=email,
        hashed_password=hash_password(password),
        full_name=full_name,
        is_active=True,
        is_superadmin=True,
    )
    db.add(user)
    await db.commit()
    print(f"  Создан суперадмин: {email}")


async def main():
    print("=== Инициализация базы данных ===")

    async with AsyncSessionLocal() as db:
        print("\n1. Создание налоговых схем...")
        await seed_tax_schemes(db)

        print("\n2. Создание суперадмина...")
        email = os.environ.get("ADMIN_EMAIL", "admin@yomimovie.art")
        password = os.environ.get("ADMIN_PASSWORD", "admin123")
        full_name = os.environ.get("ADMIN_NAME", "Администратор")
        await seed_admin(db, email, password, full_name)

    print("\n=== Готово! ===")


if __name__ == "__main__":
    asyncio.run(main())
