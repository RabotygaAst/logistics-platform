# Logistics Control OS — Three.js MVP

Черно-белый строгий React/TypeScript прототип системы автоматизации логистики и доставки.

## Что внутри

- React + TypeScript + Vite
- Three.js realtime-визуал маршрута и фуры
- Роли: супер-админ, заказчик, кладовщик, водитель
- Каталог товаров и корзина
- Резервирование товара на складе
- Подбор фуры по грузоподъемности, объему и доступности
- Multi-drop delivery
- GPS online / lost simulation
- Статусы заказа
- Инциденты: потеря GPS, отклонение от маршрута, поломка
- Расчет ETA и стоимости доставки
- RBAC matrix
- API / backend modules preview
- DB schema preview

## Запуск

```bash
npm install
npm run dev
```

После запуска открой адрес из терминала, обычно:

```bash
http://localhost:5173
```

## Сборка

```bash
npm run build
npm run preview
```

## Структура

```text
src/
  App.tsx                         главный экран
  components/
    ThreeLogisticsScene.tsx        Three.js карта/фура/GPS
    RolePanel.tsx                  панели ролей
    Tables.tsx                     таблицы, маршрут, флот, RBAC, БД
    ui.tsx                         кнопки, секции, метрики
  data/
    seed.ts                        мок-данные
  hooks/
    useLogisticsSystem.ts          бизнес-логика MVP
  lib/
    logistics.ts                   маршрутизация, стоимость, подбор фуры
  types.ts                         TypeScript модели
```

## Примечание

Это frontend MVP/prototype. Backend, БД, OSRM, Redis и Socket.IO показаны в интерфейсе и документации как архитектурные контракты. Для production версии нужно заменить мок-логику на реальные API-запросы.

## Linux + DB setup

Подробная инструкция по запуску на Linux и подключению PostgreSQL/PostGIS (включая запись пометок в БД): `docs/RUN_LINUX_DB.md`.