import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Star, MapPin, Clock, Share2, Heart, Utensils, LayoutTemplate } from 'lucide-react';
import { Button } from '../UI/Button';
import { RestaurantData, MenuItem, UserProfile } from '../../types';
import { getRestaurantById } from '../../services/restaurantService';
import { getMenu } from '../../services/menuService';

// Helper to format date for input min attribute
const getTodayString = () => new Date().toISOString().split('T')[0];

interface RestaurantDetailsPageProps {
  currentUser?: UserProfile | null;
  onLoginRequired?: () => void;
}

export const RestaurantDetailsPage: React.FC<RestaurantDetailsPageProps> = ({ currentUser, onLoginRequired }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [restaurant, setRestaurant] = useState<RestaurantData | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'menu' | 'about'>('menu');
  const [activeCategory, setActiveCategory] = useState<string>('All');

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setIsLoading(true);
      const rData = await getRestaurantById(id);
      setRestaurant(rData);
      if (rData) {
         const mData = await getMenu(id);
         setMenuItems(mData);
      }
      setIsLoading(false);
    };
    fetchData();
  }, [id]);

  const handleBookTableNow = () => {
    // Navigate directly to booking page without login check
    // Default params can be handled by the TableSelectionPage if not present
    navigate(`/restaurant/${id}/book`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!restaurant) return null;

  // Menu Logic
  const groupedMenu = menuItems.reduce((acc, item) => {
    const cat = item.categoryName || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);
  const categories = Object.keys(groupedMenu).sort();

  return (
    <div className="min-h-screen bg-gray-50/50 pb-24 md:pb-0">
      
      {/* 1. Immersive Hero */}
      <div className="relative h-[50vh] w-full group overflow-hidden">
        <img 
          src={restaurant.imageUrl} 
          alt={restaurant.name} 
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent"></div>
        
        {/* Navbar Overlay */}
        <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10">
           <button onClick={() => navigate('/')} className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all">
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
              
              {/* CTA Button */}
              <div className="hidden md:block">
                 <Button size="lg" onClick={handleBookTableNow} className="shadow-2xl shadow-primary-500/40 border-2 border-white/20 backdrop-blur-sm">
                    <LayoutTemplate size={20} className="mr-2" /> Book Table Now
                 </Button>
              </div>
           </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
         {/* Main Layout - Now Full Width */}
         <div className="w-full">
            
            {/* Tabs */}
            <div className="flex items-center gap-8 border-b border-gray-200 mb-8">
               <button 
                 onClick={() => setActiveTab('menu')}
                 className={`pb-4 text-lg font-bold transition-all relative ${activeTab === 'menu' ? 'text-primary-600' : 'text-gray-500 hover:text-gray-800'}`}
               >
                 Menu
                 {activeTab === 'menu' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 rounded-t-full"></span>}
               </button>
               <button 
                 onClick={() => setActiveTab('about')}
                 className={`pb-4 text-lg font-bold transition-all relative ${activeTab === 'about' ? 'text-primary-600' : 'text-gray-500 hover:text-gray-800'}`}
               >
                 About
                 {activeTab === 'about' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 rounded-t-full"></span>}
               </button>
            </div>

            {/* Content */}
            <div className="min-h-[400px]">
              {activeTab === 'menu' ? (
                <>
                  {/* Category Chips */}
                  <div className="flex items-center gap-3 overflow-x-auto pb-4 custom-scrollbar mb-6">
                     <button 
                        onClick={() => setActiveCategory('All')}
                        className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${activeCategory === 'All' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}
                     >
                        All Items
                     </button>
                     {categories.map(cat => (
                        <button 
                           key={cat}
                           onClick={() => setActiveCategory(cat)}
                           className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${activeCategory === cat ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}
                        >
                           {cat}
                        </button>
                     ))}
                  </div>

                  {/* Menu Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {menuItems.filter(i => activeCategory === 'All' || i.categoryName === activeCategory).map(item => (
                        <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all flex gap-4 group cursor-default">
                           <div className="w-24 h-24 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                              {item.imageUrl ? (
                                 <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                              ) : (
                                 <div className="w-full h-full flex items-center justify-center text-gray-300"><Utensils size={20}/></div>
                              )}
                           </div>
                           <div className="flex-1 flex flex-col">
                              <div className="flex justify-between items-start">
                                 <h4 className="font-bold text-gray-900">{item.name}</h4>
                                 <span className="font-bold text-primary-600">${item.price}</span>
                              </div>
                              <p className="text-sm text-gray-500 line-clamp-2 mt-1">{item.description}</p>
                              <div className="mt-auto pt-2 flex items-center gap-2">
                                  {item.isVegetarian && <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">VEG</span>}
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
                  {menuItems.length === 0 && (
                     <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
                        <p className="text-gray-500 font-medium">Menu coming soon</p>
                     </div>
                  )}
                </>
              ) : (
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                   <h3 className="text-xl font-bold text-gray-900 mb-4">About {restaurant.name}</h3>
                   <p className="text-gray-600 leading-relaxed mb-6">{restaurant.description}</p>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-start gap-3">
                         <Clock className="text-primary-500 mt-1" size={20}/>
                         <div>
                            <p className="font-bold text-gray-900">Opening Hours</p>
                            <p className="text-sm text-gray-500">Mon-Sun: 09:00 AM - 10:00 PM</p>
                         </div>
                      </div>
                      <div className="flex items-start gap-3">
                         <MapPin className="text-primary-500 mt-1" size={20}/>
                         <div>
                            <p className="font-bold text-gray-900">Address</p>
                            <p className="text-sm text-gray-500">{restaurant.address}</p>
                         </div>
                      </div>
                   </div>
                </div>
              )}
            </div>
         </div>
      </div>

      {/* Mobile Floating Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 md:hidden z-40 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)]">
         <Button fullWidth onClick={handleBookTableNow} className="shadow-lg shadow-primary-500/20">
            Book Table Now
         </Button>
      </div>

    </div>
  );
};