create or replace function
upsert_app(arg__name varchar(255))
returns integer as $fn$
declare
  app_id integer;
begin
  perform pg_advisory_xact_lock( hashtext('upsert_app'), hashtext(arg__name) );

  select id into app_id from apps where name = arg__name;
  if app_id is null then
    insert into apps (name) values (arg__name);
    app_id := lastval();
  end if;
  return app_id;
end
$fn$ language plpgsql;
