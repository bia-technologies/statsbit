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

(ns ru.bia-tech.statsbit.init
  (:require
   [ru.bia-tech.statsbit.types]
   [ru.bia-tech.statsbit.hooks]

   [hugsql.core :as hugsql]
   [hugsql.adapter.clojure-jdbc :as cj-adapter]
   [clojure.pprint :as pprint])
  (:import
   [clojure.lang IPersistentMap IDeref]))

;; for ru.bia-tech.statsbit.utils.component
(prefer-method print-method IPersistentMap IDeref)
(prefer-method pprint/simple-dispatch IPersistentMap IDeref)

(hugsql/set-adapter! (cj-adapter/hugsql-adapter-clojure-jdbc))
