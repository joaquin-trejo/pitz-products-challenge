module Api
  module V1
    class ProductsController < ApplicationController
      PER_PAGE = 10

      wrap_parameters false

      rescue_from ActiveRecord::RecordNotFound, with: :product_not_found

      def index
        page = parse_page_param
        active = parse_active_param

        filtered = Product.search_by_name(params[:search]).filter_by_active(active)
        total_count = filtered.count
        total_pages = total_count.zero? ? 0 : (total_count + PER_PAGE - 1) / PER_PAGE

        products = filtered
          .order(created_at: :desc, id: :desc)
          .offset((page - 1) * PER_PAGE)
          .limit(PER_PAGE)

        render json: {
          data: products.map { |product| product_json(product) },
          meta: {
            page: page,
            per_page: PER_PAGE,
            total_pages: total_pages,
            total_count: total_count
          }
        }
      end

      def show
        product = Product.find(params[:id])

        render json: { data: product_json(product) }
      end

      def create
        product = Product.new(product_params)

        if product.save
          render json: { data: product_json(product) }, status: :created
        else
          render json: { errors: product.errors.to_hash }, status: :unprocessable_entity
        end
      end

      def update
        product = Product.find(params[:id])

        if product.update(product_params)
          render json: { data: product_json(product) }
        else
          render json: { errors: product.errors.to_hash }, status: :unprocessable_entity
        end
      end

      def destroy
        product = Product.find(params[:id])
        product.destroy!

        head :no_content
      end

      private

      def product_params
        params.require(:product).permit(:name, :description, :price, :stock, :sku, :active)
      end

      def parse_page_param
        return 1 unless params.key?(:page)

        raw = params[:page]
        raise ActionController::BadRequest unless raw.is_a?(String)

        raise ActionController::BadRequest if raw.empty?
        raise ActionController::BadRequest unless raw.match?(/\A\d+\z/)

        page = raw.to_i
        raise ActionController::BadRequest if page < 1

        page
      end

      def parse_active_param
        return nil unless params.key?(:active)

        case params[:active]
        when "true" then true
        when "false" then false
        else
          raise ActionController::BadRequest
        end
      end

      def product_json(product)
        {
          id: product.id,
          name: product.name,
          description: product.description,
          price: format_price(product.price),
          stock: product.stock,
          sku: product.sku,
          active: product.active,
          created_at: product.created_at,
          updated_at: product.updated_at
        }
      end

      def format_price(price)
        format("%.2f", price)
      end

      def product_not_found
        render json: {
          error: {
            code: "not_found",
            message: "Product not found"
          }
        }, status: :not_found
      end
    end
  end
end
