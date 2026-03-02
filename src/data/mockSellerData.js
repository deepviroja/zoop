export const sellerStats = {
  totalSales: 124500,
  orders: 45,
  products: 12,
  rating: 4.8,
  views: 1200,
};

export const recentOrders = [
  {
    id: "#ORD-7782",
    product: "Hand-Stitched Peshawari",
    date: "Today, 10:23 AM",
    amount: 1899,
    status: "Pending",
    customer: "Rohan S.",
    location: "Surat, Gujarat",
    type: "Local",
  },
  {
    id: "#ORD-7781",
    product: "Silk Bandhani Saree",
    date: "Today, 09:15 AM",
    amount: 4500,
    status: "Shipped",
    customer: "Priya M.",
    location: "Mumbai, Maharashtra",
    type: "Local",
  },
  {
    id: "#ORD-7780",
    product: "Custom Leather Wallet",
    date: "Yesterday",
    amount: 850,
    status: "Delivered",
    customer: "Amit K.",
    location: "Delhi",
    type: "National",
  },
  {
    id: "#ORD-7779",
    product: "Brass Diya Set",
    date: "Yesterday",
    amount: 1200,
    status: "Cancelled",
    customer: "Sneha P.",
    location: "Bangalore",
    type: "National",
  },
];

export const inventory = [
  {
    id: 1,
    name: "Hand-Stitched Peshawari",
    sku: "SKU-PESH-001",
    price: 1899,
    stock: 12,
    status: "In Stock",
    category: "Footwear",
    sales: 45,
    img: "https://images.unsplash.com/photo-1628149455678-16f37bc392f4?w=100",
  },
  {
    id: 2,
    name: "Silk Bandhani Saree",
    sku: "SKU-SAR-002",
    price: 4500,
    stock: 5,
    status: "Low Stock",
    category: "Ethnic Wear",
    sales: 28,
    img: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=100",
  },
  {
    id: 3,
    name: "Custom Leather Wallet",
    sku: "SKU-WAL-003",
    price: 850,
    stock: 0,
    status: "Out of Stock",
    category: "Accessories",
    sales: 110,
    img: "https://images.unsplash.com/photo-1627123424574-71475646093b?w=100",
  },
];

export const payouts = [
  { id: 1, date: "Oct 24, 2024", amount: 12400, status: "Paid" },
  { id: 2, date: "Oct 17, 2024", amount: 8900, status: "Paid" },
  { id: 3, date: "Oct 10, 2024", amount: 15600, status: "Processing" },
];
