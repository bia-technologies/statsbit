create table servers (
  id       serial       primary key,
  "app-id" integer      not null,
  host     varchar(255) not null,

  foreign key ("app-id") references apps (id)
);

create unique index on servers ("app-id", host varchar_pattern_ops) include (id);
