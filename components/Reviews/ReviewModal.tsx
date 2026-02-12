
import React, { useState, useEffect } from 'react';
import { Star, X } from 'lucide-react';
import { Button } from '../UI/Button';
import { Review } from '../../types';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => Promise<void>;
  restaurantName: string;
  initialData?: Review | null;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({ isOpen, onClose, onSubmit, restaurantName, initialData }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-fill data when opening or when initialData changes
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setRating(initialData.rating);
        setComment(initialData.comment);
      } else {
        setRating(5);
        setComment('');
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await onSubmit(rating, comment);
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-scale-in relative">
        
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors">
            <X size={20} className="text-gray-500" />
        </button>

        <div className="text-center mb-6">
            <h3 className="text-xl font-black text-gray-900 mb-2">{initialData ? 'Update Review' : 'Rate your experience'}</h3>
            <p className="text-sm text-gray-500">How was your meal at <span className="font-bold text-primary-600">{restaurantName}</span>?</p>
        </div>

        <div className="flex justify-center gap-2 mb-6">
            {[1, 2, 3, 4, 5].map((star) => (
                <button 
                    key={star}
                    onClick={() => setRating(star)}
                    className="transition-transform hover:scale-110 focus:outline-none"
                >
                    <Star 
                        size={36} 
                        className={`${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200 fill-gray-100'} transition-colors`}
                        strokeWidth={1}
                    />
                </button>
            ))}
        </div>

        <textarea 
            className="w-full bg-white border border-gray-200 rounded-xl p-4 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all mb-6 resize-none text-gray-900"
            rows={4}
            placeholder="Tell us what you liked..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
        ></textarea>

        <Button fullWidth size="lg" onClick={handleSubmit} isLoading={isSubmitting} className="shadow-lg shadow-primary-500/20">
            {initialData ? 'Update Review' : 'Submit Review'}
        </Button>
      </div>
    </div>
  );
};
