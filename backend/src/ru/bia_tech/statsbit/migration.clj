;;  Copyright 2020 BIA-Technologies Limited Liability Company
;;
;;  Licensed under the Apache License, Version 2.0 (the "License");
;;  you may not use this file except in compliance with the License.
;;  You may obtain a copy of the License at
;;
;;      http://www.apache.org/licenses/LICENSE-2.0
;;
;;  Unless required by applicable law or agreed to in writing, software
;;  distributed under the License is distributed on an "AS IS" BASIS,
;;  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
;;  See the License for the specific language governing permissions and
;;  limitations under the License.

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
