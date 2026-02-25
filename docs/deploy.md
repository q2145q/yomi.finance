# Инструкция по деплою

Обновлено: 2026-02-25

## Локальная разработка

```bash
# Запуск всего стека
docker compose up -d

# Первый запуск: применить миграции
docker compose exec backend alembic upgrade head

# Создать тестового пользователя (продюсер)
docker compose exec backend python -m app.scripts.create_admin

# Логи
docker compose logs -f backend
docker compose logs -f frontend
```

**URL:** http://localhost:3000

## Продакшн (finance.yomimovie.art)

Сервер: VPS с Docker + Docker Compose

```bash
# Подключение к серверу
ssh root@finance.yomimovie.art

# Деплой новой версии
cd /opt/yomifinance
git pull origin main
docker compose pull
docker compose up -d --build
docker compose exec backend alembic upgrade head
```

**Переменные окружения** (`.env` на сервере):
```env
SECRET_KEY=<случайный 64-символьный ключ>
DATABASE_URL=postgresql+asyncpg://yomi:yomipass@db:5432/yomifinance
ENCRYPTION_KEY=<32-байтный ключ для AES-256>
CORS_ORIGINS=https://finance.yomimovie.art
ANTHROPIC_API_KEY=<ключ для TG-бота AI-парсинга>
```

## Структура Docker Compose

| Сервис | Образ | Порт | Описание |
|--------|-------|------|---------|
| db | postgres:16 | 5432 (внутренний) | PostgreSQL |
| backend | ./backend | 8000 (внутренний) | FastAPI |
| frontend | ./frontend | 80/443 | React + nginx |

## SSL

nginx настроен на HTTPS с сертификатом Let's Encrypt.
Для обновления: `certbot renew` (настроен cron).
