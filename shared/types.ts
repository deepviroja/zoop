export type Role = 'customer' | 'seller' | 'admin';

export interface Address {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  type: 'home' | 'work' | 'other';
  isDefault: boolean;
}

export interface User {
  id: string;
  displayName?: string;
  name?: string;
  email: string;
  role: Role;
  photoURL?: string;
  phone?: string;
  isEmailVerified?: boolean;
  createdAt: string;
  updatedAt: string;
  // Seller onboarding fields
  verificationStatus?: 'pending' | 'approved' | 'rejected';
  businessName?: string;
  businessType?: string;
  gstNumber?: string;
  panNumber?: string;
  address?: string;
  onboardingCompletedAt?: string;
  rejectionReason?: string;
  disabled?: boolean;
  // Additional optional fields
  addresses?: any[];
  wishlistIds?: string[];
  isApproved?: boolean;
  onboardingCompleted?: boolean;
}

export type SellerVerificationStatus = 'pending' | 'approved' | 'rejected';

export interface SellerProfile {
  userId: string;
  storeName: string;
  storeSlug: string;
  bio?: string;
  gstNumber?: string;
  supportEmail: string;
  supportPhone: string;
  storeLogoUrl: string;
  storeBannerUrl?: string;
  pickupAddress: Address;
  verificationStatus: SellerVerificationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  sellerId: string;
  categoryId: string;
  subcategory?: string;
  title: string;
  description: string;
  price: number;
  mrp?: number;
  discountPercent: number;
  stock: number;
  thumbnailUrl: string;
  imageUrls: string[];
  videoUrls?: string[];
  brand?: string;
  sku?: string;
  material?: string;
  colorOptions?: string[];
  sizeOptions?: string[];
  weightGrams?: number;
  countryOfOrigin?: string;
  warrantyInfo?: string;
  aboutItem?: string;
  ram?: string;
  storage?: string;
  dimensions?: {
    width?: number;
    height?: number;
    depth?: number;
    unit?: string;
  };
  attributes?: Array<{
    key: string;
    values: string[];
  }>;
  highlights?: string[];
  returnPolicy?: string;
  deliveryTime?: string;
  tags?: string[];
  rating: number;
  ratingCount: number;
  orderedCount?: number;
  moderationStatus?: 'pending' | 'approved' | 'rejected' | 'removed';
  isSameDayEligible: boolean;
  cityAvailability: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
  selectedVariant?: Record<string, string>;
  // Denormalized fields for UI convenience
  name?: string;
  price?: number;
  image?: string;
}

export interface Cart {
  userId: string;
  items: CartItem[];
  total: number;
  updatedAt: string;
}

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PACKED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUND_REQUESTED' | 'REFUNDED';

export interface OrderItem {
  productId: string;
  sellerId: string;
  quantity: number;
  price: number;
  subtotal: number;
  name: string;
  image?: string;
  status: OrderStatus;
}

export interface Order {
  id: string;
  userId: string;
  sellerIds: string[]; // For querying multiple sellers involved
  status: OrderStatus; // Global order status
  totalAmount: number;
  paymentStatus: 'pending' | 'paid' | 'failed';
  paymentProviderRef?: string;
  paymentMethod: 'cod' | 'card' | 'upi';
  shippingAddress: Address;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  title?: string;
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  message: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
  adminReply?: string;
}
