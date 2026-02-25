"""
Стандартный шаблон бюджета кинопроизводства.
16 категорий, 47 подкатегорий, 182 строки.

Структура: категория → подкатегория → статья

Каждый элемент: (name, type, unit, quantity_units, rate, quantity)
- GROUP: name только, остальные 0
- ITEM: полные данные
"""

TEMPLATE = [
    {
        "name": "1. СЦЕНАРИЙ И РЕЖИССУРА",
        "type": "GROUP",
        "children": [
            {
                "name": "1.1 Сценарий",
                "type": "GROUP",
                "children": [
                    {"name": "Автор сценария", "type": "ITEM", "unit": "пак.", "quantity_units": 1, "rate": 0, "quantity": 1},
                    {"name": "Соавтор сценария", "type": "ITEM", "unit": "пак.", "quantity_units": 1, "rate": 0, "quantity": 1},
                    {"name": "Литературный редактор", "type": "ITEM", "unit": "пак.", "quantity_units": 1, "rate": 0, "quantity": 1},
                    {"name": "Покупка прав на экранизацию", "type": "ITEM", "unit": "шт.", "quantity_units": 1, "rate": 0, "quantity": 1},
                ],
            },
            {
                "name": "1.2 Режиссура",
                "type": "GROUP",
                "children": [
                    {"name": "Режиссёр-постановщик", "type": "ITEM", "unit": "пак.", "quantity_units": 1, "rate": 0, "quantity": 1},
                    {"name": "Второй режиссёр", "type": "ITEM", "unit": "смена", "quantity_units": 1, "rate": 0, "quantity": 1},
                    {"name": "Третий режиссёр", "type": "ITEM", "unit": "смена", "quantity_units": 1, "rate": 0, "quantity": 1},
                    {"name": "Ассистент режиссёра (1)", "type": "ITEM", "unit": "смена", "quantity_units": 1, "rate": 0, "quantity": 1},
                    {"name": "Ассистент режиссёра (2)", "type": "ITEM", "unit": "смена", "quantity_units": 1, "rate": 0, "quantity": 1},
                ],
            },
        ],
    },
    {
        "name": "2. ПРОДЮСЕРСКАЯ ГРУППА",
        "type": "GROUP",
        "children": [
            {
                "name": "2.1 Продюсеры",
                "type": "GROUP",
                "children": [
                    {"name": "Продюсер", "type": "ITEM", "unit": "пак.", "quantity_units": 1, "rate": 0, "quantity": 1},
                    {"name": "Исполнительный продюсер", "type": "ITEM", "unit": "пак.", "quantity_units": 1, "rate": 0, "quantity": 1},
                    {"name": "Линейный продюсер", "type": "ITEM", "unit": "пак.", "quantity_units": 1, "rate": 0, "quantity": 1},
                    {"name": "Директор картины", "type": "ITEM", "unit": "смена", "quantity_units": 1, "rate": 0, "quantity": 1},
                    {"name": "Локейшн-менеджер", "type": "ITEM", "unit": "смена", "quantity_units": 1, "rate": 0, "quantity": 1},
                    {"name": "Ассистент продюсера", "type": "ITEM", "unit": "смена", "quantity_units": 1, "rate": 0, "quantity": 1},
                ],
            },
            {
                "name": "2.2 Администрация",
                "type": "GROUP",
                "children": [
                    {"name": "Администратор (1)", "type": "ITEM", "unit": "смена", "quantity_units": 1, "rate": 0, "quantity": 1},
                    {"name": "Администратор (2)", "type": "ITEM", "unit": "смена", "quantity_units": 1, "rate": 0, "quantity": 1},
                    {"name": "Делопроизводитель", "type": "ITEM", "unit": "смена", "quantity_units": 1, "rate": 0, "quantity": 1},
                ],
            },
        ],
    },
    {
        "name": "3. ОПЕРАТОРСКАЯ ГРУППА",
        "type": "GROUP",
        "children": [
            {
                "name": "3.1 Операторы",
                "type": "GROUP",
                "children": [
                    {"name": "Оператор-постановщик", "type": "ITEM", "unit": "пак.", "quantity_units": 1, "rate": 0, "quantity": 1},
                    {"name": "Оператор (2-я камера)", "type": "ITEM", "unit": "смена", "quantity_units": 1, "rate": 0, "quantity": 1},
                    {"name": "Фокус-пуллер (1)", "type": "ITEM", "unit": "смена", "quantity_units": 1, "rate": 0, "quantity": 1},
                    {"name": "Фокус-пуллер (2)", "type": "ITEM", "unit": "смена", "quantity_units": 1, "rate": 0, "quantity": 1},
                    {"name": "Клэпер-лоудер", "type": "ITEM", "unit": "смена", "quantity_units": 1, "rate": 0, "quantity": 1},
                    {"name": "Видеоинженер", "type": "ITEM", "unit": "смена", "quantity_units": 1, "rate": 0, "quantity": 1},
                    {"name": "DIT", "type": "ITEM", "unit": "смена", "quantity_units": 1, "rate": 0, "quantity": 1},
                ],
            },
            {
                "name": "3.2 Спецтехника операторская",
                "type": "GROUP",
                "children": [
                    {"name": "Стедикам (оператор)", "type": "ITEM", "unit": "смена", "quantity_units": 1, "rate": 0, "quantity": 1},
                    {"name": "Ронин / гироскоп", "type": "ITEM", "unit": "смена", "quantity_units": 1, "rate": 0, "quantity": 1},
                    {"name": "Коптер (пилот + оператор)", "type": "ITEM", "unit": "смена", "quantity_units": 1, "rate": 0, "quantity": 1},
                    {"name": "Автокран / подъёмник", "type": "ITEM", "unit": "смена", "quantity_units": 1, "rate": 0, "quantity": 1},
                    {"name": "Авторобот", "type": "ITEM", "unit": "смена", "quantity_units": 1, "rate": 0, "quantity": 1},
                ],
            },
        ],
    },
    {
        "name": "4. ОСВЕТИТЕЛЬНАЯ ГРУППА",
        "type": "GROUP",
        "children": [
            {
                "name": "4.1 Осветители",
                "type": "GROUP",
                "children": [
                    {"name": "Художник по свету (гафер)", "type": "ITEM", "unit": "смена", "quantity_units": 1, "rate": 0, "quantity": 1},
                    {"name": "Лучший бой", "type": "ITEM", "unit": "смена", "quantity_units": 1, "rate": 0, "quantity": 1},
                    {"name": "Осветитель (1)", "type": "ITEM", "unit": "смена", "quantity_units": 1, "rate": 0, "quantity": 1},
                    {"name": "Осветитель (2)", "type": "ITEM", "unit": "смена", "quantity_units": 1, "rate": 0, "quantity": 1},
                    {"name": "Генераторщик", "type": "ITEM", "unit": "смена", "quantity_units": 1, "rate": 0, "quantity": 1},
                ],
            },
            {
                "name": "4.2 Осветительное оборудование",
                "type": "GROUP",
                "children": [
                    {"name": "Аренда осветительного комплекта", "type": "ITEM", "unit": "смена", "quantity_units": 1, "rate": 0, "quantity": 1},
                    {"name": "Генератор", "type": "ITEM", "unit": "смена", "quantity_units": 1, "rate": 0, "quantity": 1},
                    {"name": "Дополнительное оборудование", "type": "ITEM", "unit": "шт.", "quantity_units": 1, "rate": 0, "quantity": 1},
                ],
            },
        ],
    },
    {
        "name": "5. ЗВУКОЗАПИСЬ",
        "type": "GROUP",
        "children": [
            {
                "name": "5.1 Звуковая группа",
                "type": "GROUP",
                "children": [
                    {"name": "Звукорежиссёр", "type": "ITEM", "unit": "смена", "quantity_units": 1, "rate": 0, "quantity": 1},
                    {"name": "Звукооператор / бум-оператор", "type": "ITEM", "unit": "смена", "quantity_units": 1, "rate": 0, "quantity": 1},
                    {"name": "Аренда звукового оборудования", "type": "ITEM", "unit": "смена", "quantity_units": 1, "rate": 0, "quantity": 1},
                ],
            },
        ],
    },
    {
        "name": "6. ХУДОЖЕСТВЕННАЯ ГРУППА",
        "type": "GROUP",
        "children": [
            {
                "name": "6.1 Художники",
                "type": "GROUP",
                "children": [
                    {"name": "Художник-постановщик", "type": "ITEM", "unit": "пак.", "quantity_units": 1, "rate": 0, "quantity": 1},
                    {"name": "Художник-декоратор", "type": "ITEM", "unit": "смена", "quantity_units": 1, "rate": 0, "quantity": 1},
                    {"name": "Реквизитор", "type": "ITEM", "unit": "смена", "quantity_units": 1, "rate": 0, "quantity": 1},
                    {"name": "Ассистент художника", "type": "ITEM", "unit": "смена", "quantity_units": 1, "rate": 0, "quantity": 1},
                ],
            },
            {
                "name": "6.2 Строительство декораций",
                "type": "GROUP",
                "children": [
                    {"name": "Строительство декораций", "type": "ITEM", "unit": "шт.", "quantity_units": 1, "rate": 0, "quantity": 1},
                    {"name": "Материалы для декораций", "type": "ITEM", "unit": "шт.", "quantity_units": 1, "rate": 0, "quantity": 1},
                    {"name": "Аренда реквизита", "type": "ITEM", "unit": "смена", "quantity_units": 1, "rate": 0, "quantity": 1},
                ],
            },
        ],
    },
    {
        "name": "7. КОСТЮМЫ И ГРИМ",
        "type": "GROUP",
        "children": [
            {
                "name": "7.1 Костюмерная группа",
                "type": "GROUP",
                "children": [
                    {"name": "Художник по костюмам", "type": "ITEM", "unit": "пак.", "quantity_units": 1, "rate": 0, "quantity": 1},
                    {"name": "Костюмер (1)", "type": "ITEM", "unit": "смена", "quantity_units": 1, "rate": 0, "quantity": 1},
                    {"name": "Костюмер (2)", "type": "ITEM", "unit": "смена", "quantity_units": 1, "rate": 0, "quantity": 1},
                    {"name": "Пошив / закупка костюмов", "type": "ITEM", "unit": "шт.", "quantity_units": 1, "rate": 0, "quantity": 1},
                ],
            },
            {
                "name": "7.2 Гримёрная группа",
                "type": "GROUP",
                "children": [
                    {"name": "Художник по гриму", "type": "ITEM", "unit": "смена", "quantity_units": 1, "rate": 0, "quantity": 1},
                    {"name": "Гримёр (1)", "type": "ITEM", "unit": "смена", "quantity_units": 1, "rate": 0, "quantity": 1},
                    {"name": "Гримёр (2)", "type": "ITEM", "unit": "смена", "quantity_units": 1, "rate": 0, "quantity": 1},
                    {"name": "Расходные материалы грим", "type": "ITEM", "unit": "шт.", "quantity_units": 1, "rate": 0, "quantity": 1},
                ],
            },
        ],
    },
    {
        "name": "8. АКТЁРЫ",
        "type": "GROUP",
        "children": [
            {
                "name": "8.1 Главные роли",
                "type": "GROUP",
                "children": [
                    {"name": "Актёр главной роли (1)", "type": "ITEM", "unit": "пак.", "quantity_units": 1, "rate": 0, "quantity": 1},
                    {"name": "Актёр главной роли (2)", "type": "ITEM", "unit": "пак.", "quantity_units": 1, "rate": 0, "quantity": 1},
                    {"name": "Актёр главной роли (3)", "type": "ITEM", "unit": "пак.", "quantity_units": 1, "rate": 0, "quantity": 1},
                ],
            },
            {
                "name": "8.2 Второй план",
                "type": "GROUP",
                "children": [
                    {"name": "Актёр второго плана (1)", "type": "ITEM", "unit": "смена", "quantity_units": 1, "rate": 0, "quantity": 1},
                    {"name": "Актёр второго плана (2)", "type": "ITEM", "unit": "смена", "quantity_units": 1, "rate": 0, "quantity": 1},
                    {"name": "Актёр второго плана (3)", "type": "ITEM", "unit": "смена", "quantity_units": 1, "rate": 0, "quantity": 1},
                    {"name": "Актёр эпизода", "type": "ITEM", "unit": "смена", "quantity_units": 1, "rate": 0, "quantity": 1},
                ],
            },
            {
                "name": "8.3 Массовка",
                "type": "GROUP",
                "children": [
                    {"name": "Массовка (день)", "type": "ITEM", "unit": "чел./смену", "quantity_units": 1, "rate": 0, "quantity": 1},
                    {"name": "Координатор массовки", "type": "ITEM", "unit": "смена", "quantity_units": 1, "rate": 0, "quantity": 1},
                ],
            },
        ],
    },
    {
        "name": "9. КАСКАДЁРЫ И СПЕЦЭФФЕКТЫ",
        "type": "GROUP",
        "children": [
            {
                "name": "9.1 Каскадёры",
                "type": "GROUP",
                "children": [
                    {"name": "Постановщик трюков", "type": "ITEM", "unit": "пак.", "quantity_units": 1, "rate": 0, "quantity": 1},
                    {"name": "Каскадёр (дублёр актёра)", "type": "ITEM", "unit": "смена", "quantity_units": 1, "rate": 0, "quantity": 1},
                    {"name": "Каскадёр (массовка трюков)", "type": "ITEM", "unit": "смена", "quantity_units": 1, "rate": 0, "quantity": 1},
                ],
            },
            {
                "name": "9.2 Спецэффекты на площадке",
                "type": "GROUP",
                "children": [
                    {"name": "Пиротехника", "type": "ITEM", "unit": "смена", "quantity_units": 1, "rate": 0, "quantity": 1},
                    {"name": "Спецэффекты (прочие)", "type": "ITEM", "unit": "смена", "quantity_units": 1, "rate": 0, "quantity": 1},
                    {"name": "Материалы спецэффектов", "type": "ITEM", "unit": "шт.", "quantity_units": 1, "rate": 0, "quantity": 1},
                ],
            },
        ],
    },
    {
        "name": "10. ТРАНСПОРТ",
        "type": "GROUP",
        "children": [
            {
                "name": "10.1 Транспортная группа",
                "type": "GROUP",
                "children": [
                    {"name": "Водитель (1)", "type": "ITEM", "unit": "смена", "quantity_units": 1, "rate": 0, "quantity": 1},
                    {"name": "Водитель (2)", "type": "ITEM", "unit": "смена", "quantity_units": 1, "rate": 0, "quantity": 1},
                    {"name": "Водитель (3)", "type": "ITEM", "unit": "смена", "quantity_units": 1, "rate": 0, "quantity": 1},
                    {"name": "Километраж (1)", "type": "ITEM", "unit": "км", "quantity_units": 1, "rate": 0, "quantity": 1},
                    {"name": "Километраж (2)", "type": "ITEM", "unit": "км", "quantity_units": 1, "rate": 0, "quantity": 1},
                ],
            },
            {
                "name": "10.2 Аренда транспорта",
                "type": "GROUP",
                "children": [
                    {"name": "Грузовой транспорт", "type": "ITEM", "unit": "смена", "quantity_units": 1, "rate": 0, "quantity": 1},
                    {"name": "Пассажирский транспорт", "type": "ITEM", "unit": "смена", "quantity_units": 1, "rate": 0, "quantity": 1},
                    {"name": "Гримёрный автобус", "type": "ITEM", "unit": "смена", "quantity_units": 1, "rate": 0, "quantity": 1},
                    {"name": "Топливо", "type": "ITEM", "unit": "л.", "quantity_units": 1, "rate": 0, "quantity": 1},
                ],
            },
        ],
    },
    {
        "name": "11. ЛОКАЦИИ",
        "type": "GROUP",
        "children": [
            {
                "name": "11.1 Аренда локаций",
                "type": "GROUP",
                "children": [
                    {"name": "Павильон (1)", "type": "ITEM", "unit": "смена", "quantity_units": 1, "rate": 0, "quantity": 1},
                    {"name": "Натурная локация (1)", "type": "ITEM", "unit": "смена", "quantity_units": 1, "rate": 0, "quantity": 1},
                    {"name": "Натурная локация (2)", "type": "ITEM", "unit": "смена", "quantity_units": 1, "rate": 0, "quantity": 1},
                    {"name": "Разрешения на съёмку", "type": "ITEM", "unit": "шт.", "quantity_units": 1, "rate": 0, "quantity": 1},
                ],
            },
            {
                "name": "11.2 Подготовка локации",
                "type": "GROUP",
                "children": [
                    {"name": "Уборка / восстановление", "type": "ITEM", "unit": "шт.", "quantity_units": 1, "rate": 0, "quantity": 1},
                    {"name": "Охрана объекта", "type": "ITEM", "unit": "смена", "quantity_units": 1, "rate": 0, "quantity": 1},
                ],
            },
        ],
    },
    {
        "name": "12. ПИТАНИЕ И ПРОЖИВАНИЕ",
        "type": "GROUP",
        "children": [
            {
                "name": "12.1 Питание",
                "type": "GROUP",
                "children": [
                    {"name": "Питание группы на площадке", "type": "ITEM", "unit": "чел./смену", "quantity_units": 1, "rate": 0, "quantity": 1},
                    {"name": "Каттеринг / кейтеринг", "type": "ITEM", "unit": "смена", "quantity_units": 1, "rate": 0, "quantity": 1},
                ],
            },
            {
                "name": "12.2 Проживание",
                "type": "GROUP",
                "children": [
                    {"name": "Гостиница (номеров × ночей)", "type": "ITEM", "unit": "ном./ночь", "quantity_units": 1, "rate": 0, "quantity": 1},
                    {"name": "Суточные", "type": "ITEM", "unit": "чел./день", "quantity_units": 1, "rate": 0, "quantity": 1},
                ],
            },
        ],
    },
    {
        "name": "13. ТЕХНИКА И ОБОРУДОВАНИЕ",
        "type": "GROUP",
        "children": [
            {
                "name": "13.1 Камеры",
                "type": "GROUP",
                "children": [
                    {"name": "Аренда камеры (1-я камера)", "type": "ITEM", "unit": "смена", "quantity_units": 1, "rate": 0, "quantity": 1},
                    {"name": "Аренда камеры (2-я камера)", "type": "ITEM", "unit": "смена", "quantity_units": 1, "rate": 0, "quantity": 1},
                    {"name": "Объективы", "type": "ITEM", "unit": "смена", "quantity_units": 1, "rate": 0, "quantity": 1},
                    {"name": "Носители / карты памяти", "type": "ITEM", "unit": "шт.", "quantity_units": 1, "rate": 0, "quantity": 1},
                ],
            },
            {
                "name": "13.2 Прочая техника",
                "type": "GROUP",
                "children": [
                    {"name": "Рельсы / долли", "type": "ITEM", "unit": "смена", "quantity_units": 1, "rate": 0, "quantity": 1},
                    {"name": "Операторский кран", "type": "ITEM", "unit": "смена", "quantity_units": 1, "rate": 0, "quantity": 1},
                    {"name": "Прочее оборудование", "type": "ITEM", "unit": "смена", "quantity_units": 1, "rate": 0, "quantity": 1},
                ],
            },
        ],
    },
    {
        "name": "14. ПОСТПРОДАКШН",
        "type": "GROUP",
        "children": [
            {
                "name": "14.1 Монтаж",
                "type": "GROUP",
                "children": [
                    {"name": "Монтажёр", "type": "ITEM", "unit": "мес.", "quantity_units": 1, "rate": 0, "quantity": 1},
                    {"name": "Ассистент монтажёра", "type": "ITEM", "unit": "мес.", "quantity_units": 1, "rate": 0, "quantity": 1},
                    {"name": "Монтажная студия (аренда)", "type": "ITEM", "unit": "день", "quantity_units": 1, "rate": 0, "quantity": 1},
                ],
            },
            {
                "name": "14.2 Цветокоррекция и VFX",
                "type": "GROUP",
                "children": [
                    {"name": "Колорист", "type": "ITEM", "unit": "день", "quantity_units": 1, "rate": 0, "quantity": 1},
                    {"name": "VFX-супервайзер", "type": "ITEM", "unit": "пак.", "quantity_units": 1, "rate": 0, "quantity": 1},
                    {"name": "VFX-студия", "type": "ITEM", "unit": "шт.", "quantity_units": 1, "rate": 0, "quantity": 1},
                ],
            },
            {
                "name": "14.3 Звук пост",
                "type": "GROUP",
                "children": [
                    {"name": "Сведение звука (re-recording mixer)", "type": "ITEM", "unit": "день", "quantity_units": 1, "rate": 0, "quantity": 1},
                    {"name": "Озвучание (ADR)", "type": "ITEM", "unit": "день", "quantity_units": 1, "rate": 0, "quantity": 1},
                    {"name": "Музыкальное оформление", "type": "ITEM", "unit": "пак.", "quantity_units": 1, "rate": 0, "quantity": 1},
                    {"name": "Звуковая студия (аренда)", "type": "ITEM", "unit": "день", "quantity_units": 1, "rate": 0, "quantity": 1},
                ],
            },
        ],
    },
    {
        "name": "15. СТРАХОВАНИЕ И ЮРИДИЧЕСКИЕ РАСХОДЫ",
        "type": "GROUP",
        "children": [
            {
                "name": "15.1 Страхование",
                "type": "GROUP",
                "children": [
                    {"name": "Страхование съёмочного оборудования", "type": "ITEM", "unit": "шт.", "quantity_units": 1, "rate": 0, "quantity": 1},
                    {"name": "Страхование гражданской ответственности", "type": "ITEM", "unit": "шт.", "quantity_units": 1, "rate": 0, "quantity": 1},
                    {"name": "Медицинская страховка группы", "type": "ITEM", "unit": "чел.", "quantity_units": 1, "rate": 0, "quantity": 1},
                ],
            },
            {
                "name": "15.2 Юридические расходы",
                "type": "GROUP",
                "children": [
                    {"name": "Юридическое сопровождение", "type": "ITEM", "unit": "шт.", "quantity_units": 1, "rate": 0, "quantity": 1},
                    {"name": "Авторские права и лицензии", "type": "ITEM", "unit": "шт.", "quantity_units": 1, "rate": 0, "quantity": 1},
                ],
            },
        ],
    },
    {
        "name": "16. НЕПРЕДВИДЕННЫЕ РАСХОДЫ",
        "type": "GROUP",
        "children": [
            {
                "name": "16.1 Резерв",
                "type": "GROUP",
                "children": [
                    {"name": "Непредвиденные расходы (10%)", "type": "ITEM", "unit": "шт.", "quantity_units": 1, "rate": 0, "quantity": 1},
                    {"name": "Форс-мажорный резерв", "type": "ITEM", "unit": "шт.", "quantity_units": 1, "rate": 0, "quantity": 1},
                ],
            },
        ],
    },
]


def _generate_code(parent_code: str, index: int) -> str:
    """Генерирует код вида '1', '1.1', '1.1.1'."""
    if not parent_code:
        return str(index + 1)
    return f"{parent_code}.{index + 1}"


def build_flat_lines(project_id, template=None, parent_id=None, parent_code="", sort_offset=0):
    """
    Рекурсивно строит плоский список BudgetLine из шаблона.
    Возвращает list[dict] для bulk insert.
    """
    import uuid as _uuid
    if template is None:
        template = TEMPLATE

    result = []
    for i, item in enumerate(template):
        line_id = _uuid.uuid4()
        code = _generate_code(parent_code, i)
        level = len(code.split(".")) - 1

        line = {
            "id": line_id,
            "project_id": project_id,
            "parent_id": parent_id,
            "sort_order": sort_offset + i,
            "level": level,
            "code": code,
            "name": item["name"],
            "type": item.get("type", "ITEM"),
            "unit": item.get("unit"),
            "quantity_units": item.get("quantity_units", 1.0),
            "rate": item.get("rate", 0.0),
            "quantity": item.get("quantity", 1.0),
            "tax_scheme_id": None,
            "tax_override": False,
            "currency": "RUB",
            "limit_amount": 0.0,
        }
        result.append(line)

        if "children" in item and item["children"]:
            children = build_flat_lines(
                project_id=project_id,
                template=item["children"],
                parent_id=line_id,
                parent_code=code,
                sort_offset=0,
            )
            result.extend(children)

    return result
