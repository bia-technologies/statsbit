create table "metric-data" (
  point       timestamptz not null,
  key         int not null,

  -- "server-id" int    not null,

  "call-count"           real not null,
  "total-call-time"      real not null,
  "total-exclusive-time" real not null,

  "min-call-time"        real not null,
  "max-call-time"        real not null,
  "sum-of-squares"       real not null
);



SELECT create_hypertable('metric-data', 'point', 'key', 4);


INSERT INTO "metric-data" (
  point,
  key,

  "call-count",
  "total-call-time",
  "total-exclusive-time",
  "min-call-time",
  "max-call-time",
  "sum-of-squares"
)
SELECT to_timestamp(floor( 1555523785 - (i / 300 + 1) * 60 ))::timestamp,
       floor(random() * 30)::int,

       0, 0, 0, 0, 0, 0
FROM generate_series(0, 60 * 60 * 24 * 7 * 3) AS g (i);




ALTER TABLE "metric-data" SET (timescaledb.compress, timescaledb.compress_orderby = 'point DESC', timescaledb.compress_segmentby = 'key');





create index on "metric-data" (key, point);


34.70 MB в минуту
