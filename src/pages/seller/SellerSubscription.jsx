import React, { useEffect, useState } from "react";
import { sellerApi, authApi } from "../../services/api";
import { useSiteConfig } from "../../context/SiteConfigContext";

const RAZORPAY_CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

const loadRazorpayCheckoutScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = RAZORPAY_CHECKOUT_SRC;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const SellerSubscription = () => {
  const { brandName } = useSiteConfig();
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
        <h1 className="text-4xl md:text-5xl font-black text-zoop-obsidian dark:text-white italic tracking-tighter">
          Seller Subscription Plans
        </h1>
        {profile?.subscription?.planName ? (
          <p className="text-sm font-bold text-gray-600 dark:text-gray-400">
            Active plan: <span className="text-zoop-obsidian dark:text-white">{profile.subscription.planName}</span>{" "}
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
              className={`relative rounded-[2rem] hover:scale-102 p-7 border-2 shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)] transition-all ${
                activePlanId === plan.id
                  ? "border-zoop-moss bg-zoop-moss/10"
                  : "border-gray-200 dark:border-white/10 bg-white dark:glass-card "
              }`}
            >
              <h3 className="text-2xl font-black text-zoop-obsidian dark:text-white">{plan.name}</h3>
              <p className="text-4xl font-black mt-3">Rs. {Number(plan.price || 0).toLocaleString("en-IN")}</p>
              <p className="text-xs text-gray-500 mt-1">{plan.durationDays || 30} days</p>
              <ul className="mt-4 space-y-2">
                {(plan.features || []).map((feature, idx) => (
                  <li key={idx} className="text-sm text-gray-600 dark:text-gray-400">
                    • {feature}
                  </li>
                ))}
              </ul>
              <button
                onClick={async () => {
                  setSavingPlanId(plan.id);
                  try {
                    const price = Number(plan.price || 0);
                    if (price > 0) {
                      const sdkLoaded = await loadRazorpayCheckoutScript();
                      if (!sdkLoaded || !window.Razorpay) {
                        throw new Error("Could not load Razorpay checkout. Please try again.");
                      }

                      const paymentOrderResponse =
                        await sellerApi.createSubscriptionRazorpayOrder(plan.id);

                      if (paymentOrderResponse?.free) {
                        await load();
                        return;
                      }

                      const keyId = paymentOrderResponse?.keyId;
                      const razorpayOrder = paymentOrderResponse?.order;
                      if (!keyId || !razorpayOrder?.id) {
                        throw new Error("Could not start subscription payment.");
                      }

                      const paymentResult = await new Promise((resolve, reject) => {
                        const rzp = new window.Razorpay({
                          key: keyId,
                          amount: razorpayOrder.amount,
                          currency: razorpayOrder.currency || "INR",
                          name: brandName || "Zoop",
                          description: "Subscription Payment",
                          order_id: razorpayOrder.id,
                          prefill: {
                            name: profile?.displayName || profile?.name || "",
                            email: profile?.email || "",
                            contact: profile?.phone || "",
                          },
                          notes: razorpayOrder.notes || {},
                          theme: { color: "#a3e635" },
                          handler: (payment) => resolve(payment),
                          modal: {
                            ondismiss: () => reject(new Error("Payment cancelled by user")),
                          },
                        });
                        rzp.on("payment.failed", (resp) => {
                          const reason =
                            resp?.error?.description ||
                            resp?.error?.reason ||
                            "Payment failed";
                          reject(new Error(reason));
                        });
                        rzp.open();
                      });

                      await sellerApi.verifySubscriptionRazorpayPayment({
                        razorpayOrderId: paymentResult.razorpay_order_id,
                        razorpayPaymentId: paymentResult.razorpay_payment_id,
                        razorpaySignature: paymentResult.razorpay_signature,
                      });

                      await load();
                    } else {
                      await sellerApi.chooseSubscriptionPlan(plan.id);
                      await load();
                    }
                  } finally {
                    setSavingPlanId("");
                  }
                }}
                disabled={savingPlanId === plan.id}
                className={`mt-6 w-full py-3 rounded-xl font-black text-xs uppercase tracking-widest ${
                  activePlanId === plan.id
                    ? "bg-gray-100 dark:bg-white/10 text-gray-500"
                    : "bg-zoop-obsidian text-white"
                }`}
              >
                {savingPlanId === plan.id
                  ? "Saving..."
                  : activePlanId === plan.id
                    ? "Current Plan"
                    : Number(plan.price || 0) > 0
                      ? "Pay & Activate"
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
