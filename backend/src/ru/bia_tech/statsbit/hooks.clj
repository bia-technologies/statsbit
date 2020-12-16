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

(ns ru.bia-tech.statsbit.hooks
  (:require
   [robert.hooke :as rh]
   [ru.bia-tech.statsbit.http.agent :as agent])
   ;; [ru.bia-tech.statsbit.utils.time :as u.time])
  (:import
   [com.newrelic.api.agent NewRelic]))

(defn wrap-agent-handler [f req]
  (let [method (get-in req [:params :method])]
    (NewRelic/setTransactionName "Handler" (str "/agent/" method)))
  (f req))

(rh/add-hook #'agent/handler #'wrap-agent-handler)

;; (defn wrap-time [f x]
;;   (let [res (f x)]
;;     (if (.isAfter res (java.time.Instant/parse "2021-01-01T00:00:00.00Z"))
;;       (throw (ex-info "num->instant" {:x x, :class (class x), :res res})))
;;     res))

;; (rh/add-hook #'u.time/num->instant #'wrap-time)
