(ns ru.bia-tech.statsbit.commands.error-data
  (:require
   [ru.bia-tech.statsbit.utils.time :as u.time]
   [ru.bia-tech.statsbit.utils.agent-id :as u.agent-id]
   [ru.bia-tech.statsbit.context :as ctx]
   [clojure.string :as str]
   [hugsql.core :as hugsql]))

(hugsql/def-db-fns "ru/bia_tech/statsbit/commands/error_data.sql" {:quoting :ansi})

(defn- sanitize [s]
  (str/replace s "\u0000" ""))

(defn- convert-error [app-id server-id error]
  {:point                (-> 0 error u.time/num->instant)
   :app-id               app-id
   :server-id            server-id
   :transaction-name     (-> 1 error str sanitize)
   :message              (-> 2 error str sanitize)
   :exception-class-name (-> 3 error str sanitize)
   :data                 (-> 4 error)})

(defn convert [raw]
  (let [[agent-id errors]  raw
        [app-id server-id] (u.agent-id/parse agent-id)]
    (map #(convert-error app-id server-id %)
         errors)))

(def ^:private fields
  [:point
   :transaction-id
   :server-id
   :message
   :exception-class-name
   :data])

(def ^:private ->tuple (apply juxt fields))

(defn- add-transactions [errors]
  (let [args            (map (juxt :app-id, :transaction-name) errors)
        result          (upsert-transactions ctx/*conn* {:args args})
        transaction-ids (map :id result)]
    (map (fn [trace transaction-id]
           (assoc trace :transaction-id transaction-id))
         errors transaction-ids)))

(defn process [errors]
  (let [errors     (->> errors
                        (sort-by (juxt :app-id, :transaction-name)))
        batch-size (int (/ Short/MAX_VALUE (count fields)))]
    (doseq [errors (partition-all batch-size errors)]
      (let [with-scopes (add-transactions errors)
            tuples      (map ->tuple with-scopes)
            field-names (map name fields)]
        (insert-error-data ctx/*conn* {:fields field-names
                                       :tuples tuples})))))
