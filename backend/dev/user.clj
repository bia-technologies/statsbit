(ns user
  (:require
   [com.stuartsierra.component :as component]
   [ru.bia-tech.statsbit.init]
   [ru.bia-tech.statsbit.system :as system]
   [ru.bia-tech.statsbit.migration :as migration]))

(defonce system (system/build :dev))

(defn start []
  (alter-var-root #'system component/start-system))

(defn stop []
  (alter-var-root #'system component/stop-system))

(defn migrate []
  (migration/migrate :dev)
  (migration/migrate :test))
