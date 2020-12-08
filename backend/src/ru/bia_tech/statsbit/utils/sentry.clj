(ns ru.bia-tech.statsbit.utils.sentry
  (:import
   [io.sentry.event EventBuilder Event$Level]
   [io.sentry.event.interfaces ExceptionInterface]))

(defn throwable->event-builder [throwable context]
  (.. (EventBuilder.)
      (withLevel Event$Level/ERROR)
      (withMessage (ex-message throwable))
      (withSentryInterface (ExceptionInterface. throwable))
      (withExtra "ex-data" (ex-data throwable))
      (withExtra "context" context)))

(defn send-ex [sentry throwable context]
  (let [eventBuilder (throwable->event-builder throwable context)]
    (.sendEvent sentry eventBuilder)))
