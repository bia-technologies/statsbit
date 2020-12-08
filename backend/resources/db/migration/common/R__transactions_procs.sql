create or replace function
upsert_transaction(arg__app_id integer, arg__name varchar(255))
returns integer as $fn$
declare
  transaction_id integer;
begin
  perform pg_advisory_xact_lock(
    hashtext('upsert_transaction'),
    hashtext(
      concat(
        arg__app_id,
        arg__name
      )
    )
  );

  select id into transaction_id from transactions where "app-id" = arg__app_id
                                                    and name     = arg__name;
  if transaction_id is null then
    insert into transactions ("app-id", name) values (arg__app_id, arg__name);
    transaction_id := lastval();
  end if;
  return transaction_id;
end
$fn$ language plpgsql;
