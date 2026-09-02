require "rails_helper"

RSpec.describe "Api::V1::Products", type: :request do
  def valid_product_payload(overrides = {})
    {
      name: "Valid Product",
      price: "10.50",
      stock: 5,
      sku: "SKU-001"
    }.merge(overrides)
  end

  def json
    JSON.parse(response.body)
  end

  def create_product!(overrides = {})
    Product.create!(
      {
        name: "Existing Product",
        price: "10.50",
        stock: 5,
        sku: "SKU-EXISTING"
      }.merge(overrides)
    )
  end

  describe "GET /api/v1/products" do
    it "returns 200" do
      get "/api/v1/products"

      expect(response).to have_http_status(:ok)
    end

    it "returns Product data" do
      product = create_product!(sku: "SKU-INDEX")

      get "/api/v1/products"

      expect(json).to eq(
        "data" => [
          {
            "id" => product.id,
            "name" => "Existing Product",
            "description" => nil,
            "price" => "10.50",
            "stock" => 5,
            "sku" => "SKU-INDEX",
            "active" => true,
            "created_at" => product.created_at.as_json,
            "updated_at" => product.updated_at.as_json
          }
        ]
      )
    end
  end

  describe "GET /api/v1/products/:id" do
    it "returns 200 for an existing Product" do
      product = create_product!(sku: "SKU-SHOW")

      get "/api/v1/products/#{product.id}"

      expect(response).to have_http_status(:ok)
      expect(json).to eq(
        "data" => {
          "id" => product.id,
          "name" => "Existing Product",
          "description" => nil,
          "price" => "10.50",
          "stock" => 5,
          "sku" => "SKU-SHOW",
          "active" => true,
          "created_at" => product.created_at.as_json,
          "updated_at" => product.updated_at.as_json
        }
      )
    end

    it "returns 404 with the agreed error structure for a missing Product" do
      get "/api/v1/products/0"

      expect(response).to have_http_status(:not_found)
      expect(json).to eq(
        "error" => {
          "code" => "not_found",
          "message" => "Product not found"
        }
      )
    end
  end

  describe "POST /api/v1/products" do
    it "returns 201 for a valid request" do
      post "/api/v1/products", params: { product: valid_product_payload(sku: "SKU-CREATE") }, as: :json

      expect(response).to have_http_status(:created)
    end

    it "creates a Product" do
      expect do
        post "/api/v1/products", params: { product: valid_product_payload(sku: "SKU-NEW") }, as: :json
      end.to change(Product, :count).by(1)
    end

    it "returns the agreed data wrapper" do
      post "/api/v1/products", params: { product: valid_product_payload(sku: "SKU-WRAPPER") }, as: :json

      product = Product.find_by!(sku: "SKU-WRAPPER")

      expect(json).to eq(
        "data" => {
          "id" => product.id,
          "name" => "Valid Product",
          "description" => nil,
          "price" => "10.50",
          "stock" => 5,
          "sku" => "SKU-WRAPPER",
          "active" => true,
          "created_at" => product.created_at.as_json,
          "updated_at" => product.updated_at.as_json
        }
      )
    end

    it "returns 422 with field-addressable validation errors for an invalid Product" do
      expect do
        post "/api/v1/products", params: { product: valid_product_payload(name: "AB", sku: "SKU-INVALID") }, as: :json
      end.not_to change(Product, :count)

      expect(response).to have_http_status(:unprocessable_entity)
      expect(json["errors"]).to include("name")
      expect(json["errors"]["name"]).to be_present
    end

    it "returns 400 when the Product wrapper is missing" do
      post "/api/v1/products", params: { name: "Valid Product" }, as: :json

      expect(response).to have_http_status(:bad_request)
      expect(json).to eq(
        "error" => {
          "code" => "bad_request",
          "message" => "Invalid request parameters"
        }
      )
    end
  end

  describe "PUT /api/v1/products/:id" do
    it "returns 200 for a valid update" do
      product = create_product!(sku: "SKU-UPDATE")

      put "/api/v1/products/#{product.id}",
          params: { product: valid_product_payload(name: "Updated Product", sku: "SKU-UPDATE") },
          as: :json

      expect(response).to have_http_status(:ok)
    end

    it "updates the Product" do
      product = create_product!(sku: "SKU-UPDATED")

      put "/api/v1/products/#{product.id}",
          params: { product: valid_product_payload(name: "Updated Product", sku: "SKU-UPDATED") },
          as: :json

      expect(product.reload.name).to eq("Updated Product")
    end

    it "returns 422 for an invalid update" do
      product = create_product!(sku: "SKU-UPDATE-422")
      original_name = product.name

      put "/api/v1/products/#{product.id}",
          params: { product: valid_product_payload(name: "AB", sku: "SKU-UPDATE-422") },
          as: :json

      expect(response).to have_http_status(:unprocessable_entity)
      expect(json["errors"]).to include("name")
      expect(product.reload.name).to eq(original_name)
    end

    it "returns 404 for a missing Product" do
      put "/api/v1/products/0",
          params: { product: valid_product_payload(sku: "SKU-MISSING") },
          as: :json

      expect(response).to have_http_status(:not_found)
      expect(json).to eq(
        "error" => {
          "code" => "not_found",
          "message" => "Product not found"
        }
      )
    end
  end

  describe "DELETE /api/v1/products/:id" do
    it "returns 204 for an existing Product" do
      product = create_product!(sku: "SKU-DESTROY")

      delete "/api/v1/products/#{product.id}"

      expect(response).to have_http_status(:no_content)
      expect(response.body).to be_blank
    end

    it "removes the Product" do
      product = create_product!(sku: "SKU-REMOVED")

      expect do
        delete "/api/v1/products/#{product.id}"
      end.to change(Product, :count).by(-1)
    end

    it "returns 404 for a missing Product" do
      delete "/api/v1/products/0"

      expect(response).to have_http_status(:not_found)
      expect(json).to eq(
        "error" => {
          "code" => "not_found",
          "message" => "Product not found"
        }
      )
    end
  end

  describe "unexpected server failures" do
    it "returns the agreed generic 500 response without leaking internal details" do
      allow(Product).to receive(:all).and_raise(StandardError, "secret sql detail")

      get "/api/v1/products"

      expect(response).to have_http_status(:internal_server_error)
      expect(json).to eq(
        "error" => {
          "code" => "internal_server_error",
          "message" => "Something went wrong"
        }
      )
      expect(response.body).not_to include("secret sql detail")
    end
  end
end
