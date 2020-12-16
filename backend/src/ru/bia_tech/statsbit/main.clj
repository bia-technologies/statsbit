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
