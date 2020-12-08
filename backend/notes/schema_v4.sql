create table "metric-data" (
-- TODO: server or app

  time timestamp not null,

  "call-count"           real not null,
  "total-call-time"      real not null,
  "total-exclusive-time" real not null,
  "min-call-time"        real not null,
  "max-call-time"        real not null,
  "sum-of-squares"       real not null,

  "scope" varchar(255) not null,
  "name"  varchar(255) not null
);


create index on "metric-data" (time);


INSERT INTO "metric-data" (
  time,
  "scope",
  "name",
  "call-count",
  "total-call-time",
  "total-exclusive-time",
  "min-call-time",
  "max-call-time",
  "sum-of-squares"
)
SELECT
  to_timestamp(floor( 1555523785 - i / 300 * 60 )),
  concat_ws('/', floor(random() * 2),
                 floor(random() * 20),
                 floor(random() * 200)),
  concat_ws('/', floor(random() * 2),
                 floor(random() * 20),
                 floor(random() * 200)),
  0, 0, 0, 0, 0, 0
FROM generate_series(0, 300 * 60 * 24 * 7 * 3 ) AS g (i);






explain analyze
select
  "name"
from "metric-data"
where
time >= '2019-04-10 17:00:00' and time < '2019-04-10 17:02:00'

group by "name";

-- btree: 9.7 ms, 300MB
-- brin:  841.5 ms, примерно 50KB
-- cstore: 13.376 ms, -




explain analyze
select
  "time",
  "name"
from "metric-data"
where
time >= '2019-04-10 17:00:00' and time < '2019-04-10 17:30:00'
and "name" like '1%'
group by "time", "name";
