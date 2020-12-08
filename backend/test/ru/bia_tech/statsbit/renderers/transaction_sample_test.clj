(ns ru.bia-tech.statsbit.renderers.transaction-sample-test
  (:require
   [ru.bia-tech.statsbit.renderers.transaction-sample :as sut]
   [clojure.test :as t]))

(t/deftest render
  (let [data [1.5616376289067805E9 {} {}
              [0 10303 "ROOT" {}
               [[3 10303 "Nested/Controller/app" {}
                 [[4 10302 "Middleware/foo" {}
                   [[5 10301 "Middleware/bar" {:foo :bar}
                     []]]]]]]]
              {:attr 42}]
        html (sut/render data)]
    #_(spit "transaction-sample.html" html)
    (t/is (some? html))))

(t/deftest render-python
  (let [data [[1.5656047566888252E12 {} {}
               [0.0 16708.755493164062 "ROOT" {}
                [[0.0 16708.755493164062 "WebTransaction/Function/geysir.middleware:RequestLimiter"
                  {"exclusive_duration_millis" 0.3304481506347656}
                  [[0.10585784912109375 16708.17542076111 "`0"
                    {"exclusive_duration_millis" 0.07319450378417969}
                    [[0.1552104949951172 16708.1515789032 "`1"
                      {"exclusive_duration_millis" 0.39649009704589844}
                      [] nil]] nil]] nil]] nil]
               {:attr 42}]
              ["Python/WSGI/Application" "Function/django.core.handlers.wsgi:WSGIHandler"]]
        html (sut/render data)]
    #_(spit "transaction-sample.html" html)
    (t/is (some? html))))
