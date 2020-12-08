create table keys (
  id        serial      primary key,
  "app-id" integer      not null,
  scope    varchar(255) not null,
  name     varchar(255) not null,

  foreign key ("app-id") references apps (id)
);

create unique index
  on keys ("app-id", scope varchar_pattern_ops, name varchar_pattern_ops)
  include (id);
