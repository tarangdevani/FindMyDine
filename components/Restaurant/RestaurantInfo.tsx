
import React, { useState, useEffect } from 'react';
import { Clock, MapPin, Star } from 'lucide-react';
import { RestaurantData, Review } from '../../types';
import { getReviewsByRestaurant } from '../../services/reviewService';
import { ReviewList } from '../Reviews/ReviewList';

interface RestaurantInfoProps {
  restaurant: RestaurantData;
}

export const RestaurantInfo: React.FC<RestaurantInfoProps> = ({ restaurant }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);

  useEffect(() => {
    const fetchReviews = async () => {
        setIsLoadingReviews(true);
        const data = await getReviewsByRestaurant(restaurant.id);
        setReviews(data);
        setIsLoadingReviews(false);
    };
    if (restaurant.id) {
        fetchReviews();
    }
  }, [restaurant.id]);

  return (
    <div className="space-y-6">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-4">About {restaurant.name}</h3>
            <p className="text-gray-600 leading-relaxed mb-6">{restaurant.description}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                    <Clock className="text-primary-500 mt-1" size={20}/>
                    <div>
                        <p className="font-bold text-gray-900">Opening Hours</p>
                        <p className="text-sm text-gray-500">
                            Mon-Sun: 09:00 AM - 10:00 PM
                        </p>
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

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-6">
                <h3 className="text-xl font-bold text-gray-900">Reviews & Ratings</h3>
                {restaurant.rating && (
                    <span className="flex items-center gap-1 bg-yellow-50 text-yellow-700 px-2 py-1 rounded-lg text-sm font-bold ml-2 border border-yellow-100">
                        <Star size={14} className="fill-current"/> {restaurant.rating.toFixed(1)} ({restaurant.ratingCount})
                    </span>
                )}
            </div>
            
            {isLoadingReviews ? (
                <div className="text-center py-4 text-gray-400">Loading reviews...</div>
            ) : (
                <ReviewList reviews={reviews} compact={true} />
            )}
        </div>
    </div>
  );
};
