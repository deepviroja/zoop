import React, { useEffect, useMemo, useState } from "react";
import { sellerApi } from "../../services/api";

const fmtInr = (value) =>
  Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });

const Payouts = () => {
  const [loading, setLoading] = useState(true);
  const [payload, setPayload] = useState({ payouts: [], totals: {} });
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await sellerApi.getPayouts();
        if (!cancelled) setPayload(data || { payouts: [], totals: {} });
      } catch (e) {
        if (!cancelled) setError(e?.message || "Failed to load payouts");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const rows = useMemo(
    () => (Array.isArray(payload?.payouts) ? payload.payouts : []),
    [payload],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-900 tracking-tighter italic text-zoop-obsidian uppercase">
          Payouts
        </h1>
        <p className="text-gray-500 mt-2">Funds are released only after admin transfer.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <p className="text-xs font-black uppercase tracking-widest text-gray-400">Pending Transfer</p>
          <p className="text-3xl font-black text-amber-600 mt-2">
            ₹{fmtInr(payload?.totals?.pendingTransfer)}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <p className="text-xs font-black uppercase tracking-widest text-gray-400">Transferred</p>
          <p className="text-3xl font-black text-green-600 mt-2">₹{fmtInr(payload?.totals?.transferred)}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <p className="text-xs font-black uppercase tracking-widest text-gray-400">Approx Balance</p>
          <p className="text-3xl font-black text-zoop-obsidian mt-2">
            ₹{fmtInr(payload?.totals?.approximateBalance)}
          </p>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-black text-zoop-obsidian">Payout Records</h2>
        </div>
        {loading ? (
          <p className="p-6 text-gray-500 font-bold">Loading payouts...</p>
        ) : error ? (
          <p className="p-6 text-red-600 font-bold">{error}</p>
        ) : rows.length === 0 ? (
          <p className="p-6 text-gray-500 font-bold">No payouts yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {["Order", "Product", "Gross", "Commission", "Payout", "Status", "Released"].map((h) => (
                    <th
                      key={h}
                      className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="px-6 py-4 font-bold text-zoop-obsidian">{row.orderId}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{row.productId}</td>
                    <td className="px-6 py-4 font-bold">₹{fmtInr(row.grossAmount)}</td>
                    <td className="px-6 py-4 text-sm">
                      ₹{fmtInr(row.commissionAmount)} ({row.commissionPercent}%)
                    </td>
                    <td className="px-6 py-4 font-black text-zoop-moss">₹{fmtInr(row.payoutAmount)}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-black ${
                          row.status === "TRANSFERRED"
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {row.releasedAt ? new Date(row.releasedAt).toLocaleString() : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Payouts;

