(ns ru.bia-tech.statsbit.main
  (:require
   [com.stuartsierra.component :as component]
   [ru.bia-tech.statsbit.init]
   [ru.bia-tech.statsbit.system :as system]
   [ru.bia-tech.statsbit.migration :as migration]))

(defn- add-shutdown-hook [f]
  (.. Runtime
      (getRuntime)
      (addShutdownHook (Thread. f))))

(defn -main []
  (migration/migrate :prod)
  (let [system (system/build :prod)
        system (component/start system)]
    (prn "Started")
    (add-shutdown-hook #(component/stop system))))
