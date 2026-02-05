
import React from 'react';
import { Star, User } from 'lucide-react';
import { Review } from '../../types';

interface ReviewListProps {
  reviews: Review[];
  compact?: boolean;
}

export const ReviewList: React.FC<ReviewListProps> = ({ reviews, compact = false }) => {
  if (reviews.length === 0) {
    return (
        <div className="text-center py-8 text-gray-400 text-sm">
            No reviews yet. Be the first to rate!
        </div>
    );
  }

  return (
    <div className={`space-y-4 ${compact ? 'max-h-96 overflow-y-auto custom-scrollbar' : ''}`}>
      {reviews.map((review) => (
        <div key={review.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                        <User size={14} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-900">{review.userName || 'Anonymous'}</p>
                        <p className="text-[10px] text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</p>
                    </div>
                </div>
                <div className="flex bg-yellow-50 border border-yellow-100 px-2 py-1 rounded-lg items-center gap-1">
                    <Star size={12} className="fill-yellow-400 text-yellow-400" />
                    <span className="text-xs font-bold text-yellow-700">{review.rating}</span>
                </div>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
                {review.comment}
            </p>
        </div>
      ))}
    </div>
  );
};
