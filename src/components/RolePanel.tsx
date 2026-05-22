import { AlertTriangle, ClipboardCheck, Gauge, MapPin, Navigation, ShoppingCart, Smartphone, Truck, UserCog, Warehouse, Wifi, WifiOff, XCircle } from 'lucide-react';
import { apiMap } from '../data/seed';
import { money } from '../lib/logistics';
import type { LogisticsSystem } from '../hooks/useLogisticsSystem';
import { ActionButton, Section, StatusPill } from './ui';
import { ProductsTable, RouteList } from './Tables';

export function RolePanel({ s }: { s: LogisticsSystem }) {
  if (s.role === 'CUSTOMER') {
    return (
      <div className="grid gap-7 xl:grid-cols-[1.1fr_0.9fr]">
        <Section title="Каталог и корзина" icon={ShoppingCart} right={<span className="text-xs uppercase tracking-[0.18em] text-white/35">Customer UI</span>}>
          <ProductsTable products={s.products} cart={s.cart} changeCart={s.changeCart} />
          <div className="mt-4 flex flex-wrap gap-3">
            <ActionButton onClick={s.rebuildOrder}>Пересобрать заказ</ActionButton>
            <ActionButton dark onClick={() => s.setPriority(!s.priority)}>{s.priority ? 'Обычный маршрут' : 'Приоритетный маршрут'}</ActionButton>
          </div>
        </Section>
        <Section title="Доставка клиента" icon={MapPin}>
          <RouteList route={s.route} deliveredStops={s.deliveredStops} />
          <div className="mt-4 rounded-3xl border border-white/10 bg-black p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-white/35">Итого</div>
            <div className="mt-2 text-3xl font-semibold">{money(s.order.goodsSum + s.order.deliveryCost)}</div>
            <div className="mt-2 text-sm text-white/45">Товары {money(s.order.goodsSum)} · доставка {money(s.order.deliveryCost)}</div>
          </div>
        </Section>
      </div>
    );
  }

  if (s.role === 'WAREHOUSE') {
    return (
      <div className="grid gap-7 xl:grid-cols-[1fr_0.85fr]">
        <Section title="Склад, остатки, резерв" icon={Warehouse}>
          <ProductsTable products={s.products} cart={s.cart} changeCart={s.changeCart} />
        </Section>
        <Section title="Сборка и отгрузка" icon={ClipboardCheck}>
          <div className="grid gap-3">
            <ActionButton onClick={s.reserveStock} disabled={s.order.reserved || s.order.status === 'CANCELLED'}>Проверить остатки и зарезервировать</ActionButton>
            <ActionButton dark onClick={s.simulateShortage} disabled={s.order.reserved}>Смоделировать недостаток товара</ActionButton>
            <ActionButton dark onClick={s.acceptPartialSupply} disabled={s.order.reserved}>Согласовать частичную поставку</ActionButton>
            <ActionButton dark onClick={s.waitRestock}>Ожидать пополнения склада</ActionButton>
            <ActionButton onClick={s.assembleOrder} disabled={!s.order.reserved || s.order.status === 'DELIVERED'}>Подтвердить сборку</ActionButton>
            <ActionButton onClick={s.loadAndAssignTruck} disabled={!s.order.reserved || Boolean(s.order.assignedTruck)}>Отгрузить и назначить фуру</ActionButton>
          </div>
          <div className="mt-5 rounded-3xl border border-white/10 bg-black p-4 text-sm leading-7 text-white/50">
            Резерв блокирует доступный остаток товара, чтобы один и тот же груз не был продан двум заказчикам.
          </div>
        </Section>
      </div>
    );
  }

  if (s.role === 'DRIVER') {
    return (
      <div className="grid gap-7 xl:grid-cols-[0.85fr_1fr]">
        <Section title="Мобильная панель водителя" icon={Smartphone}>
          <div className="rounded-[2rem] border border-white/10 bg-black p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-white/40">Назначенный рейс</div>
                <div className="mt-1 text-3xl font-semibold">{s.order.assignedTruck || '—'}</div>
              </div>
              {s.gpsOnline ? <Wifi className="h-7 w-7 text-white" /> : <WifiOff className="h-7 w-7 text-white/35" />}
            </div>
            <div className="mt-5 grid gap-3">
              <ActionButton onClick={s.startTrip} disabled={!s.order.assignedTruck || s.order.status === 'DELIVERED'}>Начать / продолжить рейс</ActionButton>
              <ActionButton dark onClick={() => s.simulateIssue('GPS_LOST')}>Сообщить потерю GPS</ActionButton>
              <ActionButton dark onClick={() => s.simulateIssue('TRUCK_BROKEN')}>Сообщить поломку</ActionButton>
              <ActionButton onClick={s.confirmDelivery} disabled={!s.order.assignedTruck}>Подтвердить полную доставку</ActionButton>
            </div>
          </div>
        </Section>
        <Section title="Точки рейса" icon={Navigation}>
          <RouteList route={s.route} deliveredStops={s.deliveredStops} />
        </Section>
      </div>
    );
  }

  return (
    <div className="grid gap-7 xl:grid-cols-[0.95fr_1.05fr]">
      <Section title="Админ-контроль" icon={UserCog} right={<StatusPill status={s.order.status} />}>
        <div className="grid gap-3 md:grid-cols-2">
          <ActionButton onClick={s.reserveStock} disabled={s.order.reserved || s.order.status === 'CANCELLED'}>Резервировать</ActionButton>
          <ActionButton dark onClick={s.simulateShortage} disabled={s.order.reserved}>Недостаток товара</ActionButton>
          <ActionButton dark onClick={s.acceptPartialSupply} disabled={s.order.reserved}>Частичная поставка</ActionButton>
          <ActionButton onClick={s.assembleOrder} disabled={!s.order.reserved}>Сборка</ActionButton>
          <ActionButton onClick={s.loadAndAssignTruck} disabled={!s.order.reserved || Boolean(s.order.assignedTruck)}>Подобрать фуру</ActionButton>
          <ActionButton onClick={s.startTrip} disabled={!s.order.assignedTruck || s.order.status === 'DELIVERED'}>Запустить рейс</ActionButton>
          <ActionButton dark onClick={() => s.simulateIssue('ROUTE_DEVIATION')}>Отклонение от маршрута</ActionButton>
          <ActionButton dark onClick={() => s.simulateIssue('GPS_LOST')}>Потеря GPS</ActionButton>
          <ActionButton onClick={s.resolveIssue} disabled={!s.order.issue && s.gpsOnline}>Решить инцидент</ActionButton>
          <ActionButton dark onClick={s.cancelOrder} disabled={s.order.status === 'DELIVERED'}>Отменить заказ</ActionButton>
        </div>
        {s.order.issue && <div className="mt-4 rounded-3xl border border-white/15 bg-black p-4 text-sm font-semibold text-white"><AlertTriangle className="mr-2 inline h-4 w-4" />{s.order.issue}</div>}
      </Section>

      <Section title="Backend modules / API" icon={Gauge}>
        <div className="grid gap-3">
          {apiMap.map(([name, text]) => (
            <div key={name} className="rounded-2xl border border-white/10 bg-black p-4">
              <div className="text-sm font-semibold text-white">{name}</div>
              <div className="mt-1 text-sm text-white/45">{text}</div>
            </div>
          ))}
          <div className="rounded-2xl border border-white/10 bg-black p-4 text-sm leading-7 text-white/45">
            <XCircle className="mr-2 inline h-4 w-4 text-white/35" />Это frontend MVP с мок-логикой. Реальный backend можно подключить через эти API-контракты.
          </div>
        </div>
      </Section>
    </div>
  );
}
