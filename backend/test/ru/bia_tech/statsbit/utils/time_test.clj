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

(ns ru.bia-tech.statsbit.utils.time-test
  (:require
   [ru.bia-tech.statsbit.utils.time :as u.time]
   [clojure.test :as t])
  (:import
   [java.time Instant]
   [java.time.temporal ChronoUnit]))

;; (t/deftest build-ranges
;;   (let [finish          (-> (Instant/now)
;;                             (.truncatedTo ChronoUnit/MINUTES))
;;         interval-length 60
;;         amount          30
;;         result          (u.time/build-ranges finish interval-length amount)]
;;     (t/is (= amount (count result)))
;;     (t/is (= (.minus finish (* interval-length amount) ChronoUnit/SECONDS)
;;              (-> result first :start)))
;;     (t/is (= (.minus finish (* interval-length (- amount 1)) ChronoUnit/SECONDS)
;;              (-> result first :finish)))
;;     (t/is (= finish
;;              (-> result last :finish)))))

(t/deftest normalize-range
  (t/testing "small"
    (let [start  (Instant/parse "2019-01-01T12:01:01.00Z")
          finish (Instant/parse "2019-01-01T12:01:59.00Z")]
      (t/is (= [{:start  (Instant/parse "2019-01-01T12:01:00.00Z")
                 :factor (/ 58 60)}]
               (u.time/normalize-range start finish)))))
  (t/testing "different"
    (let [start  (Instant/parse "2019-01-01T12:01:15.00Z")
          finish (Instant/parse "2019-01-01T12:02:14.00Z")]
      (t/is (= [{:start  (Instant/parse "2019-01-01T12:01:00.00Z")
                 :factor (/ 45 60)}
                {:start  (Instant/parse "2019-01-01T12:02:00.00Z")
                 :factor (/ 14 60)}]
               (u.time/normalize-range start finish))))))

(t/deftest lag-in-sec
  (let [lag   10
        point (-> (Instant/now)
                  (.minusSeconds lag))]
    (t/is (= lag (u.time/lag-in-sec point)))))
