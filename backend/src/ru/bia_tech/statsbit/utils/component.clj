(ns ru.bia-tech.statsbit.utils.component
  (:require
   [com.stuartsierra.component :as component]))

(defrecord Derefable [value init dispose]
  clojure.lang.IDeref
  (deref [_] value)

  component/Lifecycle
  (start [this]
    (if (some? value)
      this
      (assoc this :value (init this))))
  (stop [this]
    (if (some? value)
      (do
        (dispose value)
        (assoc this :value nil))
      this)))

(defn derefable [config]
  (map->Derefable (merge {:init    (constantly nil)
                          :dispose (constantly nil)}
                         config)))
