
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Button } from '../UI/Button';
import { RestaurantData, MenuItem, UserProfile } from '../../types';
import { getRestaurantById } from '../../services/restaurantService';
import { getMenu } from '../../services/menuService';

// Child Components
import { RestaurantHero } from './RestaurantHero';
import { RestaurantTabs } from './RestaurantTabs';
import { RestaurantMenu } from './RestaurantMenu';
import { RestaurantInfo } from './RestaurantInfo';

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
    navigate(`/restaurant/${id}/book`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 size={40} className="animate-spin text-primary-600" />
      </div>
    );
  }

  if (!restaurant) return null;

  // Extract Categories
  const uniqueCategories = Array.from(new Set(menuItems.map(item => item.categoryName || 'Other'))).sort();

  return (
    <div className="min-h-screen bg-gray-50/50 pb-24 md:pb-0">
      
      {/* 1. Hero Section */}
      <RestaurantHero 
        restaurant={restaurant} 
        onBack={() => navigate('/')} 
        onBookNow={handleBookTableNow} 
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
         <div className="w-full">
            
            {/* 2. Tabs */}
            <RestaurantTabs 
                activeTab={activeTab} 
                onTabChange={setActiveTab} 
            />

            {/* 3. Content */}
            <div className="min-h-[400px]">
              {activeTab === 'menu' ? (
                <RestaurantMenu 
                    menuItems={menuItems} 
                    categories={uniqueCategories} 
                    activeCategory={activeCategory} 
                    onCategoryChange={setActiveCategory} 
                />
              ) : (
                <RestaurantInfo restaurant={restaurant} />
              )}
            </div>
         </div>
      </div>

      {/* Mobile Floating Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 md:hidden z-[60] shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)] safe-area-pb">
         <Button fullWidth onClick={handleBookTableNow} className="shadow-lg shadow-primary-500/20">
            Book Table Now
         </Button>
      </div>

    </div>
  );
};
