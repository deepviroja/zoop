import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';
import { ShoppingCart } from '../../assets/icons/ShoppingCart';
import * as motion from 'motion/react';

const { motion: Motion, AnimatePresence } = motion;

const AnimatedCartIcon = ({ className = "", stroke = "#b7e84b" }) => {
  const { getCartCount, recentlyAdded } = useCart();
  const count = getCartCount();

  return (
    <Link to="/cart" className={`relative ${className}`}>
      <Motion.div
        animate={recentlyAdded ? {
          scale: [1, 1.2, 1],
          rotate: [0, -10, 10, -10, 0],
        } : {}}
        transition={{ duration: 0.6, type: "spring" }}
        className="relative"
      >
        {/* Shopping Cart Icon */}
        <div className="relative">
          <ShoppingCart width={28} height={28} stroke={stroke} className="text-white hover:text-zoop-moss transition-colors" />
          
          {/* Animated Fill Effect - Items in Cart */}
          <AnimatePresence>
            {count > 0 && (
              <>
                {/* Fill layer 1 - Bottom */}
                <Motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "30%", opacity: 0.6 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="absolute bottom-[6px] left-[7px] right-[7px] bg-zoop-moss rounded-sm"
                  style={{ width: '14px' }}
                />
                
                {/* Fill layer 2 - Middle (if more than 2 items) */}
                {count > 2 && (
                  <Motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "25%", opacity: 0.5 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, delay: 0.1, ease: "easeOut" }}
                    className="absolute bottom-[9px] left-[7px] right-[7px] bg-zoop-moss rounded-sm"
                    style={{ width: '14px' }}
                  />
                )}
                
                {/* Fill layer 3 - Top (if more than 5 items) */}
                {count > 5 && (
                  <Motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "20%", opacity: 0.4 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, delay: 0.2, ease: "easeOut" }}
                    className="absolute bottom-[12px] left-[7px] right-[7px] bg-zoop-moss rounded-sm"
                    style={{ width: '14px' }}
                  />
                )}
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Counter Badge */}
        <AnimatePresence>
          {count > 0 && (
            <Motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] min-w-[18px] h-[18px] rounded-full flex items-center justify-center font-black shadow-lg"
            >
              <Motion.span
                key={count}
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 25 }}
              >
                {count > 99 ? '99+' : count}
              </Motion.span>
            </Motion.span>
          )}
        </AnimatePresence>

        {/* Pulse effect when item added */}
        <AnimatePresence>
          {recentlyAdded && (
            <Motion.span
              initial={{ scale: 1, opacity: 0.8 }}
              animate={{ scale: 2.5, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="absolute -top-1 -right-1 w-8 h-8 bg-zoop-moss rounded-full"
            />
          )}
        </AnimatePresence>
      </Motion.div>
    </Link>
  );
};

export default AnimatedCartIcon;
