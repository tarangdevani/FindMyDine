
import React, { useState, useEffect } from 'react';
import { Loader2, Star } from 'lucide-react';
import { Review } from '../../types';
import { getReviewsByRestaurant } from '../../services/reviewService';
import { getRestaurantProfile } from '../../services/restaurantService';
import { ReviewList } from '../Reviews/ReviewList';

interface ReviewsProps {
  userId: string;
}

export const Reviews: React.FC<ReviewsProps> = ({ userId }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ rating: 0, count: 0 });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const [reviewData, profileData] = await Promise.all([
        getReviewsByRestaurant(userId),
        getRestaurantProfile(userId)
      ]);
      setReviews(reviewData);
      if (profileData) {
        setStats({ 
            rating: profileData.rating || 0, 
            count: profileData.ratingCount || 0 
        });
      }
      setIsLoading(false);
    };
    fetchData();
  }, [userId]);

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary-600" size={32} /></div>;
  }

  return (
    <div className="animate-fade-in-up pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
        <div>
           <h2 className="text-2xl font-bold text-gray-900">Customer Reviews</h2>
           <p className="text-gray-500">See what your guests are saying about you.</p>
        </div>
        
        {/* Stats Card */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-6">
            <div className="text-center border-r border-gray-100 pr-6">
                <span className="block text-3xl font-black text-gray-900">{stats.rating.toFixed(1)}</span>
                <span className="flex items-center gap-1 text-xs font-bold text-yellow-500 justify-center">
                    <Star size={12} className="fill-current"/> Average
                </span>
            </div>
            <div className="text-center">
                <span className="block text-3xl font-black text-gray-900">{stats.count}</span>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Total Reviews</span>
            </div>
        </div>
      </div>

      <div className="max-w-3xl">
         <ReviewList reviews={reviews} />
      </div>
    </div>
  );
};
