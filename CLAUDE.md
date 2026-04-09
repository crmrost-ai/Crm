# CLAUDE.md — Теремка CRM (Типография Рост)

## Что это такое

**Теремка** — внутренняя система управления заказами для типографии «Рост».

Главная идея: **прокладка между менеджерами и цехами-подрядчиками**.

```
Клиент → [Источник заявки] → Менеджер → [ТЕРЕМКА] → Цех (подрядчик)
```

Система:
- собирает заявки из разных каналов в одном месте
- автоматически считает стоимость простых заказов (калькуляторы)
- передаёт задания в нужный цех
- отслеживает статус выполнения

---

## Роли пользователей

| Роль | Описание |
|---|---|
| **Менеджер** | Принимает заявки, общается с клиентами, контролирует заказы |
| **Подрядчик (цех)** | Получает задания, меняет статус, вводит расчёт |
| **Администратор** | Управляет пользователями, настройками, имеет доступ ко всему |

---

## Источники заявок

- Телефон / WhatsApp → менеджер вводит вручную
- Email → менеджер вводит вручную
- Сайт типографии → форма заказа (планируется интеграция)
- Telegram → уведомления (планируется)

---

## Жизненный цикл заказа

```
NEW (Новая заявка)
    ↓
CALCULATING (Отправлена на расчёт подрядчику)
    ↓
CALCULATED (Расчёт получен, ожидает согласования)
    ↓
AGREED (Согласована с клиентом)
    ↓
IN_PRODUCTION (В производстве)
    ↓
READY (Готово)
    ↓
DELIVERED (Выдано клиенту)
    ↓
CLOSED (Закрыт)
```

Также: CANCELLED (Отменён) — из любого статуса.

---

## Архитектура проекта

```
Crm/
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.js        # POST /login, GET /me
│   │   │   ├── orders.js      # CRUD заказов, статусы, расчёт
│   │   │   ├── clients.js     # CRUD клиентов
│   │   │   ├── users.js       # Пользователи (admin)
│   │   │   ├── dadata.js      # Прокси к DaData API
│   │   │   └── settings.js    # Реквизиты компании
│   │   ├── middleware/
│   │   │   └── auth.js        # JWT, requireRole
│   │   └── index.js
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   └── package.json
│
├── frontend/
│   ├── app/
│   │   ├── (main)/
│   │   │   ├── dashboard/         # Дашборд (менеджер / подрядчик)
│   │   │   ├── orders/
│   │   │   │   ├── page.js        # Список заказов с фильтрами
│   │   │   │   ├── new/           # Создание заказа
│   │   │   │   └── [id]/
│   │   │   │       ├── page.js    # Карточка заказа
│   │   │   │       └── invoice/   # Счёт на оплату (печать/PDF)
│   │   │   ├── clients/
│   │   │   │   ├── page.js        # Список клиентов
│   │   │   │   └── [id]/          # Карточка клиента
│   │   │   ├── calculator/        # Калькулятор (4 типа продукции)
│   │   │   ├── contractors/       # Список цехов
│   │   │   ├── products/          # Каталог продукции
│   │   │   └── admin/
│   │   │       ├── users/         # Управление пользователями
│   │   │       └── settings/      # Реквизиты компании
│   │   └── login/
│   ├── components/
│   │   ├── layout/
│   │   │   └── Sidebar.js
│   │   ├── orders/
│   │   │   └── ClientForm.js      # Форма клиента (все 3 типа)
│   │   └── ui/
│   │       ├── StatusBadge.js
│   │       ├── PhoneInput.js      # Маска +7
│   │       ├── DateQuickPick.js   # +3/7/14/30 дней
│   │       ├── InnSearch.js       # Поиск по ИНН/названию (DaData)
│   │       ├── AddressInput.js    # Автодополнение адреса (DaData)
│   │       └── BankSearch.js      # Поиск банка по БИК (DaData)
│   └── lib/
│       ├── api.js                 # Все API-вызовы
│       ├── auth.js                # getUser, logout
│       └── constants.js           # Статусы, источники, типы продукции
│
├── deploy.sh                      # Скрипт деплоя на VPS
├── nginx-rost.conf                # Конфиг Nginx (subpath /rost)
└── CLAUDE.md
```

---

## Технологический стек

| Слой | Технология |
|---|---|
| Backend | Node.js + Express |
| ORM | Prisma |
| База данных | PostgreSQL |
| Frontend | Next.js 14 (App Router) |
| Стили | Tailwind CSS |
| Auth | JWT + bcrypt |
| Внешний API | DaData (ИНН, адрес, банк) |
| Хостинг | VPS (antonchernyshov.ru/rost) |

---

## Схема БД (актуальная)

```
User          — id, name, email, passwordHash, role, phone, telegram, isActive
Client        — id, type(INDIVIDUAL/ENTREPRENEUR/COMPANY), name, phone, email,
                contactPerson, inn, kpp, ogrn, ogrnip, legalAddress, director,
                bik, bankName, bankAccount, corrAccount, comment
Order         — id, number(auto), status, source, productType, title,
                params(JSON), estimatedPrice, finalPrice, description,
                managerNote, deliveryAddress, files(JSON),
                deadline, clientId, managerId, contractorId,
                calcRequest, calcRequestedAt, calcResponse, calcRespondedAt
OrderStatus_History — orderId, status, comment, userId, createdAt
Settings      — key, value (реквизиты компании-продавца)
```

---

## DaData интеграции

Все запросы проксируются через backend (`/api/dadata/*`). Токен только на сервере.

| Эндпоинт | Что делает |
|---|---|
| `GET /api/dadata/party?query=&type=` | Поиск компании/ИП по названию или ИНН |
| `GET /api/dadata/party/:inn` | Детальная проверка контрагента по ИНН |
| `GET /api/dadata/address?query=` | Автодополнение адреса |
| `GET /api/dadata/bank?query=` | Поиск банка по БИК или названию |

---

## Роадмап разработки

### Этап 1 — Фундамент ✅
- [x] CLAUDE.md — документация проекта
- [x] Схема БД (Prisma): User, Client, Order, OrderStatus_History, Settings
- [x] Миграции БД (4 миграции применены)
- [x] Backend: JWT авторизация, middleware ролей
- [x] Backend: CRUD заказов со статус-машиной и историей
- [x] Backend: CRUD клиентов (физлицо / ИП / юрлицо)
- [x] Backend: Управление пользователями (admin)
- [x] Backend: Реквизиты компании (Settings)
- [x] Frontend: Страница входа
- [x] Frontend: Дашборд менеджера (статистика, последние заказы)
- [x] Frontend: Список и фильтрация заказов
- [x] Frontend: Карточка заказа (статусы, цех, переписка)
- [x] Frontend: Список и карточка клиента
- [x] Frontend: Управление пользователями (admin)
- [x] Frontend: Настройки компании (admin)

### Этап 2 — Калькуляторы и DaData ✅
- [x] Калькулятор визиток / листовок
- [x] Калькулятор баннеров
- [x] Калькулятор упаковки
- [x] Калькулятор сувениров
- [x] Калькулятор → автозаполнение формы нового заказа
- [x] DaData: поиск контрагента по ИНН/названию (InnSearch)
- [x] DaData: автодополнение адреса (AddressInput)
- [x] DaData: поиск банка по БИК (BankSearch)
- [x] Счёт на оплату (печатная форма / PDF)
- [x] Адрес доставки в заказе

### Этап 3 — Подрядчики (в работе)
- [x] Список цехов с созданием через интерфейс
- [x] Назначение цеха на заказ
- [x] Передача заказа в цех (статус CALCULATING + сопроводительное сообщение)
- [x] Ввод расчёта подрядчиком (цена + описание)
- [ ] **Редактирование заказа** — после создания нельзя поправить поля
- [ ] **Загрузка файлов** — поле в БД есть, UI нет (макеты, ТЗ, фото)
- [ ] **Уведомления в Telegram** — оповещение цеха при новом задании

### Этап 4 — Деплой
- [x] Скрипт деплоя `deploy.sh` (Node.js, PostgreSQL, PM2)
- [x] Конфиг Nginx (`nginx-rost.conf`, subpath `/rost`)
- [x] Первый запуск на VPS (antonchernyshov.ru/rost)
- [ ] **Docker + docker-compose** — для чистого воспроизводимого деплоя
- [ ] **SSL / HTTPS** — сейчас HTTP

### Этап 5 — Интеграции (планируется)
- [ ] Ценовые правила в интерфейсе (сейчас цены захардкожены в калькуляторе)
- [ ] Форма заказа с сайта типографии → Теремка
- [ ] Уведомления в Telegram (бот)
- [ ] Автоимпорт заявок из Email

---

## Переменные окружения

```env
# Backend (.env)
DATABASE_URL=postgresql://teremka:password@localhost:5432/teremka
JWT_SECRET=your-secret-key
PORT=4000
FRONTEND_URL=http://localhost:3000
DADATA_TOKEN=your-dadata-token

# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:4000
```

---

## Команды разработки

```bash
# Backend
cd backend && npm install
npm run dev          # порт 4000

# Frontend
cd frontend && npm install
npm run dev          # порт 3000

# Применить миграции БД
cd backend && npx prisma migrate deploy

# Деплой на VPS
bash deploy.sh
```
