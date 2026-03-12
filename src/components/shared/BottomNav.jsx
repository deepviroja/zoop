import React from "react";
import { NavLink } from "react-router-dom";
import { Home } from "../../assets/icons/Home";
import { User } from "../../assets/icons/User";
import { SearchIcon } from "../../assets/icons/SearchIcon";
import { Heart } from "../../assets/icons/Heart";
import { Grid } from "../../assets/icons/Grid";

const BottomNav = () => {
  const navItems = [
    { name: "Home", icon: Home, path: "/" },
    { name: "Categories", icon: Grid, path: "/products" },
    { name: "Search", icon: SearchIcon, path: "/mobile-search" },
    { name: "Wishlist", icon: Heart, path: "/wishlist" },
    { name: "Account", icon: User, path: "/profile" },
  ];

  // Permanently visible as requested
  const isVisible = true;

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 bg-zoop-moss/5 backdrop-blur-2xl text-zoop-obsidian dark:text-white border-t border-white/20 shadow-[0_-10px_40px_rgba(0,0,0,0.18)] z-50 md:hidden safe-bottom transition-transform duration-300 ease-in-out ${
        isVisible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 transition-all relative ${
                  isActive ? "text-zoop-obsidian dark:text-white" : "text-zoop-moss"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <Icon
                      width={22}
                      height={22}
                      className={isActive ? "text-zoop-moss" : "text-zoop-obsidian/50"}
                    />
                    {item.badge > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] min-w-[16px] h-4 rounded-full flex items-center justify-center font-black px-1">
                        {item.badge > 99 ? "99+" : item.badge}
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-bold ${isActive ? "text-zoop-moss" : "text-zoop-obsidian/50"}`}
                  >
                    {item.name}
                  </span>
                  {isActive && (
                    <div className="absolute top-1 w-22 h-14 backdrop-blur-2xl bg-zoop-obsidian/10 rounded-full" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
