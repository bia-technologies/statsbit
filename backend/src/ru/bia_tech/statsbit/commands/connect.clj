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

(ns ru.bia-tech.statsbit.commands.connect
  (:require
   [ru.bia-tech.statsbit.context :as ctx]
   [ru.bia-tech.statsbit.utils.agent-id :as u.agent-id]
   [clojure.string :as str]
   [hugsql.core :as hugsql]
   [clojure.java.io :as io]))

(hugsql/def-db-fns "ru/bia_tech/statsbit/commands/connect.sql" {:quoting :ansi})

(defn process [req]
  (let [data         (-> req :body first)
        backend-host (get-in req [:headers "host"])
        app-name     (as-> data <>
                       (get <> "app_name")
                       (str/join "," <>))
        host         (get data "host")
        app-id       (:id (upsert-app ctx/*conn* {:name app-name}))
        server-id    (:id (upsert-server ctx/*conn* {:app-id app-id
                                                     :host   host}))
        agent-id     (u.agent-id/build app-id server-id)]
    {:agent_run_id                     agent-id
     :xray_session.enabled             false
     :error_collector.enabled          true
     :cross_application_tracer.enabled false

     :encoding_key       "some-key" ;; for python
     :collect_traces     true
     :collect_errors     true
     :data_report_period 60

     ;; там был еще минифицированный вариант, и я уже не помню, где достал полный
     :js_agent_loader (-> "browser/js_agent_loader.js" io/resource slurp)
     :application_id  app-id
     :js_agent_file   (str backend-host "/js-agent/nr-1169.js")
     :beacon          (str backend-host "/browser")
     :error_beacon    (str backend-host "/browser")
     :browser_key     "my-browser-key"}))

;; `return_value.request_headers_map` будет мержиться к последующим запросам.
;; `return_value.agent_run_id` передается первым значением в векторе запроса
;; можно передать вот эти, и они замержатся к конфигу агента
;; account_id
;; apdex_t
;; application_id
;; beacon
;; browser_key
;; browser_monitoring.debug
;; browser_monitoring.loader
;; browser_monitoring.loader_version
;; cross_process_id
;; data_report_period
;; data_report_periods.analytic_event_data
;; error_beacon
;; js_agent_file
;; js_agent_loader
;; max_payload_size_in_bytes
;; primary_application_id
;; sampling_target
;; sampling_target_period_in_seconds
;; trusted_account_ids
;; trusted_account_key




;; там вроде бы было 2 js файла для мониторинга, для SPA и для "обычных"

;; browser_monitoring.auto_instrument должен быть включен, на коллекторе он выключен.
