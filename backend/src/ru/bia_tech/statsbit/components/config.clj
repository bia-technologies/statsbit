(ns ru.bia-tech.statsbit.components.config
  (:require
   [com.stuartsierra.component :as component]
   [ru.bia-tech.statsbit.utils.component :as utils.component]
   [ru.bia-tech.statsbit.config :as config]))

(defn- init [{:keys [profile]}]
  (config/read profile))

(defn build [profile]
  (utils.component/derefable
   {:init init :prifile profile}))
