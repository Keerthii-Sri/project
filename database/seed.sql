-- Demo seed script
insert into organizations (id, name, fuel_price_per_litre, co2_factor_kg_per_litre)
values ('11111111-1111-4111-8111-111111111111', 'Demo Logistics', 95, 2.31)
on conflict do nothing;
