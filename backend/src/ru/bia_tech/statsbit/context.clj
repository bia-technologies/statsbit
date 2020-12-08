(ns ru.bia-tech.statsbit.context)

;; я не расчитываю, что код приложения будет явно создавать треды
;; передовать это соединение в другой поток нельзя
(declare ^:dynamic *conn*)

(declare ^{:dynamic true, :arglists '([throwable context])} *log-ex*)
