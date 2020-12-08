(ns ru.bia-tech.statsbit.migration
  (:require
   [clojure.string :as str]
   [com.stuartsierra.component :as component]
   [ru.bia-tech.statsbit.config :as config])
  (:import
   [org.flywaydb.core Flyway]))

(defn get-cfg [profile]
  (let [config (config/read profile)]
    {:url       (-> config :jdbc :url)
     :user      (-> config :jdbc :user)
     :pass      (-> config :jdbc :password)
     :locations (-> config :migration :locations (str/split #",")
                    (->> (into-array String)))}))

(defn migrate [profile]
  (let [{:keys [url user pass locations]} (get-cfg profile)]
    (.. Flyway
        (configure)
        (outOfOrder true)
        (ignoreMissingMigrations true)
        (locations locations)
        (dataSource url user pass)
        (load)
        (migrate))))

;; clojure -m ru.bia-tech.statsbit.migration dev
(defn -main [profile]
  (let [profile (keyword profile)]
    (migrate profile)))
