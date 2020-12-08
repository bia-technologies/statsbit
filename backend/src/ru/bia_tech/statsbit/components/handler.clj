(ns ru.bia-tech.statsbit.components.handler
  (:require
   [com.stuartsierra.component :as component]
   [ru.bia-tech.statsbit.utils.component :as utils.component]
   [ru.bia-tech.statsbit.http.handler :as handler]))

(defn- init [{:keys [context]}]
  (@context (handler/build)))

(defn build []
  (utils.component/derefable
   {:init init}))
