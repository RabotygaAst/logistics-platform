# API Contract Draft

## Auth

```http
POST /login
POST /register
```

## Products

```http
GET /products
POST /products
PATCH /products/:id
```

## Orders

```http
POST /orders
GET /orders/:id
GET /orders
PATCH /orders/:id/status
POST /orders/:id/reserve
POST /orders/:id/cancel
```

## Fleet

```http
GET /trucks
POST /trucks
POST /trucks/assign
PATCH /trucks/:id/status
```

## Routing

```http
POST /routes/build
GET /routes/:id
POST /routes/:id/recalculate-eta
```

## Tracking

```http
POST /gps/update
GET /tracking/:truckId
GET /tracking/:truckId/history
```

## Socket.IO channels

```text
tracking/:truckId
orders/:orderId
fleet/status
```

## GPS update payload

```json
{
  "truckId": "TR-01",
  "orderId": "ORD-2407",
  "latitude": 55.784,
  "longitude": 37.59,
  "speed": 62,
  "timestamp": "2026-05-21T12:00:00Z"
}
```
