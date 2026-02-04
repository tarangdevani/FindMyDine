

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
}

export interface ReservationConfig {
  reservationFee: number;
  isRefundable: boolean;
  refundPercentage: number; // 0-100
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
  maxDiscount?: number;
  freeItemId?: string;
  triggerItemId?: string;
  minSpend: number;
  applicableItemIds?: string[];
  maxUsage?: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  usageCount: number;
  termsAndConditions?: string;
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
  cuisine?: string[];
  operatingHours?: OperatingHours;
  priceRange?: '$$' | '$$$' | '$$$$';
  reservationConfig?: ReservationConfig;
  billingConfig?: BillingConfig;
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