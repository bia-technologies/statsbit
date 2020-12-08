create extension ltree;
create extension btree_gist;

create table "metric-data-names" (
  id serial primary key,
  name varchar(255) not null,
  path ltree unique not null
);

create table "metric-data-scopes" (
  id serial primary key,
  name varchar(255) not null,
  path ltree unique not null
);

create table "metric-data" (
-- TODO: server or app

  interval tsrange not null,
  "scope-id" integer not null references "metric-data-scopes" on delete restrict,
  "name-id"  integer not null references "metric-data-names"  on delete restrict,

  "call-count"           integer not null,
  "total-call-time"      float8  not null,
  "total-exclusive-time" float8  not null,
  "min-call-time"        float8  not null,
  "max-call-time"        float8  not null,
  "sum-of-squares"       float8  not null
) partition by range(lower(interval));

-- CREATE TABLE "metric-data-default" partition of "metric-data" default;

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

INSERT INTO "metric-data-scopes" (name, path)
SELECT i,
       concat_ws('.', i,
                      floor(random() * 50),
                      floor(random() * 5000))::ltree
FROM generate_series(0, 10000) AS g (i);

INSERT INTO "metric-data-names" (name, path)
SELECT i,
       concat_ws('.', i,
                      floor(random() * 50),
                      floor(random() * 5000))::ltree
FROM generate_series(0, 30000) AS g (i);

INSERT INTO "metric-data" (
  interval,
  "scope-id",
  "name-id",
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
       floor(random() * 10000) + 1,
       floor(random() * 30000) + 1,
       0, 0, 0, 0, 0, 0
FROM generate_series(0, 300 * 60 * 24 * 7 * 3 ) AS g (i);


insert into "metric-data-scopes" (name, path)
values ('', '')
returning id;

insert into "metric-data-names" (name, path)
values ('db/mysql/web', 'db.mysql.web'),
       ('db/pg/web',    'db.pg.web'),
       ('db/redis/web', 'db.redis.web')
returning id;

INSERT INTO "metric-data" (
  interval,
  "scope-id",
  "name-id",
  "call-count",
  "total-call-time",
  "total-exclusive-time",
  "min-call-time",
  "max-call-time",
  "sum-of-squares"
) values
(
tsrange('2019-04-02 17:00:00', '2019-04-02 17:01:00'),
10002,
30004,
0, 0, 0, 0, 0, 0
)
;


create index on "metric-data-scopes" using gist (path);
create index on "metric-data-names"  using gist (path);
create index on "metric-data" using gist (interval);


explain analyze
select *
from "metric-data"
join "metric-data-names"  as names on names.id = "name-id"
join "metric-data-scopes" as scopes on scopes.id = "scope-id"
where
interval && tsrange('2019-04-02 17:00:00', '2019-04-02 17:01:00')
and names.path ? array['db.*{1}.web']::lquery[]
and scopes.path = ''
-- особо не нужное условие для попадания в партицию
-- нужно брать более широкий диапазон, чем заданне интервалы
-- and lower(interval) > '2019-04-02 16:00:00' and lower(interval) < '2019-04-02 18:01:00'
;


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
  from "metric-data" as data
  join
    (values
      (tsrange('2019-04-02 17:00:00', '2019-04-02 17:01:00')),
      (tsrange('2019-04-02 17:01:00', '2019-04-02 17:02:00')),
      (tsrange('2019-04-02 17:02:00', '2019-04-02 17:03:00')))
    as intervals(interval)
    on data.interval && intervals.interval
  join "metric-data-names"  as names  on data."name-id"  = names.id
  join "metric-data-scopes" as scopes on data."scope-id" = scopes.id
  ,
  lateral (select data.interval * intervals.interval
                  as intersection) intersection,
  lateral (select extract(epoch from (upper(intersection) - lower(intersection)))
                  as intersection_time) intersection_time,
  lateral (select extract(epoch from (upper(data.interval) - lower(data.interval)))
                  as interval_time) interval_time,
  lateral (select intersection_time / interval_time
                  as factor) factor
  where
    -- без этой штуки не правильно делает join и не использует индекс.
    data.interval && tsrange('2019-04-02 17:00:00', '2019-04-02 17:03:00')
    and scopes.path = ''
    and names.path ? array['db.*{1}.web']::lquery[]
  group by intervals.interval, names.name

) as res
group by interval
order by 1;









explain analyze

with intervals(interval) as (
  values
    (tsrange('2019-04-02 17:00:00', '2019-04-02 17:01:00')),
    (tsrange('2019-04-02 17:01:00', '2019-04-02 17:02:00')),
    (tsrange('2019-04-02 17:02:00', '2019-04-02 17:03:00'))
), data as (
  select
    interval,
    "scope-id",
    "name-id",
    "total-call-time",
    "total-exclusive-time",
    "call-count"
  from "metric-data"
  where interval && tsrange('2019-04-02 17:00:00', '2019-04-02 17:03:00')
), scopes as (
  select id
  from "metric-data-scopes"
  where path = ''
), names as (
  select id, name
  from "metric-data-names"
  where path ? array['db.*{1}.web']::lquery[]
), res as (
   select
    intervals.interval,
    names.name,
    json_build_object(
      'total-call-time',       sum( factor * "total-call-time" ),
      'total-exclusive-time',  sum( factor * "total-exclusive-time" ),
      'call-count',            sum( factor * "call-count" )
    ) as metrics
  from intervals
  join data   on data.interval && intervals.interval
  join scopes on data."scope-id" = scopes.id
  join names  on data."name-id"  = names.id
  ,
  lateral (select data.interval * intervals.interval
                  as intersection) intersection,
  lateral (select extract(epoch from (upper(intersection) - lower(intersection)))
                  as intersection_time) intersection_time,
  lateral (select extract(epoch from (upper(data.interval) - lower(data.interval)))
                  as interval_time) interval_time,
  lateral (select intersection_time / interval_time
                  as factor) factor
  group by intervals.interval, names.name
)
select
  interval,
  json_object_agg(name, metrics) as metrics
from res
group by interval
order by 1;



explain analyze
  select
    interval,
    "scope-id",
    "name-id",
    "total-call-time",
    "total-exclusive-time",
    "call-count"
  from "metric-data"
  where interval && tsrange('2019-04-02 17:00:00', '2019-04-02 17:03:00')
;
