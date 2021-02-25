-- metric-data
-- ===========
select set_number_partitions('metric-data', 1);
select set_chunk_time_interval('metric-data', interval '6 hours');

select remove_compression_policy('metric-data', if_exists => true);
select add_compression_policy('metric-data', interval '1 hour');

select remove_retention_policy('metric-data', if_exists => true);
select add_retention_policy('metric-data', interval '6 months');

-- transaction-sample-data
-- =======================
select set_number_partitions('transaction-sample-data', 1);
select set_chunk_time_interval('transaction-sample-data', interval '7 day');

select remove_retention_policy('transaction-sample-data', if_exists => true);
select add_retention_policy('transaction-sample-data', interval '1 months');

-- analytic-event-data
-- ===================
select set_number_partitions('analytic-event-data', 1);
select set_chunk_time_interval('analytic-event-data', interval '12 hours');

select remove_compression_policy('analytic-event-data', if_exists => true);
select add_compression_policy('analytic-event-data', interval '1 hour');

select remove_retention_policy('analytic-event-data', if_exists => true);
select add_retention_policy('analytic-event-data', interval '6 months');

-- error-data
-- ==========
select set_number_partitions('error-data', 1);
select set_chunk_time_interval('error-data', interval '7 day');

select remove_retention_policy('error-data', if_exists => true);
select add_retention_policy('error-data', interval '6 months');
