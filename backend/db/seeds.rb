seed_products = [
  {
    name: "Wireless Mouse",
    description: "Ergonomic wireless mouse for daily office use.",
    price: "29.99",
    stock: 120,
    sku: "SEED-MOUSE-01",
    active: true
  },
  {
    name: "Mechanical Keyboard",
    description: "Tactile mechanical keyboard with backlight.",
    price: "89.50",
    stock: 45,
    sku: "SEED-KEYBOARD-01",
    active: true
  },
  {
    name: "USB-C Hub",
    description: "Multiport USB-C hub with HDMI output.",
    price: "49.00",
    stock: 80,
    sku: "SEED-HUB-01",
    active: true
  },
  {
    name: "27-inch Monitor",
    description: "Full HD monitor for desk setups.",
    price: "199.99",
    stock: 25,
    sku: "SEED-MONITOR-01",
    active: true
  },
  {
    name: "Laptop Stand",
    description: "Aluminum laptop stand with adjustable height.",
    price: "39.95",
    stock: 60,
    sku: "SEED-STAND-01",
    active: true
  },
  {
    name: "Noise Cancelling Headphones",
    description: "Over-ear headphones for focused work.",
    price: "149.00",
    stock: 35,
    sku: "SEED-HEADPHONES-01",
    active: true
  },
  {
    name: "Webcam HD",
    description: "1080p webcam with built-in microphone.",
    price: "69.99",
    stock: 50,
    sku: "SEED-WEBCAM-01",
    active: true
  },
  {
    name: "Desk Lamp LED",
    description: "Adjustable LED desk lamp with USB charging.",
    price: "24.50",
    stock: 90,
    sku: "SEED-LAMP-01",
    active: true
  },
  {
    name: "External SSD 1TB",
    description: "Portable solid-state drive for backups.",
    price: "119.00",
    stock: 40,
    sku: "SEED-SSD-01",
    active: true
  },
  {
    name: "HDMI Cable 2m",
    description: "High-speed HDMI cable for displays.",
    price: "12.99",
    stock: 200,
    sku: "SEED-CABLE-01",
    active: true
  },
  {
    name: "Wireless Charger",
    description: "Qi wireless charging pad.",
    price: "19.99",
    stock: 75,
    sku: "SEED-CHARGER-01",
    active: true
  },
  {
    name: "Legacy Mouse Pad",
    description: "Discontinued large mouse pad.",
    price: "9.99",
    stock: 0,
    sku: "SEED-MOUSEPAD-01",
    active: false
  },
  {
    name: "Old Wired Keyboard",
    description: "Inactive catalog entry for wired keyboard.",
    price: "34.00",
    stock: 5,
    sku: "SEED-KEYBOARD-02",
    active: false
  },
  {
    name: "Refurbished Monitor Stand",
    description: "Inactive refurbished monitor stand.",
    price: "27.50",
    stock: 8,
    sku: "SEED-STAND-02",
    active: false
  },
  {
    name: "Travel Laptop Sleeve",
    description: "Inactive soft sleeve for 14-inch laptops.",
    price: "22.00",
    stock: 15,
    sku: "SEED-SLEEVE-01",
    active: false
  }
]

seed_products.each do |attributes|
  product = Product.find_or_initialize_by(sku: attributes[:sku])
  product.assign_attributes(attributes)
  product.save!
end
