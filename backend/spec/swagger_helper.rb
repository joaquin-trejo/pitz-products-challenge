# frozen_string_literal: true

require 'rails_helper'

RSpec.configure do |config|
  # Specify a root folder where Swagger JSON files are generated
  # NOTE: If you're using the rswag-api to serve API descriptions, you'll need
  # to ensure that it's configured to serve Swagger from the same folder
  config.openapi_root = Rails.root.join('swagger').to_s

  # Define one or more Swagger documents and provide global metadata for each one
  # When you run the 'rswag:specs:swaggerize' rake task, the complete Swagger will
  # be generated at the provided relative path under openapi_root
  # By default, the operations defined in spec files are added to the first
  # document below. You can override this behavior by adding a openapi_spec tag to the
  # the root example_group in your specs, e.g. describe '...', openapi_spec: 'v2/swagger.json'
  config.openapi_specs = {
    'v1/swagger.yaml' => {
      openapi: '3.0.1',
      info: {
        title: 'PITZ Products API',
        version: 'v1',
        description: 'REST API for Product catalog management.'
      },
      servers: [
        {
          url: ENV.fetch('OPENAPI_SERVER_URL', '/')
        }
      ],
      paths: {},
      components: {
        schemas: {
          product: {
            type: :object,
            required: %w[id name price stock sku active created_at updated_at],
            properties: {
              id: { type: :integer },
              name: { type: :string },
              description: { type: :string, nullable: true },
              price: { type: :string },
              stock: { type: :integer },
              sku: { type: :string },
              active: { type: :boolean },
              created_at: { type: :string, format: :'date-time' },
              updated_at: { type: :string, format: :'date-time' }
            }
          },
          product_input: {
            type: :object,
            required: %w[name price stock sku],
            properties: {
              name: { type: :string, minLength: 3, maxLength: 100 },
              description: { type: :string, nullable: true, maxLength: 1000 },
              price: { type: :string },
              stock: { type: :integer, minimum: 0 },
              sku: { type: :string, pattern: '^[A-Z0-9-]+$' },
              active: { type: :boolean }
            }
          },
          products_pagination_meta: {
            type: :object,
            required: %w[page per_page total_pages total_count],
            properties: {
              page: { type: :integer },
              per_page: { type: :integer },
              total_pages: { type: :integer },
              total_count: { type: :integer }
            }
          },
          products_collection_response: {
            type: :object,
            required: %w[data meta],
            properties: {
              data: {
                type: :array,
                items: { '$ref' => '#/components/schemas/product' }
              },
              meta: { '$ref' => '#/components/schemas/products_pagination_meta' }
            }
          },
          single_product_response: {
            type: :object,
            required: %w[data],
            properties: {
              data: { '$ref' => '#/components/schemas/product' }
            }
          },
          error_detail: {
            type: :object,
            required: %w[code message],
            properties: {
              code: { type: :string },
              message: { type: :string }
            }
          },
          error_response: {
            type: :object,
            required: %w[error],
            properties: {
              error: { '$ref' => '#/components/schemas/error_detail' }
            }
          },
          validation_error_response: {
            type: :object,
            required: %w[errors],
            properties: {
              errors: {
                type: :object,
                additionalProperties: {
                  type: :array,
                  items: { type: :string }
                }
              }
            }
          }
        }
      }
    }
  }

  # Specify the format of the output Swagger file when running 'rswag:specs:swaggerize'.
  # The openapi_specs configuration option has the filename including format in
  # the key, this may want to be changed to avoid putting yaml in json files.
  # Defaults to json. Accepts ':json' and ':yaml'.
  config.openapi_format = :yaml
end
