# Architecture

## Frontend

- React + TypeScript
- Vite dev/build pipeline
- Three.js для визуального мониторинга маршрута и грузовика
- Tailwind CSS для строгого черно-белого интерфейса
- Компонентная структура: UI, панели ролей, таблицы, 3D-сцена

## Backend target architecture

Рекомендуемая production-архитектура:

- NestJS API Gateway
- Auth Module: register, login, JWT, RBAC
- Product Module: каталог и товары
- Warehouse Module: остатки, резерв, снятие резерва
- Order Module: заказы, статусы, позиции заказа
- Fleet Module: фуры, водители, рейсы
- Routing Module: OSRM/GraphHopper, ETA, оптимизация точек
- Tracking Module: прием GPS, история перемещений, realtime socket events
- Pricing Module: расчет стоимости доставки

## Data flow

1. Customer создает заказ и выбирает delivery points.
2. Warehouse проверяет остатки и резервирует товар.
3. Fleet module выбирает подходящую свободную фуру.
4. Routing module строит multi-drop маршрут.
5. Driver начинает рейс.
6. Tracking module принимает GPS updates.
7. Frontend обновляет карту через Socket.IO без перезагрузки.

## Three.js visualization

Сцена содержит:

- склад в центре
- маршрут
- delivery points
- грузовик
- GPS pulse
- пройденный путь
- строгую черно-белую сетку города
