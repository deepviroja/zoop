import { z } from 'zod';



// ============ USERS & PROFILES ============

// Address Schema
export const addressSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  addressLine1: z.string().min(1, "Address line 1 is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  country: z.string().default('India'),
  phone: z.string().regex(/^\d{10}$/, "Phone number must be 10 digits"),
  type: z.enum(['home', 'work', 'other']).default('home'),
  isDefault: z.boolean().default(false),
});

// Seller Profile Schema
export const sellerProfileSchema = z.object({
  storeName: z.string().min(3, "Store name must be at least 3 characters"),
  storeSlug: z.string().min(3).regex(/^[a-z0-9-]+$/, "Slug must use lowercase letters, numbers, and hyphens"),
  bio: z.string().max(500).optional(),
  gstNumber: z.string().min(15).max(15).optional(), // Example for GST validation
  supportEmail: z.string().email(),
  supportPhone: z.string().regex(/^\d{10}$/),
  storeLogoUrl: z.string().url(),
  storeBannerUrl: z.string().url().optional(),
  pickupAddress: addressSchema,
});

// ============ PRODUCTS ============

export const productSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.number().min(0, "Price must be non-negative"),
  mrp: z.number().min(0, "MRP must be non-negative").optional(),
  categoryId: z.string().min(1, "Category is required"),
  subcategory: z.string().min(1, "Subcategory is required").optional(),
  stock: z.number().int().min(0, "Stock must be non-negative"),
  thumbnailUrl: z.string().url("Thumbnail URL is required"),
  imageUrls: z.array(z.string().url()).min(1, "At least one additional image is required (use thumbnail as fallback)"),
  videoUrls: z.array(z.string().url()).optional(),
  brand: z.string().optional(),
  sku: z.string().max(40).optional(),
  material: z.string().max(120).optional(),
  colorOptions: z.array(z.string()).optional(),
  sizeOptions: z.array(z.string()).optional(),
  weightGrams: z.number().min(0).optional(),
  countryOfOrigin: z.string().optional(),
  warrantyInfo: z.string().max(500).optional(),
  aboutItem: z.string().max(2000).optional(),
  ram: z.string().max(100).optional(),
  storage: z.string().max(100).optional(),
  dimensions: z
    .object({
      width: z.number().min(0).optional(),
      height: z.number().min(0).optional(),
      depth: z.number().min(0).optional(),
      unit: z.string().max(20).optional(),
    })
    .optional(),
  attributes: z
    .array(
      z.object({
        key: z.string().min(1).max(80),
        values: z.array(z.string().min(1).max(80)).min(1),
      }),
    )
    .optional(),
  highlights: z.array(z.string()).optional(),
  returnPolicy: z.string().optional(),
  deliveryTime: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isSameDayEligible: z.boolean().default(false),
  cityAvailability: z.array(z.string()).default([]), // Cities where same-day is available
  discountPercent: z.number().min(0).max(100).default(0),
});

// ============ ORDERS & CART ============

export const cartItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1),
  selectedVariant: z.record(z.string()).optional(), // e.g. { size: 'M', color: 'Red' }
});

export const orderItemSchema = z.object({
  productId: z.string(),
  sellerId: z.string(),
  quantity: z.number().min(1),
  price: z.number().min(0),
  subtotal: z.number().min(0),
  name: z.string(),
  image: z.string().url().optional(),
  status: z.enum(['PENDING', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUND_REQUESTED', 'REFUNDED']).default('PENDING')
});

export const orderSchema = z.object({
  items: z.array(orderItemSchema).min(1, "Order must have at least one item"),
  totalAmount: z.number().min(0),
  shippingAddress: addressSchema,
  paymentMethod: z.enum(['cod', 'card', 'upi']).default('cod'),
  paymentProviderRef: z.string().optional(),
});

// ============ REVIEWS & SUPPORT ============

export const reviewSchema = z.object({
  productId: z.string(),
  rating: z.number().min(1).max(5),
  title: z.string().max(100).optional(),
  comment: z.string().max(1000).optional(),
});

export const supportTicketSchema = z.object({
  subject: z.string().min(5),
  message: z.string().min(10),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
});
