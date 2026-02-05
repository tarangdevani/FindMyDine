
export enum UserRole {
  CUSTOMER = 'customer',
  RESTAURANT = 'restaurant'
}

export type ReservationStatus = 'pending' | 'confirmed' | 'declined' | 'cancelled' | 'active' | 'completed';

export interface BillingConfig {
  serviceChargeRate: number;
  salesTaxRate: number;
  isServiceChargeInclusive: boolean;
  isSalesTaxInclusive: boolean;
  paypalClientId?: string; // New field for PayPal
}

export interface ReservationConfig {
  reservationFee: number;
  isRefundable: boolean;
  refundPercentage: number; // 0-70 (Platform takes 30% fixed on cancel)
}

export interface PayoutConfig {
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  routingNumber: string;
}

export interface Reservation {
  id?: string;
  restaurantId: string;
  restaurantName: string;
  restaurantImage?: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  tableId: string;
  tableName: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  guestCount: number;
  status: ReservationStatus;
  type: 'reservation' | 'walk_in';
  createdAt: string;
  notes?: string;
  
  // Payment info
  amountPaid?: number;
  currency?: string;
  transactionId?: string;
  paymentStatus?: 'paid' | 'unpaid' | 'refunded' | 'pending_counter';
  paymentMethod?: 'online' | 'counter';
  totalBillAmount?: number;

  // Financial Breakdown
  revenueSplit?: {
    platform: number;
    restaurant: number;
    userRefund: number;
  };
}

export type TransactionType = 'reservation' | 'bill_payment' | 'cancellation' | 'withdrawal' | 'subscription';
export type TransactionStatus = 'pending' | 'completed' | 'failed';

export interface Transaction {
  id?: string;
  restaurantId: string;
  type: TransactionType;
  amount: number; // Net amount to restaurant (Positive = Income, Negative = Outflow)
  status: TransactionStatus;
  createdAt: string;
  description: string;
  
  // References
  reservationId?: string;
  orderId?: string;
  
  // Snapshot Data for History
  metadata?: {
    customerName?: string;
    totalBill?: number;
    platformFee?: number;
    itemsSummary?: string; // e.g. "2x Burger, 1x Coke"
    refundAmount?: number;
  };
}

export interface WalletStats {
  availableBalance: number;
  pendingBalance: number;
  totalEarnings: number;
  lastPayout?: string;
}

export type OrderStatus = 'ordered' | 'preparing' | 'served' | 'paid' | 'cancelled';

export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  status?: OrderStatus;
  selectedAddOns?: FoodAddOn[];
}

export interface BillSnapshot {
  subtotal: number;
  serviceCharge: number;
  tax: number;
  discount: number;
  grandTotal: number;
  discountDetails?: string; // e.g. "Coupon SAVE20"
}

export interface Order {
  id?: string;
  restaurantId: string;
  tableId: string;
  tableName: string;
  reservationId: string;
  userId: string;
  userName: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
  // New field for manual discounts by restaurant
  customDiscount?: {
    type: 'percentage' | 'fixed';
    value: number;
    reason?: string;
  };
  appliedOfferId?: string;
  appliedDiscountAmount?: number; // Track specific amount deducted by offer
  billDetails?: BillSnapshot; // Store the exact calculation at time of generation
}

export interface Offer {
  id?: string;
  type: 'offer' | 'coupon';
  code: string;
  title: string; 
  description: string;
  rewardType: 'discount' | 'free_item';
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxDiscount?: number; // Per order cap
  freeItemId?: string;
  triggerItemId?: string;
  minSpend: number;
  applicableItemIds?: string[];
  
  // Usage Limits
  maxUsage?: number; // Total count of redemptions allowed
  globalBudget?: number; // Total monetary value allowed to be given away
  
  // Stats
  usageCount: number;
  totalDiscountGiven?: number; // Cumulative discount given across all orders

  validFrom: string;
  validUntil: string;
  isActive: boolean;
  termsAndConditions?: string;
  createdAt: string;
}

export interface OfferUsage {
  id?: string;
  userId: string;
  userName: string;
  orderId: string;
  discountAmount: number;
  usedAt: string;
}

export interface Review {
  id?: string;
  restaurantId: string;
  userId: string;
  userName: string;
  rating: number; // 1-5
  comment: string;
  createdAt: string;
}

export interface DaySchedule {
  open: string;
  close: string;
  isClosed: boolean;
}

export interface OperatingHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  mobile?: string;
  displayName?: string;
  location?: {
    lat: number;
    lng: number;
  };
}

export interface RestaurantProfile extends UserProfile {
  restaurantName: string;
  address: string;
  logoUrl?: string;
  coverImageUrl?: string;
  description?: string;
  rating?: number;
  ratingCount?: number;
  cuisine?: string[];
  operatingHours?: OperatingHours;
  priceRange?: '$$' | '$$$' | '$$$$';
  reservationConfig?: ReservationConfig;
  billingConfig?: BillingConfig;
  payoutConfig?: PayoutConfig; // New Payout Settings
  bankInfoConfigured?: boolean; // Track if payout info is set
}

export interface RestaurantData {
  id: string;
  name: string;
  address: string;
  imageUrl: string;
  logoUrl?: string; 
  rating: number;
  ratingCount?: number; 
  deliveryTime?: string; 
  cuisine: string;
  distance: string; 
  isOpen: boolean;
  description?: string;
  operatingHours?: OperatingHours;
  lat?: number;
  lng?: number;
  reservationConfig?: ReservationConfig;
  billingConfig?: BillingConfig;
}

export interface FoodCategory {
  id: string;
  name: string;
}

export interface FoodAddOn {
  id: string;
  name: string;
  price: number;
}

export interface MenuItem {
  id?: string;
  name: string;
  price: number;
  description: string;
  imageUrl?: string; 
  categoryId: string;
  categoryName?: string;
  isVegetarian: boolean;
  isAvailable: boolean;
  addOns?: FoodAddOn[];
  createdAt?: string;
}

export interface Point {
  x: number;
  y: number;
}

export interface TableItem {
  id?: string;
  name: string;
  seats: number;
  area: string;
  shape: 'rectangle' | 'round' | 'square' | 'custom';
  status: 'available' | 'occupied' | 'reserved';
  createdAt?: string;
  position?: Point;
  rotation?: number;
  width?: number; 
  height?: number; 
  points?: Point[];
  chairPositions?: Point[];
  chairConfig?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

export interface Room {
  id: string;
  name: string;
  points: Point[];
}

export interface Wall {
  id: string;
  points: Point[];
}

export interface WindowItem {
  id: string;
  wallId: string;
  p1: Point;
  p2: Point;
}

export interface FloorPlanData {
  rooms: Room[];
  tables: TableItem[];
  walls?: Wall[];
  windows?: WindowItem[];
}

declare global {
  interface Window {
    paypal: any;
  }
}
