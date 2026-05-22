export type RoleId = 'SUPER_ADMIN' | 'CUSTOMER' | 'WAREHOUSE' | 'DRIVER';
export type OrderStatus =
  | 'CREATED'
  | 'CONFIRMED'
  | 'ASSEMBLING'
  | 'LOADED'
  | 'IN_TRANSIT'
  | 'PARTIALLY_DELIVERED'
  | 'DELIVERED'
  | 'CANCELLED';

export type TruckStatus = 'FREE' | 'ACTIVE' | 'SERVICE';

export interface RoleOption {
  id: RoleId;
  label: string;
}

export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  weight: number;
  volume: number;
  quantity: number;
  reserved: number;
}

export interface TruckModel {
  id: string;
  driver: string;
  capacityWeight: number;
  capacityVolume: number;
  status: TruckStatus;
  x: number;
  y: number;
  fuel: number;
}

export interface DeliveryPoint {
  id: string;
  address: string;
  lat: number;
  lon: number;
  x: number;
  y: number;
  sequence?: number;
  delivered?: boolean;
}

export interface OrderItem {
  productId: number;
  quantity: number;
}

export interface OrderModel {
  id: string;
  customer: string;
  status: OrderStatus;
  items: OrderItem[];
  points: DeliveryPoint[];
  priority: boolean;
  totalWeight: number;
  totalVolume: number;
  goodsSum: number;
  deliveryCost: number;
  etaMinutes: number;
  reserved: boolean;
  assignedTruck: string | null;
  deliveredStops: number;
  issue: string | null;
  audit: string[];
}

export type Cart = Record<number, number>;
