create or replace view "error-data-ext" as
select
  point,
  "app-id",
  name as "transaction-name",
  "server-id",
  message,
  "exception-class-name",
  data
from "error-data" as data
join transactions on transactions.id = data."transaction-id";
