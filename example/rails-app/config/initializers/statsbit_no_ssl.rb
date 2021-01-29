module NewRelicPatch
  module NewRelicService
    def setup_connection_for_ssl(conn)
      super conn
      conn.use_ssl = false
    end
  end
end

NewRelic::Agent::NewRelicService.prepend NewRelicPatch::NewRelicService
