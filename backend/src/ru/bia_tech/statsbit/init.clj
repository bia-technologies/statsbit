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
