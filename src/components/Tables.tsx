import { AlertTriangle, CheckCircle2, Minus, Package, Plus, Radio, Shield, XCircle } from 'lucide-react';
import { dbTables, permissions, roles, serviceHealth, statuses } from '../data/seed';
import { money } from '../lib/logistics';
import type { DeliveryPoint, OrderStatus, Product, TruckModel } from '../types';
import type { LogisticsSystem } from '../hooks/useLogisticsSystem';
import { Section } from './ui';

export function ProductsTable({ products, cart, changeCart }: Pick<LogisticsSystem, 'products' | 'cart' | 'changeCart'>) {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/10">
      <table className="w-full text-left text-sm">
        <thead className="bg-white/[0.04] text-xs uppercase tracking-[0.18em] text-white/40">
          <tr>
            <th className="p-4">Товар</th>
            <th className="p-4">Вес</th>
            <th className="p-4">Объем</th>
            <th className="p-4">Доступно</th>
            <th className="p-4">Резерв</th>
            <th className="p-4">Корзина</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {products.map((product: Product) => (
            <tr key={product.id} className="text-white/70">
              <td className="p-4">
                <div className="font-medium text-white">{product.name}</div>
                <div className="text-xs text-white/35">{product.category} · {money(product.price)}</div>
              </td>
              <td className="p-4">{product.weight} кг</td>
              <td className="p-4">{product.volume} м³</td>
              <td className="p-4">{product.quantity - product.reserved}</td>
              <td className="p-4">{product.reserved}</td>
              <td className="p-4">
                <div className="flex items-center gap-2">
                  <button onClick={() => changeCart(product.id, -1)} className="rounded-xl border border-white/10 p-1.5 text-white/55 hover:text-white"><Minus className="h-3.5 w-3.5" /></button>
                  <span className="w-6 text-center font-semibold text-white">{cart[product.id] || 0}</span>
                  <button onClick={() => changeCart(product.id, 1)} className="rounded-xl border border-white/10 p-1.5 text-white/55 hover:text-white"><Plus className="h-3.5 w-3.5" /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function RouteList({ route, deliveredStops }: { route: DeliveryPoint[]; deliveredStops: number }) {
  return (
    <div className="space-y-3">
      {route.map((point) => {
        const done = (point.sequence || 0) <= deliveredStops;
        return (
          <div key={point.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold ${done ? 'bg-white text-black' : 'border border-white/15 bg-black text-white'}`}>{done ? '✓' : point.sequence}</div>
            <div className="min-w-0 flex-1">
              <div className="font-medium text-white">{point.address}</div>
              <div className="text-xs text-white/40">{point.lat.toFixed(3)}, {point.lon.toFixed(3)}</div>
            </div>
            <span className="text-xs uppercase tracking-[0.16em] text-white/35">{done ? 'done' : 'queue'}</span>
          </div>
        );
      })}
    </div>
  );
}

export function ProgressRail({ status }: { status: OrderStatus }) {
  const activeIndex = Math.max(0, statuses.indexOf(status));
  return (
    <div className="grid gap-2 md:grid-cols-4 xl:grid-cols-8">
      {statuses.map((entry, index) => (
        <div key={entry} className={`rounded-2xl border p-3 text-[10px] font-bold uppercase tracking-[0.14em] ${index <= activeIndex && status !== 'CANCELLED' ? 'border-white bg-white text-black' : entry === status ? 'border-white/30 bg-black text-white' : 'border-white/10 bg-white/[0.03] text-white/35'}`}>{entry}</div>
      ))}
    </div>
  );
}

export function EventLog({ events }: { events: string[] }) {
  return (
    <div className="space-y-2">
      {events.map((event, index) => (
        <div key={`${event}-${index}`} className="rounded-2xl border border-white/10 bg-black p-3 text-sm leading-6 text-white/52">{event}</div>
      ))}
    </div>
  );
}

export function FleetCards({ trucks }: { trucks: TruckModel[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {trucks.map((truck) => (
        <div key={truck.id} className="rounded-2xl border border-white/10 bg-black p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="font-semibold">{truck.id}</div>
            <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${truck.status === 'FREE' ? 'border-white/15 text-white/55' : truck.status === 'SERVICE' ? 'border-white/10 text-white/30' : 'border-white bg-white text-black'}`}>{truck.status}</span>
          </div>
          <div className="mt-2 text-sm text-white/45">{truck.driver}</div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-white/45">
            <div className="rounded-xl bg-white/[0.04] p-2">{truck.capacityWeight} кг</div>
            <div className="rounded-xl bg-white/[0.04] p-2">{truck.capacityVolume} м³</div>
            <div className="rounded-xl bg-white/[0.04] p-2">fuel {truck.fuel}%</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function OrderDetails({ s }: { s: LogisticsSystem }) {
  const itemRows = s.order.items.map((item) => {
    const product = s.products.find((entry) => entry.id === item.productId);
    return { ...item, product, sum: (product?.price || 0) * item.quantity };
  });

  return (
    <div className="grid gap-7 xl:grid-cols-[1fr_0.8fr]">
      <Section title="Состав заказа" icon={Package} right={<span className="text-xs uppercase tracking-[0.18em] text-white/35">{s.order.id}</span>}>
        <div className="overflow-hidden rounded-3xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/[0.04] text-xs uppercase tracking-[0.18em] text-white/40">
              <tr><th className="p-4">Позиция</th><th className="p-4">Кол-во</th><th className="p-4">Вес</th><th className="p-4">Сумма</th></tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {itemRows.map((row) => (
                <tr key={row.productId} className="text-white/60">
                  <td className="p-4 font-medium text-white">{row.product?.name || 'Unknown product'}</td>
                  <td className="p-4">{row.quantity}</td>
                  <td className="p-4">{Math.round((row.product?.weight || 0) * row.quantity)} кг</td>
                  <td className="p-4">{money(row.sum)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {s.order.issue && <div className="mt-4 rounded-3xl border border-white/15 bg-black p-4 text-sm font-semibold text-white"><AlertTriangle className="mr-2 inline h-4 w-4" />{s.order.issue}</div>}
      </Section>

      <Section title="GPS packet" icon={Radio} right={<span className="text-xs uppercase tracking-[0.18em] text-white/35">1 update / minute</span>}>
        <pre className="overflow-hidden rounded-3xl border border-white/10 bg-black p-5 text-xs leading-6 text-white/58">{JSON.stringify({
          truckId: s.order.assignedTruck || null,
          orderId: s.order.id,
          status: s.order.status,
          gps: s.gpsOnline ? 'ONLINE' : 'SIGNAL_LOST',
          progress: `${s.deliveredPercent}%`,
          deliveredStops: `${s.deliveredStops}/${s.route.length}`,
          etaMinutes: s.remainingEta,
          socket: `tracking/${s.order.assignedTruck || 'pending'}`,
        }, null, 2)}</pre>
      </Section>
    </div>
  );
}

export function PermissionMatrix() {
  return (
    <Section title="RBAC matrix" icon={Shield}>
      <div className="overflow-hidden rounded-3xl border border-white/10">
        <table className="w-full text-left text-xs">
          <thead className="bg-white/[0.04] uppercase tracking-[0.18em] text-white/40">
            <tr><th className="p-3">Функция</th>{roles.map((role) => <th key={role.id} className="p-3">{role.id}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {permissions.map(([feature, ...allowed]) => {
              const allowedRoles = allowed as readonly import('../types').RoleId[];
              return (              <tr key={feature}>
                <td className="p-3 font-semibold text-white/70">{feature}</td>
                {roles.map((role) => (
                  <td key={role.id} className="p-3">{allowedRoles.includes(role.id) ? <CheckCircle2 className="h-4 w-4 text-white" /> : <XCircle className="h-4 w-4 text-white/18" />}</td>                ))}
              </tr>
            );})}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

export function SystemHealth() {
  return (
    <Section title="Инфраструктура" icon={CheckCircle2}>
      <div className="grid gap-3 md:grid-cols-2">
        {serviceHealth.map(([name, role, state]) => (
          <div key={name} className="rounded-2xl border border-white/10 bg-black p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="font-semibold text-white">{name}</div>
              <span className="rounded-full border border-white bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-black">{state}</span>
            </div>
            <div className="mt-1 text-sm text-white/40">{role}</div>
          </div>
        ))}
      </div>
    </Section>
  );
}

export function DbSchema() {
  return (
    <Section title="PostgreSQL / PostGIS schema" icon={Package}>
      <div className="grid gap-3 md:grid-cols-2">
        {dbTables.map(([name, fields]) => (
          <div key={name} className="rounded-2xl border border-white/10 bg-black p-4">
            <div className="font-semibold text-white">{name}</div>
            <div className="mt-2 text-sm leading-6 text-white/42">{fields}</div>
          </div>
        ))}
      </div>
    </Section>
  );
}
