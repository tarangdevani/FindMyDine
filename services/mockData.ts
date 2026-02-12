
import { RestaurantData } from '../types';

export const MOCK_RESTAURANTS: RestaurantData[] = [
  {
    id: '1',
    name: "The Golden Spoon",
    address: "123 Culinary Ave, Food City",
    imageUrl: "https://picsum.photos/800/600?random=1",
    logoUrl: "https://ui-avatars.com/api/?name=Golden+Spoon&background=f97316&color=fff",
    rating: 4.8,
    ratingCount: 342,
    deliveryTime: "30-45 min",
    cuisine: "Italian",
    distance: "0.5 km",
    isOpen: true,
    subscriptionPlan: 'pro'
  },
  {
    id: '2',
    name: "Sakura Sushi Bar",
    address: "45 Blossom Lane, Tokyo District",
    imageUrl: "https://picsum.photos/800/600?random=2",
    logoUrl: "https://ui-avatars.com/api/?name=Sakura+Sushi&background=ec4899&color=fff",
    rating: 4.5,
    ratingCount: 189,
    deliveryTime: "40-55 min",
    cuisine: "Japanese",
    distance: "1.2 km",
    isOpen: true,
    subscriptionPlan: 'pro'
  },
  {
    id: '3',
    name: "Burger & Brew",
    address: "88 Industrial Way, Downtown",
    imageUrl: "https://picsum.photos/800/600?random=3",
    logoUrl: "https://ui-avatars.com/api/?name=Burger+Brew&background=3b82f6&color=fff",
    rating: 4.2,
    ratingCount: 521,
    deliveryTime: "15-25 min",
    cuisine: "American",
    distance: "2.5 km",
    isOpen: false,
    subscriptionPlan: 'pro'
  },
  {
    id: '4',
    name: "Spice Garden",
    address: "10 Curried Rd, Flavor Town",
    imageUrl: "https://picsum.photos/800/600?random=4",
    logoUrl: "https://ui-avatars.com/api/?name=Spice+Garden&background=10b981&color=fff",
    rating: 4.7,
    ratingCount: 210,
    deliveryTime: "35-50 min",
    cuisine: "Indian",
    distance: "0.8 km",
    isOpen: true,
    subscriptionPlan: 'pro'
  },
  {
    id: '5',
    name: "Le Petit Bistro",
    address: "9 Paris St, Old Town",
    imageUrl: "https://picsum.photos/800/600?random=5",
    logoUrl: "https://ui-avatars.com/api/?name=Le+Petit&background=8b5cf6&color=fff",
    rating: 4.9,
    ratingCount: 86,
    deliveryTime: "45-60 min",
    cuisine: "French",
    distance: "3.0 km",
    isOpen: true,
    subscriptionPlan: 'pro'
  },
  {
    id: '6',
    name: "Tacos & Tequila",
    address: "55 Fiesta Blvd, Westside",
    imageUrl: "https://picsum.photos/800/600?random=6",
    logoUrl: "https://ui-avatars.com/api/?name=Tacos+Tequila&background=eab308&color=fff",
    rating: 4.4,
    ratingCount: 156,
    deliveryTime: "20-35 min",
    cuisine: "Mexican",
    distance: "1.5 km",
    isOpen: true,
    subscriptionPlan: 'pro'
  }
];
