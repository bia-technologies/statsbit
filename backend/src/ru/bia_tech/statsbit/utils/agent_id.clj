(ns ru.bia-tech.statsbit.utils.agent-id
  (:require
   [clojure.string :as str]))

(defn build [app-id server-id]
  (str/join ":" ["v1" app-id server-id]))

(defn parse [value]
  (let [[found? app-id server-id] (re-find #"v1:(\d+):(\d+)" value)]
    (when-not found?
      (throw (ex-info "Wrong agent-id" {:type :wrong-agent-id, :value value})))
    [(Integer/parseInt app-id)
     (Integer/parseInt server-id)]))
