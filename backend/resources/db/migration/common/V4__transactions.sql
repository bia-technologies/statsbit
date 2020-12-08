create table transactions (
  id        serial      primary key,
  "app-id" integer      not null,
  name     varchar(255) not null,

  foreign key ("app-id") references apps (id)
);

create unique index
  on transactions ("app-id", name varchar_pattern_ops)
  include (id);
