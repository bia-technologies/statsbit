-- :name- upsert-app :? :1
select upsert_app(:name) as id

-- :name- upsert-server :? :1
select upsert_server(:app-id, :host) as id
