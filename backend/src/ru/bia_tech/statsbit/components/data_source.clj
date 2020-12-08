(ns ru.bia-tech.statsbit.components.data-source
  (:require
   [com.stuartsierra.component :as component]
   [ru.bia-tech.statsbit.utils.component :as utils.component])
  (:import
   [com.mchange.v2.c3p0 ComboPooledDataSource]))

(defn- init [{:keys [config]}]
  (doto (ComboPooledDataSource.)
    (.setJdbcUrl (-> @config :jdbc :url))
    (.setUser (-> @config :jdbc :user))
    (.setPassword (-> @config :jdbc :password))

    (.setAcquireIncrement (-> @config :db-pool :acquire-increment))
    (.setMinPoolSize (-> @config :db-pool :min-pool-size))
    (.setMaxPoolSize (-> @config :db-pool :max-pool-size))))

(defn- dispose [datasource]
  (.close datasource))

(defn build []
  (utils.component/derefable
   {:init init, :dispose dispose}))
