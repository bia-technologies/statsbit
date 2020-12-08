create extension ltree;
create extension btree_gist;

create table "metric-data" (
  interval tsrange not null,
  "scope" varchar(255) not null,
  "name"  varchar(255) not null,

  "call-count"           integer not null,
  "total-call-time"      float8  not null,
  "total-exclusive-time" float8  not null,
  "min-call-time"        float8  not null,
  "max-call-time"        float8  not null,
  "sum-of-squares"       float8  not null
) partition by range(lower(interval));

create table "metric-data-2019-13" partition of "metric-data"
for values
from ('2019-03-25 00:00:00')
to   ('2019-04-01 00:00:00');

create table "metric-data-2019-14" partition of "metric-data"
for values
from ('2019-04-01 00:00:00')
to   ('2019-04-08 00:00:00');

create table "metric-data-2019-15" partition of "metric-data"
for values
from ('2019-04-08 00:00:00')
to   ('2019-04-15 00:00:00');

create table "metric-data-2019-16" partition of "metric-data"
for values
from ('2019-04-15 00:00:00')
to   ('2019-04-22 00:00:00');

INSERT INTO "metric-data" (
  interval,
  "scope",
  "name",
  "call-count",
  "total-call-time",
  "total-exclusive-time",
  "min-call-time",
  "max-call-time",
  "sum-of-squares"
)
SELECT tsrange(
        to_timestamp(floor( 1555523785 - (i / 300 + 1) * 60 ))::timestamp without time zone,
        to_timestamp(floor( 1555523785 - (i / 300)     * 60 ))::timestamp without time zone
       ),
       concat_ws('/', floor(random() * 5),
                      floor(random() * 50),
                      floor(random() * 500)),
       concat_ws('/', floor(random() * 5),
                      floor(random() * 50),
                      floor(random() * 500)),
       0, 0, 0, 0, 0, 0
FROM generate_series(0, 300 * 60 * 24 * 7 * 3 ) AS g (i);




-- create index on "metric-data-names"  using gist (path);
-- create index on "metric-data-scopes" using gist (path);
-- create index on "metric-data" using gist ("scope-id", "name-id", interval);

-- самый лучший индекс на маленьком наборе данных
-- create index on "metric-data" using gist (interval);


-- foreign keys !!!



explain analyze
select
  names.*,
  scopes.*
from "metric-data"
join "metric-data-names"  as names on names.id = "name-id"
join "metric-data-scopes" as scopes on scopes.id = "scope-id"
where interval && tsrange('2019-04-16 17:00:00', '2019-04-16 17:04:00');



explain analyze
select
  interval,
  json_object_agg(name, metrics) as metrics
from (

  select
    intervals.interval,
    names.name,
    json_build_object(
      'total-call-time',       sum( factor * "total-call-time" ),
      'total-exclusive-time',  sum( factor * "total-exclusive-time" ),
      'call-count',            sum( factor * "call-count" )
    ) as metrics
  from unnest(
    array[
      tsrange('2019-03-30 17:00:00', '2019-03-30 17:01:00'),
      tsrange('2019-03-30 17:01:00', '2019-03-30 17:02:00'),
      tsrange('2019-03-30 17:02:00', '2019-03-30 17:03:00'),
      tsrange('2019-03-30 17:03:00', '2019-03-30 17:04:00')
    ]
  ) as intervals(interval)

  join "metric-data" as data on data.interval && intervals.interval
  join "metric-data-names"  as names  on data."name-id"  = names.id
  join "metric-data-scopes" as scopes on data."scope-id" = scopes.id,

  lateral (select data.interval * intervals.interval
                  as intersection) intersection,
  lateral (select extract(epoch from (upper(intersection) - lower(intersection)))
                  as intersection_time) intersection_time,
  lateral (select extract(epoch from (upper(data.interval) - lower(data.interval)))
                  as interval_time) interval_time,
  lateral (select intersection_time / interval_time
                  as factor) factor
  where
    and scopes.path ~ '3.*{2}'
    and names.path ? array['2.*{2}', '*{1}.3.*{1}']::lquery[]
  group by intervals.interval, names.name

) as res
group by interval
order by 1;

explain analyze
select *
from "metric-data"
where
  name like any(array['2/%', '%/3/%'])
  and scope like '3/%'
  --and lower(interval) > '2019-04-02 16:00:00' and lower(interval) < '2019-04-02 18:01:00'
  and interval && tsrange('2019-04-02 17:00:00', '2019-04-02 17:01:00')
;
