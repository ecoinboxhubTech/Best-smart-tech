export const STORE = {
  name: "Best Smartech",
  cac: "BN 7447548",
  address: "Shop D4, Chinese Line, Alaba Intl Market, Lagos",
  email: "smarttechandcomms@gmail.com",
  phone: "07034857089",
  whatsapp: "2347034857089", // international format, no +
};

export const ZONES = [
  { id: "lagos", label: "Lagos", fee: 3000 },
  { id: "sw", label: "South-West (Ogun, Oyo, Osun, Ekiti, Ondo)", fee: 4000 },
  { id: "sess", label: "South-East / South-South", fee: 5000 },
  { id: "nc", label: "North Central + FCT", fee: 5500 },
  { id: "fn", label: "Far North", fee: 6500 },
];

export const FREE_SHIPPING_AT = 100000;

// Coupons: pct = percentage off subtotal
export const COUPONS = { WELCOME10: 10, SMART5: 5 };

// Add `image: "/images/x.jpg"` to any product to replace the colour tile.
export const PRODUCTS = [
  { id: 1, name: "Fusender Pro LED 800 Kit", cat: "Lighting", price: 85000, was: 98000, rating: 4.8, reviews: 124, stock: 14, badge: "Best seller", desc: "Bi-color 3200–5600K, 800 LED, AC adapter + stand.", tint: "#DCE8F7", mark: "LED" },
  { id: 2, name: "Unique Leather S25 / S24 Case", cat: "Cases", price: 12500, was: 16000, rating: 4.6, reviews: 89, stock: 30, desc: "Genuine leather for S25 Ultra and S24 Plus, magnetic.", tint: "#EADFD0", mark: "S25" },
  { id: 3, name: "Hello Kitty 3D iPhone Case", cat: "Cases", price: 8500, was: 11000, rating: 4.9, reviews: 210, stock: 4, badge: "Trending", desc: "3D bow, soft silicone. Fits iPhone 15, 14 and 13.", tint: "#F6D6EA", mark: "3D" },
  { id: 4, name: "F12 3-Axis Foldable Gimbal", cat: "Gadgets", price: 48000, was: 58000, rating: 4.7, reviews: 67, stock: 9, badge: "New", desc: "3-axis stabilization, face tracking, foldable.", tint: "#E1E4EA", mark: "F12" },
  { id: 5, name: "Camera Lens Film Protectors (Bulk)", cat: "Protection", price: 3500, was: 5000, rating: 4.5, reviews: 342, stock: 120, desc: "9H tempered glass, anti-scratch, for all phones.", tint: "#E3EDEA", mark: "9H" },
  { id: 6, name: "RGB Soft Ring Light MJ33", cat: "Lighting", price: 22000, was: 28000, rating: 4.8, reviews: 156, stock: 3, badge: "Best seller", desc: "13-inch RGB, 22 colors, tripod stand, Bluetooth.", tint: "#E6DDF5", mark: "RGB" },
  { id: 7, name: "JBL X68 MAX Bass Stereo", cat: "Gadgets", price: 15500, was: 19500, rating: 4.6, reviews: 98, stock: 22, desc: "Bluetooth 5.3, 20W bass, RGB lights, TWS.", tint: "#E9E6E1", mark: "X68" },
  { id: 8, name: "Cat Ear SNK-B39M RGB Headset", cat: "Gadgets", price: 14200, was: 18000, rating: 4.7, reviews: 112, stock: 0, desc: "Cat ear LED, RGB lighting, Bluetooth + wired.", tint: "#F8DDE0", mark: "B39M" },
];

export const CATS = ["All", "Cases", "Lighting", "Gadgets", "Protection"];

export const REVIEWS = [
  { name: "Chinedu O.", city: "Enugu", text: "Ring light arrived in 3 days and was exactly as shown. Packed very well.", rating: 5 },
  { name: "Aisha M.", city: "Abuja", text: "Ordered the gimbal over WhatsApp, they confirmed fast and sent tracking.", rating: 5 },
  { name: "Tolu A.", city: "Lagos", text: "Leather case feels premium for the price. Will order again.", rating: 4 },
];

export const FAQ = [
  { q: "How do I pay?", a: "Send your order on WhatsApp and we confirm stock, then share bank transfer details. You can also pay by card, bank transfer or USSD online with Paystack at checkout." },
  { q: "How long does delivery take?", a: "Lagos: 1–2 working days. Other states: 2–5 working days depending on your region." },
  { q: "Can I return an item?", a: "Yes. Report any faulty or wrong item within 48 hours of delivery and we will replace or refund it." },
  { q: "Do you sell wholesale?", a: "Yes. Message us on WhatsApp with the items and quantities for a bulk price." },
];

export const naira = (n) => "₦" + n.toLocaleString("en-NG");
export const off = (p) => Math.round((1 - p.price / p.was) * 100);
