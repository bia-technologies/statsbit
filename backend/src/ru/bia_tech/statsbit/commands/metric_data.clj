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

(ns ru.bia-tech.statsbit.commands.metric-data
  (:require
   [ru.bia-tech.statsbit.utils.time :as u.time]
   [ru.bia-tech.statsbit.utils.agent-id :as u.agent-id]
   [ru.bia-tech.statsbit.context :as ctx]
   [hugsql.core :as hugsql]
   [clojure.string :as str]))

(hugsql/def-db-fns "ru/bia_tech/statsbit/commands/metric_data.sql" {:quoting :ansi})

(defn- convert-metric [app-id server-id start finish metric]
  (let [[{:strs [name scope]}
         [call-count total-call-time total-exclusive-time
          min-call-time max-call-time sum-of-squares]]
        metric]
    (for [{:keys [start factor]} (u.time/normalize-range start finish)]
      {:point                start
       :app-id               app-id
       :server-id            server-id
       :name                 name
       :scope                (str scope)
       :call-count           (* factor (float call-count))
       :total-call-time      (* factor (float total-call-time))
       :total-exclusive-time (* factor (float total-exclusive-time))
       :min-call-time        min-call-time
       :max-call-time        max-call-time
       :sum-of-squares       (* factor (float sum-of-squares))})))

(defn convert [raw]
  (let [[agent-id start finish metrics] raw

        [app-id server-id] (u.agent-id/parse agent-id)
        start              (u.time/num->instant start)
        finish             (u.time/num->instant finish)]
    (mapcat #(convert-metric app-id server-id start finish %)
            metrics)))

(def ^:private fields
  [:point
   :key-id
   :server-id
   :call-count
   :total-call-time
   :total-exclusive-time
   :min-call-time
   :max-call-time
   :sum-of-squares])

(def ^:private ->tuple (apply juxt fields))

(defn- supportability? [metric]
  (str/starts-with? (:name metric) "Supportability/"))

(defn- fresh? [metric]
  (let [max-lag (* 10 60)
        lag     (-> metric :point u.time/lag-in-sec Math/abs)]
    (< lag max-lag)))

(defn- add-keys [metrics]
  (let [args    (map (juxt :app-id :scope :name) metrics)
        result  (upsert-keys ctx/*conn* {:args args})
        key-ids (map :id result)]
    (map (fn [metric key-id]
           (assoc metric :key-id key-id))
         metrics key-ids)))

(defn process [metrics]
  (let [metrics    (->> metrics
                        (filter fresh?)
                        (remove supportability?)
                        (sort-by (juxt :point :app-id :scope :name)))
        batch-size (int (/ Short/MAX_VALUE (count fields)))]
    (doseq [metrics (partition-all batch-size metrics)]
      (let [with-keys   (add-keys metrics)
            tuples      (map ->tuple with-keys)
            field-names (map name fields)]
        (insert-metric-data ctx/*conn* {:fields field-names
                                        :tuples tuples})))))
