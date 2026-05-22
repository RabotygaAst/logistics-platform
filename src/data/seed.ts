import type { DeliveryPoint, Product, RoleOption, TruckModel } from '../types';

export const roles: RoleOption[] = [
  { id: 'SUPER_ADMIN', label: 'Супер-админ' },
  { id: 'CUSTOMER', label: 'Заказчик' },
  { id: 'WAREHOUSE', label: 'Кладовщик' },
  { id: 'DRIVER', label: 'Водитель' },
];

export const statuses = [
  'CREATED',
  'CONFIRMED',
  'ASSEMBLING',
  'LOADED',
  'IN_TRANSIT',
  'PARTIALLY_DELIVERED',
  'DELIVERED',
  'CANCELLED',
] as const;

export const productsSeed: Product[] = [
  { id: 1, name: 'Industrial Compressor', category: 'Heavy', price: 185000, weight: 640, volume: 5.2, quantity: 18, reserved: 0 },
  { id: 2, name: 'Steel Pallet Kit', category: 'Pallet', price: 42000, weight: 220, volume: 1.4, quantity: 40, reserved: 0 },
  { id: 3, name: 'Thermo Box XL', category: 'Cold', price: 26500, weight: 85, volume: 2.1, quantity: 56, reserved: 0 },
  { id: 4, name: 'Server Rack Cargo', category: 'IT', price: 94000, weight: 180, volume: 1.9, quantity: 22, reserved: 0 },
  { id: 5, name: 'Medical Container', category: 'Care', price: 73500, weight: 140, volume: 2.4, quantity: 16, reserved: 0 },
];

export const trucksSeed: TruckModel[] = [
  { id: 'TR-01', driver: 'Viktor Morozov', capacityWeight: 9000, capacityVolume: 42, status: 'FREE', x: -4.4, y: 2.8, fuel: 78 },
  { id: 'TR-02', driver: 'Dmitry Sokolov', capacityWeight: 14000, capacityVolume: 58, status: 'FREE', x: 4.8, y: -2.4, fuel: 64 },
  { id: 'TR-03', driver: 'Anton Volkov', capacityWeight: 7200, capacityVolume: 34, status: 'ACTIVE', x: 2.1, y: 3.4, fuel: 51 },
  { id: 'TR-04', driver: 'Kirill Orlov', capacityWeight: 11000, capacityVolume: 47, status: 'SERVICE', x: -3.6, y: -3.4, fuel: 31 },
];

export const deliveryPointsSeed: DeliveryPoint[] = [
  { id: 'DP-1', address: 'North Terminal', lat: 55.784, lon: 37.59, x: -3.2, y: -2.2 },
  { id: 'DP-2', address: 'Black Gate Hub', lat: 55.741, lon: 37.63, x: 1.5, y: -3.1 },
  { id: 'DP-3', address: 'East Client Yard', lat: 55.77, lon: 37.71, x: 3.8, y: 1.7 },
  { id: 'DP-4', address: 'South Depot', lat: 55.69, lon: 37.61, x: -1.1, y: 3.6 },
];

export const apiMap = [
  ['Auth', 'POST /login · POST /register · JWT + RBAC'],
  ['Products', 'GET /products · POST /products'],
  ['Orders', 'POST /orders · GET /orders/:id · PATCH status'],
  ['Routing', 'OSRM route build · ETA recalculation'],
  ['Tracking', 'POST /gps/update · Socket.IO tracking/:truckId'],
] as const;

export const permissions = [
  ['Каталог', 'SUPER_ADMIN', 'CUSTOMER'],
  ['Остатки', 'SUPER_ADMIN', 'WAREHOUSE'],
  ['Резерв', 'SUPER_ADMIN', 'WAREHOUSE'],
  ['Маршруты', 'SUPER_ADMIN', 'DRIVER', 'CUSTOMER'],
  ['GPS', 'SUPER_ADMIN', 'DRIVER', 'CUSTOMER'],
  ['Флот', 'SUPER_ADMIN'],
  ['Статусы', 'SUPER_ADMIN', 'WAREHOUSE', 'DRIVER'],
] as const;

export const dbTables = [
  ['users', 'id · role · name · email · password_hash'],
  ['products', 'id · name · weight · volume · quantity'],
  ['orders', 'id · customer_id · status · total_weight · total_volume'],
  ['order_items', 'id · order_id · product_id · quantity'],
  ['delivery_points', 'id · order_id · latitude · longitude · sequence'],
  ['trucks', 'id · capacity_weight · capacity_volume · status'],
  ['routes', 'id · truck_id · distance · eta'],
  ['gps_logs', 'id · truck_id · latitude · longitude · timestamp'],
] as const;

export const serviceHealth = [
  ['Next.js / Vite', 'Frontend', 'online'],
  ['NestJS', 'API Gateway', 'online'],
  ['PostgreSQL + PostGIS', 'Primary DB', 'online'],
  ['Redis', 'Cache / sessions', 'online'],
  ['OSRM', 'Routing engine', 'online'],
  ['Socket.IO', 'Realtime channel', 'online'],
] as const;
