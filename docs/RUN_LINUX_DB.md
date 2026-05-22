# Запуск проекта на Linux + подключение PostgreSQL (с возможностью записей и пометок)

> Важно: текущий репозиторий — это frontend MVP на React/Vite. Прямого backend/API в этом репозитории нет, поэтому запись в БД из UI сейчас не выполняется автоматически. Ниже — рабочая схема, как поднять БД, создать таблицы (включая пометки) и проверить, что записи создаются.

## 1) Требования

- Linux (Ubuntu 22.04+/Debian/Fedora и т.п.)
- Node.js 20 LTS+
- npm 10+
- PostgreSQL 15+ (или 16+) с расширением PostGIS

Проверка версий:

```bash
node -v
npm -v
psql --version
```

## 2) Запуск frontend

Из корня репозитория:

```bash
npm install
npm run dev
```

Открыть в браузере адрес из терминала (обычно `http://localhost:5173`).

Сборка production:

```bash
npm run build
npm run preview
```

## 3) Поднять PostgreSQL + PostGIS (локально)

### Вариант A (Ubuntu/Debian, системный PostgreSQL)

```bash
sudo apt update
sudo apt install -y postgresql postgresql-contrib postgis
```

Создать БД/пользователя:

```bash
sudo -u postgres psql <<'SQL'
CREATE ROLE logistics_app WITH LOGIN PASSWORD 'logistics_pass';
CREATE DATABASE logistics_db OWNER logistics_app;
\c logistics_db
CREATE EXTENSION IF NOT EXISTS postgis;
SQL
```

### Вариант B (Docker)

```bash
docker run --name logistics-postgres \
  -e POSTGRES_USER=logistics_app \
  -e POSTGRES_PASSWORD=logistics_pass \
  -e POSTGRES_DB=logistics_db \
  -p 5432:5432 \
  -d postgis/postgis:16-3.4
```

## 4) Применить схему БД

В репозитории добавлен SQL-файл `db/schema.sql`.

Применение:

```bash
PGPASSWORD=logistics_pass psql \
  -h 127.0.0.1 -p 5432 -U logistics_app -d logistics_db \
  -f db/schema.sql
```

## 5) Проверка записей и пометок

### 5.1. Создать тестовый заказ

```bash
PGPASSWORD=logistics_pass psql -h 127.0.0.1 -U logistics_app -d logistics_db <<'SQL'
INSERT INTO users (role, name, email, password_hash)
VALUES ('CUSTOMER', 'Demo Customer', 'customer@example.com', 'hash-demo')
RETURNING id;
SQL
```

Скопируйте `id` пользователя и создайте заказ:

```bash
PGPASSWORD=logistics_pass psql -h 127.0.0.1 -U logistics_app -d logistics_db <<'SQL'
INSERT INTO orders (customer_id, status, total_weight, total_volume, goods_sum, delivery_cost, eta_minutes)
VALUES (1, 'CREATED', 1200, 6.8, 227000, 14500, 96)
RETURNING id;
SQL
```

### 5.2. Добавить пометку к заказу

```bash
PGPASSWORD=logistics_pass psql -h 127.0.0.1 -U logistics_app -d logistics_db <<'SQL'
INSERT INTO order_notes (order_id, author_user_id, note)
VALUES (1, 1, 'Клиент просит доставку до 14:00')
RETURNING id, order_id, note, created_at;
SQL
```

### 5.3. Убедиться, что запись сохранилась

```bash
PGPASSWORD=logistics_pass psql -h 127.0.0.1 -U logistics_app -d logistics_db <<'SQL'
SELECT o.id, o.status, n.note, n.created_at
FROM orders o
LEFT JOIN order_notes n ON n.order_id = o.id
WHERE o.id = 1
ORDER BY n.created_at DESC;
SQL
```

## 6) Как подключить будущий backend к этой БД

В backend-сервисе (например NestJS) используйте DSN:

```text
postgresql://logistics_app:logistics_pass@127.0.0.1:5432/logistics_db
```

Рекомендуемые сущности/эндпоинты для пометок:

- `POST /orders/:id/notes` — добавить пометку.
- `GET /orders/:id/notes` — получить список пометок.
- `PATCH /orders/:id/notes/:noteId` — редактировать.
- `DELETE /orders/:id/notes/:noteId` — удалить.

## 7) Ограничение текущего MVP

Текущий UI использует seed-данные в памяти и не делает HTTP-запросы к БД. Для реальной записи из интерфейса нужно:

1. Добавить backend API (NestJS/Express/Fastify).
2. Подключить ORM/SQL-клиент (Prisma/TypeORM/pg).
3. Заменить работу с seed в `useLogisticsSystem` на вызовы API.