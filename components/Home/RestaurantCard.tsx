import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, MapPin, Clock, ArrowRight, Heart, Loader2 } from 'lucide-react';
import { RestaurantData, UserProfile } from '../../types';
import { toggleFavorite, checkIsFavorite } from '../../services/userService';

interface RestaurantCardProps {
  data: RestaurantData;
  currentUser?: UserProfile | null;
  onLoginRequired?: () => void;
}

export const RestaurantCard: React.FC<RestaurantCardProps> = ({ data, currentUser, onLoginRequired }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isLoadingLike, setIsLoadingLike] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser && data.id) {
      checkIsFavorite(currentUser.uid, data.id).then(setIsLiked);
    }
  }, [currentUser, data.id]);

  const handleLikeClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!currentUser) {
      if (onLoginRequired) onLoginRequired();
      return;
    }

    if (isLoadingLike) return;

    // Optimistic UI update
    const previousState = isLiked;
    setIsLiked(!previousState);
    setIsLoadingLike(true);

    try {
      const isNowFavorite = await toggleFavorite(currentUser.uid, data);
      setIsLiked(isNowFavorite);
    } catch (error) {
      setIsLiked(previousState); // Revert on error
    } finally {
      setIsLoadingLike(false);
    }
  };

  const handleCardClick = () => {
    navigate(`/restaurant/${data.id}`);
  };

  const hasRating = data.rating && data.rating > 0;

  return (
    <div 
      onClick={handleCardClick}
      className="group bg-white rounded-[2rem] p-3 shadow-soft hover:shadow-soft-lg transition-all duration-500 border border-transparent hover:border-gray-100 flex flex-col h-full relative cursor-pointer"
    >
      
      {/* Image Container */}
      <div className="relative h-56 rounded-[1.5rem] overflow-hidden mb-4">
        <img 
          src={data.imageUrl || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1000&auto=format&fit=crop"} 
          alt={data.name} 
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
        />
        
        {/* Rating Badge */}
        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 z-10">
          <Star size={14} className={`${hasRating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
          <span className="text-sm font-bold text-gray-900">
            {hasRating ? data.rating.toFixed(1) : 'N/A'}
          </span>
          {hasRating && <span className="text-xs text-gray-400 font-medium">({data.ratingCount || 0})</span>}
        </div>

        {/* Status Badge */}
        <div className={`absolute bottom-4 left-4 px-3 py-1.5 rounded-full shadow-lg backdrop-blur-md text-xs font-bold z-10 ${
          data.isOpen 
            ? 'bg-emerald-500/90 text-white' 
            : 'bg-white/90 text-red-500'
        }`}>
          {data.isOpen ? 'Open Now' : 'Closed'}
        </div>

        {/* Favorite Button Overlay */}
        <button 
          onClick={handleLikeClick}
          className={`absolute top-4 right-4 p-2.5 rounded-full backdrop-blur-md transition-all duration-300 shadow-md ${
            isLiked 
              ? 'bg-red-500 text-white hover:bg-red-600' 
              : 'bg-white/80 text-gray-400 hover:bg-white hover:text-red-500'
          }`}
        >
          {isLoadingLike ? (
             <Loader2 size={20} className="animate-spin" />
          ) : (
             <Heart size={20} className={isLiked ? "fill-current" : ""} />
          )}
        </button>
      </div>

      {/* Content */}
      <div className="px-2 pb-2 flex-1 flex flex-col">
        <div className="flex items-start gap-3 mb-1">
          {/* Logo */}
          {data.logoUrl && (
             <div className="w-10 h-10 rounded-full border border-gray-100 overflow-hidden shadow-sm shrink-0">
                <img src={data.logoUrl} alt={`${data.name} logo`} className="w-full h-full object-cover" />
             </div>
          )}
          <h3 className="text-xl font-bold text-gray-900 leading-tight group-hover:text-primary-600 transition-colors pt-1">
            {data.name}
          </h3>
        </div>

        <p className="text-gray-500 text-sm mb-4 line-clamp-1 flex items-center ml-1">
           {data.cuisine} • {data.address}
        </p>

        <div className="flex items-center gap-4 mb-6 ml-1">
           <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-50 px-2.5 py-1.5 rounded-lg">
             <MapPin size={14} className="text-primary-500" />
             {data.distance || "Calc..."}
           </div>
           <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-50 px-2.5 py-1.5 rounded-lg">
             <Clock size={14} className="text-primary-500" />
             {data.deliveryTime || '15-20 min'}
           </div>
        </div>

        <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
          <div className="flex flex-col">
             <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Book Table</span>
             <span className="text-sm font-bold text-gray-900">Free Reservation</span>
          </div>
          <button className="h-10 w-10 rounded-full bg-gray-900 text-white flex items-center justify-center group-hover:bg-primary-600 transition-colors shadow-lg shadow-gray-200">
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};