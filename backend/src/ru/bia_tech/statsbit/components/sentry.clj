(ns ru.bia-tech.statsbit.components.sentry
  (:require
   [com.stuartsierra.component :as component]
   [ru.bia-tech.statsbit.utils.component :as utils.component])
  (:import
   [io.sentry SentryClientFactory]))

(defn- init [{:keys [config]}]
  (let [dsn (-> @config :sentry :dsn)]
    (SentryClientFactory/sentryClient dsn)))

(defn- dispose [sentry]
  (.closeConnection sentry))

(defn build []
  (utils.component/derefable
   {:init init, :dispose dispose}))
