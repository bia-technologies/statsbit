create table "error-data" (
  point                  timestamptz  not null,
  "transaction-id"       integer      not null,
  "server-id"            integer      not null,
  message                text         not null,
  "exception-class-name" varchar(255) not null,
  data                   jsonb        not null

  -- foreign key ("transaction-id") references transactions (id)
  -- foreign key ("server-id") references servers (id)
);

create index on "error-data" ("transaction-id", point desc);
