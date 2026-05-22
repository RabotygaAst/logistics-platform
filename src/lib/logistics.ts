import type { Cart, DeliveryPoint, OrderItem, OrderModel, Product, TruckModel } from '../types';

export function money(value: number): string {
  return `${new Intl.NumberFormat('ru-RU').format(Math.round(value))} ₽`;
}

export function dist(a: Pick<DeliveryPoint, 'x' | 'y'>, b: Pick<DeliveryPoint, 'x' | 'y'>): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function optimizeRoute(start: Pick<DeliveryPoint, 'x' | 'y'>, points: DeliveryPoint[]): DeliveryPoint[] {
  const rest = [...points];
  const route: DeliveryPoint[] = [];
  let cursor = start;

  while (rest.length) {
    let best = 0;
    for (let i = 1; i < rest.length; i += 1) {
      if (dist(cursor, rest[i]) < dist(cursor, rest[best])) best = i;
    }
    const [next] = rest.splice(best, 1);
    route.push(next);
    cursor = next;
  }

  return route.map((point, index) => ({ ...point, sequence: index + 1, delivered: false }));
}

export function estimateDistance(start: Pick<DeliveryPoint, 'x' | 'y'>, route: DeliveryPoint[]): number {
  let current = start;
  let sum = 0;
  route.forEach((point) => {
    sum += dist(current, point);
    current = point;
  });
  sum += dist(current, start) * 0.22;
  return Number((sum * 8.7).toFixed(1));
}

export function cartToItems(cart: Cart): OrderItem[] {
  return Object.entries(cart)
    .map(([productId, quantity]) => ({ productId: Number(productId), quantity }))
    .filter((item) => item.quantity > 0);
}

export function getTotals(products: Product[], items: OrderItem[]) {
  return items.reduce(
    (acc, item) => {
      const product = products.find((entry) => entry.id === item.productId);
      if (!product) return acc;
      acc.weight += product.weight * item.quantity;
      acc.volume += product.volume * item.quantity;
      acc.goods += product.price * item.quantity;
      return acc;
    },
    { weight: 0, volume: 0, goods: 0 },
  );
}

export function calcDeliveryCost(distance: number, totals: { weight: number; volume: number }, drops: number, priority: boolean): number {
  const base = priority ? 16500 : 12000;
  const distancePrice = distance * (priority ? 1720 : 1450);
  const weightPrice = totals.weight * 1.8;
  const volumePrice = totals.volume * 320;
  const multiDrop = Math.max(0, drops - 1) * 4200;
  return base + distancePrice + weightPrice + volumePrice + multiDrop;
}

export function buildOrder(products: Product[], route: DeliveryPoint[], cart: Cart, priority = false): OrderModel {
  const items = cartToItems(cart);
  const totals = getTotals(products, items);
  const routeDistance = estimateDistance({ x: 0, y: 0 }, route);

  return {
    id: 'ORD-2407',
    customer: 'NordLine Retail',
    status: 'CREATED',
    items,
    points: route,
    priority,
    totalWeight: totals.weight,
    totalVolume: totals.volume,
    goodsSum: totals.goods,
    deliveryCost: calcDeliveryCost(routeDistance, totals, route.length, priority),
    etaMinutes: Math.round(routeDistance * (priority ? 7.6 : 9) + route.length * 11),
    reserved: false,
    assignedTruck: null,
    deliveredStops: 0,
    issue: null,
    audit: ['Заказ создан из корзины заказчика'],
  };
}

export function pickTruck(order: OrderModel, trucks: TruckModel[]): TruckModel | undefined {
  const warehouse = { x: 0, y: 0 };
  return trucks
    .filter((truck) => truck.status === 'FREE' && truck.capacityWeight >= order.totalWeight && truck.capacityVolume >= order.totalVolume)
    .sort((a, b) => dist(a, warehouse) - dist(b, warehouse))[0];
}
