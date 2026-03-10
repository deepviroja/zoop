import React, { useEffect, useMemo, useState } from "react";
import { adminApi } from "../../services/api";
import { Search } from "../../assets/icons/Search";
import { Store } from "../../assets/icons/Store";
import { Package } from "../../assets/icons/Package";
import { ShoppingCart } from "../../assets/icons/ShoppingCart";
import { Eye } from "../../assets/icons/Eye";
import { X } from "../../assets/icons/X";
import { Check } from "../../assets/icons/Check";
import { normalizeDocumentUrl } from "../../utils/documentLinks";

const fmtInr = (value) =>
  Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });
const fmtDateTime = (value) => (value ? new Date(value).toLocaleString() : "-");
const sellerStateLabel = (seller) => {
  if (seller?.isDeleted || seller?.status === "deleted") return "deleted";
  if (seller?.disabled || seller?.status === "banned") return "banned";
  if (
    seller?.status === "pending" ||
    seller?.accountState === "pending" ||
    seller?.isProfileComplete === false
  ) {
    return "pending";
  }
  return "active";
};

const SellerManagement = () => {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSeller, setSelectedSeller] = useState(null);

  useEffect(() => {
    let cancelled = false;
    adminApi
      .getSellers()
      .then((items) => {
        if (!cancelled) setSellers(Array.isArray(items) ? items : []);
      })
      .catch(() => {
        if (!cancelled) setSellers([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return sellers.filter((s) => {
      const name = String(s.businessName || s.displayName || s.name || "").toLowerCase();
      const email = String(s.email || "").toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [sellers, searchQuery]);

  const handleToggleBanSeller = async (seller) => {
    const isBanned = sellerStateLabel(seller) === "banned";
    const action = isBanned ? "unban" : "ban";
    if (!window.confirm(`Are you sure you want to ${action} ${seller.businessName || seller.email}?`)) {
      return;
    }
    try {
      await adminApi.banUser(seller.id, !isBanned);
      setSellers((prev) =>
        prev.map((s) =>
          s.id === seller.id
            ? {
                ...s,
                disabled: !isBanned,
                status: !isBanned ? "banned" : s?.isDeleted ? "deleted" : "active",
                accountState: !isBanned ? "banned" : s?.isDeleted ? "deleted" : "active",
              }
            : s,
        ),
      );
      if (selectedSeller?.id === seller.id) {
        setSelectedSeller((prev) =>
          prev
            ? {
                ...prev,
                disabled: !isBanned,
                status: !isBanned ? "banned" : prev?.isDeleted ? "deleted" : "active",
                accountState: !isBanned ? "banned" : prev?.isDeleted ? "deleted" : "active",
              }
            : prev,
        );
      }
    } catch {
      alert(`Failed to ${action} seller`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-900 tracking-tighter italic text-zoop-obsidian uppercase">
              Seller_Management
            </h1>
            <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">
              Detailed operational view of all sellers
            </p>
          </div>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" width={18} height={18} />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search seller by name or email"
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-zoop-moss outline-none"
            />
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto scrollbar-gap">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Seller</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Verification</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Products</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Orders</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Revenue</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Last Order</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td className="px-6 py-6 text-gray-500 font-bold" colSpan={7}>
                      Loading sellers...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td className="px-6 py-6 text-gray-500 font-bold" colSpan={7}>
                      No sellers found
                    </td>
                  </tr>
                ) : (
                  filtered.map((seller) => (
                    <tr key={seller.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-full bg-zoop-canvas flex items-center justify-center">
                            <Store width={18} height={18} />
                          </div>
                          <div>
                            <p className="font-bold text-zoop-obsidian">
                              {seller.businessName || seller.displayName || seller.name || "Seller"}
                            </p>
                            <p className="text-xs text-gray-500">{seller.email || "-"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-gray-100 text-gray-700">
                            {seller.verificationStatus || "pending"}
                          </span>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                              sellerStateLabel(seller) === "deleted"
                                ? "bg-gray-200 text-gray-700"
                                : sellerStateLabel(seller) === "pending"
                                  ? "bg-sky-100 text-sky-700"
                                : sellerStateLabel(seller) === "banned"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-green-100 text-green-700"
                            }`}
                          >
                            {sellerStateLabel(seller)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="inline-flex items-center gap-2 text-sm font-bold text-zoop-obsidian">
                          <Package width={14} height={14} />
                          {Number(seller.productsCount || 0)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="inline-flex items-center gap-2 text-sm font-bold text-zoop-obsidian">
                          <ShoppingCart width={14} height={14} />
                          {Number(seller.totalOrders || 0)}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-black text-zoop-moss">
                        Rs. {fmtInr(seller.totalRevenue)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {fmtDateTime(seller.lastOrderAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedSeller(seller)}
                            className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all"
                            title="View seller details"
                          >
                            <Eye width={18} height={18} />
                          </button>
                          {sellerStateLabel(seller) !== "deleted" && (
                            <button
                              onClick={() => handleToggleBanSeller(seller)}
                              className={`p-2 rounded-lg transition-all ${
                                sellerStateLabel(seller) === "banned"
                                  ? "bg-green-50 text-green-600 hover:bg-green-100"
                                  : "bg-red-50 text-red-600 hover:bg-red-100"
                              }`}
                              title={sellerStateLabel(seller) === "banned" ? "Unban seller" : "Ban seller"}
                            >
                              {sellerStateLabel(seller) === "banned" ? (
                                <Check width={18} height={18} />
                              ) : (
                                <X width={18} height={18} />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {selectedSeller && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-8 max-w-3xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-black text-zoop-obsidian">Seller Details</h3>
                <button
                  onClick={() => setSelectedSeller(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-all"
                >
                  <X width={22} height={22} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 font-bold uppercase">Business Name</p>
                  <p className="font-black text-zoop-obsidian mt-1">
                    {selectedSeller.businessName || selectedSeller.displayName || "-"}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 font-bold uppercase">Owner</p>
                  <p className="font-black text-zoop-obsidian mt-1">{selectedSeller.ownerName || "-"}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 font-bold uppercase">Email</p>
                  <p className="font-black text-zoop-obsidian mt-1">{selectedSeller.email || "-"}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 font-bold uppercase">Phone</p>
                  <p className="font-black text-zoop-obsidian mt-1">{selectedSeller.phone || "-"}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 font-bold uppercase">Joined At</p>
                  <p className="font-black text-zoop-obsidian mt-1">{fmtDateTime(selectedSeller.joinedAt)}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 font-bold uppercase">Last Login</p>
                  <p className="font-black text-zoop-obsidian mt-1">{fmtDateTime(selectedSeller.lastLoginAt)}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 font-bold uppercase">Account Status</p>
                  <p className="font-black text-zoop-obsidian mt-1">{sellerStateLabel(selectedSeller)}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 font-bold uppercase">Last Product Added</p>
                  <p className="font-black text-zoop-obsidian mt-1">{fmtDateTime(selectedSeller.lastProductAt)}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 font-bold uppercase">Last Order</p>
                  <p className="font-black text-zoop-obsidian mt-1">{fmtDateTime(selectedSeller.lastOrderAt)}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 font-bold uppercase">Total Products</p>
                  <p className="font-black text-zoop-obsidian mt-1">{selectedSeller.productsCount || 0}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 font-bold uppercase">Total Orders</p>
                  <p className="font-black text-zoop-obsidian mt-1">{selectedSeller.totalOrders || 0}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl md:col-span-2">
                  <p className="text-xs text-gray-500 font-bold uppercase">Total Revenue</p>
                  <p className="font-black text-zoop-moss text-xl mt-1">
                    Rs. {fmtInr(selectedSeller.totalRevenue)}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl md:col-span-2">
                  <p className="text-xs text-gray-500 font-bold uppercase mb-2">Uploaded Documents</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                    {[
                      { label: "PAN Card", url: normalizeDocumentUrl(selectedSeller.panCardUrl) },
                      { label: "Cancelled Cheque", url: normalizeDocumentUrl(selectedSeller.cancelledChequeUrl) },
                      { label: "GST Certificate", url: normalizeDocumentUrl(selectedSeller.gstCertificateUrl) },
                    ].map((doc) => (
                      <a
                        key={doc.label}
                        href={doc.url || "#"}
                        target={doc.url ? "_blank" : undefined}
                        rel={doc.url ? "noreferrer" : undefined}
                        onClick={(e) => {
                          if (!doc.url) e.preventDefault();
                        }}
                        className={`px-3 py-2 rounded-lg border font-bold ${
                          doc.url
                            ? "bg-white border-gray-200 text-zoop-obsidian hover:border-zoop-moss"
                            : "bg-gray-100 border-gray-100 text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        {doc.label}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerManagement;
