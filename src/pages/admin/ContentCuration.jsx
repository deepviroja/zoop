import React, { useState } from 'react';
import { Check } from '../../assets/icons/Check';
import { X } from '../../assets/icons/X';
import { Eye } from '../../assets/icons/Eye';
import { adminApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import StarRating from '../../components/product/StarRating';

const ContentCuration = () => {
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected
  const [searchQuery, setSearchQuery] = useState('');

  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const { showToast } = useToast();

  React.useEffect(() => {
    adminApi
      .getProductsForCuration()
      .then((items) => setProducts(Array.isArray(items) ? items : []))
      .catch((e) => showToast(e?.message || 'Failed to load products', 'error'));
  }, [showToast]);

  // Filter products
  const filteredProducts = products.filter(p => {
    const status = p.moderationStatus || 'pending';
    const matchesFilter = filter === 'all' || status === filter;
    const title = String(p.name || p.title || '').toLowerCase();
    const brand = String(p.brand || '').toLowerCase();
    const matchesSearch = title.includes(searchQuery.toLowerCase()) || brand.includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    pending: products.filter(p => (p.moderationStatus || 'pending') === 'pending').length,
    approved: products.filter(p => p.moderationStatus === 'approved').length,
    rejected: products.filter(p => p.moderationStatus === 'rejected').length,
    total: products.length,
  };

  const handleApprove = (productId) => {
    adminApi.updateProductModeration(productId, 'approved')
      .then(() => {
        setProducts((prev) => prev.map((p) => p.id === productId ? { ...p, moderationStatus: 'approved' } : p));
        showToast('Product approved', 'success');
      })
      .catch((e) => showToast(e?.message || 'Failed to approve product', 'error'));
  };

  const handleReject = (productId) => {
    const reason = prompt('Reason for rejection:');
    if (reason) {
      adminApi.updateProductModeration(productId, 'rejected', reason)
        .then(() => {
          setProducts((prev) =>
            prev.map((p) => (p.id === productId ? { ...p, moderationStatus: 'rejected', moderationNote: reason } : p)),
          );
          showToast('Product rejected', 'warning');
        })
        .catch((e) => showToast(e?.message || 'Failed to reject product', 'error'));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-900 text-zoop-obsidian">Content Curation</h1>
            <p className="text-gray-500 mt-1">Review and approve product listings</p>
          </div>
          
          {/* Search */}
          <div className="w-full md:w-96">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zoop-moss"
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <p className="text-gray-500 text-sm font-medium mb-1">Pending Review</p>
            <p className="text-3xl font-black text-orange-500">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <p className="text-gray-500 text-sm font-medium mb-1">Approved</p>
            <p className="text-3xl font-black text-green-500">{stats.approved}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <p className="text-gray-500 text-sm font-medium mb-1">Rejected</p>
            <p className="text-3xl font-black text-red-500">{stats.rejected}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <p className="text-gray-500 text-sm font-medium mb-1">Total Products</p>
            <p className="text-3xl font-black text-zoop-obsidian">{stats.total}</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-2xl p-2 shadow-sm flex gap-2">
          {['all', 'pending', 'approved', 'rejected'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all ${
                filter === tab
                  ? 'bg-zoop-moss text-zoop-obsidian'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all">
              {/* Product Image */}
              <div className="relative aspect-square bg-gray-100">
                <img
                  src={product.image || product.thumbnailUrl || "/brand-mark.svg"}
                  alt={product.name || product.title}
                  className="w-full h-full object-cover"
                  onError={(event) => {
                    event.currentTarget.src = "/brand-mark.svg";
                  }}
                />
                <div className="absolute top-3 left-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                    (product.moderationStatus || 'pending') === 'pending' ? 'bg-orange-500 text-white' :
                    product.moderationStatus === 'approved' ? 'bg-green-500 text-white' :
                    'bg-red-500 text-white'
                  }`}>
                    {product.moderationStatus || 'pending'}
                  </span>
                </div>
                {product.type === 'Local' && (
                  <div className="absolute top-3 right-3 bg-zoop-moss text-zoop-obsidian px-3 py-1 rounded-full text-xs font-black">
                    ⚡ LOCAL
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-4">
                <div className="mb-3">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{product.brand}</p>
                  <h3 className="font-bold text-lg text-zoop-obsidian line-clamp-2">{product.name || product.title}</h3>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <StarRating rating={Number(product.rating) || 0} totalReviews={Number(product.ratingCount) || 0} size={12} />
                  <p className="font-black text-zoop-obsidian">₹{(product.price || 0).toLocaleString()}</p>
                </div>

                <div className="space-y-2 mb-4 pb-4 border-b border-gray-100">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Category:</span>
                    <span className="font-bold">{product.category || product.categoryId}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Seller:</span>
                    <span className="font-bold">
                      {product.seller?.businessName || product.seller?.displayName || product.sellerId || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Submitted:</span>
                    <span className="font-bold">{product.createdAt ? new Date(product.createdAt).toLocaleDateString() : '-'}</span>
                  </div>
                </div>

                {product.moderationNote && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg">
                    <p className="text-xs font-bold text-red-700 uppercase mb-1">Rejection Reason</p>
                    <p className="text-xs text-red-600">{product.moderationNote}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  {(product.moderationStatus || 'pending') === 'pending' && (
                    <>
                      <button
                        onClick={() => handleApprove(product.id)}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-1"
                      >
                        <Check width={16} height={16} />
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(product.id)}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-1"
                      >
                        <X width={16} height={16} />
                        Reject
                      </button>
                    </>
                  )}
                  {product.moderationStatus === 'rejected' && (
                    <button
                      onClick={() => handleApprove(product.id)}
                      className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-lg font-bold text-sm transition-all"
                    >
                      Re-review
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedProduct(product)}
                    className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all flex items-center justify-center"
                  >
                    <Eye width={16} height={16} className="text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <div className="bg-white rounded-2xl p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-black text-zoop-obsidian mb-2">
              No products found
            </h3>
            <p className="text-gray-500">
              {searchQuery ? 'Try a different search term' : `No ${filter} products at the moment`}
            </p>
          </div>
        )}
      </div>

      {selectedProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-4xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-black text-zoop-obsidian">Product Full Details</h3>
              <button
                onClick={() => setSelectedProduct(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-all"
              >
                <X width={22} height={22} />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <img
                  src={selectedProduct.image || selectedProduct.thumbnailUrl || "/brand-mark.svg"}
                  alt={selectedProduct.name || selectedProduct.title}
                  className="w-full aspect-square object-cover rounded-2xl border border-gray-200"
                  onError={(event) => {
                    event.currentTarget.src = "/brand-mark.svg";
                  }}
                />
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {(selectedProduct.imageUrls || []).slice(0, 6).map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt="media"
                      className="h-20 w-full object-cover rounded-lg border border-gray-200"
                      onError={(event) => {
                        event.currentTarget.src = "/brand-mark.svg";
                      }}
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-xs font-black uppercase tracking-widest text-gray-500">{selectedProduct.brand || "Brand"}</p>
                <h4 className="text-2xl font-black text-zoop-obsidian">{selectedProduct.name || selectedProduct.title}</h4>
                <p className="text-sm text-gray-700">{selectedProduct.description || "No description provided."}</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 bg-gray-50 rounded-xl"><b>Price:</b> Rs. {(selectedProduct.price || 0).toLocaleString("en-IN")}</div>
                  <div className="p-3 bg-gray-50 rounded-xl"><b>Stock:</b> {selectedProduct.stockQty ?? selectedProduct.quantity ?? 0}</div>
                  <div className="p-3 bg-gray-50 rounded-xl"><b>Category:</b> {selectedProduct.category || selectedProduct.categoryId || "-"}</div>
                  <div className="p-3 bg-gray-50 rounded-xl"><b>Created:</b> {selectedProduct.createdAt ? new Date(selectedProduct.createdAt).toLocaleString() : "-"}</div>
                </div>
                <div className="p-4 border border-gray-200 rounded-xl">
                  <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Seller Information</p>
                  <p className="text-sm"><b>Name:</b> {selectedProduct.seller?.businessName || selectedProduct.seller?.displayName || "-"}</p>
                  <p className="text-sm"><b>Email:</b> {selectedProduct.seller?.email || "-"}</p>
                  <p className="text-sm"><b>Phone:</b> {selectedProduct.seller?.phone || "-"}</p>
                  <p className="text-sm"><b>Verification:</b> {selectedProduct.seller?.verificationStatus || "-"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentCuration;

