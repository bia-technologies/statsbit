create or replace function
upsert_server(arg__app_id integer, arg__host varchar(255))
returns integer as $fn$
declare
  server_id integer;
begin
  perform pg_advisory_xact_lock( hashtext('upsert_app'), hashtext(concat(arg__app_id, arg__host)) );

  select id into server_id from servers where "app-id" = arg__app_id and host = arg__host;
  if server_id is null then
    insert into servers ("app-id", host) values (arg__app_id, arg__host);
    server_id := lastval();
  end if;
  return server_id;
end
$fn$ language plpgsql;
