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

(ns ru.bia-tech.statsbit.components.data-source
  (:require
   [com.stuartsierra.component :as component]
   [ru.bia-tech.statsbit.utils.component :as utils.component])
  (:import
   [com.mchange.v2.c3p0 ComboPooledDataSource]))

(defn- init [{:keys [config]}]
  (doto (ComboPooledDataSource.)
    (.setJdbcUrl (-> @config :jdbc :url))
    (.setUser (-> @config :jdbc :user))
    (.setPassword (-> @config :jdbc :password))

    (.setAcquireIncrement (-> @config :db-pool :acquire-increment))
    (.setMinPoolSize (-> @config :db-pool :min-pool-size))
    (.setMaxPoolSize (-> @config :db-pool :max-pool-size))))

(defn- dispose [datasource]
  (.close datasource))

(defn build []
  (utils.component/derefable
   {:init init, :dispose dispose}))
