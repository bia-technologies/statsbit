;;  Copyright 2020 BIA-Technologies Limited Liability Company
;;
;;  Licensed under the Apache License, Version 2.0 (the "License");
;;  you may not use this file except in compliance with the License.
;;  You may obtain a copy of the License at
;;
;;      http://www.apache.org/licenses/LICENSE-2.0
;;
;;  Unless required by applicable law or agreed to in writing, software
;;  distributed under the License is distributed on an "AS IS" BASIS,
;;  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
;;  See the License for the specific language governing permissions and
;;  limitations under the License.

(ns ru.bia-tech.statsbit.http.agent
  (:require
   [ring.util.http-response :as ring.resp]
   [jsonista.core :as json]
   [clojure.string :as str]
   [ru.bia-tech.statsbit.commands.connect :as connect]
   [ru.bia-tech.statsbit.commands.metric-data :as metric-data]
   [ru.bia-tech.statsbit.commands.transaction-sample-data :as transaction-sample-data]
   [ru.bia-tech.statsbit.commands.analytic-event-data :as analytic-event-data]
   [ru.bia-tech.statsbit.commands.error-data :as error-data])
  (:import
   [java.io ByteArrayInputStream]
   [java.util.zip InflaterInputStream GZIPInputStream]
   [java.util Base64]))

(defn wrap-decode [handler]
  (fn [req]
    (let [encoding (get-in req [:headers "content-encoding"])
          req      (update req :body
                           #(case encoding
                              ("identity" "Identity") %
                              "deflate"               (InflaterInputStream. %)
                              "gzip"                  (GZIPInputStream. %)))]
      (handler req))))

(defn wrap-decode-body [handler]
  (fn [req]
    (let [format (get-in req [:params :marshal_format])
          req    (update req :body
                         #(case format
                            "json" (json/read-value %)))]
      (handler req))))

(defn wrap-encode-body [handler]
  (fn [req]
    (let [resp (handler req)]
      (update resp :body json/write-value-as-string))))

(defn wrap-protocol-version [handler]
  (fn [req]
    (let [version (get-in req [:params :protocol_version])]
      (if (= "17" version)
        (handler req)
        (throw (UnsupportedOperationException. (str "Unsupported protocol version: " version)))))))

(defmulti handler (fn [req] (get-in req [:params :method])))

(defmethod handler :default [req]
  (ring.resp/ok {:return_value {}}))

(defn build []
  ["" {:middleware [wrap-protocol-version
                    wrap-decode
                    wrap-decode-body
                    wrap-encode-body]}
   ["/agent_listener/invoke_raw_method" {:post {:handler handler}}]])

;; `return_value.redirect_host` - чтобы сменить сервер.
(defmethod handler "preconnect" [req]
  ;; для ruby клиента можно не делать редирект,
  ;; а для python необходимо, поэтому отправляем на тот же адрес

  ;; бывает, что прилетает "host:port", и java агенту сносит крышу
  ;; в логах появляется что-то вроде:
  ;; Malformed IPv6 address at index 9: https://[your-host.com:443]:443/agent_listener/invoke_raw_method

  (let [host (-> req
                 (get-in [:headers "host"])
                 (str/split #":")
                 first)]
    (ring.resp/ok {:return_value {:redirect_host host}})))

(defmethod handler "connect" [req]
  (let [result (connect/process req)]
    (ring.resp/ok {:return_value result})))

(defmethod handler "metric_data" [req]
  (-> req
      :body
      (metric-data/convert)
      (metric-data/process))
  (ring.resp/ok {:return_value {}}))

(defn base64->bytes [x]
  (let [decoder (Base64/getMimeDecoder)]
    (.decode decoder x)))

(defn parse-transaction-trace [x]
  (cond
    (vector? x) x
    :else       (-> x
                    (base64->bytes)
                    (ByteArrayInputStream.)
                    (InflaterInputStream.)
                    (json/read-value))))

(defmethod handler "transaction_sample_data" [req]
  (-> req
      :body
      (update 1 (fn [traces] (map #(update % 4 parse-transaction-trace)
                                  traces)))
      (transaction-sample-data/convert)
      (transaction-sample-data/process))
  (ring.resp/ok {:return_value {}}))

(defmethod handler "analytic_event_data" [req]
  (-> req
      :body
      (analytic-event-data/convert)
      (analytic-event-data/process))
  (ring.resp/ok {:return_value {}}))

;; "error_event_data"
(defmethod handler "error_data" [req]
  (-> req
      :body
      (error-data/convert)
      (error-data/process))
  (ring.resp/ok {:return_value {}}))
