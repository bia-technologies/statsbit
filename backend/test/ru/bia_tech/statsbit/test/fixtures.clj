(ns ru.bia-tech.statsbit.test.fixtures
  (:require
   [jdbc.core :as jdbc]
   [clojure.test :as t]
   [ru.bia-tech.statsbit.config :as config]
   [ru.bia-tech.statsbit.context :as ctx]))

(defn- setup-connection [t]
  (let [config (config/read :test)
        dbspec (-> (:db config)
                   (assoc :vendor "postgresql"))]
    (with-open [conn (jdbc/connection dbspec)]
      (jdbc/atomic conn
                   (jdbc/set-rollback! conn)
                   (binding [ctx/*conn* conn]
                     (t))))))

(defn- setup-log-ex [t]
  (binding [ctx/*log-ex* (constantly nil)]
    (t)))

(def each (t/join-fixtures [setup-connection setup-log-ex]))
