(ns ru.bia-tech.statsbit.http.browser-test
  (:require
   [ru.bia-tech.statsbit.http.handler :as handler]
   [ru.bia-tech.statsbit.test.fixtures :as fixtures]
   #_[ru.bia-tech.statsbit.utils.time :as u.time]
   #_[ru.bia-tech.statsbit.utils.agent-id :as u.agent-id]
   [ring.mock.request :as mock.request]
   [ring.util.http-predicates :as http-predicates]
   [jsonista.core :as json]
   [clojure.test :as t]
   [clojure.string :as str])
  #_(:import
     [java.time Instant]))

(t/use-fixtures :each fixtures/each)

(defn- request [method endpoint query body]
  (-> (mock.request/request method (->> ["browser" endpoint "1" "unused-license-key"]
                                        (filter some?)
                                        (str/join "/")
                                        (str "/")))
      (mock.request/query-string query)
      (mock.request/body body)))

#_(defn- setup-agent [handler]
    (let [req  (request "connect" [{:app_name ["test app"]
                                    :host     "test"}])]
      (-> req
          (handler)
          :body
          json/read-value
          (get-in ["return_value" "agent_run_id"]))))

(t/deftest rum
  ;; function sendRUM (nr)
  ;; дерграется 1 раз и вроде после полной загрузки страницы
  (let [query   {:a     717224209 ;; applicationID
                 :sa    1 ;; nr.info.sa берется из сниппета
                 :v     "1184.ab39b52" ;; version
                 :t     "Unnamed Transaction" ;; transaction name
                 :rst   18094 ;; nr.now() разница таймстампов, похоже, что сколько миллисекунд с загрузки скрипта до отправки данных
                 :ck    0 ;; cookies enabled 0/1
                 :ref   "https://www.dellin.stage/" ;; encode.param('ref', cleanURL(locationUtil.getLocation()))
                 :be    204 ;;total_be_time - the total roundtrip time of the remote service call
                 :fe    18076 ;; fe_time - the time spent rendering the result of the service call (or user defined)
                 :dc    580 ;; dom_time - the time spent processing the result of the service call (or user defined)
                 :af    "err,xhr,stn,ins,spa" ;; features
                 :perf  (json/write-value-as-string
                         ;; var offset = pt['navigation' + START]
                         ;; v.of = offset
                         ;; addRel(offset, offset, v, 'n')
                         ;; addRel(pt[UNLOAD_EVENT + START], offset, v, 'u')
                         ;; addRel(pt[REDIRECT + START], offset, v, 'r')
                         ;; addRel(pt[UNLOAD_EVENT + END], offset, v, 'ue')
                         ;; addRel(pt[REDIRECT + END], offset, v, 're')
                         ;; addRel(pt['fetch' + START], offset, v, 'f')
                         ;; addRel(pt[DOMAIN_LOOKUP + START], offset, v, 'dn')
                         ;; addRel(pt[DOMAIN_LOOKUP + END], offset, v, 'dne')
                         ;; addRel(pt['c' + ONNECT + START], offset, v, 'c')
                         ;; addRel(pt['secureC' + ONNECT + 'ion' + START], offset, v, 's')
                         ;; addRel(pt['c' + ONNECT + END], offset, v, 'ce')
                         ;; addRel(pt[REQUEST + START], offset, v, 'rq')
                         ;; addRel(pt[RESPONSE + START], offset, v, 'rp')
                         ;; addRel(pt[RESPONSE + END], offset, v, 'rpe')
                         ;; addRel(pt.domLoading, offset, v, 'dl')
                         ;; addRel(pt.domInteractive, offset, v, 'di')
                         ;; addRel(pt[DOM_CONTENT_LOAD_EVENT + START], offset, v, 'ds')
                         ;; addRel(pt[DOM_CONTENT_LOAD_EVENT + END], offset, v, 'de')
                         ;; addRel(pt.domComplete, offset, v, 'dc')
                         ;; addRel(pt[LOAD_EVENT + START], offset, v, 'l')
                         ;; addRel(pt[LOAD_EVENT + END], offset, v, 'le')

                         {:timing     {:of  1602588824857
                                       :n   0
                                       :u   53
                                       :ue  53
                                       :f   20
                                       :dn  20
                                       :dne 20
                                       :c   20
                                       :ce  20
                                       :rq  22
                                       :rp  44
                                       :rpe 44
                                       :dl  56
                                       :di  579
                                       :ds  579
                                       :de  580
                                       :dc  18073
                                       :l   18073
                                       :le  18084}
                          ;; // Add Performance Navigation values to the given object
                          ;; function addPN (pn, v) {
                          ;;                         addRel(pn.type, 0, v, 'ty')
                          ;;                         addRel(pn.redirectCount, 0, v, 'rc')
                          ;;                         return v}
                          :navigation {:ty 1}})

                 ;; if (entry.name === 'first-paint') {
                 ;;   chunksForQueryString.push(encode.param('fp',
                 ;;                                          String(Math.floor(entry.startTime))))
                 ;; } else if (entry.name === 'first-contentful-paint') {
                 ;;   chunksForQueryString.push(encode.param('fcp',
                 ;;                                          String(Math.floor(entry.startTime))))
                 ;; }
                 :fp    635
                 :fcp   635
                 :jsonp "NREUM.setToken"}
        req     (request :get nil query nil)
        handler (handler/build)
        resp    (handler req)]
    (t/is (http-predicates/ok? resp))))

;; у events есть как bel.6, так и bel.7 %)
