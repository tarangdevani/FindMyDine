
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, MapPin, SlidersHorizontal, Loader2, Crosshair, ChevronDown, Check, Star, Navigation } from 'lucide-react';
import { RestaurantCard } from './RestaurantCard';
import { RestaurantData, UserProfile } from '../../types';

interface HomePageProps {
  restaurants: RestaurantData[];
  isLoading: boolean;
  currentUser: UserProfile | null;
  onLoginRequired: () => void;
}

interface LocationState {
  lat: number;
  lng: number;
  address: string;
}

interface OSMSuggestion {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

const ITEMS_PER_PAGE = 9;

export const HomePage: React.FC<HomePageProps> = ({ restaurants, isLoading, currentUser, onLoginRequired }) => {
  // --- State ---
  
  // Search & Filter
  const [searchTerm, setSearchTerm] = useState(''); 
  const [searchInputValue, setSearchInputValue] = useState(''); 
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [sortOption, setSortOption] = useState<'recommended' | 'rating' | 'distance'>('recommended');
  
  // Location
  const [userLocation, setUserLocation] = useState<LocationState | null>(null);
  const [locationQuery, setLocationQuery] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<OSMSuggestion[]>([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // Data & Pagination
  const [processedRestaurants, setProcessedRestaurants] = useState<RestaurantData[]>([]);
  const [visibleRestaurants, setVisibleRestaurants] = useState<RestaurantData[]>([]);
  const [page, setPage] = useState(1);

  // Refs
  const observerTarget = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);

  // Debounce Refs
  const isTypingSearch = useRef(false);
  const isTypingLocation = useRef(false);

  // --- Initial Location Detect ---
  useEffect(() => {
    if (!userLocation) {
      handleDetectLocation(false);
    }
  }, []);

  // --- Helpers ---
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; 
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // --- Location Logic ---
  const handleDetectLocation = (showErrorAlert = true) => {
    if (!navigator.geolocation) return;

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await response.json();
          const city = data.address?.city || data.address?.town || data.address?.village || "Current Location";
          
          const newLoc = {
            lat: latitude,
            lng: longitude,
            address: city
          };
          
          isTypingLocation.current = false;
          setUserLocation(newLoc);
          setLocationQuery(city);
          setSortOption('distance');
          setShowLocationSuggestions(false);
        } catch (error) {
          console.error("Reverse geocoding failed", error);
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        console.error("Error getting location", error);
        if (showErrorAlert) alert("Unable to retrieve location.");
        setIsLocating(false);
      }
    );
  };

  const handleLocationChange = (val: string) => {
    isTypingLocation.current = true;
    setLocationQuery(val);
  };

  // Debounce Location Search API
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!isTypingLocation.current) return;

      if (locationQuery.length < 3) {
        setLocationSuggestions([]);
        return;
      }
      
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationQuery)}&limit=5`);
        const data = await response.json();
        setLocationSuggestions(data);
        setShowLocationSuggestions(true);
      } catch (error) {
        console.error("Location autocomplete failed", error);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [locationQuery]);

  const selectLocation = (item: OSMSuggestion) => {
    isTypingLocation.current = false;
    setUserLocation({
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      address: item.display_name.split(',')[0] 
    });
    setLocationQuery(item.display_name.split(',')[0]);
    setLocationSuggestions([]);
    setShowLocationSuggestions(false);
    setSortOption('distance');
  };

  // --- Search Logic ---
  const handleSearchChange = (val: string) => {
    isTypingSearch.current = true;
    setSearchInputValue(val);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInputValue);

      if (!isTypingSearch.current) return;

      if (!searchInputValue.trim()) {
        setSearchSuggestions([]);
        setShowSearchSuggestions(false);
        return;
      }

      const lowerTerm = searchInputValue.toLowerCase();
      const suggestions = new Set<string>();
      
      restaurants.forEach(r => {
        if (r.name.toLowerCase().includes(lowerTerm)) suggestions.add(r.name);
        if (r.cuisine.toLowerCase().includes(lowerTerm)) suggestions.add(r.cuisine);
      });

      setSearchSuggestions(Array.from(suggestions).slice(0, 5));
      setShowSearchSuggestions(true);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInputValue, restaurants]);

  const selectSearchSuggestion = (term: string) => {
    isTypingSearch.current = false;
    setSearchInputValue(term);
    setSearchTerm(term);
    setShowSearchSuggestions(false);
  };
  
  const clearFilters = () => {
    isTypingSearch.current = false;
    isTypingLocation.current = false;
    setSearchInputValue('');
    setSearchTerm('');
    setLocationQuery('');
  };

  // --- Filtering & Sorting Effect ---
  useEffect(() => {
    // 1. Pre-filter: Only show restaurants that have a paid plan (Base/Pro/Ultra)
    // Free plan restaurants are hidden from public view
    // Note: We show restaurants even if isOpen is false, so users can book for later dates.
    let updated = restaurants.filter(r => {
       const validPlans = ['base', 'pro', 'ultra'];
       const hasPaidPlan = r.subscriptionPlan && validPlans.includes(r.subscriptionPlan);
       return hasPaidPlan;
    });

    // 2. Filter by Search
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      updated = updated.filter(r => 
        r.name.toLowerCase().includes(lowerTerm) || 
        r.cuisine.toLowerCase().includes(lowerTerm)
      );
    }

    // 3. Distance Calc
    if (userLocation) {
      updated = updated.map(r => {
        if (r.lat && r.lng) {
          const dist = calculateDistance(userLocation.lat, userLocation.lng, r.lat, r.lng);
          return { ...r, distance: `${dist.toFixed(1)} km`, _distVal: dist };
        }
        return { ...r, _distVal: 99999 };
      });
    }

    // 4. Sort
    if (sortOption === 'rating') {
      updated.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortOption === 'distance' && userLocation) {
      updated.sort((a: any, b: any) => a._distVal - b._distVal);
    }

    setProcessedRestaurants(updated);
    setPage(1); 
    setVisibleRestaurants(updated.slice(0, ITEMS_PER_PAGE));
  }, [restaurants, searchTerm, userLocation, sortOption]);

  // --- Infinite Scroll ---
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMoreItems();
        }
      },
      { threshold: 0.5 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [processedRestaurants, page, visibleRestaurants]);

  const loadMoreItems = () => {
    if (visibleRestaurants.length < processedRestaurants.length) {
      const nextPage = page + 1;
      const nextBatch = processedRestaurants.slice(0, nextPage * ITEMS_PER_PAGE);
      setVisibleRestaurants(nextBatch);
      setPage(nextPage);
    }
  };

  // --- Click Outside Handlers ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) setShowSearchSuggestions(false);
      if (locationRef.current && !locationRef.current.contains(event.target as Node)) setShowLocationSuggestions(false);
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) setIsSortDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const sortOptions = [
    { value: 'recommended', label: 'Recommended' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'distance', label: 'Nearest First' }
  ];

  return (
    <>
      <header className="relative bg-white pt-24 pb-8 md:pt-32 md:pb-16 z-30">
        <div className="absolute inset-0 overflow-hidden -z-10 pointer-events-none">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-50 rounded-full blur-3xl opacity-60 translate-x-1/3 -translate-y-1/3"></div>
            <div className="absolute top-20 left-0 w-48 h-48 bg-blue-50 rounded-full blur-2xl opacity-50 -translate-x-1/2"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-3xl mx-auto text-center mb-8">
            <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight mb-3">
              Find the Best <span className="text-primary-600">Local Food</span>
            </h1>
            <p className="text-gray-500 text-sm md:text-lg">
              Order delivery or reserve a table from top-rated restaurants near you.
            </p>
          </div>

          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-soft-lg border border-gray-100 p-2 flex flex-col md:flex-row gap-2 relative">
            
            {/* Location Input */}
            <div className="relative flex-1 md:flex-[0.4] z-20" ref={locationRef}>
               <div className="flex items-center h-full bg-gray-50 rounded-xl px-4 py-3 md:py-0 border border-transparent focus-within:bg-white focus-within:border-primary-200 focus-within:ring-2 focus-within:ring-primary-100 transition-all">
                  <MapPin size={20} className="text-primary-500 shrink-0 mr-3" />
                  <div className="flex-1">
                     <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Where?</label>
                     <input 
                        type="text"
                        className="w-full bg-transparent outline-none text-gray-900 font-medium placeholder-gray-400 text-sm"
                        placeholder="Current Location"
                        value={locationQuery}
                        onChange={(e) => handleLocationChange(e.target.value)}
                        onFocus={() => { if(locationSuggestions.length > 0) setShowLocationSuggestions(true); }}
                     />
                  </div>
                  {isLocating && <Loader2 size={16} className="animate-spin text-primary-500 ml-2" />}
               </div>

               {showLocationSuggestions && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-scale-in">
                     <button 
                        onClick={() => handleDetectLocation(true)}
                        className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50 text-primary-600 font-bold text-sm border-b border-gray-50"
                     >
                        <Crosshair size={16} /> Use Current Location
                     </button>
                     <div className="max-h-60 overflow-y-auto">
                        {locationSuggestions.map((item) => (
                           <button
                              key={item.place_id}
                              onClick={() => selectLocation(item)}
                              className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-gray-50 text-gray-700 text-sm border-b border-gray-50 last:border-0"
                           >
                              <MapPin size={16} className="mt-0.5 text-gray-400 shrink-0" />
                              <span className="line-clamp-2">{item.display_name}</span>
                           </button>
                        ))}
                     </div>
                  </div>
               )}
            </div>

            <div className="hidden md:block w-px bg-gray-200 my-2"></div>

            {/* Search Input */}
            <div className="relative flex-1 z-10" ref={searchRef}>
               <div className="flex items-center h-full bg-gray-50 rounded-xl px-4 py-3 md:py-4 border border-transparent focus-within:bg-white focus-within:border-primary-200 focus-within:ring-2 focus-within:ring-primary-100 transition-all">
                  <Search size={20} className="text-gray-400 shrink-0 mr-3" />
                  <div className="flex-1">
                     <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">What?</label>
                     <input 
                        type="text"
                        className="w-full bg-transparent outline-none text-gray-900 font-medium placeholder-gray-400 text-sm"
                        placeholder="Restaurant, Cuisine, or Dish..."
                        value={searchInputValue}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        onFocus={() => { if(searchInputValue) setShowSearchSuggestions(true); }}
                     />
                  </div>
               </div>

               {showSearchSuggestions && searchSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-scale-in">
                     {searchSuggestions.map((term, index) => (
                        <button
                           key={index}
                           onClick={() => selectSearchSuggestion(term)}
                           className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50 text-gray-700 text-sm border-b border-gray-50 last:border-0"
                        >
                           <Search size={14} className="text-gray-400" />
                           {term}
                        </button>
                     ))}
                  </div>
               )}
            </div>
            
            <button className="bg-gray-900 hover:bg-black text-white rounded-xl px-6 py-3 md:py-0 font-bold shadow-lg shadow-gray-900/20 transition-all flex items-center justify-center gap-2">
               Search
            </button>
          </div>
        </div>
      </header>

      {/* Main Listing Section */}
      <section className="bg-gray-50/30 border-t border-gray-100 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          
          {/* List Header & Sort */}
          <div className="flex justify-between items-center mb-6">
             <h2 className="text-xl font-bold text-gray-900">
               {searchTerm ? `Results for "${searchTerm}"` : 'Nearby Restaurants'}
               <span className="ml-2 text-sm font-normal text-gray-500">({processedRestaurants.length} places)</span>
             </h2>

             <div className="relative" ref={sortRef}>
                <button
                   onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                   className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:border-gray-300 transition-all shadow-sm"
                >
                   <SlidersHorizontal size={16} className="text-gray-400" />
                   <span className="hidden sm:inline">{sortOptions.find(o => o.value === sortOption)?.label}</span>
                   <ChevronDown size={16} className={`text-gray-400 transition-transform ${isSortDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isSortDropdownOpen && (
                   <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-30">
                      {sortOptions.map((option) => (
                         <button
                            key={option.value}
                            onClick={() => {
                               setSortOption(option.value as any);
                               setIsSortDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm font-medium flex items-center justify-between hover:bg-gray-50 ${sortOption === option.value ? 'text-primary-600' : 'text-gray-700'}`}
                         >
                            {option.label}
                            {sortOption === option.value && <Check size={14} />}
                         </button>
                      ))}
                   </div>
                )}
             </div>
          </div>

          {/* Grid */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
               <Loader2 size={40} className="animate-spin text-primary-600 mb-4" />
               <p className="text-gray-500 font-medium animate-pulse">Finding the best spots for you...</p>
            </div>
          ) : visibleRestaurants.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {visibleRestaurants.map(restaurant => (
                <RestaurantCard 
                  key={restaurant.id} 
                  data={restaurant} 
                  currentUser={currentUser}
                  onLoginRequired={onLoginRequired}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-dashed border-gray-200 mx-4 md:mx-0">
              <div className="bg-gray-50 p-4 rounded-full mb-4 text-gray-400">
                <Search size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No restaurants found</h3>
              <p className="text-gray-500 text-sm max-w-xs mx-auto mb-6">
                Try changing your location or search terms.
              </p>
              <button 
                onClick={clearFilters}
                className="text-sm font-bold text-primary-600 hover:text-primary-700 bg-primary-50 px-6 py-2.5 rounded-full hover:bg-primary-100 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )}
          
          {/* Infinite Scroll Anchor */}
          {!isLoading && visibleRestaurants.length < processedRestaurants.length && (
             <div ref={observerTarget} className="py-10 flex justify-center w-full">
                <Loader2 className="animate-spin text-gray-400" size={24} />
             </div>
          )}
          
          {/* End of List Indicator */}
          {!isLoading && visibleRestaurants.length > 0 && visibleRestaurants.length === processedRestaurants.length && (
             <div className="py-12 text-center text-gray-400 text-sm font-medium">
                You've reached the end of the list.
             </div>
          )}
        </div>
      </section>
    </>
  );
};
