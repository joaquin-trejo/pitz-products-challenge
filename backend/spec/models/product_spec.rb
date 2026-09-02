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

  describe ".search_by_name" do
    it "returns products with a partial name match" do
      matching = Product.create!(valid_attributes.merge(name: "Wireless Mouse", sku: "SEARCH-1"))
      Product.create!(valid_attributes.merge(name: "USB Keyboard", sku: "SEARCH-2"))

      expect(Product.search_by_name("Wire")).to contain_exactly(matching)
    end

    it "matches names case-insensitively" do
      matching = Product.create!(valid_attributes.merge(name: "Wireless Mouse", sku: "SEARCH-3"))

      expect(Product.search_by_name("MOUSE")).to contain_exactly(matching)
    end

    it "excludes products that do not match" do
      Product.create!(valid_attributes.merge(name: "Wireless Mouse", sku: "SEARCH-4"))

      expect(Product.search_by_name("Keyboard")).to be_empty
    end

    it "does not restrict results when the search term is blank" do
      first = Product.create!(valid_attributes.merge(sku: "SEARCH-5"))
      second = Product.create!(valid_attributes.merge(name: "Another Product", sku: "SEARCH-6"))

      expect(Product.search_by_name("")).to contain_exactly(first, second)
      expect(Product.search_by_name(nil)).to contain_exactly(first, second)
    end

    it "treats LIKE wildcard characters as literal search text" do
      literal = Product.create!(valid_attributes.merge(name: "100% Cotton Shirt", sku: "SEARCH-7"))
      Product.create!(valid_attributes.merge(name: "Cotton Shirt", sku: "SEARCH-8"))

      expect(Product.search_by_name("%")).to contain_exactly(literal)
    end
  end

  describe ".filter_by_active" do
    it "returns only active products when true" do
      active = Product.create!(valid_attributes.merge(sku: "ACTIVE-1", active: true))
      Product.create!(valid_attributes.merge(name: "Inactive Product", sku: "ACTIVE-2", active: false))

      expect(Product.filter_by_active(true)).to contain_exactly(active)
    end

    it "returns only inactive products when false" do
      Product.create!(valid_attributes.merge(sku: "ACTIVE-3", active: true))
      inactive = Product.create!(valid_attributes.merge(name: "Inactive Product", sku: "ACTIVE-4", active: false))

      expect(Product.filter_by_active(false)).to contain_exactly(inactive)
    end

    it "returns all products when nil" do
      active = Product.create!(valid_attributes.merge(sku: "ACTIVE-5", active: true))
      inactive = Product.create!(valid_attributes.merge(name: "Inactive Product", sku: "ACTIVE-6", active: false))

      expect(Product.filter_by_active(nil)).to contain_exactly(active, inactive)
    end
  end
end
