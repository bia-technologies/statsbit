-- metric-data
-- ===========
select set_number_partitions('metric-data', 1);
select set_chunk_time_interval('metric-data', interval '6 hours');

select remove_compress_chunks_policy('metric-data', if_exists => true);
select add_compress_chunks_policy('metric-data', interval '1 hour');

select remove_drop_chunks_policy('metric-data', if_exists => true);
select add_drop_chunks_policy('metric-data', interval '1 month');

-- transaction-sample-data
-- =======================
select set_number_partitions('transaction-sample-data', 1);
select set_chunk_time_interval('transaction-sample-data', interval '7 day');

select remove_drop_chunks_policy('transaction-sample-data', if_exists => true);
select add_drop_chunks_policy('transaction-sample-data', interval '1 month');

-- analytic-event-data
-- ===================
select set_number_partitions('analytic-event-data', 1);
select set_chunk_time_interval('analytic-event-data', interval '12 hours');

select remove_compress_chunks_policy('analytic-event-data', if_exists => true);
select add_compress_chunks_policy('analytic-event-data', interval '1 hour');

select remove_drop_chunks_policy('analytic-event-data', if_exists => true);
select add_drop_chunks_policy('analytic-event-data', interval '1 month');

-- error-data
-- ==========
select set_number_partitions('error-data', 1);
select set_chunk_time_interval('error-data', interval '7 day');

select remove_drop_chunks_policy('error-data', if_exists => true);
select add_drop_chunks_policy('error-data', interval '1 month');
