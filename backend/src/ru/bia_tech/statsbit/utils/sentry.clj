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
