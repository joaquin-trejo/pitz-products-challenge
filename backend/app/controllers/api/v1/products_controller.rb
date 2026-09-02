module Api
  module V1
    class ProductsController < ApplicationController
      wrap_parameters false

      rescue_from ActiveRecord::RecordNotFound, with: :product_not_found

      def index
        products = Product.all

        render json: { data: products.map { |product| product_json(product) } }
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
