((nil
  (eval .
        (setq cider-refresh-before-fn "user/stop"
              cider-refresh-after-fn "user/start"
              cider-clojure-cli-global-options "-Adev"))))
