create table "metric-data" (
  point       timestamptz not null,
  "key-id"    integer     not null,
  "server-id" integer     not null,

  "call-count"            real not null,
  "total-call-time"       real not null,
  "total-exclusive-time"  real not null,

  "min-call-time"         real not null,
  "max-call-time"         real not null,
  "sum-of-squares"        real not null

  -- foreign key ("key-id")    references keys (id)
  -- foreign key ("server-id") references servers (id)
)
with (fillfactor=50);

create unique index on "metric-data" ("key-id", "server-id", point desc);
create index on "metric-data" ("key-id", point desc);
