
import React, { useState, useEffect } from 'react';
import { Check, X, CreditCard, Calendar, Star, Crown, Zap, ShieldCheck } from 'lucide-react';
import { Button } from '../UI/Button';
import { RazorpayButton } from '../UI/RazorpayButton';
import { UserProfile, SubscriptionPlan, SubscriptionDetails } from '../../types';
import { calculatePlanPrice, purchaseSubscription, PLAN_CONFIGS } from '../../services/subscriptionService';
import { getRestaurantProfile } from '../../services/restaurantService';
import { useToast } from '../../context/ToastContext';

interface SubscriptionProps {
  userId: string;
}

const DURATIONS = [
  { months: 1, label: 'Monthly', discount: '0%' },
  { months: 3, label: '3 Months', discount: '5% OFF' },
  { months: 6, label: '6 Months', discount: '10% OFF' },
  { months: 12, label: 'Yearly', discount: '15% OFF' }
];

export const Subscription: React.FC<SubscriptionProps> = ({ userId }) => {
  const { showToast } = useToast();
  const [currentSub, setCurrentSub] = useState<SubscriptionDetails | null>(null);
  const [selectedDuration, setSelectedDuration] = useState(3);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    setLoading(true);
    const profile = await getRestaurantProfile(userId);
    if (profile?.subscription) {
      setCurrentSub(profile.subscription);
    } else {
      // Default to free
      setCurrentSub({
        plan: 'free',
        startDate: new Date().toISOString(),
        expiryDate: new Date(new Date().setFullYear(2099)).toISOString(),
        isValid: true,
        aiPhotosLimit: 0,
        aiPhotosUsed: 0,
        autoRenew: false
      });
    }
    setLoading(false);
  };

  const handlePurchase = async (plan: SubscriptionPlan, paymentId?: string) => {
    setIsProcessing(true);
    try {
        const success = await purchaseSubscription(userId, plan, selectedDuration, paymentId);
        if (success) {
            showToast(`Successfully subscribed to ${PLAN_CONFIGS[plan].name} Plan!`, "success");
            loadProfile();
        } else {
            showToast("Failed to update subscription.", "error");
        }
    } catch (e) {
        showToast("An error occurred.", "error");
    } finally {
        setIsProcessing(false);
    }
  };

  interface PlanCardProps {
    id: SubscriptionPlan;
    plan: { 
        price: number; 
        name: string; 
        photos: number; 
        write: boolean; 
        deleteReview: boolean; 
    };
  }

  const PlanCard: React.FC<PlanCardProps> = ({ id, plan }) => {
    const isCurrent = currentSub?.plan === id;
    const { total, perMonth, savings } = calculatePlanPrice(id, selectedDuration);
    
    // Feature Checks
    const features = [
        { label: "Dashboard Access", available: true },
        { label: "Data Write Access", available: plan.write },
        { label: "User Visibility", available: plan.write }, // Free is hidden
        { label: "QR Ordering", available: plan.write }, // Free blocked
        { label: "AI Photography", available: plan.photos > 0, info: plan.photos > 0 ? `${plan.photos} Photos/mo` : undefined },
        { label: "Review Management", available: true },
        { label: "Delete Reviews", available: plan.deleteReview },
    ];

    // Add specific Free Plan feature line
    if (id === 'free') {
        features.splice(1, 0, { label: "Read & Access all your previous data", available: true });
    }

    return (
        <div className={`relative flex flex-col p-6 rounded-2xl border-2 transition-all ${isCurrent ? 'border-green-500 bg-green-50/30' : 'border-gray-200 bg-white hover:border-primary-300 hover:shadow-lg'}`}>
            {id === 'pro' && !isCurrent && <div className="absolute top-0 right-0 bg-primary-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl rounded-tr-lg uppercase tracking-wider">Most Popular</div>}
            {isCurrent && <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl rounded-tr-lg uppercase tracking-wider flex items-center gap-1"><Check size={10}/> Active</div>}
            
            <div className="mb-4">
                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-3xl font-black text-gray-900">${perMonth.toFixed(0)}</span>
                    <span className="text-sm text-gray-500 font-medium">/mo</span>
                </div>
                {savings > 0 && id !== 'free' && (
                    <p className="text-xs text-green-600 font-bold mt-1">Save ${savings.toFixed(0)} with {selectedDuration}mo plan</p>
                )}
            </div>

            <ul className="space-y-3 mb-8 flex-1">
                {features.map((f, i) => (
                    <li key={i} className={`text-sm flex items-start gap-2 ${f.available ? 'text-gray-700' : 'text-gray-400'}`}>
                        {f.available ? <Check size={16} className="text-green-500 mt-0.5 shrink-0"/> : <X size={16} className="shrink-0 mt-0.5"/>}
                        <span>{f.label} {f.info && <span className="text-xs font-bold text-primary-600 bg-primary-50 px-1.5 rounded ml-1">{f.info}</span>}</span>
                    </li>
                ))}
            </ul>

            {id === 'free' ? (
                <Button disabled={true} variant="outline" fullWidth>Free Forever</Button>
            ) : (
                <RazorpayButton 
                    amount={total}
                    name={`${plan.name} Plan`}
                    description={`${selectedDuration} Months Subscription`}
                    onSuccess={(res) => handlePurchase(id, res.razorpay_payment_id)}
                    disabled={isProcessing}
                />
            )}
        </div>
    );
  };

  if (loading) return null;

  const expiry = currentSub?.expiryDate ? new Date(currentSub.expiryDate) : null;
  const isFree = currentSub?.plan === 'free';

  return (
    <div className="animate-fade-in-up pb-10">
        <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Subscription Plans</h2>
            <p className="text-gray-500">Choose the perfect plan to grow your restaurant.</p>
        </div>

        {/* Current Plan Banner */}
        <div className="bg-gray-900 text-white p-6 rounded-2xl shadow-lg mb-8 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center text-primary-400">
                    <Crown size={24} />
                </div>
                <div>
                    <p className="text-sm text-gray-400 font-bold uppercase tracking-wider">Current Plan</p>
                    <h3 className="text-2xl font-bold capitalize">{currentSub?.plan}</h3>
                    {!isFree && expiry && <p className="text-sm text-gray-400 mt-1 flex items-center gap-1"><Calendar size={14}/> Expires on {expiry.toLocaleDateString()}</p>}
                </div>
            </div>
            
            {!isFree && (
                <div className="flex gap-4">
                    <div className="bg-gray-800 p-3 rounded-xl border border-gray-700 min-w-[120px]">
                        <p className="text-xs text-gray-400 mb-1">AI Photos</p>
                        <p className="font-bold">{currentSub?.aiPhotosUsed} / {currentSub?.aiPhotosLimit}</p>
                    </div>
                    <div className="bg-gray-800 p-3 rounded-xl border border-gray-700 min-w-[120px]">
                        <p className="text-xs text-gray-400 mb-1">Status</p>
                        <p className="font-bold text-green-400">Active</p>
                    </div>
                </div>
            )}
        </div>

        {/* Duration Selector */}
        <div className="flex justify-center mb-8">
            <div className="bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm inline-flex">
                {DURATIONS.map(d => (
                    <button
                        key={d.months}
                        onClick={() => setSelectedDuration(d.months)}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all relative ${selectedDuration === d.months ? 'bg-gray-900 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        {d.label}
                        {d.discount !== '0%' && (
                            <span className={`absolute -top-3 left-1/2 -translate-x-1/2 text-[9px] px-1.5 rounded bg-green-500 text-white whitespace-nowrap ${selectedDuration === d.months ? 'opacity-100' : 'opacity-80'}`}>
                                {d.discount}
                            </span>
                        )}
                    </button>
                ))}
            </div>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <PlanCard id="free" plan={PLAN_CONFIGS.free} />
            <PlanCard id="base" plan={PLAN_CONFIGS.base} />
            <PlanCard id="pro" plan={PLAN_CONFIGS.pro} />
            <PlanCard id="ultra" plan={PLAN_CONFIGS.ultra} />
        </div>

        <div className="mt-8 text-center text-sm text-gray-500 bg-blue-50 p-4 rounded-xl border border-blue-100">
            <ShieldCheck size={16} className="inline mr-1 text-blue-600"/>
            <strong>Recharge Policy:</strong> Purchasing a plan while active will extend your current subscription validity. You won't lose days!
        </div>
    </div>
  );
};
