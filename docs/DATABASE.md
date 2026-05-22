# Database Schema Draft

Target DB: PostgreSQL + PostGIS.

## users

- id
- role
- name
- email
- password_hash

## products

- id
- name
- weight
- volume
- quantity

## orders

- id
- customer_id
- status
- total_weight
- total_volume
- delivery_cost
- eta

## order_items

- id
- order_id
- product_id
- quantity

## delivery_points

- id
- order_id
- latitude
- longitude
- sequence
- address

## trucks

- id
- capacity_weight
- capacity_volume
- status
- current_location geography(Point, 4326)

## routes

- id
- truck_id
- order_id
- distance
- eta
- geometry geography(LineString, 4326)

## gps_logs

- id
- truck_id
- latitude
- longitude
- timestamp

## Redis usage

- active GPS position cache
- Socket.IO sessions
- ETA recalculation cache
- short-lived route snapshots
