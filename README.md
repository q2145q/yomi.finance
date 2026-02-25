# YOMI Finance

Система управления финансами кинопроизводства.

## Быстрый старт (разработка)

```bash
# 1. Скопируй .env
cp .env.example .env

# 2. Запусти всё
docker compose up -d

# 3. Применить миграции
docker compose exec backend alembic upgrade head

# 4. Заполнить начальными данными (налоговые схемы + суперадмин)
docker compose exec backend python -m app.scripts.seed

# 5. Открой в браузере
open http://localhost:3000
```

**Логин по умолчанию:** `admin@yomimovie.art` / `admin123`

## Стек

- **Backend:** Python 3.12 + FastAPI + SQLAlchemy (async) + Alembic
- **Frontend:** React 18 + TypeScript + Vite + Handsontable + Zustand
- **БД:** PostgreSQL 16
- **Деплой:** Docker Compose

## Документация

- [SPEC.md](./SPEC.md) — полная техническая спецификация
- [PLAN.md](./PLAN.md) — план разработки с чекбоксами
- [PROGRESS.md](./PROGRESS.md) — текущий статус
- [docs/data-model.md](./docs/data-model.md) — схема данных
- [docs/api.md](./docs/api.md) — API эндпоинты
- [docs/deploy.md](./docs/deploy.md) — инструкция по деплою

## Продакшн

**URL:** https://finance.yomimovie.art
