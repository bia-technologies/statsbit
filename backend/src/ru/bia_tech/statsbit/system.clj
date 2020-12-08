(ns ru.bia-tech.statsbit.system
  (:require
   [com.stuartsierra.component :as component]
   [ru.bia-tech.statsbit.components.jetty :as jetty]
   [ru.bia-tech.statsbit.components.data-source :as data-source]
   [ru.bia-tech.statsbit.components.config :as config]
   [ru.bia-tech.statsbit.components.handler :as handler]
   [ru.bia-tech.statsbit.components.context :as context]
   [ru.bia-tech.statsbit.components.sentry :as sentry]))

(defn build [profile]
  (component/system-map
   :config
   (config/build profile)

   :data-source
   (component/using (data-source/build) [:config])

   :context
   (component/using (context/build) [:data-source :sentry])

   :handler
   (component/using (handler/build) [:context])

   :jetty
   (component/using (jetty/build) [:config :handler])

   :sentry
   (component/using (sentry/build) [:config])))
