(ns ru.bia-tech.statsbit.components.jetty
  (:require
   [com.stuartsierra.component :as component]
   [ru.bia-tech.statsbit.utils.component :as utils.component]
   [ring.adapter.jetty :as jetty]))

(defn- init [{:keys [config handler]}]
  (let [options (-> @config :jetty (assoc :join? false))]
    (jetty/run-jetty @handler options)))

(defn- dispose [server]
  (.stop server))

(defn build []
  (utils.component/derefable
   {:init init, :dispose dispose}))
