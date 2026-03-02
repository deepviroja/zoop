export const adminStats = {
  totalUsers: 14500,
  totalSellers: 120,
  activeOrders: 450,
  totalRevenue: 4500000,
};

export const verificationQueue = [
  {
    id: 1,
    name: "Radhe Shyam Textiles",
    type: "Manufacturer",
    location: "Surat, Gujarat",
    documents: ["GST Certificate", "PAN Card", "Udhyam Aadhar"],
    status: "Pending",
    date: "10 mins ago",
  },
  {
    id: 2,
    name: "Mumbai Spices Co.",
    type: "Home-Seller",
    location: "Mumbai, Maharashtra",
    documents: ["FSSAI License", "Aadhar Card"],
    status: "Pending",
    date: "1 hour ago",
  },
  {
    id: 3,
    name: "Jaipur Blue Pottery",
    type: "Artisan",
    location: "Jaipur, Rajasthan",
    documents: ["Artisan Card", "Bank Details"],
    status: "In Review",
    date: "3 hours ago",
  },
];

export const recentTickets = [
  {
    id: "#TKT-9901",
    user: "Ravi Kumar",
    subject: "Return Request - Damaged Item",
    priority: "High",
    status: "Open",
    date: "Today",
  },
  {
    id: "#TKT-9902",
    user: "Sneha Gupta",
    subject: "Payment Deducted but Order Failed",
    priority: "Critical",
    status: "In Progress",
    date: "Today",
  },
  {
    id: "#TKT-9903",
    user: "Amit Shah",
    subject: "Delay in Delivery",
    priority: "Medium",
    status: "Closed",
    date: "Yesterday",
  },
];

export const contentMod = [
  {
    id: 1,
    type: "Product",
    title: "Homemade Gunpowder",
    reports: 12,
    reason: "Prohibited Item Name",
    status: "Flagged",
  },
  {
    id: 2,
    type: "Review",
    title: "Review on Nike Shoes",
    reports: 5,
    reason: "Abusive Language",
    status: "Flagged",
  },
];
