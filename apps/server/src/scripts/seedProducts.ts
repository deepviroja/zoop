import { db } from '../config/firebase';

const sampleProducts = [
  {
    id: 'prod-001',
    sellerId: 'seller-demo',
    title: 'Premium Cotton T-Shirt',
    description: 'High-quality cotton t-shirt, perfect for everyday wear. Soft, breathable, and comfortable.',
    categoryId: 'men',
    brand: 'Zoop Basics',
    price: 599,
    mrp: 999,
    discountPercent: 40,
    stock: 50,
    thumbnailUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
    imageUrls: [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800'
    ],
    isSameDayEligible: true,
    cityAvailability: ['Surat', 'Ahmedabad'],
    tags: ['cotton', 'casual', 'summer'],
    rating: 4.5,
    ratingCount: 120,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-002',
    sellerId: 'seller-demo',
    title: 'Wireless Bluetooth Headphones',
    description: 'Premium wireless headphones with noise cancellation. 30-hour battery life.',
    categoryId: 'electronics',
    brand: 'SoundMax',
    price: 2499,
    mrp: 4999,
    discountPercent: 50,
    stock: 25,
    thumbnailUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
    imageUrls: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800'
    ],
    isSameDayEligible: true,
    cityAvailability: ['Surat'],
    tags: ['wireless', 'bluetooth', 'audio'],
    rating: 4.7,
    ratingCount: 89,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-003',
    sellerId: 'seller-demo',
    title: 'Women\'s Summer Dress',
    description: 'Elegant floral summer dress. Light, comfortable, and stylish.',
    categoryId: 'women',
    brand: 'Fashion Hub',
    price: 1299,
    mrp: 2499,
    discountPercent: 48,
    stock: 30,
    thumbnailUrl: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400',
    imageUrls: [
      'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800',
      'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800'
    ],
    isSameDayEligible: true,
    cityAvailability: ['Surat', 'Ahmedabad'],
    tags: ['dress', 'summer', 'floral'],
    rating: 4.3,
    ratingCount: 67,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-004',
    sellerId: 'seller-demo',
    title: 'Kids Backpack',
    description: 'Colorful and durable backpack for kids. Perfect for school.',
    categoryId: 'kids',
    brand: 'KidZone',
    price: 799,
    mrp: 1299,
    discountPercent: 38,
    stock: 40,
    thumbnailUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400',
    imageUrls: [
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800'
    ],
    isSameDayEligible: true,
    cityAvailability: ['Surat'],
    tags: ['backpack', 'school', 'kids'],
    rating: 4.6,
    ratingCount: 45,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-005',
    sellerId: 'seller-demo',
    title: 'LED Desk Lamp',
    description: 'Modern LED desk lamp with adjustable brightness. Energy efficient.',
    categoryId: 'home',
    brand: 'HomeLight',
    price: 899,
    mrp: 1499,
    discountPercent: 40,
    stock: 35,
    thumbnailUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400',
    imageUrls: [
      'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800'
    ],
    isSameDayEligible: false,
    cityAvailability: ['Surat', 'Ahmedabad'],
    tags: ['lamp', 'led', 'desk'],
    rating: 4.4,
    ratingCount: 78,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-006',
    sellerId: 'seller-demo',
    title: 'Running Shoes',
    description: 'Comfortable running shoes with excellent grip. Perfect for daily workouts.',
    categoryId: 'men',
    brand: 'SportFit',
    price: 1999,
    mrp: 3999,
    discountPercent: 50,
    stock: 45,
    thumbnailUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
    imageUrls: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',
      'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800'
    ],
    isSameDayEligible: true,
    cityAvailability: ['Surat'],
    tags: ['shoes', 'running', 'sports'],
    rating: 4.8,
    ratingCount: 156,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-007',
    sellerId: 'seller-demo',
    title: 'Smart Watch',
    description: 'Feature-packed smartwatch with fitness tracking, heart rate monitor, and notifications.',
    categoryId: 'electronics',
    brand: 'TechWear',
    price: 3499,
    mrp: 6999,
    discountPercent: 50,
    stock: 20,
    thumbnailUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
    imageUrls: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
      'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800'
    ],
    isSameDayEligible: true,
    cityAvailability: ['Surat', 'Ahmedabad'],
    tags: ['smartwatch', 'fitness', 'wearable'],
    rating: 4.6,
    ratingCount: 234,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-008',
    sellerId: 'seller-demo',
    title: 'Ceramic Coffee Mug Set',
    description: 'Set of 4 elegant ceramic coffee mugs. Microwave and dishwasher safe.',
    categoryId: 'home',
    brand: 'HomeEssentials',
    price: 599,
    mrp: 999,
    discountPercent: 40,
    stock: 60,
    thumbnailUrl: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400',
    imageUrls: [
      'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800'
    ],
    isSameDayEligible: false,
    cityAvailability: ['Surat'],
    tags: ['mug', 'coffee', 'ceramic'],
    rating: 4.5,
    ratingCount: 92,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

async function seedProducts() {
  try {
    console.log('🌱 Starting to seed products...');

    const batch = db.batch();
    
    sampleProducts.forEach((product) => {
      const productRef = db.collection('products').doc(product.id);
      batch.set(productRef, product);
    });

    await batch.commit();

    console.log('✅ Successfully added', sampleProducts.length, 'products!');
    console.log('📦 Products added:');
    sampleProducts.forEach(p => console.log(`  - ${p.title} (₹${p.price})`));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding products:', error);
    process.exit(1);
  }
}

seedProducts();
