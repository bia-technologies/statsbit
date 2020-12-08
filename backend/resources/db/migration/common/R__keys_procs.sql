create or replace function
upsert_key(arg__app_id integer, arg__scope varchar(255), arg__name varchar(255))
returns integer as $fn$
declare
  key_id integer;
begin
  perform pg_advisory_xact_lock(
    hashtext('upsert_key'),
    hashtext(
      concat(
        arg__app_id,
        arg__scope,
        arg__name
      )
    )
  );

  select id into key_id from keys where "app-id" = arg__app_id
                                    and scope    = arg__scope
                                    and name     = arg__name;
  if key_id is null then
    insert into keys ("app-id", scope, name) values (arg__app_id, arg__scope, arg__name);
    key_id := lastval();
  end if;
  return key_id;
end
$fn$ language plpgsql;
