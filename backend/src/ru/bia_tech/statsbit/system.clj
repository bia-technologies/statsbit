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

(ns ru.bia-tech.statsbit.system
  (:require
   [com.stuartsierra.component :as component]
   [ru.bia-tech.statsbit.components.jetty :as jetty]
   [ru.bia-tech.statsbit.components.data-source :as data-source]
   [ru.bia-tech.statsbit.components.config :as config]
   [ru.bia-tech.statsbit.components.handler :as handler]
   [ru.bia-tech.statsbit.components.context :as context]
   [ru.bia-tech.statsbit.components.sentry :as sentry]))

(defn build [profile]
  (component/system-map
   :config
   (config/build profile)

   :data-source
   (component/using (data-source/build) [:config])

   :context
   (component/using (context/build) [:data-source :sentry])

   :handler
   (component/using (handler/build) [:context])

   :jetty
   (component/using (jetty/build) [:config :handler])

   :sentry
   (component/using (sentry/build) [:config])))
