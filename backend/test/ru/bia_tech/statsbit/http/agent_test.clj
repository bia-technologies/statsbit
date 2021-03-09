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

(ns ru.bia-tech.statsbit.http.agent-test
  (:require
   [ru.bia-tech.statsbit.http.handler :as handler]
   [ru.bia-tech.statsbit.utils.time :as u.time]
   [ru.bia-tech.statsbit.utils.agent-id :as u.agent-id]
   [ru.bia-tech.statsbit.test.fixtures :as fixtures]
   [ring.mock.request :as mock.request]
   [ring.util.http-predicates :as http-predicates]
   [jsonista.core :as json]
   [clojure.test :as t])
  (:import
   [java.time Instant]))

(t/use-fixtures :each fixtures/each)

(defn- request [method data]
  (-> (mock.request/request :post "/agent_listener/invoke_raw_method")
      (mock.request/query-string {:method           method
                                  :marshal_format   "json"
                                  :protocol_version "17"})
      (mock.request/header "content-encoding" "identity")
      (mock.request/body (json/write-value-as-string data))))

(defn- setup-agent [handler]
  (let [req  (request "connect" [{:app_name ["test app"]
                                  :host     "test"}])]
    (-> req
        (handler)
        :body
        json/read-value
        (get-in ["return_value" "agent_run_id"]))))

(t/deftest preconnect
  (let [data    []
        handler (handler/build)
        req     (request "preconnect" data)
        resp    (handler req)]
    (t/is (http-predicates/ok? resp))))

(t/deftest connect
  (let [data [{:pid 7
               :host "eb409b839a92"
               :display_host "eb409b839a92"
               :app_name ["test app"]
               :language "ruby"
               :labels []
               :agent_version "6.2.0.354"
               :environment []
               :settings {}
               :high_security false,
               :utilization {}
               :identifier "ruby:eb409b839a92:test app"}]
        handler (handler/build)
        req     (request "connect" data)
        resp    (handler req)]
    (t/is (http-predicates/ok? resp))))

(t/deftest metric-data
  (let [handler  (handler/build)
        now      (-> (Instant/now) (u.time/instant->double))
        agent-id (setup-agent handler)
        data     [agent-id
                  (- now 60) now
                  [[{"name"  "MetricName"
                     "scope" "MetricScope"}
                    [61                      ;; call_count
                     61.00498843193054       ;; total_call_time
                     61.00498843193054       ;; total_exclusive_time
                     0.9654638767242432      ;; min_call_time
                     1.0051724910736084      ;; max_call_time
                     61.01249727803071]]]]

        req  (request "metric_data" data)
        resp (handler req)]
    (t/is (http-predicates/ok? resp))))

(t/deftest transaction-sample-data
  (let [handler  (handler/build)
        agent-id (setup-agent handler)
        data     [agent-id
                  [[1561637628907
                    10303
                    "Controller/pages/show"
                    "/fast_forward/"
                    "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\nNA==\n"
                    "91f1f7cc9df42d1b"
                    nil
                    false
                    nil
                    nil]]]
        req      (request "transaction_sample_data" data)
        resp     (handler req)]
    (t/is (http-predicates/ok? resp))))

(t/deftest analytic-event-data
  (let [handler   (handler/build)
        agent-id  (setup-agent handler)
        now       (-> (Instant/now) (u.time/instant->double))
        data      [agent-id
                   {"reservoir_size" 1200, "events_seen" 2}
                   [[{"externalCallCount" 8,
                      "priority"          0.781743,
                      "externalDuration"  0.9943344593048096,
                      "error"             false,
                      "timestamp"         now,
                      "nr.apdexPerfZone"  "F",
                      "name"              "Controller/main_page/show",
                      "duration"          14.987826347351074,
                      "type"              "Transaction",
                      "databaseCallCount" 17,
                      "databaseDuration"  0.4411029815673828}
                     {}
                     {"request.headers.host"         "localhost",
                      "request.headers.accept"       "*/*",
                      "request.headers.userAgent"    "Ruby",
                      "request.method"               "GET",
                      "httpResponseCode"             "200",
                      "response.headers.contentType" "text/html; charset=utf-8"}]
                    [{"priority"         0.388966,
                      "error"            false,
                      "timestamp"        now,
                      "nr.apdexPerfZone" "S",
                      "name"             "Controller/Middleware/Rack/Rack::Rewrite/call",
                      "duration"         0.004479408264160156,
                      "type"             "Transaction"}
                     {}
                     {"request.headers.host"         "localhost",
                      "request.headers.accept"       "*/*",
                      "request.headers.userAgent"    "Ruby",
                      "request.method"               "GET",
                      "httpResponseCode"             "301",
                      "response.headers.contentType" "application/octet-stream"}]]]
        req       (request "analytic_event_data" data)
        resp      (handler req)]
    (t/is (http-predicates/ok? resp))))

(t/deftest error-data
  (let [handler  (handler/build)
        agent-id (setup-agent handler)
        now      (-> (Instant/now) (u.time/instant->double))
        data     [agent-id
                  [[now
                    "Controlller/foo/bar"
                    "error msg"
                    "Error Class"
                    {"agentAttributes" {"request.headers.host"         "localhost",
                                        "request.headers.accept"       "*/*",
                                        "request.headers.userAgent"    "Ruby",
                                        "request.uri"                  "/",
                                        "request.method"               "GET",
                                        "httpResponseCode"             "500",
                                        "response.headers.contentType" "text/plain; charset=utf-8"},
                     "userAttributes"  {},
                     "error.expected"  false,
                     "stack_trace"     ["foo/bar"],
                     "intrinsics"      {"priority" 0.988318, "cpu_time" 0.16533800000000554}}]]]
        req      (request "error_data" data)
        resp     (handler req)]
    (t/is (http-predicates/ok? resp))))
