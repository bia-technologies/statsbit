(ns ru.bia-tech.statsbit.http.handler
  (:require
   [reitit.ring :as r.ring]
   [ring.util.http-response :as ring.resp]
   [ring.middleware.params :as ring.params]
   [ring.middleware.keyword-params :as ring.keyword-params]
   [ru.bia-tech.statsbit.http.agent :as agent]
   [ru.bia-tech.statsbit.context :as ctx]))

(defn wrap-log-ex [handler]
  (fn [req]
    (try
      (handler req)
      (catch Throwable ex
        (ctx/*log-ex* ex req)
        (throw ex)))))

(defn wrap-exception [handler]
  (fn [req]
    (try
      (handler req)
      (catch Throwable ex
        (case (-> ex ex-data :type)
          :wrong-agent-id (ring.resp/unauthorized (ex-message ex))
          (throw ex))))))

(defn default-handler [req]
  (ring.resp/not-found))

(defn health []
  ["/health" (fn [req] (ring.resp/ok "Success"))])

(defn build []
  (r.ring/ring-handler
   (r.ring/router [(health)
                   (agent/build)])
   default-handler
   {:middleware [wrap-log-ex
                 wrap-exception
                 ring.params/wrap-params
                 ring.keyword-params/wrap-keyword-params]}))
