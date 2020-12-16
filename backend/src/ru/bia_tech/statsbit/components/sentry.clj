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

(ns ru.bia-tech.statsbit.components.sentry
  (:require
   [com.stuartsierra.component :as component]
   [ru.bia-tech.statsbit.utils.component :as utils.component])
  (:import
   [io.sentry SentryClientFactory]))

(defn- init [{:keys [config]}]
  (let [dsn (-> @config :sentry :dsn)]
    (SentryClientFactory/sentryClient dsn)))

(defn- dispose [sentry]
  (.closeConnection sentry))

(defn build []
  (utils.component/derefable
   {:init init, :dispose dispose}))
