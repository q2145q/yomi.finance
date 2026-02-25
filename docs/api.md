# Документация API

Обновлено: 2026-02-25

**Базовый URL:** `/api/v1`

Полная интерактивная документация: `/docs` (Swagger UI)

## Аутентификация

| Метод | Путь | Описание |
|-------|------|---------|
| POST | `/auth/login` | Логин, возвращает access + refresh tokens |
| POST | `/auth/refresh` | Обновить access token |
| POST | `/auth/logout` | Инвалидировать refresh token |
| GET | `/auth/me` | Профиль текущего пользователя |

## Проекты

| Метод | Путь | Описание |
|-------|------|---------|
| GET | `/projects` | Список проектов пользователя |
| POST | `/projects` | Создать проект |
| GET | `/projects/{id}` | Детали проекта |
| PATCH | `/projects/{id}` | Обновить проект |
| GET | `/projects/{id}/team` | Команда проекта |
| POST | `/projects/{id}/team` | Добавить пользователя в проект |
| DELETE | `/projects/{id}/team/{user_id}` | Убрать пользователя |

## Контрагенты

| Метод | Путь | Описание |
|-------|------|---------|
| GET | `/projects/{id}/contractors` | Контрагенты проекта |
| POST | `/contractors` | Создать контрагента |
| GET | `/contractors/{id}` | Карточка контрагента |
| PATCH | `/contractors/{id}` | Обновить контрагента |

## Налоговые схемы

| Метод | Путь | Описание |
|-------|------|---------|
| GET | `/tax-schemes` | Список схем |
| POST | `/tax-schemes` | Создать схему |
| GET | `/tax-schemes/{id}` | Детали схемы |

## Бюджет

| Метод | Путь | Описание |
|-------|------|---------|
| GET | `/projects/{id}/budget` | Дерево статей бюджета |
| POST | `/projects/{id}/budget/lines` | Добавить статью |
| PATCH | `/budget/lines/{id}` | Обновить статью |
| DELETE | `/budget/lines/{id}` | Удалить статью |
| POST | `/budget/lines/{id}/move` | Переместить статью |
| POST | `/projects/{id}/budget/from-template` | Загрузить шаблон |
| GET | `/projects/{id}/budget/export` | Экспорт в Excel |
