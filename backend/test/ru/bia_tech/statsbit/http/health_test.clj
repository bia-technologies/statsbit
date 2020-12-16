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

(ns ru.bia-tech.statsbit.http.health-test
  (:require
   [ru.bia-tech.statsbit.http.handler :as handler]
   [ru.bia-tech.statsbit.test.fixtures :as fixtures]
   [ring.mock.request :as mock.request]
   [ring.util.http-predicates :as http-predicates]
   [clojure.test :as t]))

(t/use-fixtures :each fixtures/each)

(t/deftest health
  (let [handler (handler/build)
        req     (mock.request/request :get "/health")
        resp    (handler req)]
    (t/is (http-predicates/ok? resp))))
