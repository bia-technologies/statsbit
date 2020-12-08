select create_hypertable(
  'error-data', 'point',
  partitioning_column => 'transaction-id',
  number_partitions => 1,
  create_default_indexes => false,
  associated_table_prefix => 'ed'
);

alter table "error-data"
set (
  timescaledb.compress,
  timescaledb.compress_orderby = '"server-id", point desc',
  timescaledb.compress_segmentby = '"transaction-id"'
);
