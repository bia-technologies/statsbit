select create_hypertable(
  'transaction-sample-data', 'start-time',
  partitioning_column => 'transaction-id',
  number_partitions => 1,
  create_default_indexes => false,
  associated_table_prefix => 'tsd'
);

alter table "transaction-sample-data"
set (
  timescaledb.compress,
  timescaledb.compress_orderby = '"server-id", "start-time" desc',
  timescaledb.compress_segmentby = '"transaction-id"'
);
