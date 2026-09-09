# CLAUDE.md — SlimWay OS

> Читать ОБЯЗАТЕЛЬНО перед любым действием. Главный документ с правилами разработки.

---

## Основные правила

1. Всегда читай CLAUDE.md перед началом работы
2. Не меняй архитектуру без явного указания
3. Не удаляй существующий функционал
4. Проверяй TypeScript ошибки через `tsc --noEmit` перед коммитом
5. После каждой задачи — `git add . && git commit`, затем `git push` вручную из терминала
6. Версию обновлять в `package.json`
7. SQL миграции выполняются ВРУЧНУЮ в Supabase SQL Editor — не автоматически
8. Никогда не хардкодить цвета — только CSS переменные темы (`var(--text)`, `var(--bg)` и т.д.)

---

## Дизайн-система

### Темы

- Несколько тем × несколько акцентов (расширяемая матрица)
- CSS переменные через `data-theme` и `data-accent` на html элементе
- `applyTheme()` вызывается ДО рендера (нет мигания)
- Хранение: localStorage + профиль пользователя в БД
- ВАЖНО: все цвета только через CSS переменные, никогда хардкод

Базовые переменные:
```
--bg, --bg-card, --bg-sidebar, --border, --text, --text-muted,
--accent, --accent-hover, --accent-muted, --accent-fg
```

Семантические токены статусов:
```
--color-success, --color-success-muted
--color-warning, --color-warning-muted
--color-danger, --color-danger-muted
--color-info, --color-info-muted
```

### Отступы и сетка

- Базовая единица отступа: 4px (шкала: 4, 8, 12, 16, 24, 32, 48, 64)
- Радиусы скругления: sm 6px / md 10px / lg 16px
- Максимальная ширина контента и брейкпоинты — по стандарту Tailwind

### Типографика

- Единая шкала кеглей: 12 / 14 / 16 / 18 / 20 / 24 / 32 / 40px
- Один основной шрифт для UI + один моноширинный для чисел/кода
- Насыщенность: regular / medium / semibold — без произвольных значений

### Анимация и интерактивность

- НИКОГДА `transition: all` — только конкретные свойства
- НИКОГДА `scale(0)` — минимум `scale(0.95) + opacity: 0`
- Кнопки: `transform: scale(0.97)` на `:active`
- Hover только через `@media (hover: hover) and (pointer: fine)`
- `ease-out` для входящих элементов, `ease-in-out` для движения на экране
- Длительность анимаций: 150–300ms максимум
- `prefers-reduced-motion` — всегда учитывать
- CSS transitions предпочтительнее keyframes

---

## UI Skills

Перед любой UI/фронтенд задачей читать в порядке:

1. `Read .claude/skills/frontend-design/SKILL.md`
2. `Read .claude/skills/emil-design-eng/SKILL.md`
3. `Read .claude/skills/ckm:design-system/SKILL.md`

---

## Engineering Skills

Использовать по ситуации:

- `/grill-with-docs` — перед любой новой фичей
- `/systematic-debugging` — для сложных багов
- `/handoff` — когда лимит контекста обрывается, создаёт документ для продолжения
- `/improve-codebase-architecture` — раз в несколько дней
- `/zoom-out` — объяснить незнакомый участок кода
- `/review` — code review перед коммитом
- `/request-refactor-plan` — перед большим рефакторингом
- `/brainstorming` — исследовать идею до написания кода

---

## Стандартный шаблон начала каждой задачи

Прочитай CLAUDE.md перед началом.
Прочитай нужные скиллы из разделов выше по ситуации.
Обнови CLAUDE.md, если в ходе работы изменятся правила проекта.