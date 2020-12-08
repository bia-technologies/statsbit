(ns ru.bia-tech.statsbit.config
  (:refer-clojure :exclude [read])
  (:require
   [clojure.java.io :as io]
   [aero.core :as aero]))

(defn read [profile]
  (let [url  (io/resource "config.edn")
        opts {:profile profile}]
    (aero/read-config url opts)))
