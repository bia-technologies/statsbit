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

(ns ru.bia-tech.statsbit.utils.component
  (:require
   [com.stuartsierra.component :as component]))

(defrecord Derefable [value init dispose]
  clojure.lang.IDeref
  (deref [_] value)

  component/Lifecycle
  (start [this]
    (if (some? value)
      this
      (assoc this :value (init this))))
  (stop [this]
    (if (some? value)
      (do
        (dispose value)
        (assoc this :value nil))
      this)))

(defn derefable [config]
  (map->Derefable (merge {:init    (constantly nil)
                          :dispose (constantly nil)}
                         config)))
