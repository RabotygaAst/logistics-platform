import { useEffect, useMemo, useState } from 'react';
import { deliveryPointsSeed, productsSeed, trucksSeed } from '../data/seed';
import type { Cart, OrderStatus, Product, RoleId, TruckModel } from '../types';
import { buildOrder, calcDeliveryCost, cartToItems, estimateDistance, getTotals, optimizeRoute, pickTruck } from '../lib/logistics';

const initialCart: Cart = { 1: 2, 2: 8, 4: 3 };

function cloneProducts(): Product[] {
  return productsSeed.map((product) => ({ ...product }));
}

function cloneTrucks(): TruckModel[] {
  return trucksSeed.map((truck) => ({ ...truck }));
}

export function useLogisticsSystem() {
  const [products, setProducts] = useState<Product[]>(cloneProducts);
  const [trucks, setTrucks] = useState<TruckModel[]>(cloneTrucks);
  const [role, setRole] = useState<RoleId>('SUPER_ADMIN');
  const [gpsOnline, setGpsOnline] = useState(true);
  const [priority, setPriority] = useState(false);
  const [cart, setCart] = useState<Cart>(initialCart);
  const route = useMemo(() => optimizeRoute({ x: 0, y: 0 }, deliveryPointsSeed), []);
  const [order, setOrder] = useState(() => buildOrder(cloneProducts(), route, initialCart, false));
  const [progress, setProgress] = useState(0);

  const routeDistance = useMemo(() => estimateDistance({ x: 0, y: 0 }, route), [route]);
  const activeTruck = trucks.find((truck) => truck.id === order.assignedTruck);
  const deliveredPercent = Math.round(progress * 100);
  const remainingEta = Math.max(0, Math.round(order.etaMinutes * (1 - progress)) + (order.issue ? 18 : 0));
  const deliveredStops = Math.min(route.length, Math.floor(progress * route.length + 0.0001));

  function log(text: string) {
    setOrder((current) => ({
      ...current,
      audit: [`${new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} · ${text}`, ...current.audit].slice(0, 9),
    }));
  }

  function setStatus(status: OrderStatus, text: string) {
    setOrder((current) => ({ ...current, status }));
    log(text);
  }

  function changeCart(productId: number, delta: number) {
    setCart((current) => ({ ...current, [productId]: Math.max(0, (current[productId] || 0) + delta) }));
  }

  function rebuildOrder() {
    const nextProducts = cloneProducts();
    setProducts(nextProducts);
    setTrucks(cloneTrucks());
    setProgress(0);
    setGpsOnline(true);
    setOrder(buildOrder(nextProducts, route, cart, priority));
  }

  function reserveStock() {
    if (order.reserved || !order.items.length) return;

    const canReserve = order.items.every((item) => {
      const product = products.find((entry) => entry.id === item.productId);
      return product && product.quantity - product.reserved >= item.quantity;
    });

    if (!canReserve) {
      setOrder((current) => ({ ...current, status: 'CANCELLED', issue: 'Недостаток товара на складе' }));
      log('Резерв отклонен: недостаточно товара');
      return;
    }

    setProducts((current) =>
      current.map((product) => {
        const item = order.items.find((entry) => entry.productId === product.id);
        return item ? { ...product, reserved: product.reserved + item.quantity } : product;
      }),
    );
    setOrder((current) => ({ ...current, reserved: true, status: 'CONFIRMED' }));
    log('Товар зарезервирован, заказ подтвержден');
  }

  function assembleOrder() {
    if (!order.reserved) return;
    setStatus('ASSEMBLING', 'Кладовщик начал сборку заказа');
  }

  function loadAndAssignTruck() {
    if (!order.reserved || order.assignedTruck) return;
    const candidate = pickTruck(order, trucks);
    if (!candidate) {
      setOrder((current) => ({ ...current, issue: 'Нет свободной фуры подходящего объема' }));
      log('Автоподбор фуры не нашел подходящий транспорт');
      return;
    }

    setTrucks((current) => current.map((truck) => (truck.id === candidate.id ? { ...truck, status: 'ACTIVE' } : truck)));
    setOrder((current) => ({ ...current, assignedTruck: candidate.id, status: 'LOADED', issue: null }));
    log(`Фура ${candidate.id} назначена, груз загружен`);
  }

  function startTrip() {
    if (!order.assignedTruck || order.status === 'DELIVERED') return;
    setOrder((current) => ({ ...current, status: 'IN_TRANSIT', issue: null }));
    setProgress((current) => (current > 0 && current < 1 ? current : 0));
    log('Водитель подтвердил начало рейса');
  }

  function confirmDelivery() {
    if (order.status === 'DELIVERED') return;

    setProgress(1);
    setOrder((current) => ({ ...current, status: 'DELIVERED', deliveredStops: route.length, issue: null }));
    setProducts((current) =>
      current.map((product) => {
        const item = order.items.find((entry) => entry.productId === product.id);
        return item ? { ...product, quantity: Math.max(0, product.quantity - item.quantity), reserved: Math.max(0, product.reserved - item.quantity) } : product;
      }),
    );
    setTrucks((current) => current.map((truck) => (truck.id === order.assignedTruck ? { ...truck, status: 'FREE', fuel: Math.max(8, truck.fuel - 12) } : truck)));
    log('Все точки доставлены, заказ закрыт');
  }

  function cancelOrder() {
    if (order.status === 'DELIVERED') return;

    setProducts((current) =>
      current.map((product) => {
        const item = order.items.find((entry) => entry.productId === product.id);
        return item ? { ...product, reserved: Math.max(0, product.reserved - item.quantity) } : product;
      }),
    );
    setOrder((current) => ({ ...current, status: 'CANCELLED', reserved: false, issue: 'Заказ отменен' }));
    setProgress(0);
    log('Резерв освобожден после отмены заказа');
  }

  function simulateShortage() {
    if (order.reserved) return;
    setProducts((current) => current.map((product) => (product.id === 1 ? { ...product, quantity: 1, reserved: 0 } : product)));
    setOrder((current) => ({ ...current, issue: 'Недостаток товара на складе' }));
    log('Смоделирован недостаток товара: доступна только часть груза');
  }

  function acceptPartialSupply() {
    if (order.reserved) return;

    const partialItems = order.items
      .map((item) => {
        const product = products.find((entry) => entry.id === item.productId);
        const available = Math.max(0, (product?.quantity || 0) - (product?.reserved || 0));
        return { ...item, quantity: Math.min(item.quantity, available) };
      })
      .filter((item) => item.quantity > 0);

    const totals = getTotals(products, partialItems);
    setOrder((current) => ({
      ...current,
      items: partialItems,
      totalWeight: totals.weight,
      totalVolume: totals.volume,
      goodsSum: totals.goods,
      deliveryCost: calcDeliveryCost(routeDistance, totals, route.length, current.priority),
      status: 'CREATED',
      issue: 'Согласована частичная поставка',
    }));
    log('Заказ перестроен под частичную поставку');
  }

  function waitRestock() {
    setOrder((current) => ({ ...current, status: 'CREATED', issue: 'Ожидание пополнения склада' }));
    log('Заказ переведен в ожидание пополнения склада');
  }

  function simulateIssue(type: 'GPS_LOST' | 'ROUTE_DEVIATION' | 'TRUCK_BROKEN') {
    const labels = {
      GPS_LOST: 'Потеря GPS-сигнала',
      ROUTE_DEVIATION: 'Отклонение от маршрута',
      TRUCK_BROKEN: 'Поломка фуры',
    } as const;
    if (type === 'GPS_LOST') setGpsOnline(false);
    setOrder((current) => ({ ...current, issue: labels[type] }));
    log(labels[type]);
  }

  function resolveIssue() {
    setGpsOnline(true);
    setOrder((current) => ({ ...current, issue: null, etaMinutes: current.etaMinutes + 7 }));
    log('Инцидент обработан, ETA пересчитан');
  }

  useEffect(() => {
    const moving = order.status === 'IN_TRANSIT' || order.status === 'PARTIALLY_DELIVERED';
    if (!moving || !gpsOnline || order.issue === 'Поломка фуры') return undefined;

    const id = window.setInterval(() => {
      setProgress((current) => {
        const next = Math.min(1, current + 0.0075);
        const stops = Math.min(route.length, Math.floor(next * route.length + 0.0001));
        if (next >= 1) {
          setOrder((value) => ({ ...value, status: 'DELIVERED', deliveredStops: route.length, issue: null }));
        } else if (stops > 0) {
          setOrder((value) => ({ ...value, status: 'PARTIALLY_DELIVERED', deliveredStops: stops }));
        }
        return next;
      });
    }, 560);

    return () => window.clearInterval(id);
  }, [order.status, gpsOnline, order.issue, route.length]);

  return {
    products,
    trucks,
    role,
    setRole,
    cart,
    cartItems: cartToItems(cart),
    changeCart,
    priority,
    setPriority,
    order,
    route,
    routeDistance,
    activeTruck,
    progress,
    deliveredPercent,
    remainingEta,
    deliveredStops,
    gpsOnline,
    setGpsOnline,
    rebuildOrder,
    reserveStock,
    assembleOrder,
    loadAndAssignTruck,
    startTrip,
    confirmDelivery,
    cancelOrder,
    simulateShortage,
    acceptPartialSupply,
    waitRestock,
    simulateIssue,
    resolveIssue,
  };
}

export type LogisticsSystem = ReturnType<typeof useLogisticsSystem>;
