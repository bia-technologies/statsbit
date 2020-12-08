(ns ru.bia-tech.statsbit.commands.transaction-sample-data
  (:require
   [ru.bia-tech.statsbit.utils.agent-id :as u.agent-id]
   [ru.bia-tech.statsbit.context :as ctx]
   [ru.bia-tech.statsbit.renderers.transaction-sample :as renderers.transaction-sample]
   [ru.bia-tech.statsbit.utils.time :as u.time]
   [hugsql.core :as hugsql]))

(hugsql/def-db-fns "ru/bia_tech/statsbit/commands/transaction_sample_data.sql" {:quoting :ansi})

(defn- convert-trace [app-id server-id trace]
  (let [start-time             (u.time/num->instant (trace 0))
        duration               (trace 1) ;; ms
        transaction-name       (trace 2)
        uri                    (trace 3) ;; для background/other - nil
        tree                   (trace 4)
        guid                   (trace 5)
        _                      (trace 6)
        forced?                (trace 7)
        xray-session-id        (get trace 8)
        synthetics-resource-id (get trace 9)]
    {:app-id                 app-id
     :server-id              server-id
     :start-time             start-time
     :duration               duration
     :transaction-name       transaction-name ;; => transaction-id
     :uri                    uri
     :guid                   guid
     :forced?                forced?
     :xray-session-id        xray-session-id
     :synthetics-resource-id synthetics-resource-id
     :html                   (renderers.transaction-sample/render tree)}))

(defn convert [raw]
  (let [[agent-id traces]  raw
        [app-id server-id] (u.agent-id/parse agent-id)]
    (map #(convert-trace app-id server-id %) traces)))

(def ^:private fields
  [:transaction-id
   :server-id
   :start-time
   :duration
   :uri
   :guid
   :forced?
   :xray-session-id
   :synthetics-resource-id
   :html])

(defn-  ->tuple [trace]
  (let [tuple (apply juxt fields)]
    (tuple trace)))

(defn- add-transactions [traces]
  (let [args            (map (juxt :app-id, :transaction-name) traces)
        result          (upsert-transactions ctx/*conn* {:args args})
        transaction-ids (map :id result)]
    (map (fn [trace transaction-id]
           (assoc trace :transaction-id transaction-id))
         traces transaction-ids)))

(defn process [traces]
  (let [traces     (->> traces
                        (sort-by (juxt :app-id, :transaction-name)))
        batch-size (int (/ Short/MAX_VALUE (count fields)))]
    (doseq [traces (partition-all batch-size traces)]
      (let [with-scopes (add-transactions traces)
            tuples      (map ->tuple with-scopes)
            field-names (map name fields)]
        (insert-transaction-sample-data ctx/*conn* {:fields field-names
                                                    :tuples tuples})))))
