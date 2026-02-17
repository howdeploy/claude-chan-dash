# claude-chan-dash

Веб-дашборд для управления AI-ассистентом. Задачи, процессы, скиллы, файлы, чат и мониторинг сервера — всё в одном интерфейсе.

Форк [clawdia-dash](https://github.com/maycrypto/clawdia-dash), полностью переписанный с нуля.

## Отличия от оригинала

| | clawdia-dash | claude-chan-dash |
|---|---|---|
| Стек | React SPA (1 файл) + отдельный Express API | Next.js 16 full-stack (App Router) |
| Установка | curl install.sh + агент пишет API по спеке | `npm install && npm run dev` |
| API | Агент создаёт сервер самостоятельно | Встроено, работает из коробки |
| Чат | Нет | TUI-чат через `claude --print` |
| Редактор скиллов | Только просмотр | Просмотр + редактирование SKILL.md |
| Файлы | Плоский список | Дерево с категориями |
| Мониторинг | Аптайм, память | CPU, RAM, диск, нагрузка, лимиты подписки |
| Темы | Matrix rain | 15 цветовых схем (Catppuccin Mocha) |
| Авторизация | Basic Auth через nginx | Локальный доступ (127.0.0.1) |

## Установка

Скопируй это сообщение и отправь своему AI-ассистенту:

```
Установи дашборд claude-chan-dash на сервер:

1. git clone https://github.com/howdeploy/claude-chan-dash.git ~/claude-chan-dash
2. cd ~/claude-chan-dash && npm install
3. cp .env.example .env.local (отредактируй WORKSPACE_PATH если нужно)
4. npm run build && npm run start

Или для автозапуска через pm2:
  npm install -g pm2
  pm2 start deploy/ecosystem.config.js
  pm2 save

Дашборд будет доступен на http://127.0.0.1:3000
```

### Требования

- Node.js 18+
- npm
- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) (для чата)

### Переменные окружения

| Переменная | Описание | По умолчанию |
|---|---|---|
| `WORKSPACE_PATH` | Путь к рабочей директории ассистента | `$HOME` |

## Что внутри

| Раздел | Описание |
|---|---|
| **Дашборд** | Задачи дня, активные процессы, метрики сервера, прогресс лимитов подписки |
| **Чат** | Терминальный чат с ассистентом через `claude --print` |
| **Задачи** | CRUD задач с приоритетами, категориями, датами, фильтрами по статусу и исполнителю |
| **Процессы** | Крон-задачи и расписания ассистента |
| **Скиллы** | Просмотр и редактирование SKILL.md (системные + кастомные) |
| **Файлы** | Дерево файлов рабочей директории с загрузкой и удалением |
| **Настройки** | Имя ассистента, цветовая тема (15 вариантов) |

## Структура

```
app/
  layout.tsx              # Корневой layout (Sidebar + Shell + Theme)
  page.tsx                # / — дашборд
  OverviewClient.tsx      # Виджеты дашборда
  chat/                   # /chat — TUI-чат
  tasks/                  # /tasks — менеджер задач
  processes/              # /processes — процессы
  skills/                 # /skills — скиллы
  files/                  # /files — файлы
  settings/               # /settings — настройки
  api/
    status/route.ts       # CPU, RAM, диск, аптайм
    usage/route.ts        # Лимиты подписки из ~/.claude/stats-cache.json
    chat/route.ts         # Прокси к claude --print
    tasks/route.ts        # CRUD задач
    processes/route.ts    # Чтение процессов
    skills/route.ts       # Список + чтение/запись скиллов
    files/route.ts        # Сканер + загрузка/удаление файлов
    settings/route.ts     # Конфигурация

components/
  layout/                 # Sidebar, Shell, Header
  common/                 # Card, Badge, Modal, MarkdownView
  tabs/                   # TaskList, SkillGrid, FileManager, ...
  ThemeProvider.tsx        # 15 цветовых тем

lib/
  constants.ts            # Навигация, темы, категории
  api-client.ts           # Типизированный HTTP-клиент
  services/
    config-store.ts       # ~/.claude-dash/config.json
    task-store.ts          # ~/.claude-dash/tasks.json
    file-scanner.ts        # Сканер рабочей директории
    skill-scanner.ts       # Сканер ~/.claude/skills/
    process-cache.ts       # Чтение cron-cache.json

styles/                   # CSS-переменные, компоненты, layout
```

## Как это работает

Данные хранятся в JSON-файлах в `~/.claude-dash/` (задачи, конфигурация, история чата). Файловый менеджер сканирует рабочую директорию ассистента (`WORKSPACE_PATH`). Скиллы читаются из `~/.claude/skills/`.

Чат отправляет сообщения через `claude --print` в неинтерактивном режиме с таймаутом 120 секунд.

Мониторинг лимитов подписки читает `~/.claude/stats-cache.json` и вычисляет процент использования за 5 часов / день / неделю / месяц.

Дашборд работает на `127.0.0.1:3000` — доступ только локально. Для внешнего доступа используй nginx reverse proxy с авторизацией.

## License

MIT

---

Fork of [clawdia-dash](https://github.com/maycrypto/clawdia-dash) by [@maycrypto](https://github.com/maycrypto)
