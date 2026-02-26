# Статус разработки
Обновлено: 2026-02-26

## Сейчас в работе
- (нет активных задач)

## Завершено
- 2026-02-25 Создание SPEC.md (спецификация)
- 2026-02-25 Документация: PLAN.md, PROGRESS.md, NEXT_STEPS.md, DECISIONS.md, CHANGELOG.md, docs/
- 2026-02-25 Docker Compose: db + backend + frontend/nginx
- 2026-02-25 Backend Этап 1: FastAPI + auth (JWT) + 5 ролей + все модели + Alembic миграция
- 2026-02-25 Backend: налоговые схемы (СЗ/ИП/НДС/ФЛ/ИП+НДС) + расчёт floor-округлением
- 2026-02-25 Backend: шаблон бюджета (16 кат., 47 подкат., 182 статьи) + seed-скрипт
- 2026-02-25 Frontend Этап 1: React + TypeScript + Vite + Handsontable + Zustand
- 2026-02-25 Frontend: страница входа, проекты, бюджетная таблица с деревом
- 2026-02-25 Коммит и push в GitHub (main)
- 2026-02-26 Бюджет: поля date_start/date_end + Pikaday datepicker (только для ед.изм. "мес")
- 2026-02-26 Миграция 003: date_start, date_end в budget_lines
- 2026-02-26 Этап 2: Договоры (Contract) — бэкенд + фронтенд
  - Модель Contract + ContractBudgetLine + миграция 004
  - API: GET/POST/PATCH/DELETE /api/v1/contracts
  - ContractsPage: список, форма, привязка к статьям бюджета
  - Автоподстановка налог.схемы из контрагента (tax_override флаг)
- 2026-02-26 Этап 2: Производственный отчёт — бэкенд + фронтенд
  - Модели ProductionReport + ReportEntry + миграция 005
  - API: /production/projects/{id}/reports, /production/reports/{id}, /production/entries/{id}
  - Расчёт overtime_hours (смена − обед − разрыв − 12ч базовая)
  - Расчёт amount_net/amount_gross через налоговые схемы
  - ProductionPage: панель дней + детализация записей, форма ручного ввода
  - ProjectTabs-компонент: единые вкладки Бюджет/Договоры/Производство

## Заблокировано
- (пусто)
