create table apps (
  id   serial       primary key,
  name varchar(255) not null
);

create unique index on apps (name varchar_pattern_ops) include (id);
