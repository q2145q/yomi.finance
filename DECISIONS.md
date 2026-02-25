# Лог решений

## 2026-02-25 — Выбор технического стека

**Контекст:** Начало разработки с нуля, нужно выбрать стек.

**Решение:**
- Frontend: React 18 + TypeScript + Vite + Handsontable Community + Zustand
- Backend: Python FastAPI + SQLAlchemy (async) + Alembic
- БД: PostgreSQL 16
- Деплой: Docker Compose (3 сервиса: db, backend, frontend/nginx)
- Аутентификация: JWT (access + refresh tokens)
- Шифрование чувствительных данных: AES-256 (паспорт, банк. реквизиты)

**Причина:**
- FastAPI — async из коробки, отличная документация OpenAPI, хорошая производительность
- Handsontable — экселевидный интерфейс с навигацией стрелками/Tab/Enter, Community edition бесплатна
- Zustand — минималистичный state manager, меньше бойлерплейта чем Redux
- Docker Compose — простой деплой, все сервисы в одном файле

**Влияние:** архитектура всего проекта

---

## 2026-02-25 — Налоговые формулы

**Контекст:** Нужно однозначно зафиксировать формулы расчёта налогов.

**Решение:**
- **СЗ/ИП (INTERNAL):** `tax = rate / (100 - %) * %` → включается внутрь суммы
- **НДС (EXTERNAL):** `tax = rate * % / 100` → добавляется сверху
- **ИП+НДС:** сначала ИП inside, потом НДС on top от получившегося gross
- **ФЛ:** НДФЛ 13% — internal в бюджет (не контрагенту), Страховые 30% — external в бюджет
- **Округление:** floor (вниз) до рублей на каждую единицу

**Причина:** зафиксировано в SPEC.md, проверено на примерах.

**Влияние:** backend/app/core/tax_logic.py, frontend/src/utils/taxCalc.ts

---
