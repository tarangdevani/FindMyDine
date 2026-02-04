import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Loader2 } from 'lucide-react';
import { RestaurantData, UserProfile } from '../../types';
import { getUserFavorites } from '../../services/userService';
import { RestaurantCard } from '../Home/RestaurantCard';
import { Button } from '../UI/Button';

interface UserFavoritesProps {
  currentUser: UserProfile | null;
  onLoginRequired: () => void;
}

export const UserFavorites: React.FC<UserFavoritesProps> = ({ currentUser, onLoginRequired }) => {
  const [favorites, setFavorites] = useState<RestaurantData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      navigate('/');
      return;
    }
    fetchData();
  }, [currentUser]);

  const fetchData = async () => {
    setIsLoading(true);
    if (currentUser) {
      const data = await getUserFavorites(currentUser.uid);
      setFavorites(data);
    }
    setIsLoading(false);
  };

  if (isLoading) return <div className="flex justify-center py-32"><Loader2 className="animate-spin text-primary-500" size={40} /></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Favorites</h1>
        <p className="text-gray-500">Your collection of loved dining spots.</p>
      </div>

      {favorites.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
           <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-gray-300">
              <Heart size={32} />
           </div>
           <h3 className="text-lg font-bold text-gray-900 mb-2">No favorites yet</h3>
           <p className="text-gray-500 mb-6">Tap the heart icon on any restaurant to save it here.</p>
           <Button onClick={() => navigate('/')}>Discover Places</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {favorites.map(restaurant => (
             <RestaurantCard 
               key={restaurant.id} 
               data={restaurant} 
               currentUser={currentUser} 
               onLoginRequired={onLoginRequired}
             />
           ))}
        </div>
      )}
    </div>
  );
};