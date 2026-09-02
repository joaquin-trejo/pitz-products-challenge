class ApplicationController < ActionController::API
  unless Rails.env.development?
    rescue_from StandardError, with: :internal_server_error
  end

  rescue_from ActionController::ParameterMissing, with: :bad_request
  rescue_from ActionController::BadRequest, with: :bad_request

  private

  def bad_request
    render json: {
      error: {
        code: "bad_request",
        message: "Invalid request parameters"
      }
    }, status: :bad_request
  end

  def internal_server_error(exception)
    Rails.logger.error(exception.full_message)

    render json: {
      error: {
        code: "internal_server_error",
        message: "Something went wrong"
      }
    }, status: :internal_server_error
  end
end
