require 'json'
require "bundler/setup"
Bundler.require

class RetryWrapper
  def initialize(m)
    @m = m
  end

  def call
    @m.call
  rescue => e
    p e
    sleep 1
    retry
  end
end

class Generator
  def initialize
    @thread = nil
    @http = HTTP.persistent "http://web:3000"
    @post_ids = []
  end

  def start
    @thread = Thread.new { main_loop }
    self
  end

  def join
    @thread.join
  end

  private

  def main_loop
    %i[create_post get_posts get_post]
      .map { |sym| method sym }
      .map { |m| RetryWrapper.new m }
      .cycle
      .each(&:call)
  end

  def create_post
    form = {
      "post[title]" => Faker::Lorem.sentence(word_count: 3),
      "post[body]"  => Faker::Lorem.paragraph,
    }
    resp = @http.post("/posts", form: form).flush
    @post_ids << JSON.parse(resp.body) if resp.status.success?
  end

  def get_posts
    @http.get("/posts").flush
  end

  def get_post
    @http.get("/posts/#{@post_ids.sample}").flush
  end
end

10.times
  .map { Generator.new }
  .map(&:start)
  .each(&:join)
