# Модель данных

Обновлено: 2026-02-25

## Основные сущности (Этап 1)

### User
| Поле | Тип | Описание |
|------|-----|---------|
| id | UUID | PK |
| email | string | уникальный, логин |
| hashed_password | string | bcrypt |
| full_name | string | ФИО |
| is_active | boolean | активен |
| created_at | datetime | |

### ProjectUser (связь пользователей с проектами)
| Поле | Тип | Описание |
|------|-----|---------|
| id | UUID | PK |
| project_id | UUID | FK |
| user_id | UUID | FK |
| role | enum | PRODUCER / LINE_PRODUCER / DIRECTOR / ASSISTANT / CLERK |

### Project
| Поле | Тип | Описание |
|------|-----|---------|
| id | UUID | PK |
| name | string | |
| currency_primary | enum | RUB/USD/EUR/... |
| currencies_allowed | JSON | список валют |
| exchange_rate_mode | enum | CBR_ON_DATE / FIXED |
| exchange_rate_fixed | float | null если CBR |
| status | enum | PREP/PRODUCTION/POST/CLOSED |
| created_at | datetime | |

### Contractor
| Поле | Тип | Описание |
|------|-----|---------|
| id | UUID | PK |
| full_name | string | |
| passport_data_enc | text | AES-256 |
| type | enum | FL/SZ/IP/OOO |
| inn | string | |
| bank_details_enc | text | AES-256 |
| telegram_id | string | null |
| phone | string | |
| email | string | |
| tax_scheme_id | UUID | FK → TaxScheme |
| currency | enum | RUB/... |

### TaxScheme
| Поле | Тип | Описание |
|------|-----|---------|
| id | UUID | PK |
| name | string | "СЗ 6%", "ФЛ НДФЛ+Страховые", ... |
| is_system | boolean | системная схема (нельзя удалить) |

### TaxComponent
| Поле | Тип | Описание |
|------|-----|---------|
| id | UUID | PK |
| scheme_id | UUID | FK → TaxScheme |
| name | string | "НПД", "НДФЛ", "Страховые", "НДС" |
| rate | float | 0.06, 0.13, 0.30, 0.20 |
| type | enum | INTERNAL / EXTERNAL |
| recipient | enum | CONTRACTOR / BUDGET |

### BudgetLine
| Поле | Тип | Описание |
|------|-----|---------|
| id | UUID | PK |
| project_id | UUID | FK |
| parent_id | UUID | FK → self, null для корневых |
| sort_order | int | порядок внутри родителя |
| level | int | вычисляется (0=категория, 1=подкатегория, 2+=статья) |
| code | string | "1.2.3" |
| name | string | |
| type | enum | GROUP / ITEM / SPREAD_ITEM |
| unit | string | "день", "час", "км" |
| quantity_units | float | кол-во ед. изм. |
| rate | float | ставка |
| quantity | float | кол-во |
| tax_scheme_id | UUID | FK, null |
| tax_override | boolean | флаг ручного изменения |
| currency | enum | валюта строки |
| limit_amount | float | утверждённый лимит |

## Вычисляемые поля BudgetLine (не хранятся в БД)
- `subtotal = rate * quantity`
- `tax_amount` — по формуле из TaxScheme
- `total = subtotal + tax_amount` (для EXTERNAL) или `subtotal` (для INTERNAL — tax включён)
- `accrued` — из ReportEntry
- `paid` — из Payment
- `closed` — из Payment со статусом CLOSED
- `advance = max(0, paid - accrued)`
