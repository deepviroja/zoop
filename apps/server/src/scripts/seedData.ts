import { db } from '../config/firebase';
import { Product } from '../../../../shared/types';

const sampleProducts: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    title: 'Handwoven Silk Saree',
    description: 'Beautiful traditional silk saree handwoven by local artisans in Surat',
    price: 4500,
    mrp: 6000,
    stock: 15,
    categoryId: 'women',
    sellerId: 'demo-seller-001',
    thumbnailUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400',
    imageUrls: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800'],
    brand: 'Surat Silk House',
    rating: 4.8,
    ratingCount: 156,
    isSameDayEligible: true,
    cityAvailability: ['Surat'],
    discountPercent: 25,
    tags: ['traditional', 'silk', 'handwoven']
  },
  {
    title: 'Cotton Kurta Set',
    description: 'Comfortable cotton kurta set perfect for daily wear',
    price: 899,
    mrp: 1499,
    stock: 50,
    categoryId: 'men',
    sellerId: 'demo-seller-001',
    thumbnailUrl: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400',
    imageUrls: ['https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800'],
    brand: 'Zoop Ethnic',
    rating: 4.5,
    ratingCount: 89,
    isSameDayEligible: true,
    cityAvailability: ['Surat'],
    discountPercent: 40,
    tags: ['cotton', 'ethnic', 'comfortable']
  },
  {
    title: 'Kids Ethnic Wear Set',
    description: 'Adorable ethnic wear set for kids, perfect for festivals',
    price: 699,
    mrp: 999,
    stock: 30,
    categoryId: 'kids',
    sellerId: 'demo-seller-001',
    thumbnailUrl: 'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=400',
    imageUrls: ['https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=800'],
    brand: 'Little Zoop',
    rating: 4.7,
    ratingCount: 67,
    isSameDayEligible: true,
    cityAvailability: ['Surat'],
    discountPercent: 30,
    tags: ['kids', 'festival', 'ethnic']
  },
  {
    title: 'Handcrafted Wall Hanging',
    description: 'Beautiful handcrafted wall hanging made by local artisans',
    price: 1299,
    mrp: 1999,
    stock: 20,
    categoryId: 'home',
    sellerId: 'demo-seller-001',
    thumbnailUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400',
    imageUrls: ['https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800'],
    brand: 'Artisan Collective',
    rating: 4.9,
    ratingCount: 45,
    isSameDayEligible: false,
    cityAvailability: [],
    discountPercent: 35,
    tags: ['handcrafted', 'decor', 'artisan']
  },
  {
    title: 'Wireless Earbuds',
    description: 'Premium wireless earbuds with noise cancellation',
    price: 2499,
    mrp: 4999,
    stock: 100,
    categoryId: 'electronics',
    sellerId: 'demo-seller-002',
    thumbnailUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400',
    imageUrls: ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800'],
    brand: 'TechZoop',
    rating: 4.6,
    ratingCount: 234,
    isSameDayEligible: true,
    cityAvailability: ['Surat', 'Mumbai', 'Delhi'],
    discountPercent: 50,
    tags: ['electronics', 'audio', 'wireless']
  },
  {
    title: 'Designer Bandhani Dupatta',
    description: 'Traditional Bandhani dupatta with intricate patterns',
    price: 1599,
    mrp: 2499,
    stock: 25,
    categoryId: 'women',
    sellerId: 'demo-seller-001',
    thumbnailUrl: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=400',
    imageUrls: ['https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800'],
    brand: 'Surat Handicrafts',
    rating: 4.8,
    ratingCount: 92,
    isSameDayEligible: true,
    cityAvailability: ['Surat'],
    discountPercent: 36,
    tags: ['bandhani', 'traditional', 'dupatta']
  },
  {
    title: 'Smart Watch',
    description: 'Feature-packed smartwatch with health tracking',
    price: 3999,
    mrp: 7999,
    stock: 75,
    categoryId: 'electronics',
    sellerId: 'demo-seller-002',
    thumbnailUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
    imageUrls: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800'],
    brand: 'TechZoop',
    rating: 4.4,
    ratingCount: 178,
    isSameDayEligible: true,
    cityAvailability: ['Surat', 'Mumbai'],
    discountPercent: 50,
    tags: ['smartwatch', 'fitness', 'electronics']
  },
  {
    title: 'Ceramic Dinner Set',
    description: 'Elegant 24-piece ceramic dinner set for family',
    price: 2999,
    mrp: 4999,
    stock: 15,
    categoryId: 'home',
    sellerId: 'demo-seller-003',
    thumbnailUrl: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=400',
    imageUrls: ['https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800'],
    brand: 'HomeZoop',
    rating: 4.7,
    ratingCount: 56,
    isSameDayEligible: false,
    cityAvailability: [],
    discountPercent: 40,
    tags: ['ceramic', 'dinnerware', 'home']
  }
];

async function seedDatabase() {
  try {
    console.log('Starting database seed...');
    
    let count = 0;
    for (const productData of sampleProducts) {
      const productRef = db.collection('products').doc();
      const product: Product = {
        ...productData,
        id: productRef.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await productRef.set(product);
      count++;
      console.log(`✅ Added product ${count}/${sampleProducts.length}: ${product.title}`);
    }
    
    console.log(`\n🎉 Successfully seeded ${count} products!`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
