(ns ru.bia-tech.statsbit.http.browser
  (:require
   [ring.util.http-response :as ring.resp]
   [jsonista.core :as json]))

;; RUM - real user monitoring

(defn rum-handler [req]
  #_(tap> [:rum req (ring.util.request/body-string req)])

  (let [jsonp (get-in req [:query-params "jsonp"])
        json  (json/write-value-as-string
               ;; похоже cap не используется
               {:cap false :err true :ins true :spa true :stn true})
        js    (str jsonp "(" json ")")]
    (ring.resp/ok js)))

(defn resources-handler [req]
  (ring.resp/ok))

(defn events-handler [req]
  #_(tap> [:events req (ring.util.request/body-string req)])

  (ring.resp/ok))

(defn jserrors-handler [req]
  (ring.resp/ok))

(defn wrap-allow-origin [handler]
  (fn [req]
    (let [origin (get-in req [:headers "origin"])]
      (-> req
          (handler)
          (ring.resp/header "Access-Control-Allow-Origin" origin)
          (ring.resp/header "Access-Control-Allow-Credentials" true)))))

(defn build []
  ["/browser" {:middleware [wrap-allow-origin]}
   ;; brewser-key - это licenseKey
   ["/1/:browser-key" {:get {:handler rum-handler}}]
   ["/resources/1/:browser-key" {:post {:handler resources-handler}}]
   ["/events/1/:browser-key" {:post {:handler events-handler}}]
   ;; и тут вот вроде как ни разу не ошибки
   ["/jserrors/1/:browser-key" {:post {:handler jserrors-handler}}]
   ;; похоже и такой адрес есть. ins - insights
   #_["/ins/1/:browser-key"]])
