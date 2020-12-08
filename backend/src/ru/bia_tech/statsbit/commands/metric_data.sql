-- :name- insert-metric-data :!
insert into "metric-data" (:i*:fields) values :tuple*:tuples
on conflict ("key-id", "server-id", point) do update
set
  "call-count"           = "metric-data"."call-count"           + excluded."call-count",
  "total-call-time"      = "metric-data"."total-call-time"      + excluded."total-call-time",
  "total-exclusive-time" = "metric-data"."total-exclusive-time" + excluded."total-exclusive-time",
  "min-call-time"        = "metric-data"."min-call-time"        + excluded."min-call-time",
  "max-call-time"        = "metric-data"."max-call-time"        + excluded."max-call-time",
  "sum-of-squares"       = "metric-data"."sum-of-squares"       + excluded."sum-of-squares";

-- :name- upsert-keys :? :*
select upsert_key("app-id", scope, name) as id from (values :t*:args) as args("app-id", scope, name);
