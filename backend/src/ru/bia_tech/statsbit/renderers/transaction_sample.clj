(ns ru.bia-tech.statsbit.renderers.transaction-sample
  (:require
   [jsonista.core :as json]
   [clojure.string :as str]
   [hiccup2.core :as h]
   [clojure.test :as t]))

(defn- pretty-json [val]
  (let [mapper (json/object-mapper {:pretty true})]
    (json/write-value-as-string val mapper)))

(defn- format-ms [ms]
  (format "%dms" ms))

(defn- format-percent [percent]
  (format "%.2f%%" (float (* 100 percent))))

(defn- linearize-tree
  ([tree total-duration] (linearize-tree tree total-duration [] 0))
  ([tree total-duration acc deep]
   (let [entry             (long (tree 0))
         exit              (long (tree 1))
         metric-name       (tree 2)
         params            (tree 3)
         children          (tree 4)
         children-nodes    (reduce (fn [acc item] (linearize-tree item
                                                                  total-duration
                                                                  acc
                                                                  (inc deep)))
                                   []
                                   children)
         children-duration (->> children-nodes
                                (map :self-duration)
                                (reduce +))
         duration          (- exit entry)
         self-duration     (- duration children-duration)
         self-percent      (/ self-duration total-duration)
         node              {:entry         entry
                            :exit          exit
                            :metric-name   metric-name
                            :params        params
                            :deep          deep
                            :duration      duration
                            :self-duration self-duration
                            :self-percent  self-percent}]
     (-> acc
         (conj node)
         (into children-nodes)))))

(defn- table [nodes]
  (let [items       (->> nodes
                         (group-by :metric-name)
                         (map (fn [[metric-name group]]
                                {:metric-name   metric-name
                                 :count         (count group)
                                 :self-duration (->> group (map :self-duration) (reduce +))
                                 :self-percent  (->> group (map :self-percent)  (reduce +))}))
                         (sort-by :self-percent)
                         (reverse))
        main-items  (take 6 items)
        other-items (drop 6 items)
        other       {:metric-name   "Other"
                     :count         1
                     :self-duration (->> other-items (map :self-duration) (reduce +))
                     :self-percent  (->> other-items (map :self-percent)  (reduce +))}]
    (concat main-items [other])))

(defn- render-linearized-node [node]
  (let [deep          (:deep node)
        duration      (:duration node)
        self-duration (:self-duration node)
        self-percent  (:self-percent node)
        entry         (:entry node)
        exit          (:exit node)
        metric-name   (:metric-name node)
        params        (:params node)
        prefix        (->> "&nbsp;" (repeat (* 2 deep)) (str/join) (h/raw))
        td-style      (cond-> {}
                        (not-empty params) (assoc :rowspan 2))
        tr-style      (cond-> {}
                        (> self-percent 0.10) (assoc :bgcolor "lightgray"))]
    (h/html
     [:tr tr-style
      [:td td-style (format-ms entry)]
      #_[:td td-style exit]
      #_[:td td-style (format "%dms" duration)]
      [:td td-style (format-ms self-duration)]
      [:td td-style (format-percent self-percent)]
      #_[:td td-style deep]
      [:td prefix metric-name]]
     (when (not-empty params)
       [:tr tr-style
        [:td
         [:pre (pretty-json params)]]]))))

(defn- render-tree [nodes]
  (let [rendered (map render-linearized-node nodes)
        th-style {:nowrap true}]
    (h/html
     [:h1 "Trace details"]
     [:table
      [:thead
       [:tr
        [:th th-style "entry"]
        #_[:th th-style "exit"]
        #_[:th th-style "duration"]
        [:th th-style "self duration"]
        [:th th-style "percent"]
        #_[:th th-style "deep"]
        [:th th-style "metric"]]]
      [:tbody rendered]])))

(defn- render-table-row [row]
  (h/html
   [:tr
    [:td (:metric-name row)]
    [:td (:count row)]
    [:td (format-ms (:self-duration row))]
    [:td (format-percent (:self-percent row))]]))

(defn- render-table [tbl]
  (h/html
   [:h1 "Summary"]
   [:table
    [:thead
     [:tr
      [:th "metric"]
      [:th "count"]
      [:th "duration"]
      [:th "percent"]]]
    [:tbody
     (map render-table-row tbl)]]))

(defn- render-attrs [attrs]
  (h/html
   [:h1 "Transaction attributes"]
   [:pre (pretty-json attrs)]))

(defn- render-default [data]
  (let [tree       (data 3)
        duration   (get-in data [3 1])
        attrs      (data 4)
        nodes      (linearize-tree tree duration)
        tbl        (table nodes)
        tbl-html   (render-table tbl)
        attrs-html (render-attrs attrs)
        tree-html  (render-tree nodes)]
    (str (h/html tbl-html
                 [:br]
                 attrs-html
                 [:br]
                 tree-html))))

(defn- decompress-python [node dict]
  (update node :metric-name
          (fn [name]
            (if-some [idx (second (re-matches #"`(\d+)" name))]
              (dict (bigint idx))
              name))))

(defn- render-python [[data dictionary]]
  (let [tree       (data 3)
        duration   (get-in data [3 1])
        attrs      (data 4)
        nodes      (linearize-tree tree duration)
        nodes      (map #(decompress-python % dictionary) nodes)
        tbl        (table nodes)
        tbl-html   (render-table tbl)
        attrs-html (render-attrs attrs)
        tree-html  (render-tree nodes)]
    (str (h/html tbl-html
                 [:br]
                 attrs-html
                 [:br]
                 tree-html))))

(defn render [data]
  (cond
    (= 2 (count data)) (render-python data)
    :else              (render-default data)))
