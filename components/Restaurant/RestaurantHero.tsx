
import React from 'react';
import { ChevronLeft, Share2, Heart, Star, MapPin, Utensils, LayoutTemplate } from 'lucide-react';
import { RestaurantData } from '../../types';
import { Button } from '../UI/Button';

interface RestaurantHeroProps {
  restaurant: RestaurantData;
  onBack: () => void;
  onBookNow: () => void;
}

export const RestaurantHero: React.FC<RestaurantHeroProps> = ({ restaurant, onBack, onBookNow }) => {
  return (
    <div className="relative h-[50vh] w-full group overflow-hidden">
      <img 
        src={restaurant.imageUrl} 
        alt={restaurant.name} 
        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-1000"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent"></div>
      
      {/* Navbar Overlay */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10">
         <button onClick={onBack} className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all">
           <ChevronLeft size={24} />
         </button>
         <div className="flex gap-3">
           <button className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all"><Share2 size={20} /></button>
           <button className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all"><Heart size={20} /></button>
         </div>
      </div>

      {/* Hero Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 max-w-7xl mx-auto w-full">
         <div className="flex items-end gap-6 animate-fade-in-up">
            {restaurant.logoUrl && (
              <div className="hidden md:block w-24 h-24 rounded-full border-4 border-white shadow-xl overflow-hidden bg-white">
                 <img src={restaurant.logoUrl} alt="logo" className="w-full h-full object-cover"/>
              </div>
            )}
            <div className="flex-1">
               <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-3 tracking-tight">{restaurant.name}</h1>
               <div className="flex flex-wrap items-center gap-4 text-white/90 font-medium">
                  <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-lg flex items-center gap-1.5 border border-white/10">
                     <Star size={16} className="text-yellow-400 fill-current" /> 
                     {restaurant.rating} <span className="text-white/60 text-sm">({restaurant.ratingCount || 0})</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                     <MapPin size={18} /> {restaurant.address}
                  </span>
                  <span className="flex items-center gap-1.5">
                     <Utensils size={18} /> {restaurant.cuisine}
                  </span>
               </div>
            </div>
            
            {/* CTA Button (Desktop) */}
            <div className="hidden md:block">
               <Button size="lg" onClick={onBookNow} className="shadow-2xl shadow-primary-500/40 border-2 border-white/20 backdrop-blur-sm">
                  <LayoutTemplate size={20} className="mr-2" /> Book Table Now
               </Button>
            </div>
         </div>
      </div>
    </div>
  );
};
