import React, { useEffect, useState } from "react";
import { sellerApi, authApi } from "../../services/api";

const SellerSubscription = () => {
  const [plans, setPlans] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingPlanId, setSavingPlanId] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [planList, myProfile] = await Promise.all([
        sellerApi.getSubscriptionPlans(),
        authApi.getProfile(),
      ]);
      setPlans(Array.isArray(planList) ? planList : []);
      setProfile(myProfile || null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const activePlanId = profile?.subscription?.planId || "";

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="text-center space-y-3">
        <h1 className="text-4xl md:text-5xl font-black text-zoop-obsidian italic tracking-tighter">
          Seller Subscription Plans
        </h1>
        {profile?.subscription?.planName ? (
          <p className="text-sm font-bold text-gray-600">
            Active plan: <span className="text-zoop-obsidian">{profile.subscription.planName}</span>{" "}
            {profile.subscription.expiresAt
              ? `(expires ${new Date(profile.subscription.expiresAt).toLocaleDateString()})`
              : ""}
          </p>
        ) : (
          <p className="text-gray-500 font-bold">Choose a plan to unlock seller features.</p>
        )}
      </div>

      {loading ? (
        <p className="text-center text-gray-500 font-bold">Loading plans...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-[2rem] p-7 border-2 shadow-sm transition-all ${
                activePlanId === plan.id
                  ? "border-zoop-moss bg-zoop-moss/10"
                  : "border-gray-200 bg-white"
              }`}
            >
              <h3 className="text-2xl font-black text-zoop-obsidian">{plan.name}</h3>
              <p className="text-4xl font-black mt-3">₹{Number(plan.price || 0).toLocaleString("en-IN")}</p>
              <p className="text-xs text-gray-500 mt-1">{plan.durationDays || 30} days</p>
              <ul className="mt-4 space-y-2">
                {(plan.features || []).map((feature, idx) => (
                  <li key={idx} className="text-sm text-gray-600">
                    • {feature}
                  </li>
                ))}
              </ul>
              <button
                onClick={async () => {
                  setSavingPlanId(plan.id);
                  try {
                    await sellerApi.chooseSubscriptionPlan(plan.id);
                    await load();
                  } finally {
                    setSavingPlanId("");
                  }
                }}
                disabled={savingPlanId === plan.id}
                className={`mt-6 w-full py-3 rounded-xl font-black text-xs uppercase tracking-widest ${
                  activePlanId === plan.id
                    ? "bg-gray-100 text-gray-500"
                    : "bg-zoop-obsidian text-white"
                }`}
              >
                {savingPlanId === plan.id
                  ? "Saving..."
                  : activePlanId === plan.id
                    ? "Current Plan"
                    : "Select Plan"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SellerSubscription;

