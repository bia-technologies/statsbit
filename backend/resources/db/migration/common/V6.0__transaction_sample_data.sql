create table "transaction-sample-data" (
  /* primary key, но т.к. ключ партицирования не входит в id, то не проверяем ограничения */
  id                       bigserial    not null,
  "transaction-id"         integer      not null,
  "server-id"              integer      not null,
  "start-time"             timestamptz  not null,
  duration                 int          not null, /* ms */
  uri                      text,
  guid                     varchar(255) not null,
  "forced?"                boolean      not null,
  "xray-session-id"        int,
  "synthetics-resource-id" text,
  html                     text

  -- foreign key ("transaction-id") references transactions (id)
  -- foreign key ("server-id") references servers (id)
);

create index on "transaction-sample-data" ("transaction-id", "start-time" desc);
