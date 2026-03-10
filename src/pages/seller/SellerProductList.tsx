import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { apiClient } from '../../api/client';
import { Edit } from '../../assets/icons/Edit';
import Trash from '../../assets/icons/Trash';
import { Plus } from '../../assets/icons/Plus';

interface Product {
    id: string;
    title: string;
    brand?: string;
    price: number;
    stock: number;
    categoryId: string;
    thumbnailUrl?: string;
}

export const SellerProductList = () => {
    const { user } = useUser();
    const navigate = useNavigate();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProducts = async () => {
            if (!user?.uid) return;
            try {
                // Fetch products for this seller
                // user.uid is reliable here if we are protected route
                const data = await apiClient.get<Product[]>(`/products?sellerId=${user.uid}`);
                setProducts(data);
            } catch (error) {
                console.error("Failed to load products", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, [user]);

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this product?")) return;
        
        try {
             await apiClient.delete(`/products/${id}`);
             setProducts(products.filter(p => p.id !== id));
        } catch (error) {
            console.error("Failed to delete", error);
            alert("Failed to delete product. Please try again.");
        }
    };

    if (loading) return <div className="p-8 text-center">Loading your products...</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-black text-zoop-obsidian">My Products</h1>
                        <p className="text-gray-500">Manage your inventory</p>
                    </div>
                    <Link 
                        to="/seller/add-product" 
                        className="flex items-center gap-2 px-6 py-3 bg-zoop-obsidian text-white rounded-xl font-bold hover:bg-zoop-moss hover:text-zoop-obsidian transition-all shadow-lg"
                    >
                        <Plus width={20} height={20} />
                        Add New
                    </Link>
                </div>

                <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
                    <div className="overflow-x-auto scrollbar-gap">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 font-black text-gray-600 uppercase text-xs tracking-wider">Product</th>
                                    <th className="px-6 py-4 font-black text-gray-600 uppercase text-xs tracking-wider">Price</th>
                                    <th className="px-6 py-4 font-black text-gray-600 uppercase text-xs tracking-wider">Stock</th>
                                    <th className="px-6 py-4 font-black text-gray-600 uppercase text-xs tracking-wider">Category</th>
                                    <th className="px-6 py-4 font-black text-gray-600 uppercase text-xs tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {products.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                            No products found. Start selling today!
                                        </td>
                                    </tr>
                                ) : (
                                    products.map((product) => (
                                        <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                                                        <img 
                                                            src={product.thumbnailUrl || '/brand-mark.svg'} 
                                                            alt="" 
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900 line-clamp-1">{product.title}</p>
                                                        <p className="text-xs text-gray-500">{product.brand || 'No Brand'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-gray-900">
                                                Rs. {product.price}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-bold ${
                                                    product.stock > 10 ? 'bg-green-100 text-green-700' : 
                                                    product.stock > 0 ? 'bg-yellow-100 text-yellow-700' : 
                                                    'bg-red-100 text-red-700'
                                                }`}>
                                                    {product.stock > 0 ? `${product.stock} in stock` : 'Out of Stock'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600 capitalize">
                                                {product.categoryId}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button 
                                                        onClick={() => navigate(`/seller/edit-product/${product.id}`)}
                                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    >
                                                        <Edit width={18} height={18} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(product.id)}
                                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
                                                        <Trash width={18} height={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};
