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

(ns ru.bia-tech.statsbit.components.context
  (:require
   [ru.bia-tech.statsbit.context :as ctx]
   [ru.bia-tech.statsbit.utils.sentry :as sentry]
   [ru.bia-tech.statsbit.utils.component :as utils.component]
   [com.stuartsierra.component :as component]
   [jdbc.core :as jdbc]))

(defn- wrap-conn [f data-source]
  (fn [& args]
    (with-open [conn (jdbc/connection data-source)]
      (binding [ctx/*conn* conn]
        (apply f args)))))

(defn- wrap-log-ex [f sentry]
  (fn [& args]
    (binding [ctx/*log-ex* (partial sentry/send-ex sentry)]
      (apply f args))))

(defn- init [{:keys [data-source sentry]}]
  #(-> %
       (wrap-conn @data-source)
       (wrap-log-ex @sentry)))

(defn build []
  (utils.component/derefable
   {:init init}))
