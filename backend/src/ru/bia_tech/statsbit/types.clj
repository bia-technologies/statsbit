(ns ru.bia-tech.statsbit.types
  (:require
   [jdbc.proto]
   [jsonista.core :as json])
  (:import
   [java.sql Timestamp]
   [java.time Instant]
   [org.postgresql.util PGobject]
   [java.util Collection]
   [clojure.lang IPersistentMap]))

(extend-protocol jdbc.proto/ISQLType
  Instant
  (set-stmt-parameter! [self conn stmt index]
    (let [sql-val (Timestamp/from self)]
      (.setObject stmt index sql-val)))

  IPersistentMap
  (as-sql-type [self conn]
    (doto (PGobject.)
      (.setType "jsonb")
      (.setValue (json/write-value-as-string self))))

  (set-stmt-parameter! [self conn stmt index]
    (.setObject stmt index (jdbc.proto/as-sql-type self conn)))

  Collection
  (as-sql-type [this conn]
    (to-array (map #(jdbc.proto/as-sql-type % conn) this)))
  (set-stmt-parameter! [this conn stmt index]
    (let [scalar-type (-> stmt
                          (.getParameterMetaData)
                          (.getParameterTypeName index)
                          (subs 1))
          sql-val     (.createArrayOf conn scalar-type
                                      (jdbc.proto/as-sql-type this conn))]
      (.setObject stmt index sql-val))))


(defmulti from-pgobject (fn [obj] (.getType obj)))
(defmethod from-pgobject :default [obj] obj)

(extend-protocol jdbc.proto/ISQLResultSetReadColumn
  PGobject
  (from-sql-type [this _conn _metadata _i]
    (from-pgobject this))

  Timestamp
  (from-sql-type [this _conn _metadata _i]
    (.toInstant this)))

(defmethod from-pgobject "json" [obj]
  (let [val (.getValue obj)]
    (json/read-value val)))
