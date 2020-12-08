(ns ru.bia-tech.statsbit.components.context
  (:require
   [ru.bia-tech.statsbit.context :as ctx]
   [ru.bia-tech.statsbit.utils.sentry :as sentry]
   [ru.bia-tech.statsbit.utils.component :as utils.component]
   [com.stuartsierra.component :as component]
   [jdbc.core :as jdbc]))

(defn- wrap-conn [f data-source]
  (fn [& args]
    (with-open [conn (jdbc/connection data-source)]
      (binding [ctx/*conn* conn]
        (apply f args)))))

(defn- wrap-log-ex [f sentry]
  (fn [& args]
    (binding [ctx/*log-ex* (partial sentry/send-ex sentry)]
      (apply f args))))

(defn- init [{:keys [data-source sentry]}]
  #(-> %
       (wrap-conn @data-source)
       (wrap-log-ex @sentry)))

(defn build []
  (utils.component/derefable
   {:init init}))
