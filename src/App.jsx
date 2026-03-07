import "./App.css";
import React, { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import CustomerLayout from "./layouts/CustomerLayout";
import ScrollToTop from "./components/shared/ScrollToTop";
import NetworkStatusToast from "./components/shared/NetworkStatusToast";
import {
  PageSkeleton,
  ProductDetailSkeleton,
} from "./components/shared/Skeletons";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

// Lazy Load Pages
const Home = lazy(() => import("./pages/customer/Home"));
const Search = lazy(() => import("./pages/customer/Search"));
const MobileSearch = lazy(() => import("./pages/customer/MobileSearch"));
const Cart = lazy(() => import("./pages/customer/Cart"));
const Checkout = lazy(() => import("./pages/customer/Checkout"));
const OrderHistory = lazy(() => import("./pages/customer/OrderHistory"));
const Track = lazy(() => import("./pages/customer/Track"));
const Wishlist = lazy(() => import("./pages/customer/Wishlist"));
const Profile = lazy(() => import("./pages/customer/Profile"));
const Products = lazy(() => import("./pages/customer/Products"));
const CategoryPage = lazy(() => import("./pages/customer/CategoryPage"));
const ProductDetail = lazy(() => import("./pages/customer/ProductDetail"));
const About = lazy(() => import("./pages/static/About"));
const Contact = lazy(() => import("./pages/static/Contact"));
const Privacy = lazy(() => import("./pages/static/Privacy"));
const Cookies = lazy(() => import("./pages/static/Cookies"));
const Terms = lazy(() => import("./pages/static/Terms"));
const Help = lazy(() => import("./pages/static/Help"));
const IconShowcase = lazy(() => import("./pages/IconShowcase"));

// Auth & Seller Pages
const AuthLayout = lazy(() => import("./pages/auth/AuthLayout"));
const Login = lazy(() => import("./pages/auth/Login"));
const Signup = lazy(() => import("./pages/auth/Signup"));
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const SellerOnboarding = lazy(() => import("./pages/seller/SellerOnboarding"));
const SellerApprovalWaiting = lazy(
  () => import("./pages/seller/SellerApprovalWaiting"),
);
const SellerLayout = lazy(() => import("./layouts/SellerLayout"));
const SellerDashboard = lazy(() => import("./pages/seller/SellerDashboard"));
const SellerSignup = lazy(() => import("./pages/auth/SellerSignup"));

// Seller Components (Handling named/default exports correctly)
const SellerAddProduct = lazy(() =>
  import("./pages/seller/SellerAddProduct").then((module) => ({
    default: module.SellerAddProduct,
  })),
);
const SellerProductList = lazy(() =>
  import("./pages/seller/SellerProductList").then((module) => ({
    default: module.SellerProductList,
  })),
);
const SellerOrders = lazy(() => import("./pages/seller/SellerOrders"));
const SellerProfile = lazy(() => import("./pages/seller/SellerProfile"));
const SellerAds = lazy(() => import("./pages/seller/SellerAds"));
const SellerPayouts = lazy(() => import("./pages/seller/Payouts"));
const SellerSubscription = lazy(
  () => import("./pages/seller/SellerSubscription"),
);
const StoreSettings = lazy(() => import("./pages/seller/StoreSettings"));
const SellerInstructions = lazy(() => import("./pages/seller/SellerInstructions"));

// Admin Pages
const AdminLayout = lazy(() => import("./layouts/AdminLayout"));
const AdminStats = lazy(() => import("./pages/admin/AdminStats"));
const VerifySellers = lazy(() => import("./pages/admin/VerifySellers"));
const ContentCuration = lazy(() => import("./pages/admin/ContentCuration"));
const SupportTickets = lazy(() => import("./pages/admin/SupportTickets"));
const Monetization = lazy(() => import("./pages/admin/Monetization"));
const UserManagement = lazy(() => import("./pages/admin/UserManagement"));
const SellerManagement = lazy(() => import("./pages/admin/SellerManagement"));
const AdminWebsiteControl = lazy(() => import("./pages/admin/AdminWebsiteControl"));
const AdminProfile = lazy(() => import("./pages/admin/AdminProfile"));
const AdminGuide = lazy(() => import("./pages/admin/AdminGuide"));
const AdminAdsManagement = lazy(() => import("./pages/admin/AdminAdsManagement"));
const AdminSubscriptionManagement = lazy(
  () => import("./pages/admin/AdminSubscriptionManagement"),
);
const NotFound = lazy(() => import("./pages/shared/NotFound"));

function App() {
  return (
    <>
      <ScrollToTop />
      <NetworkStatusToast />
      <Suspense fallback={<PageSkeleton />}>
        <Routes>
          <Route path="/" element={<CustomerLayout />}>
            <Route index element={<Home />} />
            <Route path="search" element={<Search />} />
            <Route path="mobile-search" element={<MobileSearch />} />
            <Route path="cart" element={<Cart />} />
            <Route
              path="checkout"
              element={
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              }
            />
            <Route
              path="history"
              element={
                <ProtectedRoute>
                  <OrderHistory />
                </ProtectedRoute>
              }
            />
            <Route path="track" element={<Track />} />
            <Route
              path="wishlist"
              element={
                <ProtectedRoute>
                  <Wishlist />
                </ProtectedRoute>
              }
            />
            <Route
              path="profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route path="products" element={<Products />} />
            <Route path="category/:categoryName" element={<CategoryPage />} />
            <Route
              path="product/:id"
              element={
                <Suspense fallback={<ProductDetailSkeleton />}>
                  <ProductDetail />
                </Suspense>
              }
            />
            <Route path="about" element={<About />} />
            <Route path="contact" element={<Contact />} />
            <Route path="privacy" element={<Privacy />} />
            <Route path="cookies" element={<Cookies />} />
            <Route path="terms" element={<Terms />} />
            <Route path="help" element={<Help />} />
            <Route path="icons" element={<IconShowcase />} />
          </Route>

          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/seller/signup" element={<SellerSignup />} />
          </Route>

          {/* Admin Login - Standalone Route */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Seller Onboarding - requires any logged-in user (NOT admin-only) */}
          <Route
            path="/seller/onboarding"
            element={
              <ProtectedRoute allowedRoles={["customer", "seller"]}>
                <SellerOnboarding />
              </ProtectedRoute>
            }
          />
          <Route
            path="/seller/waiting"
            element={
              <ProtectedRoute allowedRoles={["customer", "seller"]}>
                <SellerApprovalWaiting />
              </ProtectedRoute>
            }
          />

          {/* Seller Routes - Protected */}
          <Route
            path="/seller"
            element={
              <ProtectedRoute allowedRoles={["seller"]}>
                <SellerLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<SellerDashboard />} />
            <Route path="dashboard" element={<SellerDashboard />} />
            <Route path="add-product" element={<SellerAddProduct />} />
            <Route
              path="edit-product/:productId"
              element={<SellerAddProduct />}
            />
            <Route path="products" element={<SellerProductList />} />
            <Route path="orders" element={<SellerOrders />} />
            <Route path="ads" element={<SellerAds />} />
            <Route path="payouts" element={<SellerPayouts />} />
            <Route path="subscription" element={<SellerSubscription />} />
            <Route path="instructions" element={<SellerInstructions />} />
            <Route path="settings" element={<StoreSettings />} />
            <Route path="profile" element={<SellerProfile />} />
          </Route>

          {/* Admin Routes - Protected, admin-only */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly allowedRoles={["admin"]}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminStats />} />
            <Route path="verify" element={<VerifySellers />} />
            <Route path="contentcuration" element={<ContentCuration />} />
            <Route path="website-control" element={<AdminWebsiteControl />} />
            <Route path="ads" element={<AdminAdsManagement />} />
            <Route path="subscriptions" element={<AdminSubscriptionManagement />} />
            <Route path="guide" element={<AdminGuide />} />
            <Route path="supporttickets" element={<SupportTickets />} />
            <Route path="monetization" element={<Monetization />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="sellers" element={<SellerManagement />} />
            <Route path="profile" element={<AdminProfile />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default App;
