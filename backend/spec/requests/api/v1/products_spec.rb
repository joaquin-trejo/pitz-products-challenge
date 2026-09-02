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

  def bad_request_error
    {
      "error" => {
        "code" => "bad_request",
        "message" => "Invalid request parameters"
      }
    }
  end

  describe "GET /api/v1/products" do
    it "returns 200" do
      get "/api/v1/products"

      expect(response).to have_http_status(:ok)
    end

    it "returns Product data with pagination metadata" do
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
        ],
        "meta" => {
          "page" => 1,
          "per_page" => 10,
          "total_pages" => 1,
          "total_count" => 1
        }
      )
    end

    describe "pagination" do
      it "defaults to page 1 when page is missing" do
        get "/api/v1/products"

        expect(response).to have_http_status(:ok)
        expect(json["meta"]["page"]).to eq(1)
      end

      it "returns at most 10 products per page" do
        11.times do |index|
          create_product!(name: "Product #{index}", sku: "PAGE-MAX-#{index}")
        end

        get "/api/v1/products"

        expect(response).to have_http_status(:ok)
        expect(json["data"].size).to eq(10)
        expect(json["meta"]).to include(
          "page" => 1,
          "per_page" => 10,
          "total_pages" => 2,
          "total_count" => 11
        )
      end

      it "returns the next records on page 2" do
        products = 11.times.map do |index|
          create_product!(name: "Product #{index}", sku: "PAGE-2-#{index}")
        end
        ordered_ids = products.sort_by { |product| [ -product.created_at.to_f, -product.id ] }.map(&:id)

        get "/api/v1/products", params: { page: 2 }

        expect(response).to have_http_status(:ok)
        expect(json["data"].map { |item| item["id"] }).to eq(ordered_ids[10..])
        expect(json["meta"]["page"]).to eq(2)
      end

      it "accepts a leading-zero page value as a positive integer" do
        create_product!(sku: "PAGE-01")

        get "/api/v1/products", params: { page: "01" }

        expect(response).to have_http_status(:ok)
        expect(json["meta"]["page"]).to eq(1)
      end

      it "returns 200 with empty data for a positive out-of-range page" do
        create_product!(sku: "PAGE-OOR")

        get "/api/v1/products", params: { page: 5 }

        expect(response).to have_http_status(:ok)
        expect(json["data"]).to eq([])
        expect(json["meta"]).to eq(
          "page" => 5,
          "per_page" => 10,
          "total_pages" => 1,
          "total_count" => 1
        )
      end

      it "returns 400 when page is explicitly blank" do
        get "/api/v1/products?page="

        expect(response).to have_http_status(:bad_request)
        expect(json).to eq(bad_request_error)
      end

      it "returns 400 when page is zero" do
        get "/api/v1/products", params: { page: 0 }

        expect(response).to have_http_status(:bad_request)
        expect(json).to eq(bad_request_error)
      end

      it "returns 400 when page is negative" do
        get "/api/v1/products", params: { page: -1 }

        expect(response).to have_http_status(:bad_request)
        expect(json).to eq(bad_request_error)
      end

      it "returns 400 when page is malformed" do
        get "/api/v1/products", params: { page: "abc" }

        expect(response).to have_http_status(:bad_request)
        expect(json).to eq(bad_request_error)
      end
    end

    describe "search" do
      it "returns partial case-insensitive name matches with filtered metadata" do
        matching = create_product!(name: "Wireless Mouse", sku: "SEARCH-REQ-1")
        create_product!(name: "USB Keyboard", sku: "SEARCH-REQ-2")

        get "/api/v1/products", params: { search: "mouse" }

        expect(response).to have_http_status(:ok)
        expect(json["data"].map { |item| item["id"] }).to eq([ matching.id ])
        expect(json["meta"]).to include(
          "total_count" => 1,
          "total_pages" => 1
        )
      end
    end

    describe "active filter" do
      it "returns all products when active is missing" do
        active = create_product!(sku: "FILTER-ALL-1", active: true)
        inactive = create_product!(name: "Inactive Product", sku: "FILTER-ALL-2", active: false)

        get "/api/v1/products"

        expect(response).to have_http_status(:ok)
        expect(json["data"].map { |item| item["id"] }).to contain_exactly(active.id, inactive.id)
      end

      it "returns only active products when active=true" do
        active = create_product!(sku: "FILTER-TRUE-1", active: true)
        create_product!(name: "Inactive Product", sku: "FILTER-TRUE-2", active: false)

        get "/api/v1/products", params: { active: "true" }

        expect(response).to have_http_status(:ok)
        expect(json["data"].map { |item| item["id"] }).to eq([ active.id ])
      end

      it "returns only inactive products when active=false" do
        create_product!(sku: "FILTER-FALSE-1", active: true)
        inactive = create_product!(name: "Inactive Product", sku: "FILTER-FALSE-2", active: false)

        get "/api/v1/products", params: { active: "false" }

        expect(response).to have_http_status(:ok)
        expect(json["data"].map { |item| item["id"] }).to eq([ inactive.id ])
      end

      it "returns 400 for an invalid active value" do
        get "/api/v1/products", params: { active: "maybe" }

        expect(response).to have_http_status(:bad_request)
        expect(json).to eq(bad_request_error)
      end
    end

    describe "combined search, active filter, and pagination" do
      it "filters before pagination and reports filtered metadata" do
        matching_active = 11.times.map do |index|
          create_product!(name: "Alpha Gadget #{index}", sku: "COMBO-A-#{index}", active: true)
        end
        create_product!(name: "Alpha Gadget Inactive", sku: "COMBO-I-1", active: false)
        create_product!(name: "Beta Device", sku: "COMBO-B-1", active: true)

        get "/api/v1/products", params: { search: "Alpha", active: "true", page: 1 }

        expect(response).to have_http_status(:ok)
        expect(json["data"].size).to eq(10)
        expect(json["data"].map { |item| item["id"] }).to all(be_in(matching_active.map(&:id)))
        expect(json["meta"]).to eq(
          "page" => 1,
          "per_page" => 10,
          "total_pages" => 2,
          "total_count" => 11
        )
      end
    end

    describe "ordering" do
      it "returns products newest-first by created_at then id" do
        older = create_product!(name: "Older Product", sku: "ORDER-1")
        same_time_lower_id = create_product!(name: "Same Time Lower Id", sku: "ORDER-2")
        same_time_higher_id = create_product!(name: "Same Time Higher Id", sku: "ORDER-3")

        shared_created_at = 1.day.ago
        older.update_columns(created_at: 2.days.ago)
        same_time_lower_id.update_columns(created_at: shared_created_at)
        same_time_higher_id.update_columns(created_at: shared_created_at)

        get "/api/v1/products"

        expect(json["data"].map { |item| item["id"] }).to eq(
          [ same_time_higher_id.id, same_time_lower_id.id, older.id ]
        )
      end
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
      expect(json).to eq(bad_request_error)
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
      allow(Product).to receive(:search_by_name).and_raise(StandardError, "secret sql detail")

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
