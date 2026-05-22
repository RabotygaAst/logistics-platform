import { Activity, AlertTriangle, Boxes, Gauge, Lock, Navigation, Package, Radio, RefreshCcw, Route, Shield, Truck, Wifi, WifiOff, XCircle } from 'lucide-react';
import { roles } from './data/seed';
import { useLogisticsSystem } from './hooks/useLogisticsSystem';
import { money } from './lib/logistics';
import { ActionButton, GhostButton, Metric, Section, StatusPill } from './components/ui';
import { DbSchema, EventLog, FleetCards, OrderDetails, PermissionMatrix, ProgressRail, SystemHealth } from './components/Tables';
import { RolePanel } from './components/RolePanel';
import { ThreeLogisticsScene } from './components/ThreeLogisticsScene';

export default function App() {
  const s = useLogisticsSystem();

  return (
    <div className="min-h-screen bg-[#030303] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.10),transparent_34%),linear-gradient(to_bottom,rgba(255,255,255,0.04),transparent_34%)]" />
      <main className="relative mx-auto max-w-7xl px-5 py-7 lg:px-8">
        <header className="mb-7 flex flex-col justify-between gap-5 border-b border-white/10 pb-7 lg:flex-row lg:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-3 py-1 text-xs uppercase tracking-[0.22em] text-white/45">
              <Shield className="h-3.5 w-3.5" /> Logistics Control OS · MVP Final
            </div>
            <h1 className="max-w-4xl text-4xl font-semibold tracking-[-0.04em] text-white md:text-6xl">
              Автоматизация логистики и realtime-доставки
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/48">
              Заказчик оформляет multi-drop заказ, склад резервирует товар, система подбирает фуру, водитель ведет рейс, карта обновляет GPS и ETA без перезагрузки.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 md:flex">
            {roles.map((role) => <GhostButton key={role.id} active={s.role === role.id} onClick={() => s.setRole(role.id)}>{role.label}</GhostButton>)}
          </div>
        </header>

        <section className="mb-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Metric icon={Package} label="Заказ" value={s.order.id} hint={`${s.order.customer} · ${s.order.points.length} точки`} />
          <Metric icon={Boxes} label="Груз" value={`${s.order.totalWeight} кг`} hint={`${s.order.totalVolume.toFixed(1)} м³ · резерв ${s.order.reserved ? 'активен' : 'ожидает'}`} />
          <Metric icon={Route} label="Маршрут" value={`${s.routeDistance} км`} hint={`ETA ${s.remainingEta} мин · пройдено ${s.deliveredPercent}%`} />
          <Metric icon={Truck} label="Фура" value={s.order.assignedTruck || 'не выбрана'} hint={s.activeTruck ? s.activeTruck.driver : 'подбор по весу, объему и позиции'} />
        </section>

        <section className="mb-7 rounded-[2rem] border border-white/10 bg-white/[0.025] p-4 shadow-2xl">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 px-1">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <StatusPill status={s.order.status} />
                <span className="inline-flex items-center gap-2 text-sm text-white/40">
                  {s.gpsOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                  Socket.IO tracking/{s.order.assignedTruck || 'pending'}
                </span>
              </div>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight">Three.js realtime monitoring</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <ActionButton dark onClick={() => s.setGpsOnline(!s.gpsOnline)}>GPS: {s.gpsOnline ? 'ONLINE' : 'SIGNAL LOST'}</ActionButton>
              <ActionButton dark onClick={s.rebuildOrder}><RefreshCcw className="mr-2 inline h-4 w-4" />Reset</ActionButton>
            </div>
          </div>
          <ThreeLogisticsScene route={s.route} progress={s.progress} status={s.order.status} gpsOnline={s.gpsOnline} issue={s.order.issue} />
        </section>

        <section className="mb-7">
          <ProgressRail status={s.order.status} />
        </section>

        <section className="mb-7">
          <OrderDetails s={s} />
        </section>

        <section className="grid gap-7 lg:grid-cols-[1fr_0.38fr]">
          <div className="space-y-7">
            <RolePanel s={s} />
            <div className="grid gap-7 xl:grid-cols-2">
              <Section title="Флот" icon={Truck}>
                <FleetCards trucks={s.trucks} />
              </Section>
              <Section title="Расчет стоимости" icon={Gauge}>
                <div className="rounded-3xl border border-white/10 bg-black p-5">
                  <div className="text-xs uppercase tracking-[0.2em] text-white/35">Delivery Cost</div>
                  <div className="mt-2 text-4xl font-semibold">{money(s.order.deliveryCost)}</div>
                  <div className="mt-3 text-sm leading-7 text-white/45">
                    Base Price + Distance Price + Weight Coefficient + Volume Coefficient + Multi-Drop Coefficient{s.order.priority ? ' + Priority' : ''}.
                  </div>
                </div>
              </Section>
            </div>
          </div>

          <aside className="space-y-7">
            <Section title="Безопасность" icon={Lock}>
              <div className="space-y-3 text-sm leading-6 text-white/52">
                <div className="rounded-2xl border border-white/10 bg-black p-3">JWT авторизация</div>
                <div className="rounded-2xl border border-white/10 bg-black p-3">RBAC: admin / warehouse / driver / customer</div>
                <div className="rounded-2xl border border-white/10 bg-black p-3">Валидация входящих данных</div>
                <div className="rounded-2xl border border-white/10 bg-black p-3">Хэширование паролей</div>
              </div>
            </Section>

            <PermissionMatrix />

            <Section title="Realtime события" icon={Radio}>
              <EventLog events={s.order.audit} />
            </Section>

            <Section title="Ошибки" icon={AlertTriangle}>
              <div className="grid gap-2">
                <ActionButton dark onClick={() => s.simulateIssue('ROUTE_DEVIATION')}><Navigation className="mr-2 inline h-4 w-4" />Отклонение</ActionButton>
                <ActionButton dark onClick={() => s.simulateIssue('GPS_LOST')}><WifiOff className="mr-2 inline h-4 w-4" />GPS lost</ActionButton>
                <ActionButton dark onClick={() => s.simulateIssue('TRUCK_BROKEN')}><XCircle className="mr-2 inline h-4 w-4" />Поломка</ActionButton>
                <ActionButton onClick={s.resolveIssue} disabled={!s.order.issue && s.gpsOnline}><Activity className="mr-2 inline h-4 w-4" />Пересчитать ETA</ActionButton>
              </div>
            </Section>
          </aside>
        </section>

        <section className="mt-7 grid gap-7 xl:grid-cols-2">
          <SystemHealth />
          <DbSchema />
        </section>
      </main>
    </div>
  );
}
