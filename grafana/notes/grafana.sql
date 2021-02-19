-- ++++++++++++++++ Apps ++++++++++++++++
with
data as (
  select
    "app-id",
     name,
     sum("call-count") as "call-count",
     sum("total-call-time") as "total-call-time",
     sum("total-exclusive-time") as "total-exclusive-time"
  from "metric-data-ext"
  where
    $__timeFilter(point)
    and scope = ''
    and name = any(array[
      'Apdex',
      'HttpDispatcher',
      'Errors/allWeb'
    ])
  group by "app-id", name
),
apdex as (
  select
    "app-id",
    (s + t/2) / (s + t + f) as val
  from (
    select
      "app-id",
      "call-count" as s,
      "total-call-time" as t,
      "total-exclusive-time" as f
    from data
    where name = 'Apdex'
  ) as res
),
http_tx as (
  select
    "app-id",
    "total-call-time" as time,
    "call-count" as calls
  from data
  where name = 'HttpDispatcher'
),
errors as (
  select
    "app-id",
    "call-count" as count
  from data
  where name = 'Errors/allWeb'
)
select
  apps.id,
  apps.name,
  apdex.val as apdex,
  http_tx.time / http_tx.calls as resp,
  coalesce( http_tx.calls / extract(epoch from $__timeTo()::timestamp - $__timeFrom()::timestamp) * 60, 0 ) as rpm,
  coalesce( errors.count / http_tx.calls, 0 ) as errors
from apps
left join apdex on apps.id = apdex."app-id"
left join http_tx on apps.id = http_tx."app-id"
left join errors on apps.id = errors."app-id"

-- ++++++++++++++++ Web ++++++++++++++++

-- app name
select name
from apps
where id = $app_id

-- web response
select
  time,
  name as metric,

  sum(val)
  /
  sum(sum("call-count")) filter (where name = 'HttpDispatcher')
                         over (partition by time)
  as val
from (
  select
    $__timeGroup(point, $interval, 0),
    name,
    "call-count",
    case when "total-exclusive-time" = 0
    then "total-call-time"
    else "total-exclusive-time"
    end as val
  from "metric-data-ext"
  where
    $__timeFilter(point)
    and "app-id" = $app_id
    and scope = ''
    and name like any(array[
      'HttpDispatcher',
      'WebTransactionTotalTime',
      'Middleware/all',
      'External/allWeb',
      'Datastore/%/allWeb',
      'WebFrontend/QueueTime'
    ])
) as x
group by time, name


-- historical
select
  $__timeGroup(point, $interval, 0),
  sum("total-call-time") / sum("call-count") as val,
  'current' as metric
from "metric-data-ext"
where
  point between
    $__timeFrom()::timestamptz
    and
    $__timeTo()::timestamptz
  and "app-id" = $app_id
  and scope = ''
  and name = 'HttpDispatcher'
group by time
union all
select
  $__timeGroup(point + interval '1 day', $interval, 0),
  sum("total-call-time") / sum("call-count") as val,
  '-1 day' as metric
from "metric-data-ext"
where
  point between
    $__timeFrom()::timestamptz - interval '1 day'
    and
    $__timeTo()::timestamptz - interval '1 day'
  and "app-id" = $app_id
  and scope = ''
  and name = 'HttpDispatcher'
group by time
union all
select
  $__timeGroup(point + interval '1 week', $interval, 0),
  sum("total-call-time") / sum("call-count") as val,
  '-1 week' as metric
from "metric-data-ext"
where
  point between
    $__timeFrom()::timestamptz - interval '1 week'
    and
    $__timeTo()::timestamptz - interval '1 week'
  and "app-id" = $app_id
  and scope = ''
  and name = 'HttpDispatcher'
group by time
order by time

-- histogram
with
stat as (
  select
    percentile_cont(0.99) within group (order by duration asc)  as max,
    count(*) as total
  from "analytic-event-data-ext"
  where
    $__timeFilter(timestamp)
    and "app-id" = $app_id
    and "transaction-name" like any(array['Controller/%', 'WebTransaction/%'])
),
bucket_nums as (
  select * from generate_series(1, 101) as buckets(i)
),
buckets as (
  select
    width_bucket(duration, 0, max, 100) as bucket,
    count(*) as count
  from "analytic-event-data-ext", stat
  where
    $__timeFilter(timestamp)
    and "app-id" = $app_id
    and "transaction-name" like any(array['Controller/%', 'WebTransaction/%'])
  group by bucket
)

  select
    (i - 1) * max / 100 as start,
    coalesce(count::float, .0) / total::float * 100 as percent,
    coalesce(count, 0) as count
  from stat, bucket_nums
  left join buckets on i = bucket

-- percentiles
select
  $__timeGroup(timestamp, $interval, 0),
  percentile_cont(0.99) within group (order by duration asc) as "0.99",
  percentile_cont(0.95) within group (order by duration asc) as "0.95",
  percentile_cont(0.50) within group (order by duration asc) as median,
  avg(duration) as avg
from "analytic-event-data-ext"
where
  $__timeFilter(timestamp)
  and "app-id" = $app_id
  and "transaction-name" like any(array['Controller/%', 'WebTransaction/%'])
group by time

-- transactions
select
  replace(name, 'WebTransactionTotalTime/', '')  as metric,
  sum("total-call-time") / sum(sum("total-call-time")) over () as percent,
  sum("total-call-time") / sum("call-count") as avg,
  sum("call-count")
    / extract(epoch from $__timeTo()::timestamp - $__timeFrom()::timestamp)
    * 60 as rpm,
  min("min-call-time") as min,
  max("max-call-time") as max
from "metric-data-ext"
where
  $__timeFilter(point)
  and "app-id" = $app_id
  and scope = ''
  and name like 'WebTransactionTotalTime/%'
group by name

-- apdex
select
  time,
  (s + t/2) / (s + t + f) as val,
  'current' as metric
from (
  select
    $__timeGroup(point, $interval, 0),
    sum("call-count") as s,
    sum("total-call-time") as t,
    sum("total-exclusive-time") as f
  from "metric-data-ext"
  where
    point between
      $__timeFrom()::timestamptz
      and
      $__timeTo()::timestamptz
    and "app-id" = $app_id
    and scope = ''
    and name = 'Apdex'
  group by time
) as res
union all
select
  time,
  (s + t/2) / (s + t + f) as val,
  '-1 day' as metric
from (
  select
    $__timeGroup(point + interval '1 day', $interval, 0),
    sum("call-count") as s,
    sum("total-call-time") as t,
    sum("total-exclusive-time") as f
  from "metric-data-ext"
  where
    point between
      $__timeFrom()::timestamptz - interval '1 day'
      and
      $__timeTo()::timestamptz - interval '1 day'
    and "app-id" = $app_id
    and scope = ''
    and name = 'Apdex'
  group by time
) as res
union all
select
  time,
  (s + t/2) / (s + t + f) as val,
  '-1 week' as metric
from (
  select
    $__timeGroup(point + interval '1 week', $interval, 0),
    sum("call-count") as s,
    sum("total-call-time") as t,
    sum("total-exclusive-time") as f
  from "metric-data-ext"
  where
    point between
      $__timeFrom()::timestamptz - interval '1 week'
      and
      $__timeTo()::timestamptz - interval '1 week'
    and "app-id" = $app_id
    and scope = ''
    and name = 'Apdex'
  group by time
) as res
order by time

/* EndUser/Apdex нет в метриках */

-- throughput
select
  $__timeGroup(point, $interval, 0),
  sum("call-count") / extract(epoch from interval '$interval') * 60 as val,
  'current' as metric
from "metric-data-ext"
where
  point between
    $__timeFrom()::timestamptz
    and
    $__timeTo()::timestamptz
  and "app-id" = $app_id
  and scope = ''
  and name = 'HttpDispatcher'
group by time
union all
select
  $__timeGroup(point + interval '1 day', $interval, 0),
  sum("call-count") / extract(epoch from interval '$interval') * 60 as val,
  '-1 day' as metric
from "metric-data-ext"
where
  point between
    $__timeFrom()::timestamptz - interval '1 day'
    and
    $__timeTo()::timestamptz - interval '1 day'
  and "app-id" = $app_id
  and scope = ''
  and name = 'HttpDispatcher'
group by time
union all
select
  $__timeGroup(point + interval '1 week', $interval, 0),
  sum("call-count") / extract(epoch from interval '$interval') * 60 as val,
  '-1 week' as metric
from "metric-data-ext"
where
  point between
    $__timeFrom()::timestamptz - interval '1 week'
    and
    $__timeTo()::timestamptz - interval '1 week'
  and "app-id" = $app_id
  and scope = ''
  and name = 'HttpDispatcher'
group by time
order by time

-- errors
select *
from (
  select
    time,
    name as metric,
    sum("call-count")
    / sum(sum("call-count")) filter (where name = 'HttpDispatcher')
                             over (partition by time)
    -- здесь не нужно делать поправку на $interval, т.к. это безразмерные проценты
    as val
  from (
    select
      $__timeGroup(point, $interval, 0),
      name,
      "call-count"
    from "metric-data-ext"
    where
      $__timeFilter(point)
      and "app-id" = $app_id
      and scope = ''
      and name in ('HttpDispatcher', 'Errors/allWeb')
  ) as x
  group by time, name
) as res
where metric != 'HttpDispatcher'
order by time

-- by server
with
data as (
  select
    "server-id",
    name,
    sum("call-count") as "call-count",
    sum("total-call-time") as "total-call-time",
    sum("total-exclusive-time") as "total-exclusive-time"
  from "metric-data-ext"
  where
    $__timeFilter(point)
    and "app-id" = $app_id
    and scope = ''
    and name = any(array[
      'Apdex',
      'HttpDispatcher',
      'Errors/allWeb',
      'CPU/User Time',
      'Memory/Physical'
    ])
  group by "server-id", name
),
apdex as (
  select
    "server-id",
    (s + t/2) / (s + t + f) as val
  from (
    select
      "server-id",
      "call-count" as s,
      "total-call-time" as t,
      "total-exclusive-time" as f
    from data
    where name = 'Apdex'
  ) as res
),
http_tx as (
  select
    "server-id",
    "total-call-time" as time,
    "call-count" as calls
  from data
  where name = 'HttpDispatcher'
),
errors as (
  select
    "server-id",
    "call-count" as count
  from data
  where name = 'Errors/allWeb'
),
/* проверить бы что оно показывает то, что нужно */
cpu as (
  select
    "server-id",
     -- total-call-time - это кол-во секунд, потраченной в юзерспейсе,
     -- т.к. у нас данные за минуту, то чтобы получить проценты нужно делить на 60
    "total-call-time" / 60 / extract(epoch from $__timeTo()::timestamp - $__timeFrom()::timestamp) * 60 as val
  from data
  where name = 'CPU/User Time'
),
memory as (
  select
    "server-id",
    "total-call-time" / extract(epoch from $__timeTo()::timestamp - $__timeFrom()::timestamp) * 60 as val
  from data
  where name = 'Memory/Physical'
)
select
  servers.host,
  apdex.val as apdex,
  http_tx.time / http_tx.calls as resp,
  http_tx.calls / extract(epoch from $__timeTo()::timestamp - $__timeFrom()::timestamp) * 60 as rpm,
  errors.count / http_tx.calls as errors,
  cpu.val as cpu,
  memory.val as memory
from servers
left join apdex on servers.id = apdex."server-id"
join http_tx on servers.id = http_tx."server-id"
left join errors on servers.id = errors."server-id"
left join cpu on servers.id = cpu."server-id"
left join memory on servers.id = memory."server-id"
where
  servers."app-id" = $app_id

-- top 5 transactions by wall clock time
select
  time,
  replace(name, 'WebTransactionTotalTime/Controller/', '')  as metric,
  val
from (
  select
    time,
    name,
    val,
    dense_rank() over (order by total desc) as rank
  from (
    select
      $__timeGroup(point, $interval, 0),
      name,
      sum("total-call-time")
        / extract(epoch from interval '$interval')
      as val,
      sum(sum("total-call-time")) over (partition by name) as total
    from "metric-data-ext"
    where
      $__timeFilter(point)
      and "app-id" = $app_id
      and scope = ''
      and name like 'WebTransactionTotalTime/Controller/%'
    group by time, name
  ) as x
) as res
where rank <= 5
order by time

-- resp by server
select
  $__timeGroup(point, $interval, 0),
  sum("total-call-time") / sum("call-count") as val,
  host as metric
from "metric-data-ext" as data
join servers on servers.id = data."server-id"
where
  $__timeFilter(point)
  and data."app-id" = $app_id
  and scope = ''
  and name = 'HttpDispatcher'
group by time, host
order by time

-- throughput by server
select
  $__timeGroup(point, $interval, 0),
  sum("call-count") / extract(epoch from interval '$interval') * 60 as val,
  host as metric
from "metric-data-ext" as data
join servers on servers.id = data."server-id"
where
  $__timeFilter(point)
  and data."app-id" = $app_id
  and scope = ''
  and name = 'HttpDispatcher'
group by time, host
order by time

-- scaliability
select
  $__timeGroup(point, $interval, 0),
  sum("call-count") / extract(epoch from interval '$interval') * 60 as rpm,
  sum("total-call-time") / sum("call-count") as resp,
  extract(hour from min(point) at time zone 'MSK') as hour
from "metric-data-ext"
where
  $__timeFilter(point)
  and "app-id" = $app_id
  and scope = ''
  and name = 'HttpDispatcher'
group by time

-- ++++++++++++++++ Background Transactions ++++++++++++++++

-- response
select
  time,
  name as metric,

  sum(val)
  /
  sum(sum("call-count")) filter (where name = 'OtherTransaction/all')
                         over (partition by time)
  as val
from (
  select
    $__timeGroup(point, $interval, 0),
    name,
    "call-count",
    case when "total-exclusive-time" = 0
    then "total-call-time"
    else "total-exclusive-time"
    end as val
  from "metric-data-ext"
  where
    $__timeFilter(point)
    and "app-id" = $app_id
    and scope = ''
    and name like any(array[
      'OtherTransaction/all',
      'External/allOther',
      'Datastore/%/allOther',
      'GC/cumulative'
    ])
) as x
group by time, name

-- histogram
with
stat as (
  select
    percentile_cont(0.99) within group (order by duration asc) as max,
    count(*) as total
  from "analytic-event-data-ext"
  where
    $__timeFilter(timestamp)
    and "app-id" = $app_id
    and "transaction-name" like any(array['OtherTransaction/%'])
),
bucket_nums as (
  select * from generate_series(1, 101) as buckets(i)
),
buckets as (
  select
    width_bucket(duration, 0, max, 100) as bucket,
    count(*) as count
  from "analytic-event-data-ext", stat
  where
    $__timeFilter(timestamp)
    and "app-id" = $app_id
    and "transaction-name" like any(array['OtherTransaction/%'])
  group by bucket
)
  select
    (i - 1) * max / 100 as start,
    coalesce(count::float, .0) / total::float * 100 as percent,
    coalesce(count, 0) as count
  from stat, bucket_nums
  left join buckets on i = bucket

-- percentiles
select
  $__timeGroup(timestamp, $interval, 0),
  percentile_cont(0.99) within group (order by duration asc) as "0.99",
  percentile_cont(0.95) within group (order by duration asc) as "0.95",
  percentile_cont(0.50) within group (order by duration asc) as median,
  avg(duration) as avg
from "analytic-event-data-ext"
where
  $__timeFilter(timestamp)
  and "app-id" = $app_id
  and "transaction-name" like any(array['OtherTransaction/%'])
group by time

-- historical
select
  $__timeGroup(point, $interval, 0),
  sum("total-call-time") / sum("call-count") as val,
  'current' as metric
from "metric-data-ext"
where
  point between
    $__timeFrom()::timestamptz
    and
    $__timeTo()::timestamptz
  and "app-id" = $app_id
  and scope = ''
  and name = 'OtherTransaction/all'
group by time
union all
select
  $__timeGroup(point + interval '1 day', $interval, 0),
  sum("total-call-time") / sum("call-count") as val,
  '-1 day' as metric
from "metric-data-ext"
where
  point between
    $__timeFrom()::timestamptz - interval '1 day'
    and
    $__timeTo()::timestamptz - interval '1 day'
  and "app-id" = $app_id
  and scope = ''
  and name = 'OtherTransaction/all'
group by time
union all
select
  $__timeGroup(point + interval '1 week', $interval, 0),
  sum("total-call-time") / sum("call-count") as val,
  '-1 week' as metric
from "metric-data-ext"
where
  point between
    $__timeFrom()::timestamptz - interval '1 week'
    and
    $__timeTo()::timestamptz - interval '1 week'
  and "app-id" = $app_id
  and scope = ''
  and name = 'OtherTransaction/all'
group by time
order by time

-- table
select
  replace(name, 'OtherTransaction/', '')  as metric,
  sum("total-call-time") / sum(sum("total-call-time")) over () as percent,
  sum("total-call-time") / sum("call-count") as avg,
  sum("call-count")
    * 60
    / extract(epoch from $__timeTo()::timestamp - $__timeFrom()::timestamp)
    as rpm,
  min("min-call-time") as min,
  max("max-call-time") as max
from "metric-data-ext"
where
  $__timeFilter(point)
  and "app-id" = $app_id
  and scope = ''
  and name like 'OtherTransaction/%'
  and name not like 'OtherTransaction%/all'
group by name

-- throughput
select
  $__timeGroup(point, $interval, 0),
  sum("call-count") / extract(epoch from interval '$interval') * 60 as val,
  'current' as metric
from "metric-data-ext"
where
  point between
    $__timeFrom()::timestamptz
    and
    $__timeTo()::timestamptz
  and "app-id" = $app_id
  and scope = ''
  and name = 'OtherTransaction/all'
group by time
union all
select
  $__timeGroup(point + interval '1 day', $interval, 0),
  sum("call-count") / extract(epoch from interval '$interval') * 60 as val,
  '-1 day' as metric
from "metric-data-ext"
where
  point between
    $__timeFrom()::timestamptz - interval '1 day'
    and
    $__timeTo()::timestamptz - interval '1 day'
  and "app-id" = $app_id
  and scope = ''
  and name = 'OtherTransaction/all'
group by time
union all
select
  $__timeGroup(point + interval '1 week', $interval, 0),
  sum("call-count") / extract(epoch from interval '$interval') * 60 as val,
  '-1 week' as metric
from "metric-data-ext"
where
  point between
    $__timeFrom()::timestamptz - interval '1 week'
    and
    $__timeTo()::timestamptz - interval '1 week'
  and "app-id" = $app_id
  and scope = ''
  and name = 'OtherTransaction/all'
group by time
order by time

-- errors
select *
from (
  select
    time,
    name as metric,
    sum("call-count")
    / sum(sum("call-count")) filter (where name = 'OtherTransaction/all')
                             over (partition by time)
    -- здесь не нужно делать поправку на $interval, т.к. это безразмерные проценты
    as val
  from (
    select
      $__timeGroup(point, $interval, 0),
      name,
      "call-count"
    from "metric-data-ext"
    where
      $__timeFilter(point)
      and "app-id" = $app_id
      and scope = ''
      and name in ('OtherTransaction/all', 'Errors/allOther')
  ) as x
  group by time, name
) as res
where metric != 'OtherTransaction/all'
order by time

-- by server
with
data as (
  select
    "server-id",
    name,
    sum("call-count") as "call-count",
    sum("total-call-time") as "total-call-time",
    sum("total-exclusive-time") as "total-exclusive-time"
  from "metric-data-ext"
  where
    $__timeFilter(point)
    and "app-id" = $app_id
    and scope = ''
    and name = any(array[
      'OtherTransaction/all',
      'Errors/allOther',
      'CPU/User Time',
      'Memory/Physical'
    ])
  group by "server-id", name
),
other_tx as (
  select
    "server-id",
    "total-call-time" as time,
    "call-count" as calls
  from data
  where name = 'OtherTransaction/all'
),
errors as (
  select
    "server-id",
    "call-count" as count
  from data
  where name = 'Errors/allOther'
),
cpu as (
  select
    "server-id",
    "total-call-time" / 60 / extract(epoch from $__timeTo()::timestamp - $__timeFrom()::timestamp) * 60 as val
  from data
  where name = 'CPU/User Time'
),
memory as (
  select
    "server-id",
    "total-call-time" / extract(epoch from $__timeTo()::timestamp - $__timeFrom()::timestamp) * 60 as val
  from data
  where name = 'Memory/Physical'
)
select
  servers.host,
  other_tx.time / other_tx.calls as resp,
  other_tx.calls / extract(epoch from $__timeTo()::timestamp - $__timeFrom()::timestamp) * 60 as rpm,
  errors.count / other_tx.calls as errors,
  cpu.val as cpu,
  memory.val as memory
from servers
join other_tx on servers.id = other_tx."server-id"
left join errors on servers.id = errors."server-id"
left join cpu on servers.id = cpu."server-id"
left join memory on servers.id = memory."server-id"
where
  servers."app-id" = $app_id

-- ++++++++++++++++ WebTransactions ++++++++++++++++

-- breakdown
select
  time, metric,
  sum(val) as val
from (
  select
    time,

    case
      when dense_rank() over (order by total desc) > 6
      then 'Other'
      else name
    end as metric,

    "total-exclusive-time"
      /
      sum(nullif("call-count", 0))
      filter (where name = 'WebTransactionTotalTime/$scope')
      over (partition by time)
    as val
  from (
    select
      $__timeGroup(point, $interval, 0),
      name,
      sum("total-exclusive-time") as "total-exclusive-time",
      sum(sum("total-exclusive-time")) over (partition by name) as total,
      sum("call-count") as "call-count"
    from "metric-data-ext"
    where
      $__timeFilter(point)
      and "app-id" = $app_id
      and
      (
        scope = '$scope'
        or scope = 'WebTransaction/$scope' -- python
        or
        (scope = '' and name = 'WebTransactionTotalTime/$scope')
      )
    group by time, name
  ) as x
) as res
-- for golang
-- where metric != 'WebTransactionTotalTime/$scope'
group by time, metric
order by time

-- histogram
with
stat as (
  select
    percentile_cont(0.99) within group (order by duration asc) as max,
    count(*) as total
  from "analytic-event-data-ext"
  where
    $__timeFilter(timestamp)
    and "app-id" = $app_id
    and "transaction-name" = any(array['$scope', 'WebTransaction/$scope'])
),
bucket_nums as (
  select * from generate_series(1, 101) as buckets(i)
),
buckets as (
  select
    width_bucket(duration, 0, max, 100) as bucket,
    count(*) as count
  from "analytic-event-data-ext", stat
  where
    $__timeFilter(timestamp)
    and "app-id" = $app_id
    and "transaction-name" = any(array['$scope', 'WebTransaction/$scope'])
  group by bucket
)
  select
    (i - 1) * max / 100 as start,
    coalesce(count::float, .0) / total::float * 100 as percent,
    coalesce(count, 0) as count
  from stat, bucket_nums
  left join buckets on i = bucket

-- percentiles
select
  $__timeGroup(timestamp, $interval, 0),
  percentile_cont(0.99) within group (order by duration asc) as "0.99",
  percentile_cont(0.95) within group (order by duration asc) as "0.95",
  percentile_cont(0.50) within group (order by duration asc) as median,
  avg(duration) as avg
from "analytic-event-data-ext"
where
  $__timeFilter(timestamp)
  and "app-id" = $app_id
  and "transaction-name" = any(array['$scope', 'WebTransaction/$scope'])
group by time

-- historical
select
  $__timeGroup(point, $interval, 0),
  sum("total-exclusive-time") / sum("call-count") as val,
  'current' as metric
from "metric-data-ext"
where
  point between
    $__timeFrom()::timestamptz
    and
    $__timeTo()::timestamptz
  and "app-id" = $app_id
  and scope = ''
  and name = 'WebTransactionTotalTime/$scope'
group by time, name
union all
select
  $__timeGroup(point + interval '1 day', $interval, 0),
  sum("total-exclusive-time") / sum("call-count") as val,
  '-1 day' as metric
from "metric-data-ext"
where
  point between
    $__timeFrom()::timestamptz - interval '1 day'
    and
    $__timeTo()::timestamptz - interval '1 day'
  and "app-id" = $app_id
  and scope = ''
  and name = 'WebTransactionTotalTime/$scope'
group by time, name
union all
select
  $__timeGroup(point + interval '1 week', $interval, 0),
  sum("total-exclusive-time") / sum("call-count") as val,
  '-1 week' as metric
from "metric-data-ext"
where
  point between
    $__timeFrom()::timestamptz - interval '1 week'
    and
    $__timeTo()::timestamptz - interval '1 week'
  and "app-id" = $app_id
  and scope = ''
  and name = 'WebTransactionTotalTime/$scope'
group by time, name

-- throughput
select
  $__timeGroup(point, $interval, 0),
  sum("call-count") / extract(epoch from interval '$interval') * 60 as val,
  'current' as metric
from "metric-data-ext"
where
  point between
    $__timeFrom()::timestamptz
    and
    $__timeTo()::timestamptz
  and "app-id" = $app_id
  and scope = ''
  and name = 'WebTransactionTotalTime/$scope'
group by time
union all
select
  $__timeGroup(point + interval '1 day', $interval, 0),
  sum("call-count") / extract(epoch from interval '$interval') * 60 as val,
  '-1 day' as metric
from "metric-data-ext"
where
  point between
    $__timeFrom()::timestamptz - interval '1 day'
    and
    $__timeTo()::timestamptz - interval '1 day'
  and "app-id" = $app_id
  and scope = ''
  and name = 'WebTransactionTotalTime/$scope'
group by time
union all
select
  $__timeGroup(point + interval '1 week', $interval, 0),
  sum("call-count") / extract(epoch from interval '$interval') * 60 as val,
  '-1 week' as metric
from "metric-data-ext"
where
  point between
    $__timeFrom()::timestamptz - interval '1 week'
    and
    $__timeTo()::timestamptz - interval '1 week'
  and "app-id" = $app_id
  and scope = ''
  and name = 'WebTransactionTotalTime/$scope'
group by time

-- breakdown table
select
  name,
  "total-exclusive-time"
    / sum("total-exclusive-time") over ()
  as percent,
  "call-count" / total as avg_calls,
  "total-exclusive-time" / total as avg_time
from (
  select
    name,
    sum("total-exclusive-time") as "total-exclusive-time",
    sum("call-count") as "call-count",
    sum(sum("call-count"))
    filter (where name = 'WebTransactionTotalTime/$scope')
    over () as total
  from "metric-data-ext"
  where
    $__timeFilter(point)
    and "app-id" = $app_id
    and
    (
      scope = '$scope'
      or scope = 'WebTransaction/$scope' -- python
      or
      (scope = '' and name = 'WebTransactionTotalTime/$scope')
    )
  group by name
) as x
where name != 'WebTransactionTotalTime/$scope'

-- traces
select data.id, "start-time", duration, uri, host
from "transaction-sample-data-ext" as data
join servers on servers.id = data."server-id"
where
  $__timeFilter("start-time")
  and data."app-id" = $app_id
  and data."transaction-name" = any(array['$scope', 'WebTransaction/$scope'])
order by duration desc

-- ++++++++++++++++ BackgroundTransactions ++++++++++++++++

-- breakdown
select
  time, metric,
  sum(val) as val
from (
  select
    time,

    case
      when dense_rank() over (order by total desc) > 5
      then 'Other'
      else name
    end as metric,

    "total-exclusive-time"
      /
      sum("call-count")
      filter (where name = 'OtherTransaction/$scope')
      over (partition by time)
    as val
  from (
    select
      $__timeGroup(point, $interval, 0),
      name,
      sum("total-exclusive-time") as "total-exclusive-time",
      sum(sum("total-exclusive-time")) over (partition by name) as total,
      sum("call-count") as "call-count"
    from "metric-data-ext"
    where
      $__timeFilter(point)
      and "app-id" = $app_id
      and
      (
        scope = 'OtherTransaction/$scope'
        or
        (scope = '' and name = 'OtherTransaction/$scope')
      )
    group by time, name
  ) as x
) as res
where metric != 'OtherTransaction/$scope'
group by time, metric

-- histogram
with
stat as (
  select
    percentile_cont(0.99) within group (order by duration asc) as max,
    count(*) as total
  from "analytic-event-data-ext"
  where
    $__timeFilter(timestamp)
    and "app-id" = $app_id
    and "transaction-name" = any(array['OtherTransaction/$scope'])
),
bucket_nums as (
  select * from generate_series(1, 101) as buckets(i)
),
buckets as (
  select
    width_bucket(duration, 0, max, 100) as bucket,
    count(*) as count
  from "analytic-event-data-ext", stat
  where
    $__timeFilter(timestamp)
    and "app-id" = $app_id
    and "transaction-name" = any(array['OtherTransaction/$scope'])
  group by bucket
)
  select
    (i - 1) * max / 100 as start,
    coalesce(count::float, .0) / total::float * 100 as percent,
    coalesce(count, 0) as count
  from stat, bucket_nums
  left join buckets on i = bucket

-- percentiles
select
  $__timeGroup(timestamp, $interval, 0),
  percentile_cont(0.99) within group (order by duration asc) as "0.99",
  percentile_cont(0.95) within group (order by duration asc) as "0.95",
  percentile_cont(0.50) within group (order by duration asc) as median,
  avg(duration) as avg
from "analytic-event-data-ext"
where
  $__timeFilter(timestamp)
  and "app-id" = $app_id
  and "transaction-name" = any(array['OtherTransaction/$scope'])
group by time

-- historical
select
  $__timeGroup(point, $interval, 0),
  sum("total-call-time") / sum("call-count") as val,
  'current' as metric
from "metric-data-ext"
where
  point between
    $__timeFrom()::timestamptz
    and
    $__timeTo()::timestamptz
  and "app-id" = $app_id
  and scope = ''
  and name = 'OtherTransaction/$scope'
group by time
union all
select
  $__timeGroup(point + interval '1 day', $interval, 0),
  sum("total-call-time") / sum("call-count") as val,
  '-1 day' as metric
from "metric-data-ext"
where
  point between
    $__timeFrom()::timestamptz - interval '1 day'
    and
    $__timeTo()::timestamptz - interval '1 day'
  and "app-id" = $app_id
  and scope = ''
  and name = 'OtherTransaction/$scope'
group by time
union all
select
  $__timeGroup(point + interval '1 week', $interval, 0),
  sum("total-call-time") / sum("call-count") as val,
  '-1 week' as metric
from "metric-data-ext"
where
  point between
    $__timeFrom()::timestamptz - interval '1 week'
    and
    $__timeTo()::timestamptz - interval '1 week'
  and "app-id" = $app_id
  and scope = ''
  and name = 'OtherTransaction/$scope'
group by time




-- throughput
select
  $__timeGroup(point, $interval, 0),
  sum("call-count") / extract(epoch from interval '$interval') * 60 as val,
  'current' as metric
from "metric-data-ext"
where
  point between
    $__timeFrom()::timestamptz
    and
    $__timeTo()::timestamptz
  and "app-id" = $app_id
  and scope = ''
  and name = 'OtherTransaction/$scope'
group by time
union all
select
  $__timeGroup(point +  interval '1 day', $interval, 0),
  sum("call-count") / extract(epoch from interval '$interval') * 60 as val,
  '-1 day' as metric
from "metric-data-ext"
where
  point between
    $__timeFrom()::timestamptz - interval '1 day'
    and
    $__timeTo()::timestamptz - interval '1 day'
  and "app-id" = $app_id
  and scope = ''
  and name = 'OtherTransaction/$scope'
group by time
union all
select
  $__timeGroup(point + interval '1 week', $interval, 0),
  sum("call-count") / extract(epoch from interval '$interval') * 60 as val,
  '-1 week' as metric
from "metric-data-ext"
where
  point between
    $__timeFrom()::timestamptz - interval '1 week'
    and
    $__timeTo()::timestamptz - interval '1 week'
  and "app-id" = $app_id
  and scope = ''
  and name = 'OtherTransaction/$scope'
group by time



-- breakdown table
select
  name,
  "total-exclusive-time"
    / sum("total-exclusive-time") over ()
  as percent,
  "call-count" / total as avg_calls,
  "total-exclusive-time" / total as avg_time
from (
  select
    name,
    sum("total-exclusive-time") as "total-exclusive-time",
    sum("call-count") as "call-count",
    sum(sum("call-count"))
    filter (where name = 'OtherTransaction/$scope')
    over () as total
  from "metric-data-ext"
  where
    $__timeFilter(point)
    and "app-id" = $app_id
    and
    (
      scope = 'OtherTransaction/$scope'
      or
      (scope = '' and name = 'OtherTransaction/$scope')
    )
  group by name
) as x
where name != 'OtherTransaction/$scope'

-- Transaction traces
select data.id, "start-time", duration, host
from "transaction-sample-data-ext" as data
join servers on servers.id = data."server-id"
where
  $__timeFilter("start-time")
  and data."app-id" = $app_id
  and data."transaction-name" = 'OtherTransaction/$scope'
order by duration desc

-- ++++++++++++++++ Go runtime ++++++++++++++++

-- Goroutines
select
  $__timeGroup(point, $interval, 0),
  sum("total-call-time") / sum("call-count") as val
from "metric-data-ext"
where
  $__timeFilter(point)
  and "app-id" = $app_id
  and scope = ''
  and name = 'Go/Runtime/Goroutines'
group by time

-- GC pause time
select
  $__timeGroup(point, $interval, 0),
  sum("total-call-time") / sum("call-count") as avg_mem,
  max("max-call-time") as max_mem
from "metric-data-ext"
where
  $__timeFilter(point)
  and "app-id" = $app_id
  and scope = ''
  and name = 'GC/System/Pauses'
group by time

-- GC pause frequency
select
  $__timeGroup(point, $interval, 0),
  name as metric,
  sum("call-count") / extract(epoch from interval '$interval') * 60 as val
from "metric-data-ext"
where
  $__timeFilter(point)
  and "app-id" = $app_id
  and scope = ''
  and name = 'GC/System/Pauses'
group by time, name

-- GC pauses
select
  $__timeGroup(point, $interval, 0),
  sum("total-call-time") / extract(epoch from interval '$interval') * 60 as val
from "metric-data-ext"
where
  $__timeFilter(point)
  and "app-id" = $app_id
  and scope = ''
  and name = 'GC/System/Pause Fraction'
group by time

-- ++++++++++++++++ Ruby VMs ++++++++++++++++

-- Time spent in GC
select
  $__timeGroup(point, $interval, 0),
  -- gc_time / wall_clock_time
  sum("total-exclusive-time") / sum("sum-of-squares") as val
from "metric-data-ext"
where
  $__timeFilter(point)
  and "app-id" = $app_id
  and scope = ''
  and name = 'RubyVM/GC/runs'
group by time

-- GC frequency
select
  $__timeGroup(point, $interval, 0),
  name as metric,
  -- gc_time / wall_clock_time
  sum("total-call-time") / sum("call-count") * 100 as val
from "metric-data-ext"
where
  $__timeFilter(point)
  and "app-id" = $app_id
  and scope = ''
  and name = any(array[
    'RubyVM/GC/major_gc_count',
    'RubyVM/GC/minor_gc_count'
  ])
group by time, name

-- Memory usage
select
  $__timeGroup(point, $interval, 0),
  sum("total-call-time") / sum("call-count") as avg_mem,
  min("min-call-time") as min_mem,
  max("max-call-time") as max_mem
from "metric-data-ext"
where
  $__timeFilter(point)
  and "app-id" = $app_id
  and scope = ''
  and name = 'Memory/Physical'
group by time


--- Ruby heap size
select
  $__timeGroup(point, $interval, 0),
  name as metric,
  sum("call-count") / sum("sum-of-squares") as val
from "metric-data-ext"
where
  $__timeFilter(point)
  and "app-id" = $app_id
  and scope = ''
  and name in ('RubyVM/GC/heap_free', 'RubyVM/GC/heap_live')
group by time, name


-- GC frequency
/* я вообще не понимаю что на этом графике рисуется
  и как там отображатся minor/major, т.к. их значения не бьются с шкалой */

-- Object allocations
select
  $__timeGroup(point, $interval, 0),
  sum("total-call-time") / sum("call-count") as val
from "metric-data-ext"
where
  $__timeFilter(point)
  and "app-id" = $app_id
  and scope = ''
  and name = 'RubyVM/GC/total_allocated_object'
group by time


-- Threads
select
  $__timeGroup(point, $interval, 0),
  sum("call-count") / sum("sum-of-squares") as val
from "metric-data-ext"
where
  $__timeFilter(point)
  and "app-id" = $app_id
  and scope = ''
  and name = 'RubyVM/Threads/all'
group by time


-- ++++++++++++++++ Databases ++++++++++++++++

-- Table
select
  name,
  sum("call-count") as "call-count",
  sum("call-count")
    / extract(epoch from $__timeTo()::timestamp - $__timeFrom()::timestamp)
    * 60 as opm,
  sum("total-call-time") / sum("call-count") as avg,
  min("min-call-time") as min,
  max("max-call-time") as max
from "metric-data-ext"
where
  $__timeFilter(point)
  and "app-id" = $app_id
  and scope = ''
  and name like any(array['Datastore/operation/%', 'Datastore/statement/%'])
group by name

-- Query time
select
  $__timeGroup(point, $interval, 0),
  name as metric,
  sum("total-call-time") / sum("call-count") as val
from "metric-data-ext"
where
  $__timeFilter(point)
  and "app-id" = $app_id
  and scope = ''
  and name like 'Datastore/%/all'
group by name, time

-- Throughput
select
  $__timeGroup(point, $interval, 0),
  name as metric,
  sum("call-count") / extract(epoch from interval '$interval') * 60 as rpm
from "metric-data-ext"
where
  $__timeFilter(point)
  and "app-id" = $app_id
  and scope = ''
  and name like 'Datastore/%/all'
group by name, time


-- Top databases operations by time consumed
select
  time,
  name as metric,
  val
from (
  select
    time,
    name,
    val,
    dense_rank() over (order by total desc) as rank
  from (
    select
      $__timeGroup(point, $interval, 0),
      name,
      sum("total-call-time") as val,
      sum(sum("total-call-time")) over (partition by name) as total
    from "metric-data-ext"
    where
      $__timeFilter(point)
      and "app-id" = $app_id
      and scope = ''
      and name like 'Datastore/operation/%'
    group by time, name
  ) as x
) as res
where rank <= 5
order by time


-- ++++++++++++++++ External ++++++++++++++++

-- Table
select
  name,
  sum("call-count") as "call-count",
  sum("call-count")
    / extract(epoch from $__timeTo()::timestamp - $__timeFrom()::timestamp)
    * 60 as opm,
  sum("total-call-time") / sum("call-count") as avg,
  min("min-call-time") as min,
  max("max-call-time") as max
from "metric-data-ext"
where
  $__timeFilter(point)
  and "app-id" = $app_id
  and scope = ''
  and name like 'External/%'
  and name not like 'External/%all%'
group by name

-- time consumption
select
  $__timeGroup(point, $interval, 0),
  name as metric,
  sum("total-call-time") as "total-call-time"
from "metric-data-ext"
where
  $__timeFilter(point)
  and "app-id" = $app_id
  and scope = ''
  and name like 'External/%/all'
group by name, time

-- Throughput
select
  $__timeGroup(point, $interval, 0),
  name as metric,
  sum("call-count") / extract(epoch from interval '$interval') * 60 as rpm
from "metric-data-ext"
where
  $__timeFilter(point)
  and "app-id" = $app_id
  and scope = ''
  and name = any(array['External/allOther', 'External/allWeb'])
group by name, time


-- ++++++++++++++++ Extra ++++++++++++++++

-- Query time
select
  $__timeGroup(point, $interval, 0),
  sum("total-exclusive-time") / sum("call-count") as value
from "metric-data-ext"
where
  $__timeFilter(point)
  and "app-id" = $app_id
  and scope = ''
  and name = '$name'
group by time

-- Throughput
select
  $__timeGroup(point, $interval, 0),
  sum("call-count") / extract(epoch from interval '$interval') * 60 as rpm
from "metric-data-ext"
where
  $__timeFilter(point)
  and "app-id" = $app_id
  and scope = ''
  and name = '$name'
group by time

-- Time consumption by caller
select
  now() as time,
  sum(total) as total,
  metric
from (
  select
    *,
    case
      when dense_rank() over (order by total desc) > 5
      then 'Other'
      else scope
    end as metric
  from (
    select
      scope,
      sum("total-exclusive-time") as total
    from "metric-data-ext"
    where
      $__timeFilter(point)
      and "app-id" = $app_id
      and scope != ''
      and name = '$name'
    group by scope
  ) as res
) as x
group by metric

-- ++++++++++++++++ SLA ++++++++++++++++

-- daily
with data as (
  select *
  from "metric-data-by-day-ext"
  where
    point >= date_trunc('day', now()) - interval '1 week'
    and "app-id" = $app_id
    and scope = ''
    and name = any(array[
      'Apdex',
      'HttpDispatcher'
    ])
  order by point desc
)
select
  point as time,
  'Requests count' as metric,
  "call-count" as value
from data
where name = 'HttpDispatcher'
union all
select
  point as time,
  'Response time' as metric,
  "total-call-time" / "call-count" as value
from data
where name = 'HttpDispatcher'
union all
select
  point as time,
  'Apdex' as metric,
  (s + t/2) / (s + t + f) as value
from (
  select
    point,
    "call-count" as s,
    "total-call-time" as t,
    "total-exclusive-time" as f
  from data
  where name = 'Apdex'
) as x
union all
select
  point as time,
  'Satisfied' as metric,
  s / (s + t + f) as value
from (
  select
    point,
    "call-count" as s,
    "total-call-time" as t,
    "total-exclusive-time" as f
  from data
  where name = 'Apdex'
) as x
union all
select
  point as time,
  'Tolerating' as metric,
  t / (s + t + f) as value
from (
  select
    point,
    "call-count" as s,
    "total-call-time" as t,
    "total-exclusive-time" as f
  from data
  where name = 'Apdex'
) as x
union all
select
  point as time,
  'Frustrated' as metric,
  f / (s + t + f) as value
from (
  select
    point,
    "call-count" as s,
    "total-call-time" as t,
    "total-exclusive-time" as f
  from data
  where name = 'Apdex'
) as x


-- weekly
with data as (
  select
    point,
    sum("call-count")           as "call-count",
    sum("total-call-time")      as "total-call-time",
    sum("total-exclusive-time") as "total-exclusive-time",
    min("min-call-time")        as "min-call-time",
    max("max-call-time")        as "max-call-time",
    sum("sum-of-squares")       as "sum-of-squares",
    scope, name
  from (
    select
      date_trunc('week', point) as point,
      "call-count",
      "total-call-time",
      "total-exclusive-time",
      "min-call-time",
      "max-call-time",
      "sum-of-squares",
      scope, name
    from "metric-data-by-day-ext"
    where
      point >= date_trunc('day', now()) - interval '3 month'
      and "app-id" = $app_id
      and scope = ''
      and name = any(array[
        'Apdex',
        'HttpDispatcher'
      ])
  ) as x
  group by point, scope, name
  order by point desc
)
select
  point as time,
  'Requests count' as metric,
  "call-count" as value
from data
where name = 'HttpDispatcher'
union all
select
  point as time,
  'Response time' as metric,
  "total-call-time" / "call-count" as value
from data
where name = 'HttpDispatcher'
union all
select
  point as time,
  'Apdex' as metric,
  (s + t/2) / (s + t + f) as value
from (
  select
    point,
    "call-count" as s,
    "total-call-time" as t,
    "total-exclusive-time" as f
  from data
  where name = 'Apdex'
) as x
union all
select
  point as time,
  'Satisfied' as metric,
  s / (s + t + f) as value
from (
  select
    point,
    "call-count" as s,
    "total-call-time" as t,
    "total-exclusive-time" as f
  from data
  where name = 'Apdex'
) as x
union all
select
  point as time,
  'Tolerating' as metric,
  t / (s + t + f) as value
from (
  select
    point,
    "call-count" as s,
    "total-call-time" as t,
    "total-exclusive-time" as f
  from data
  where name = 'Apdex'
) as x
union all
select
  point as time,
  'Frustrated' as metric,
  f / (s + t + f) as value
from (
  select
    point,
    "call-count" as s,
    "total-call-time" as t,
    "total-exclusive-time" as f
  from data
  where name = 'Apdex'
) as x

-- monthly
with data as (
  select
    point,
    sum("call-count")           as "call-count",
    sum("total-call-time")      as "total-call-time",
    sum("total-exclusive-time") as "total-exclusive-time",
    min("min-call-time")        as "min-call-time",
    max("max-call-time")        as "max-call-time",
    sum("sum-of-squares")       as "sum-of-squares",
    scope, name
  from (
    select
      date_trunc('month', point) as point,
      "call-count",
      "total-call-time",
      "total-exclusive-time",
      "min-call-time",
      "max-call-time",
      "sum-of-squares",
      scope, name
    from "metric-data-by-day-ext"
    where
      point >= date_trunc('day', now()) - interval '1 year'
      and "app-id" = $app_id
      and scope = ''
      and name = any(array[
        'Apdex',
        'HttpDispatcher'
      ])
  ) as x
  group by point, scope, name
  order by point desc
)
select
  point as time,
  'Requests count' as metric,
  "call-count" as value
from data
where name = 'HttpDispatcher'
union all
select
  point as time,
  'Response time' as metric,
  "total-call-time" / "call-count" as value
from data
where name = 'HttpDispatcher'
union all
select
  point as time,
  'Apdex' as metric,
  (s + t/2) / (s + t + f) as value
from (
  select
    point,
    "call-count" as s,
    "total-call-time" as t,
    "total-exclusive-time" as f
  from data
  where name = 'Apdex'
) as x
union all
select
  point as time,
  'Satisfied' as metric,
  s / (s + t + f) as value
from (
  select
    point,
    "call-count" as s,
    "total-call-time" as t,
    "total-exclusive-time" as f
  from data
  where name = 'Apdex'
) as x
union all
select
  point as time,
  'Tolerating' as metric,
  t / (s + t + f) as value
from (
  select
    point,
    "call-count" as s,
    "total-call-time" as t,
    "total-exclusive-time" as f
  from data
  where name = 'Apdex'
) as x
union all
select
  point as time,
  'Frustrated' as metric,
  f / (s + t + f) as value
from (
  select
    point,
    "call-count" as s,
    "total-call-time" as t,
    "total-exclusive-time" as f
  from data
  where name = 'Apdex'
) as x




-- Internals

select
  c.relname as tablename,
  pg_total_relation_size(c.oid) as total_relation_size,
  reltuples as tuples,
  relpages as pages
from pg_class c
left join pg_namespace n on n.oid = c.relnamespace
where
  c.relkind = any (array['r'::"char", 'p'::"char"])
  and n.nspname = 'public'



-- Transaction trace

select "start-time", duration, uri, host
from "transaction-sample-data-ext" as data
join servers on servers.id = data."server-id"
where
  $__timeFilter("start-time")
  and data."transaction-name" = any(array['$scope', 'WebTransaction/$scope'])
  and data.id = $trace_id

select html
from "transaction-sample-data-ext" as data
where
  $__timeFilter("start-time")
  and data."transaction-name" = any(array['$scope', 'WebTransaction/$scope'])
  and data.id = $trace_id

-- Errors

-- frequency
select
  $__timeGroup(point, $interval, 0),
  count(*) as val,
  "exception-class-name" as metric
from "error-data-ext"
where
  $__timeFilter(point)
  and "app-id" = $app_id
group by
  time, "exception-class-name"
order by time

-- table
select
  count(*),
  min(point) as "first-occurrence",
  max(point) as "last-occurrence",
  "transaction-name",
  "exception-class-name",
  string_agg(distinct message, '<br>' order by message) as message

from "error-data-ext"
where
  $__timeFilter(point)
  and "app-id" = $app_id
group by
  "transaction-name",
  "exception-class-name"

-- Error

select
  $__timeGroup(point, $interval, 0),
  count(*) as value
from "error-data-ext"
where
  $__timeFilter(point)
  and "app-id" = $app_id
  and "transaction-name" = '$scope'
  and "exception-class-name" = '$exception_class_name'
group by point

select message
from "error-data-ext"
where
  $__timeFilter(point)
  and "app-id" = $app_id
  and "transaction-name" = '$scope'
  and "exception-class-name" = '$exception_class_name'
order by point asc
limit 1

select jsonb_pretty(data) as data
from "error-data-ext"
where
  $__timeFilter(point)
  and "app-id" = $app_id
  and "transaction-name" = '$scope'
  and "exception-class-name" = '$exception_class_name'
order by point asc
limit 1


-- Custom

-- сколько сторонних запросов на транзакцию

with
transactions as (
  select
    "app-id",
    replace(name, 'WebTransactionTotalTime/', '') as name,
    sum("call-count") as calls
  from "metric-data-ext"
  where
      $__timeFilter(point)
  and "call-count" > 0
  and scope = ''
  and name like 'WebTransactionTotalTime/%'
  group by "app-id", name
),
components as (
  select
    md."app-id",
    t.name as tx,
    md.name,
    sum("call-count") / sum(t.calls) as calls_per_req
  from transactions as t
  join "metric-data-ext" as md
  on  t."app-id" = md."app-id"
  and (   md.scope = t.name
       or md.scope = 'WebTransaction/' || t.name) -- python
  where
      $__timeFilter(point)
  and md.name like any(array['Datastore/%', 'External/%'])
  group by md."app-id", t.name, md.name
)
select
  apps.name as app,
  c.tx,
  c.name,
  c.calls_per_req
from components as c
join apps on c."app-id" = apps.id
where c.calls_per_req > 2
order by c.calls_per_req desc
;

with
transactions as (
  select
    "app-id",
    name,
    sum("call-count") as calls
  from "metric-data-ext"
  where
      $__timeFilter(point)
  and "call-count" > 0
  and scope = ''
  and name like 'OtherTransaction/%'
  and name not like 'OtherTransaction/%/all'
  group by "app-id", name
),
components as (
  select
    md."app-id",
    replace(t.name, 'OtherTransaction/', '') as tx,
    md.name,
    sum("call-count") / sum(t.calls) as calls_per_req
  from transactions as t
  join "metric-data-ext" as md
  on  t."app-id" = md."app-id"
  and md.scope = t.name
  where
      $__timeFilter(point)
  and md.name like any(array['Datastore/%', 'External/%'])
  group by md."app-id", t.name, md.name
)
select
  apps.name as app,
  c.tx,
  c.name,
  c.calls_per_req
from components as c
join apps on c."app-id" = apps.id
where c.calls_per_req > 2
order by c.calls_per_req desc
;
