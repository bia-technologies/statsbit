create table "metric-data" (
  interval tsrange not null,
  metrics jsonb not null
);

INSERT INTO "metric-data" (
  interval,
  metrics
)
SELECT tsrange(
        to_timestamp(floor( 1555523785 - (i / 300 + 1) * 60 ))::timestamp without time zone,
        to_timestamp(floor( 1555523785 - (i / 300)     * 60 ))::timestamp without time zone
       ),
       jsonb_build_array(
          json_build_object(
            'name',  concat_ws('/', i % 10, floor(random() * 50), floor(random() * 5000)),
            'scope', concat_ws('/', i % 10, floor(random() * 50), floor(random() * 5000)),
            'call-count', 0,
            'total-call-time', 0.0,
            'total-exclusive-time', 0.0
          ),
          json_build_object(
            'name',  concat_ws('/', i % 10, floor(random() * 50), floor(random() * 5000)),
            'scope', concat_ws('/', i % 10, floor(random() * 50), floor(random() * 5000)),
            'call-count', 0,
            'total-call-time', 0.0,
            'total-exclusive-time', 0.0
          )
       )
FROM generate_series(0, 10 * 60 * 24 * 7 * 3 ) AS g (i);

INSERT INTO "metric-data" (
  interval,
  metrics
) values
(
  tsrange('2019-04-02 17:00:00', '2019-04-02 17:01:00'),
  '[{"name":"db/redis/web", "scope":"", "call-count":0, "total-call-time":0.0, "total-exclusive-time":0.0},{"name":"db/postgres/web", "scope":"", "call-count":0, "total-call-time":0.0, "total-exclusive-time":0.0}]'
)
;


-- >create index on "metric-data" using brin (interval);





explain analyze
select interval, metrics.*
from "metric-data"
join lateral jsonb_to_recordset(metrics)
  as metrics(name varchar(255),
             scope varchar(255),
             "call-count" integer,
             "total-call-time" float8,
             "total-exclusive-time" float8) on true
where
interval && tsrange('2019-04-02 17:00:00', '2019-04-02 17:01:00')
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
