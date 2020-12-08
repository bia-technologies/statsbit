create or replace view "analytic-event-data-ext" as
select
  timestamp,
  "app-id",
  name as "transaction-name",
  "server-id",
  error,
  duration
from "analytic-event-data" as data
join transactions on transactions.id = data."transaction-id";
