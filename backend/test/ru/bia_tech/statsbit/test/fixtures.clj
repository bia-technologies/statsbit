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
