import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Zap } from "../../assets/icons/Zap";
import { Heart } from "../../assets/icons/Heart";
import { Users } from "../../assets/icons/Users";
import { TrendingUp } from "../../assets/icons/TrendingUp";
import { Plus } from '../../assets/icons/Plus';

import { productsApi } from "../../services/api";

const About = () => {
  const values = [
    {
      icon: Zap,
      title: "Hyper-Local Speed",
      description:
        "We deliver products from your city within 4-6 hours, connecting you with local sellers.",
      color: "from-yellow-400 to-orange-500",
    },
    {
      icon: Heart,
      title: "Artisan First",
      description:
        "Supporting local craftspeople and small businesses to preserve traditional skills.",
      color: "from-pink-500 to-rose-600",
    },
    {
      icon: Users,
      title: "Community Driven",
      description:
        "Building a marketplace that empowers local communities and creates opportunities.",
      color: "from-blue-500 to-indigo-600",
    },
    {
      icon: TrendingUp,
      title: "Growth Together",
      description:
        "Helping sellers grow their business while providing customers with quality products.",
      color: "from-green-500 to-emerald-600",
    },
  ];

  const [products, setProducts] = useState([]);

  useEffect(() => {
    productsApi
      .getAll()
      .then((items) => setProducts(Array.isArray(items) ? items : []))
      .catch(() => setProducts([]));
  }, []);

  const stats = useMemo(() => {
    const sellerCount = new Set(
      products.map((item) => item.sellerId || item.seller?.id).filter(Boolean),
    ).size;
    const cityCount = new Set(
      products
        .flatMap((item) => item.cityAvailability || [])
        .map((city) =>
          String(city || "")
            .trim()
            .toLowerCase(),
        )
        .filter(Boolean),
    ).size;
    const orderCount = products.reduce(
      (sum, item) => sum + Number(item.orderedCount || item.purchaseCount || 0),
      0,
    );

    return [
      {
        label: "Active Sellers",
        value: sellerCount.toLocaleString("en-IN") || "0",
      },
      {
        label: "Products",
        value: products.length.toLocaleString("en-IN") || "0",
      },
      { label: "Cities", value: cityCount.toLocaleString("en-IN") || "0" },
      {
        label: "Orders Completed",
        value: orderCount.toLocaleString("en-IN") || "0",
      },
    ];
  }, [products]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-white/5">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-zoop-obsidian via-zoop-ink to-zoop-clay py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-zoop-moss rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-zoop-copper rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-4xl md:text-6xl font-black text-white mb-6">
            About <span className="text-zoop-moss italic">ZOOP</span>
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
            India's fastest hyper-local marketplace connecting customers with
            local sellers and artisans for same-day delivery.
          </p>
        </div>
      </section>

      {/* Our Story */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-black text-zoop-obsidian dark:text-white mb-6">
              Our Story
            </h2>
            <div className="space-y-4 text-gray-700 dark:text-gray-300 leading-relaxed">
              <p>
                ZOOP was born from a simple observation: while e-commerce
                platforms offered convenience, they couldn't match the speed and
                personal touch of local shopping.
              </p>
              <p>
                We created ZOOP to bridge this gap by building a platform that
                combines the best of both worlds—the convenience of online
                shopping with the speed and community connection of local
                commerce.
              </p>
              <p>
                Today, ZOOP serves thousands of customers across India,
                delivering products from local sellers in just 4-6 hours while
                supporting artisans and small businesses in their growth
                journey.
              </p>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-4-5 bg-gradient-to-br from-zoop-moss/20 to-zoop-copper/20 rounded-3xl p-8 flex items-center justify-center">
              <div className="text-center">
                <div className="text-8xl font-black text-zoop-moss mb-4">
                  ZOOP
                </div>
                <p className="text-xl font-bold text-zoop-obsidian dark:text-white">
                  Local Speed.
                  <br />
                  Global Quality.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white dark:glass-card py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl md:text-4xl font-black text-zoop-obsidian dark:text-white text-center mb-12">
            ZOOP by the Numbers
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, idx) => (
              <div
                key={idx}
                className="text-center p-6 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10"
              >
                <div className="mb-2 inline-flex items-start gap-1 text-4xl font-black text-zoop-moss md:text-5xl">
                  <span>{stat.value}</span>
                  <Plus width={14} height={14} className="mt-1 shrink-0 md:mt-1.5" />
                </div>
                <p className="text-sm md:text-base font-bold text-gray-700 dark:text-gray-300">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-black text-zoop-obsidian dark:text-white mb-4">
            Our Values
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            The principles that guide everything we do at ZOOP
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {values.map((value, idx) => {
            const Icon = value.icon;
            return (
              <div
                key={idx}
                className="bg-white dark:glass-card rounded-2xl shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)] border border-gray-100 dark:border-white/10 p-8 hover:shadow-lg transition-shadow"
              >
                <div
                  className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${value.color} flex items-center justify-center mb-6 shadow-lg dark:shadow-[0_12px_32px_rgba(0,0,0,0.5)]`}
                >
                  <Icon width={32} height={32} className="text-white" />
                </div>
                <h3 className="text-2xl font-black text-zoop-obsidian dark:text-white mb-3">
                  {value.title}
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {value.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-zoop-obsidian to-zoop-ink py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-6">
            Join the ZOOP Community
          </h2>
          <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
            Whether you're a customer looking for fast delivery or a seller
            wanting to grow your business, ZOOP is here for you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/products"
              className="px-8 py-4 bg-zoop-moss hover:bg-zoop-moss/90 text-zoop-obsidian dark:text-white rounded-xl font-black transition-all shadow-lg dark:shadow-[0_12px_32px_rgba(0,0,0,0.5)] hover:scale-105"
            >
              Start Shopping
            </Link>
            <Link
              to="/signup"
              className="px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-xl border-2 border-white/20 text-white rounded-xl font-bold transition-all"
            >
              Become a Seller
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
