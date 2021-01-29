class PostsController < ApplicationController
  skip_before_action :verify_authenticity_token

  before_action :effects
  before_action :set_post, only: [:show, :edit, :update, :destroy]

  def index
    @posts = Post.limit(rand 100)
    render json: @posts
  end

  def show
    render json: @post
  end

  def create
    @post = Post.new(post_params)
    if @post.save
      render json: @post.id, status: 201
    else
      render json: "Errors!", status: 422
    end
  end

  private

  def set_post
    @post = Post.find(params[:id])
  end

  def post_params
    params.require(:post).permit(:title, :body)
  end

  def effects
    case rand 100
    when 0 then raise "Test exception A"
    when 1 then raise "Test exception B"
    when 2 then 0 / 0
    when 3 then sleep 3 * rand
    else sleep rand / 100
    end
  end
end
