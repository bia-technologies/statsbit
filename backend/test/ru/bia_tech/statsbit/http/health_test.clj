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
