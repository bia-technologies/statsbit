(ns ru.bia-tech.statsbit.utils.time
  (:require
   [ru.bia-tech.statsbit.types :as types])
  (:import
   [java.time Instant Duration]
   [java.time.temporal ChronoUnit]))

(defn num->instant [x]
  (let [line (-> (Instant/parse "2100-01-01T00:00:00.00Z")
                 (.toEpochMilli))]
    (cond
      (instance? Double x)  (if (< x Integer/MAX_VALUE)
                              (recur (int x))
                              (recur (long x)))
      (instance? Integer x) (Instant/ofEpochSecond x)
      (> x line)            (Instant/ofEpochMilli (/ x 1000))
      :else                 (Instant/ofEpochMilli x))))

(defn instant->double [x]
  (let [seconds (.getEpochSecond x)
        nanos   (.getNano x)]
   (double (+ seconds (/ nanos 1000000000)))))

;; предполагается, что start и finish отличаются примерно на минуту
(defn normalize-range [start finish]
  (let [start-rounded  (.truncatedTo start  ChronoUnit/MINUTES)
        finish-rounded (.truncatedTo finish ChronoUnit/MINUTES)

        start-rounded-milli  (.toEpochMilli start-rounded)
        finish-rounded-milli (.toEpochMilli finish-rounded)
        start-milli          (.toEpochMilli start)
        finish-milli         (.toEpochMilli finish)
        minute-milli         60000]
    (if (= start-rounded finish-rounded)
      (let [factor (/ (- finish-milli start-milli)
                      minute-milli)]
        [{:start start-rounded :factor factor}])
      (let [factor-1 (/ (- finish-rounded-milli start-milli)
                        minute-milli)
            factor-2 (/ (- finish-milli finish-rounded-milli)
                        minute-milli)]
        [{:start start-rounded :factor factor-1}
         {:start finish-rounded :factor factor-2}]))))

(defn lag-in-sec [point]
  (-> ChronoUnit/SECONDS
      (.between point (Instant/now))))
