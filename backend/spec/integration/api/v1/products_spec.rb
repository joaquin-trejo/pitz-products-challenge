# frozen_string_literal: true

require 'swagger_helper'

RSpec.describe 'API V1 Products', type: :request do
  after do |example|
    next if response.body.blank?
    next unless response.content_type&.include?('application/json')

    example.metadata[:response][:content] ||= {}
    example.metadata[:response][:content]['application/json'] ||= {}
    example.metadata[:response][:content]['application/json'][:example] = JSON.parse(response.body)
  end

  path '/api/v1/products' do
    get 'List Products' do
      tags 'Products'
      produces 'application/json'
      parameter name: :page, in: :query, schema: { type: :integer, minimum: 1, example: 1 }, required: false
      parameter name: :search, in: :query, schema: { type: :string, example: 'mouse' }, required: false
      parameter name: :active, in: :query, schema: { type: :boolean, example: true }, required: false

      response '200', 'products listed' do
        schema '$ref' => '#/components/schemas/products_collection_response'

        before do
          Product.create!(name: 'Wireless Mouse', price: '29.99', stock: 120, sku: 'SEED-MOUSE-01', active: true)
          Product.create!(name: 'Mechanical Keyboard', price: '99.00', stock: 50, sku: 'SEED-KEYBOARD-01', active: false)
        end

        run_test!
      end

      response '400', 'invalid query params' do
        schema '$ref' => '#/components/schemas/error_response'
        let(:page) { 0 }

        run_test!
      end
    end

    post 'Create Product' do
      tags 'Products'
      consumes 'application/json'
      produces 'application/json'
      parameter name: :product_params, in: :body, schema: {
        type: :object,
        required: ['product'],
        properties: {
          product: { '$ref' => '#/components/schemas/product_input' }
        },
        example: {
          product: {
            name: 'Brake Pad',
            description: 'Front brake pad',
            price: '45.50',
            stock: 8,
            sku: 'BRAKE-PAD-001',
            active: true
          }
        }
      }

      response '201', 'product created' do
        schema '$ref' => '#/components/schemas/single_product_response'
        let(:product_params) do
          {
            product: {
              name: 'Brake Pad',
              description: 'Front brake pad',
              price: '45.50',
              stock: 8,
              sku: 'BRAKE-PAD-001',
              active: true
            }
          }
        end

        run_test!
      end

      response '422', 'validation failed' do
        schema '$ref' => '#/components/schemas/validation_error_response'
        let(:product_params) do
          {
            product: {
              name: 'AB',
              price: '45.50',
              stock: 8,
              sku: 'BRAKE-PAD-INVALID',
              active: true
            }
          }
        end

        run_test!
      end

      response '400', 'invalid body shape' do
        schema '$ref' => '#/components/schemas/error_response'
        let(:product_params) { { name: 'Invalid Payload' } }

        run_test!
      end
    end
  end

  path '/api/v1/products/{id}' do
    parameter name: :id, in: :path, schema: { type: :integer }

    get 'Show Product' do
      tags 'Products'
      produces 'application/json'

      response '200', 'product found' do
        schema '$ref' => '#/components/schemas/single_product_response'
        let(:id) { Product.create!(name: 'Router', price: '89.90', stock: 30, sku: 'ROUTER-01').id }

        run_test!
      end

      response '404', 'product not found' do
        schema '$ref' => '#/components/schemas/error_response'
        let(:id) { 0 }

        run_test!
      end
    end

    put 'Update Product' do
      tags 'Products'
      consumes 'application/json'
      produces 'application/json'
      parameter name: :product_params, in: :body, schema: {
        type: :object,
        required: ['product'],
        properties: {
          product: { '$ref' => '#/components/schemas/product_input' }
        },
        example: {
          product: {
            name: 'Updated Name',
            description: nil,
            price: '12.50',
            stock: 10,
            sku: 'UPDATE-01',
            active: false
          }
        }
      }

      let(:existing_product) do
        Product.create!(name: 'Old Name', price: '12.00', stock: 9, sku: 'UPDATE-01', active: true)
      end
      let(:id) { existing_product.id }

      response '200', 'product updated' do
        schema '$ref' => '#/components/schemas/single_product_response'
        let(:product_params) do
          {
            product: {
              name: 'Updated Name',
              description: nil,
              price: '12.50',
              stock: 10,
              sku: 'UPDATE-01',
              active: false
            }
          }
        end

        run_test!
      end

      response '422', 'validation failed' do
        schema '$ref' => '#/components/schemas/validation_error_response'
        let(:product_params) do
          {
            product: {
              name: 'AB',
              price: '12.50',
              stock: 10,
              sku: 'UPDATE-01',
              active: false
            }
          }
        end

        run_test!
      end

      response '404', 'product not found' do
        schema '$ref' => '#/components/schemas/error_response'
        let(:id) { 0 }
        let(:product_params) do
          {
            product: {
              name: 'Missing Product',
              price: '12.50',
              stock: 10,
              sku: 'MISSING-01',
              active: false
            }
          }
        end

        run_test!
      end
    end

    delete 'Delete Product' do
      tags 'Products'
      produces 'application/json'

      response '204', 'product deleted' do
        let(:id) { Product.create!(name: 'To Delete', price: '10.00', stock: 1, sku: 'DELETE-01').id }

        run_test!
      end

      response '404', 'product not found' do
        schema '$ref' => '#/components/schemas/error_response'
        let(:id) { 0 }

        run_test!
      end
    end
  end
end
