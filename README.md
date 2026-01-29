<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# FoundersPath AI - AI-Ментор для стартапов

AI-помощник для создания питч-деков стартапов. Powered by GigaChat.

## Архитектура

Приложение состоит из трёх частей:
- **Backend**: Python Flask сервер с GigaChat API (порт 5001)
- **Frontend**: React приложение (порт 3001)
- **Database**: Supabase (PostgreSQL в облаке)

## Требования

- **Python 3.8+** (для backend)
- **Node.js 16+** (для frontend)
- **Аккаунт Supabase** (бесплатный tier подходит)

## Установка и запуск

### 1. Настройте Supabase

#### 1.1. Создайте проект

1. Зарегистрируйтесь на https://supabase.com
2. Создайте новый проект
3. Дождитесь завершения инициализации (1-2 минуты)

#### 1.2. Создайте таблицы

1. Откройте **SQL Editor** в панели Supabase
2. Скопируйте содержимое файла `supabase-schema.sql`
3. Вставьте в SQL Editor и нажмите **Run**
4. Убедитесь, что таблицы `projects` и `artifacts` созданы (вкладка **Table Editor**)

#### 1.3. Настройте OAuth (опционально)

Для входа через Google/GitHub:

1. Откройте **Authentication > Providers**
2. Включите **Google** и/или **GitHub**
3. Следуйте инструкциям для получения OAuth credentials
4. Добавьте redirect URL: `http://localhost:3001`

#### 1.4. Скопируйте API ключи

1. Откройте **Settings > API**
2. Скопируйте:
   - **Project URL** (например: `https://abcdefgh.supabase.co`)
   - **anon public** ключ
3. Откройте файл `.env.local` в корневой папке проекта
4. Замените плейсхолдеры на ваши значения:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 2. Установите зависимости Backend

```bash
cd backend
pip3 install -r requirements.txt
```

### 3. Установите зависимости Frontend

```bash
# В корневой папке проекта
npm install
```

### 4. Запустите Backend (Терминал 1)

```bash
cd backend
python server.py
```

Backend запустится на `http://localhost:5001`

Вы должны увидеть:
```
Starting GigaChat Flask backend...
Backend will run on http://localhost:5001
```

### 5. Запустите Frontend (Терминал 2)

```bash
# В корневой папке проекта
npm run dev
```

Frontend запустится на `http://localhost:3001`

### 6. Откройте приложение

Откройте в браузере: **http://localhost:3001**

### 7. Зарегистрируйтесь / Войдите

- Используйте email/пароль
- Или войдите через Google/GitHub (если настроили OAuth)

## Использование

1. **Зарегистрируйтесь** - создайте аккаунт или войдите через OAuth
2. **Начните диалог** с AI-ментором (первый проект создаётся автоматически)
3. **Расскажите о своей идее** стартапа
4. AI поможет заполнить все 11 артефактов pitch deck:
   - Идея (Проблема и Решение)
   - Целевая Аудитория
   - Гипотезы и Кастдев
   - Анализ Рынка (TAM/SAM/SOM)
   - Конкурентный Анализ
   - Бизнес-модель
   - Финансовая Модель
   - Прототип и MVP
   - Маркетинговый План
   - Дорожная карта
   - Команда

5. **Артефакты сохраняются автоматически** каждые 2 секунды в облако
6. **Создавайте несколько проектов** - переключайтесь между ними через выпадающее меню
7. **Скачайте готовый pitch deck** кнопкой "Скачать Питч Дек"
8. **Продолжайте работу** с любого устройства - данные синхронизированы

## Структура проекта

```
founderspath-ai/
├── backend/
│   ├── server.py             # Flask сервер с GigaChat
│   └── requirements.txt      # Python зависимости
├── lib/
│   └── supabaseClient.ts     # Supabase клиент и типы
├── services/
│   ├── gigachatService.ts    # AI сервис (GigaChat)
│   └── projectService.ts     # Работа с проектами и артефактами
├── components/
│   ├── Auth.tsx              # Авторизация с OAuth
│   ├── ProjectSelector.tsx   # Выбор проектов
│   ├── ChatInterface.tsx     # Чат с AI
│   └── ArtifactItem.tsx      # Отображение артефактов
├── App.tsx                   # Главный компонент
├── .env.local                # Переменные окружения (Supabase ключи)
├── supabase-schema.sql       # SQL схема для БД
└── package.json              # Node.js зависимости
```

## Troubleshooting

### Backend не запускается

```bash
# На macOS используйте pip3 вместо pip
pip3 list | grep -i gigachat

# Переустановите зависимости
cd backend
pip3 install -r requirements.txt
```

**Порт 5000 занят (macOS AirPlay):** Backend автоматически использует порт 5001.

### Frontend не подключается к Backend

- Убедитесь, что backend запущен на порту **5001** (не 5000!)
- Проверьте в консоли браузера (F12) наличие ошибок CORS
- Проверьте, что в [services/gigachatService.ts:5](services/gigachatService.ts#L5) указан правильный URL: `http://localhost:5001`

### Ошибки Supabase

**"Invalid API key":**
- Проверьте, что вы скопировали правильные значения в [.env.local](.env.local)
- `VITE_SUPABASE_URL` должен начинаться с `https://`
- `VITE_SUPABASE_ANON_KEY` должен быть **anon public** ключ (не service_role!)
- Перезапустите frontend после изменения `.env.local`

**"relation does not exist" или "permission denied":**
- Убедитесь, что вы выполнили SQL скрипт из [supabase-schema.sql](supabase-schema.sql)
- Проверьте, что RLS политики включены (запросы в SQL Editor)

**OAuth не работает:**
- Убедитесь, что провайдер включён в Supabase Dashboard
- Redirect URL должен быть: `http://localhost:3001`
- В production измените на ваш домен

### GigaChat не возвращает JSON

Backend автоматически оборачивает текстовые ответы в JSON структуру:
- Проверьте [constants.ts](constants.ts) - там должно быть явное требование JSON формата
- GigaChat может не всегда следовать формату - это нормально, backend обработает это

### Данные не сохраняются

- Откройте консоль браузера (F12) и проверьте наличие ошибок
- Автосохранение происходит через 2 секунды после изменений
- Проверьте подключение к Supabase (зелёный статус в Dashboard)

## API Keys

GigaChat credentials уже встроены в `backend/server.py`. Для production рекомендуется:
1. Создать `.env` файл в `backend/`
2. Добавить `GIGACHAT_CREDENTIALS=your_key_here`
3. Обновить `server.py` для чтения из env

## License

MIT

## Возможности

✅ **Авторизация**
- Email/пароль регистрация
- OAuth вход (Google, GitHub)
- Безопасное хранение с Row Level Security

✅ **Множественные проекты**
- Создавайте неограниченное количество проектов
- Быстрое переключение между проектами
- Автоматическое сохранение каждые 2 секунды

✅ **AI-помощник**
- GigaChat-2 для генерации контента
- Контекстное понимание истории диалога
- Структурированные ответы с обновлением артефактов

✅ **Облачное хранилище**
- Supabase PostgreSQL база данных
- Доступ с любого устройства
- Надёжные бэкапы

## Стек технологий

- **AI:** [GigaChat API](https://developers.sber.ru/portal/products/gigachat-api) - российская LLM
- **Frontend:** [React](https://react.dev/) + TypeScript + Vite
- **Backend:** [Flask](https://flask.palletsprojects.com/) (Python)
- **Database:** [Supabase](https://supabase.com/) (PostgreSQL + Auth)
- **Deployment:** Vercel-ready (frontend) + любой Python хостинг (backend)
