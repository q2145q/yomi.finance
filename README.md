# YOMI Finance — Бюджет кинопроизводства

Веб-приложение для управления финансами кинопроизводства.
Домен: **finance.yomimovie.art**

## Стек

| Слой | Технология |
|------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Таблица | Handsontable Community |
| Backend | FastAPI + SQLAlchemy (async) |
| База данных | PostgreSQL 16 |
| Деплой | Docker Compose + nginx |

## Быстрый старт

```bash
# Клонировать
git clone https://github.com/q2145q/yomi.finance.git
cd yomi.finance

# Скопировать переменные окружения
cp .env.example .env

# Запустить всё
docker compose up --build
```

Откройте http://localhost (frontend) или http://localhost:8000/docs (Swagger API).

## Разработка (без Docker)

### Backend
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
# Настроить DATABASE_URL в .env
alembic upgrade head
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Структура проекта

```
yomi.finance/
├── backend/
│   ├── app/
│   │   ├── core/          # Конфиг, безопасность, налоговая логика
│   │   ├── models/        # SQLAlchemy-модели
│   │   ├── routers/       # FastAPI-роутеры
│   │   ├── schemas/       # Pydantic-схемы
│   │   └── main.py
│   ├── alembic/           # Миграции БД
│   └── tests/             # Тесты налоговой логики
├── frontend/
│   └── src/
│       ├── api/           # HTTP-клиенты
│       ├── components/    # React-компоненты
│       ├── pages/         # Страницы
│       ├── store/         # Zustand-стор
│       ├── types/         # TypeScript-типы
│       └── utils/         # Утилиты (taxCalc)
├── docker-compose.yml
└── .env.example
```

## Налоговая логика

Реализована в `backend/app/core/tax_logic.py` и продублирована на клиенте в `frontend/src/utils/taxCalc.ts`.

| Тип | Метод |
|-----|-------|
| СЗ, ИП | Изнутри: `rate / (100 - %) * %` |
| НДС | Сверху: `base * % / 100` |
| ИП+НДС | ИП изнутри → НДС сверху |
| ФЛ | НДФЛ изнутри + Страховые сверху на брутто |

## API

Swagger UI: http://localhost:8000/docs
