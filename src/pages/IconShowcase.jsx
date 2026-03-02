import React from 'react';
import { Mail } from '../assets/icons/Mail';
import { Phone } from '../assets/icons/Phone';
import { MessageCircle } from '../assets/icons/MessageCircle';
import { Search } from '../assets/icons/Search';
import { Filter } from '../assets/icons/Filter';
import { Plus } from '../assets/icons/Plus';
import { Edit } from '../assets/icons/Edit';
import { Eye } from '../assets/icons/Eye';
import { Home } from '../assets/icons/Home';
import { Truck } from '../assets/icons/Truck';
import { Clock } from '../assets/icons/Clock';
import { Store } from '../assets/icons/Store';
import { MapPin } from '../assets/icons/MapPin';
import { CheckCircle } from '../assets/icons/CheckCircle';
import { LogOut } from '../assets/icons/LogOut';
import { Heart } from '../assets/icons/Heart';
import { ShoppingCart } from '../assets/icons/ShoppingCart';
import { Star } from '../assets/icons/Star';
import { Package } from '../assets/icons/Package';
import { Delete } from '../assets/icons/Delete';
import { X } from '../assets/icons/X';
import { User } from '../assets/icons/User';
import { Users } from '../assets/icons/Users';
import { Activity } from '../assets/icons/Activity';
import { TrendingUp } from '../assets/icons/TrendingUp';
import { BellRing } from '../assets/icons/BellRing';
import { Shield } from '../assets/icons/Shield';
import { Zap } from '../assets/icons/Zap';
import { Grid } from '../assets/icons/Grid';
import { List } from '../assets/icons/List';

const IconShowcase = () => {
  const iconSections = [
    {
      title: 'Communication',
      icons: [
        { component: Mail, name: 'Mail', description: 'Floating envelope with opening flap' },
        { component: Phone, name: 'Phone', description: 'Ringing phone with signal pulse' },
        { component: MessageCircle, name: 'MessageCircle', description: 'Bouncing bubble with typing dots' },
      ]
    },
    {
      title: 'Navigation',
      icons: [
        { component: Home, name: 'Home', description: 'Welcoming house with door swing' },
        { component: Search, name: 'Search', description: 'Magnifying glass with zoom effect' },
        { component: Filter, name: 'Filter', description: 'Funnel with flow animation' },
        { component: MapPin, name: 'MapPin', description: 'Pin drop with pulsing center' },
      ]
    },
    {
      title: 'Actions',
      icons: [
        { component: Plus, name: 'Plus', description: 'Expanding cross with rotation' },
        { component: Edit, name: 'Edit', description: 'Pencil writing animation' },
        { component: Delete, name: 'Delete', description: 'Trash can with lid opening' },
        { component: Eye, name: 'Eye', description: 'Blinking eye with pupil tracking' },
        { component: X, name: 'X', description: 'Close icon with rotation' },
        { component: CheckCircle, name: 'CheckCircle', description: 'Success with pulse' },
        { component: LogOut, name: 'LogOut', description: 'Door swing with arrow slide' },
      ]
    },
    {
      title: 'E-commerce',
      icons: [
        { component: ShoppingCart, name: 'ShoppingCart', description: 'Cart with wheel spin' },
        { component: Heart, name: 'Heart', description: 'Heart with scale and fill' },
        { component: Star, name: 'Star', description: 'Star with rotation' },
        { component: Package, name: 'Package', description: 'Box with bounce animation' },
        { component: Truck, name: 'Truck', description: 'Delivery truck driving' },
        { component: Store, name: 'Store', description: 'Shop with bouncing' },
      ]
    },
    {
      title: 'User & Social',
      icons: [
        { component: User, name: 'User', description: 'Profile with scale animation' },
        { component: Users, name: 'Users', description: 'Multiple users animation' },
      ]
    },
    {
      title: 'Business',
      icons: [
        { component: Activity, name: 'Activity', description: 'Activity graph pulse' },
        { component: TrendingUp, name: 'TrendingUp', description: 'Trending arrow motion' },
        { component: Clock, name: 'Clock', description: 'Ticking clock hands' },
      ]
    },
    {
      title: 'Status & Utility',
      icons: [
        { component: BellRing, name: 'BellRing', description: 'Notification bell ringing' },
        { component: Shield, name: 'Shield', description: 'Security shield glow' },
        { component: Zap, name: 'Zap', description: 'Lightning bolt effect' },
      ]
    },
    {
      title: 'View Options',
      icons: [
        { component: Grid, name: 'Grid', description: 'Grid view toggle' },
        { component: List, name: 'List', description: 'List view toggle' },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-black text-zoop-obsidian mb-4">
            🎨 Animated Icon Library
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            50+ Premium Animated Icons for Zoop Marketplace
          </p>
          <p className="text-lg text-gray-500">
            Hover over any icon to see its creative animation
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
            <div className="text-3xl font-black text-zoop-moss mb-2">50+</div>
            <div className="text-sm text-gray-600">Total Icons</div>
          </div>
          <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
            <div className="text-3xl font-black text-zoop-copper mb-2">100%</div>
            <div className="text-sm text-gray-600">Animated</div>
          </div>
          <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
            <div className="text-3xl font-black text-blue-600 mb-2">TypeScript</div>
            <div className="text-sm text-gray-600">Type Safe</div>
          </div>
          <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
            <div className="text-3xl font-black text-purple-600 mb-2">60fps</div>
            <div className="text-sm text-gray-600">Performance</div>
          </div>
        </div>

        {/* Icon Sections */}
        {iconSections.map((section, idx) => (
          <div key={idx} className="mb-12">
            <h2 className="text-2xl font-black text-zoop-obsidian mb-6 flex items-center gap-3">
              <span className="w-2 h-8 bg-zoop-moss rounded-full"></span>
              {section.title}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {section.icons.map((icon, iconIdx) => {
                const IconComponent = icon.component;
                return (
                  <div
                    key={iconIdx}
                    className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 group"
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="w-20 h-20 flex items-center justify-center mb-4 rounded-xl bg-gray-50 group-hover:bg-zoop-moss/10 transition-colors">
                        <IconComponent width={40} height={40} stroke="currentColor" className="text-zoop-obsidian" />
                      </div>
                      <h3 className="font-bold text-zoop-obsidian mb-2">{icon.name}</h3>
                      <p className="text-xs text-gray-500">{icon.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Features */}
        <div className="mt-16 bg-gradient-to-r from-zoop-moss/20 to-zoop-copper/20 rounded-2xl p-8">
          <h2 className="text-2xl font-black text-zoop-obsidian mb-6 text-center">
            ✨ Key Features
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white/80 backdrop-blur rounded-xl p-6">
              <div className="text-3xl mb-3">🎯</div>
              <h3 className="font-bold text-zoop-obsidian mb-2">Hover Activated</h3>
              <p className="text-sm text-gray-600">
                All animations trigger on hover for interactive feedback
              </p>
            </div>
            <div className="bg-white/80 backdrop-blur rounded-xl p-6">
              <div className="text-3xl mb-3">⚡</div>
              <h3 className="font-bold text-zoop-obsidian mb-2">Lightweight</h3>
              <p className="text-sm text-gray-600">
                CSS-based animations for optimal performance
              </p>
            </div>
            <div className="bg-white/80 backdrop-blur rounded-xl p-6">
              <div className="text-3xl mb-3">🎨</div>
              <h3 className="font-bold text-zoop-obsidian mb-2">Creative</h3>
              <p className="text-sm text-gray-600">
                Unique animations that communicate function
              </p>
            </div>
          </div>
        </div>

        {/* Usage Example */}
        <div className="mt-12 bg-white rounded-2xl p-8 shadow-sm">
          <h2 className="text-2xl font-black text-zoop-obsidian mb-4">
            💻 Usage Example
          </h2>
          <pre className="bg-gray-900 text-gray-100 rounded-xl p-6 overflow-x-auto">
            <code>{`import { Mail } from '@/assets/icons/Mail';

function ContactButton() {
  return (
    <button className="flex items-center gap-2">
      <Mail width={24} height={24} stroke="currentColor" />
      Contact Us
    </button>
  );
}`}</code>
          </pre>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500">
          <p>Created for Zoop Marketplace with ❤️</p>
          <p className="text-sm mt-2">All icons are TypeScript-based with creative animations</p>
        </div>
      </div>
    </div>
  );
};

export default IconShowcase;
