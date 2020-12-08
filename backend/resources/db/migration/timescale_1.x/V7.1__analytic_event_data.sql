select create_hypertable(
  'analytic-event-data', 'timestamp',
  partitioning_column => 'transaction-id',
  number_partitions => 1,
  create_default_indexes => false,
  associated_table_prefix => 'aed'
);

alter table "analytic-event-data"
set (
  timescaledb.compress,
  timescaledb.compress_orderby = '"server-id", timestamp desc',
  timescaledb.compress_segmentby = '"transaction-id"'
);
