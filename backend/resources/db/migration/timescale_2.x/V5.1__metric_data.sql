select create_hypertable(
  'metric-data', 'point',
  partitioning_column => 'key-id',
  number_partitions => 1,
  create_default_indexes => false,
  associated_table_prefix => 'md'
);

alter table "metric-data"
set (
  timescaledb.compress,
  timescaledb.compress_orderby = '"server-id", point desc',
  timescaledb.compress_segmentby = '"key-id"'
);
