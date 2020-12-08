CREATE EXTENSION cstore_fdw;
CREATE SERVER cstore_server FOREIGN DATA WRAPPER cstore_fdw;

CREATE TABLE "metric-data"
(
  "time" timestamp without time zone not null,
  "scope-id" int not null,
  "name-id"  int not null,

  "call-count"           real not null,
  "total-call-time"      real not null,
  "total-exclusive-time" real not null,
  "min-call-time"        real not null,
  "max-call-time"        real not null,
  "sum-of-squares"       real not null
) partition by range(time);

create table "metric-data-2019-13" partition of "metric-data"
for values
from ('2019-03-25 00:00:00')
to   ('2019-04-01 00:00:00');


CREATE FOREIGN TABLE "metric-data-2019-14" partition of "metric-data"
for values
from ('2019-04-1 00:00:00')
to   ('2019-04-10 00:00:00')
SERVER cstore_server
OPTIONS(compression 'pglz');




SELECT
    nmsp_parent.nspname AS parent_schema,
    parent.relname      AS parent,
    nmsp_child.nspname  AS child_schema,
    child.relname       AS child
FROM pg_inherits
    JOIN pg_class parent            ON pg_inherits.inhparent = parent.oid
    JOIN pg_class child             ON pg_inherits.inhrelid   = child.oid
    JOIN pg_namespace nmsp_parent   ON nmsp_parent.oid  = parent.relnamespace
    JOIN pg_namespace nmsp_child    ON nmsp_child.oid   = child.relnamespace
WHERE parent.relname='metric-data';
