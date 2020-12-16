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

(ns ru.bia-tech.statsbit.commands.analytic-event-data
  (:require
   [ru.bia-tech.statsbit.utils.time :as u.time]
   [ru.bia-tech.statsbit.utils.agent-id :as u.agent-id]
   [ru.bia-tech.statsbit.context :as ctx]
   [hugsql.core :as hugsql]))

(hugsql/def-db-fns "ru/bia_tech/statsbit/commands/analytic_event_data.sql" {:quoting :ansi})

(defn- convert-event [app-id server-id [intrinsics custom-attributes agent-attributes]]
  {:app-id           app-id
   :server-id        server-id
   :timestamp        (-> intrinsics (get "timestamp") u.time/num->instant)
   :transaction-name (-> intrinsics (get "name") str)
   :duration         (-> intrinsics (get "duration") float)
   :error            (-> intrinsics (get "error") boolean)}
  #_{:type              (-> intrinsics (get "type") str)
     :priority          (-> intrinsics (get "priority" 0) float)
     :other-intrinsics  (dissoc intrinsics "timestamp" "name" "duration" "type" "error" "priority")
     :custom-attributes custom-attributes
     :agent-attributes  agent-attributes})

(defn convert [raw]
  (let [[agent-id _ events] raw
        [app-id server-id]  (u.agent-id/parse agent-id)]
    (map #(convert-event app-id server-id %) events)))

(def ^:private fields
  [:transaction-id
   :server-id
   :timestamp
   :duration
   :error
   #_:type
   #_:priority
   #_:other-intrinsics
   #_:custom-attributes
   #_:agent-attributes])

(defn-  ->tuple [data]
  (let [tuple (apply juxt fields)]
    (tuple data)))

(defn- add-transactions [errors]
  (let [args            (map (juxt :app-id, :transaction-name) errors)
        result          (upsert-transactions ctx/*conn* {:args args})
        transaction-ids (map :id result)]
    (map (fn [trace transaction-id]
           (assoc trace :transaction-id transaction-id))
         errors transaction-ids)))

(defn process [events]
  (let [events     (->> events
                        (sort-by (juxt :app-id, :transaction-name)))
        batch-size (int (/ Short/MAX_VALUE (count fields)))]
    (doseq [events (partition-all batch-size events)]
      (let [with-scopes (add-transactions events)
            tuples      (map ->tuple with-scopes)
            field-names (map name fields)]
        (insert-analytic-event-data ctx/*conn* {:fields field-names
                                                :tuples tuples})))))
