create table "analytic-event-data" (
  timestamp        timestamptz not null,
  "transaction-id" integer     not null,
  "server-id"      integer     not null,
  error            boolean     not null,
  duration         float       not null

  -- foreign key ("transaction-id") references transactions (id)
  -- foreign key ("server-id") references servers (id)
);

create index on "analytic-event-data" ("transaction-id", timestamp desc);
