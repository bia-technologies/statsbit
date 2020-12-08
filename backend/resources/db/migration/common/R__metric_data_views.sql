create or replace view "metric-data-ext" as
select
  point,
  "app-id",
  scope,
  name,
  "server-id",
  "call-count",
  "total-call-time",
  "total-exclusive-time",
  "min-call-time",
  "max-call-time",
  "sum-of-squares"
from "metric-data" as data
join keys on keys.id = data."key-id";

-- create or replace view "apdex-hot" as
-- select
--   metric, time,
--   (s + t/2) / (s + t + f) as apdex
-- from (
--   select
--     point as time,
--     apps.name as metric,
--     sum("call-count") as s,
--     sum("total-call-time") as t,
--     sum("total-exclusive-time") as f
--   from apps
--   left join "metric-data-hot-ext" as data on apps.id = data."app-id"
--   where
--     data.scope = ''
--     and data.name = 'Apdex'
--   group by apps.name, time
-- ) as res;
