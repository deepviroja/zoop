import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { UserProvider } from "./context/UserProvider";
import { SiteConfigProvider } from "./context/SiteConfigContext";

import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";
import { ToastProvider } from "./context/ToastContext";
import { ThemeProvider } from "./context/ThemeContext";
import "./index.css";
import App from "./App.jsx";
import ErrorBoundary from "./components/shared/ErrorBoundary.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <SiteConfigProvider>
      <UserProvider>
        <WishlistProvider>
          <CartProvider>
            <ToastProvider>
              <BrowserRouter>
                <ErrorBoundary>
                  <App />
                </ErrorBoundary>
              </BrowserRouter>
            </ToastProvider>
          </CartProvider>
        </WishlistProvider>
      </UserProvider>
    </SiteConfigProvider>
    </ThemeProvider>
  </StrictMode>,
);
