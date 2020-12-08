(ns ru.bia-tech.statsbit.hooks
  (:require
   [robert.hooke :as rh]
   [ru.bia-tech.statsbit.http.agent :as agent])
   ;; [ru.bia-tech.statsbit.utils.time :as u.time])
  (:import
   [com.newrelic.api.agent NewRelic]))

(defn wrap-agent-handler [f req]
  (let [method (get-in req [:params :method])]
    (NewRelic/setTransactionName "Handler" (str "/agent/" method)))
  (f req))

(rh/add-hook #'agent/handler #'wrap-agent-handler)

;; (defn wrap-time [f x]
;;   (let [res (f x)]
;;     (if (.isAfter res (java.time.Instant/parse "2021-01-01T00:00:00.00Z"))
;;       (throw (ex-info "num->instant" {:x x, :class (class x), :res res})))
;;     res))

;; (rh/add-hook #'u.time/num->instant #'wrap-time)
