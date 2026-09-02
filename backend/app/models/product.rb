class Product < ApplicationRecord
  SKU_FORMAT = /\A[A-Z0-9-]+\z/

  validates :name, presence: true,
                   length: { minimum: 3, maximum: 100 }

  validates :description, length: { maximum: 1000 }, allow_blank: true

  validates :price, presence: true,
                    numericality: { greater_than: 0 }

  validates :stock, presence: true,
                    numericality: { only_integer: true, greater_than_or_equal_to: 0 }

  validates :sku, presence: true,
                  uniqueness: true,
                  format: { with: SKU_FORMAT }

  validates :active, inclusion: { in: [ true, false ] }

  scope :search_by_name, ->(term) {
    return all if term.blank?

    sanitized = ActiveRecord::Base.sanitize_sql_like(term.to_s.strip)
    where("name ILIKE ?", "%#{sanitized}%")
  }

  scope :filter_by_active, ->(value) {
    return all if value.nil?

    where(active: value)
  }
end
