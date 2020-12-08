create or replace view "transaction-sample-data-ext" as
select
  data.id,
  "app-id",
  name as "transaction-name",
  "server-id",
  "start-time",
  duration,
  uri,
  guid,
  "forced?",
  "xray-session-id",
  "synthetics-resource-id",
  html
from "transaction-sample-data" as data
join transactions on transactions.id = data."transaction-id";
