require "rails_helper"
require "bigdecimal"

RSpec.describe Product, type: :model do
  let(:valid_attributes) do
    {
      name: "Valid Product",
      price: BigDecimal("10.50"),
      stock: 5,
      sku: "SKU-001"
    }
  end

  describe "name" do
    it "is valid at the minimum length boundary" do
      product = Product.new(valid_attributes.merge(name: "ABC"))

      expect(product).to be_valid
    end

    it "is valid at the maximum length boundary" do
      product = Product.new(valid_attributes.merge(name: "A" * 100))

      expect(product).to be_valid
    end

    it "is invalid when blank" do
      product = Product.new(valid_attributes.merge(name: ""))

      expect(product).not_to be_valid
      expect(product.errors[:name]).to be_present
    end

    it "is invalid below the minimum length" do
      product = Product.new(valid_attributes.merge(name: "AB"))

      expect(product).not_to be_valid
      expect(product.errors[:name]).to be_present
    end

    it "is invalid above the maximum length" do
      product = Product.new(valid_attributes.merge(name: "A" * 101))

      expect(product).not_to be_valid
      expect(product.errors[:name]).to be_present
    end
  end

  describe "description" do
    it "is valid when nil" do
      product = Product.new(valid_attributes.merge(description: nil))

      expect(product).to be_valid
    end

    it "is valid when blank" do
      product = Product.new(valid_attributes.merge(description: ""))

      expect(product).to be_valid
    end

    it "is valid at the maximum length boundary" do
      product = Product.new(valid_attributes.merge(description: "A" * 1000))

      expect(product).to be_valid
    end

    it "is invalid above the maximum length" do
      product = Product.new(valid_attributes.merge(description: "A" * 1001))

      expect(product).not_to be_valid
      expect(product.errors[:description]).to be_present
    end
  end

  describe "price" do
    it "is valid when greater than zero" do
      product = Product.new(valid_attributes.merge(price: BigDecimal("0.01")))

      expect(product).to be_valid
    end

    it "is invalid when blank" do
      product = Product.new(valid_attributes.merge(price: nil))

      expect(product).not_to be_valid
      expect(product.errors[:price]).to be_present
    end

    it "is invalid when zero" do
      product = Product.new(valid_attributes.merge(price: BigDecimal("0")))

      expect(product).not_to be_valid
      expect(product.errors[:price]).to be_present
    end

    it "is invalid when negative" do
      product = Product.new(valid_attributes.merge(price: BigDecimal("-1")))

      expect(product).not_to be_valid
      expect(product.errors[:price]).to be_present
    end
  end

  describe "stock" do
    it "is valid at the minimum boundary" do
      product = Product.new(valid_attributes.merge(stock: 0))

      expect(product).to be_valid
    end

    it "is valid with a positive integer" do
      product = Product.new(valid_attributes.merge(stock: 100))

      expect(product).to be_valid
    end

    it "is invalid when blank" do
      product = Product.new(valid_attributes.merge(stock: nil))

      expect(product).not_to be_valid
      expect(product.errors[:stock]).to be_present
    end

    it "is invalid when negative" do
      product = Product.new(valid_attributes.merge(stock: -1))

      expect(product).not_to be_valid
      expect(product.errors[:stock]).to be_present
    end

    it "is invalid with a decimal value" do
      product = Product.new(valid_attributes.merge(stock: 1.5))

      expect(product).not_to be_valid
      expect(product.errors[:stock]).to be_present
    end
  end

  describe "sku" do
    it "is valid with uppercase letters, numbers, and hyphens" do
      product = Product.new(valid_attributes.merge(sku: "ABC-123"))

      expect(product).to be_valid
    end

    it "is invalid when blank" do
      product = Product.new(valid_attributes.merge(sku: ""))

      expect(product).not_to be_valid
      expect(product.errors[:sku]).to be_present
    end

    it "is invalid with lowercase letters" do
      product = Product.new(valid_attributes.merge(sku: "abc-123"))

      expect(product).not_to be_valid
      expect(product.errors[:sku]).to be_present
    end

    it "is invalid with spaces" do
      product = Product.new(valid_attributes.merge(sku: "SKU 001"))

      expect(product).not_to be_valid
      expect(product.errors[:sku]).to be_present
    end

    it "is invalid with special characters" do
      product = Product.new(valid_attributes.merge(sku: "SKU@001"))

      expect(product).not_to be_valid
      expect(product.errors[:sku]).to be_present
    end

    it "is invalid when duplicated" do
      Product.create!(valid_attributes)
      duplicate = Product.new(valid_attributes.merge(name: "Another Product", sku: "SKU-001"))

      expect(duplicate).not_to be_valid
      expect(duplicate.errors[:sku]).to be_present
    end
  end

  describe "active" do
    it "is valid when true" do
      product = Product.new(valid_attributes.merge(active: true))

      expect(product).to be_valid
    end

    it "is valid when false" do
      product = Product.new(valid_attributes.merge(active: false))

      expect(product).to be_valid
    end

    it "is invalid when nil" do
      product = Product.new(valid_attributes.merge(active: nil))

      expect(product).not_to be_valid
      expect(product.errors[:active]).to be_present
    end

    it "defaults to true when active is not provided" do
      product = Product.create!(valid_attributes)

      expect(product.active).to eq(true)
    end
  end
end
