import React, { useState, useEffect } from 'react';
import { Save, MapPin, Clock, Camera, Upload, Loader2, Building2, Phone, Globe, UtensilsCrossed, AlertCircle, Map as MapIcon, Crosshair } from 'lucide-react';
import { Button } from '../UI/Button';
import { RestaurantProfile, OperatingHours, DaySchedule } from '../../types';
import { updateRestaurantProfile, getRestaurantProfile } from '../../services/restaurantService';
import { storage } from '../../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface RestaurantDetailsProps {
  userId: string;
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const DEFAULT_SCHEDULE: DaySchedule = {
  open: '09:00',
  close: '22:00',
  isClosed: false
};

const DEFAULT_HOURS: OperatingHours = {
  monday: { ...DEFAULT_SCHEDULE },
  tuesday: { ...DEFAULT_SCHEDULE },
  wednesday: { ...DEFAULT_SCHEDULE },
  thursday: { ...DEFAULT_SCHEDULE },
  friday: { ...DEFAULT_SCHEDULE },
  saturday: { ...DEFAULT_SCHEDULE },
  sunday: { ...DEFAULT_SCHEDULE }
};

interface FormErrors {
  name?: string;
  description?: string;
  address?: string;
  phone?: string;
  cuisine?: string;
  hours?: string;
}

export const RestaurantDetails: React.FC<RestaurantDetailsProps> = ({ userId }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [profile, setProfile] = useState<Partial<RestaurantProfile>>({});
  
  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [cuisineInput, setCuisineInput] = useState('');
  const [hours, setHours] = useState<OperatingHours>(DEFAULT_HOURS);
  
  // Validation State
  const [errors, setErrors] = useState<FormErrors>({});
  
  // Geocoding Optimization
  const [lastGeocodedAddress, setLastGeocodedAddress] = useState('');

  // Visuals
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [logoImage, setLogoImage] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    setIsLoading(true);
    const data = await getRestaurantProfile(userId);
    if (data) {
      setProfile(data);
      setName(data.restaurantName || data.displayName || '');
      setDescription(data.description || '');
      setAddress(data.address || '');
      setLastGeocodedAddress(data.address || ''); 
      setPhone(data.mobile || '');
      setCuisineInput(data.cuisine?.join(', ') || '');
      setCoverPreview(data.coverImageUrl || '');
      setLogoPreview(data.logoUrl || '');
      if (data.operatingHours) {
        setHours(data.operatingHours);
      }
    }
    setIsLoading(false);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    if (!name.trim()) {
      newErrors.name = 'Restaurant name is required.';
      isValid = false;
    }

    if (!description.trim()) {
      newErrors.description = 'Description is required.';
      isValid = false;
    } else if (description.trim().length < 20) {
      newErrors.description = 'Description must be at least 20 characters.';
      isValid = false;
    }

    if (!address.trim()) {
      newErrors.address = 'Address is required.';
      isValid = false;
    }

    const phoneRegex = /^\+?[\d\s-]{10,}$/;
    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required.';
      isValid = false;
    } else if (!phoneRegex.test(phone)) {
      newErrors.phone = 'Please enter a valid phone number.';
      isValid = false;
    }

    if (!cuisineInput.trim()) {
      newErrors.cuisine = 'At least one cuisine is required.';
      isValid = false;
    }

    let hoursValid = true;
    for (const day of DAYS) {
        const schedule = hours[day as keyof OperatingHours];
        if (!schedule.isClosed && schedule.open >= schedule.close) {
            hoursValid = false;
            break;
        }
    }
    if (!hoursValid) {
        newErrors.hours = 'Opening time cannot be later than or equal to closing time.';
        isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'cover' | 'logo') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const preview = URL.createObjectURL(file);
      if (type === 'cover') {
        setCoverImage(file);
        setCoverPreview(preview);
      } else {
        setLogoImage(file);
        setLogoPreview(preview);
      }
    }
  };

  const handleScheduleChange = (day: string, field: keyof DaySchedule, value: any) => {
    setHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day as keyof OperatingHours],
        [field]: value
      }
    }));
    // Clear hours error if user interacts
    if (errors.hours) setErrors(prev => ({ ...prev, hours: undefined }));
  };

  // --- Geocoding Logic (OpenStreetMap) ---
  const handleAddressBlur = async () => {
    const cleanedAddress = address.trim();
    
    if (!cleanedAddress || cleanedAddress === lastGeocodedAddress) {
        return;
    }

    setIsGeocoding(true);
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(cleanedAddress)}`
        );
        const data = await response.json();

        if (data && data.length > 0) {
            const result = data[0];
            setProfile(prev => ({
                ...prev,
                location: {
                    lat: parseFloat(result.lat),
                    lng: parseFloat(result.lon)
                }
            }));
            setLastGeocodedAddress(cleanedAddress);
        } else {
            console.error("Geocoding failed: No results found");
        }
    } catch (error) {
        console.error("Geocoding error:", error);
    } finally {
        setIsGeocoding(false);
    }
  };

  const handleGeoLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
          };
          setProfile(prev => ({
            ...prev,
            location: loc
          }));
          
          // Reverse geocoding optional but nice
          setIsGeocoding(true);
          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${loc.lat}&lon=${loc.lng}`)
            .then(res => res.json())
            .then(data => {
                if(data && data.display_name) {
                    setAddress(data.display_name);
                    setLastGeocodedAddress(data.display_name);
                }
            })
            .finally(() => setIsGeocoding(false));

          alert("Location detected successfully!");
        },
        (error) => {
          console.error("Error detecting location", error);
          alert("Could not detect location. Please check browser permissions.");
        }
      );
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }

    setIsSaving(true);
    try {
      let coverUrl = profile.coverImageUrl;
      let logoUrl = profile.logoUrl;

      if (coverImage) {
        const refCover = ref(storage, `restaurants/${userId}/cover_${Date.now()}`);
        await uploadBytes(refCover, coverImage);
        coverUrl = await getDownloadURL(refCover);
      }

      if (logoImage) {
        const refLogo = ref(storage, `restaurants/${userId}/logo_${Date.now()}`);
        await uploadBytes(refLogo, logoImage);
        logoUrl = await getDownloadURL(refLogo);
      }

      const cuisines = cuisineInput.split(',').map(c => c.trim()).filter(c => c.length > 0);

      const updateData: Partial<RestaurantProfile> = {
        restaurantName: name,
        displayName: name, 
        description,
        address,
        mobile: phone,
        cuisine: cuisines,
        operatingHours: hours,
        coverImageUrl: coverUrl,
        logoUrl: logoUrl,
        location: profile.location
      };

      const success = await updateRestaurantProfile(userId, updateData);
      if (success) {
        setProfile(prev => ({ ...prev, ...updateData }));
        setLastGeocodedAddress(address); 
        alert("Profile updated successfully!");
      } else {
        alert("Failed to update profile.");
      }
    } catch (error) {
      console.error("Save error:", error);
      alert("An error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary-500" size={32} /></div>;

  const lat = profile.location?.lat;
  const lng = profile.location?.lng;
  const mapUrl = lat && lng 
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${lng-0.005},${lat-0.005},${lng+0.005},${lat+0.005}&layer=mapnik&marker=${lat},${lng}`
    : '';

  return (
    <div className="animate-fade-in-up pb-10">
      <div className="flex justify-between items-center mb-8">
        <div>
           <h2 className="text-2xl font-bold text-gray-900">Restaurant Profile</h2>
           <p className="text-gray-500">Manage your public listing, location, and hours.</p>
        </div>
        <Button onClick={handleSave} isLoading={isSaving} className="shadow-lg shadow-primary-500/20">
           <Save size={18} className="mr-2" /> Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Basic Info & Location */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Basic Information */}
          <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 md:p-8">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Building2 size={20} className="text-primary-500" /> Basic Information
            </h3>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Restaurant Name <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  className={`w-full px-4 py-3 rounded-xl border bg-white text-gray-900 outline-none transition-all ${errors.name ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-primary-500'}`}
                  placeholder="e.g. The Golden Spoon"
                  value={name}
                  onChange={(e) => {
                      setName(e.target.value);
                      if(errors.name) setErrors(prev => ({...prev, name: undefined}));
                  }}
                />
                {errors.name && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12}/> {errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description <span className="text-red-500">*</span></label>
                <textarea 
                  rows={4}
                  className={`w-full px-4 py-3 rounded-xl border bg-white text-gray-900 outline-none transition-all resize-none ${errors.description ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-primary-500'}`}
                  placeholder="Tell your guests about your story and ambiance (min 20 chars)..."
                  value={description}
                  onChange={(e) => {
                      setDescription(e.target.value);
                      if(errors.description) setErrors(prev => ({...prev, description: undefined}));
                  }}
                />
                {errors.description && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12}/> {errors.description}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                   <label className="block text-sm font-semibold text-gray-700 mb-2">Cuisines <span className="text-red-500">*</span></label>
                   <div className="relative">
                     <UtensilsCrossed size={18} className="absolute left-3 top-3.5 text-gray-400" />
                     <input 
                        type="text" 
                        className={`w-full pl-10 pr-4 py-3 rounded-xl border bg-white text-gray-900 outline-none transition-all ${errors.cuisine ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-primary-500'}`}
                        placeholder="Italian, Pasta, Pizza"
                        value={cuisineInput}
                        onChange={(e) => {
                            setCuisineInput(e.target.value);
                            if(errors.cuisine) setErrors(prev => ({...prev, cuisine: undefined}));
                        }}
                     />
                   </div>
                   {errors.cuisine && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12}/> {errors.cuisine}</p>}
                   <p className="text-xs text-gray-400 mt-1">Comma separated</p>
                </div>
                <div>
                   <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Number <span className="text-red-500">*</span></label>
                   <div className="relative">
                     <Phone size={18} className="absolute left-3 top-3.5 text-gray-400" />
                     <input 
                        type="tel" 
                        className={`w-full pl-10 pr-4 py-3 rounded-xl border bg-white text-gray-900 outline-none transition-all ${errors.phone ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-primary-500'}`}
                        placeholder="+1 234 567 890"
                        value={phone}
                        onChange={(e) => {
                            setPhone(e.target.value);
                            if(errors.phone) setErrors(prev => ({...prev, phone: undefined}));
                        }}
                     />
                   </div>
                   {errors.phone && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12}/> {errors.phone}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 md:p-8">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <MapPin size={20} className="text-primary-500" /> Location
            </h3>

            <div className="space-y-5">
               <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Full Address <span className="text-red-500">*</span></label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      className={`flex-1 px-4 py-3 rounded-xl border bg-white text-gray-900 outline-none transition-all ${errors.address ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-primary-500'}`}
                      placeholder="123 Culinary Ave, Food City, FC 90210"
                      value={address}
                      onChange={(e) => {
                          setAddress(e.target.value);
                          if(errors.address) setErrors(prev => ({...prev, address: undefined}));
                      }}
                      onBlur={handleAddressBlur}
                    />
                    <Button variant="outline" onClick={handleGeoLocation} title="Use Current Location">
                       <Crosshair size={20} />
                    </Button>
                  </div>
                  {errors.address && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12}/> {errors.address}</p>}
               </div>
               
               {/* Visual Map Container */}
               <div className="relative w-full h-64 bg-gray-50 rounded-xl border border-gray-200 overflow-hidden group">
                  {mapUrl ? (
                    <iframe
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      scrolling="no"
                      marginHeight={0}
                      marginWidth={0}
                      src={mapUrl}
                      className="w-full h-full grayscale-[20%] group-hover:grayscale-0 transition-all duration-500"
                    ></iframe>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                       <MapIcon size={48} className="mb-2 opacity-50" />
                       <span className="text-sm font-medium">Enter an address to preview map</span>
                    </div>
                  )}
                  {isGeocoding && (
                    <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-10">
                       <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-md">
                          <Loader2 size={16} className="animate-spin text-primary-600"/>
                          <span className="text-xs font-bold text-gray-700">Locating...</span>
                       </div>
                    </div>
                  )}
               </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Visuals & Hours */}
        <div className="space-y-8">
          
          {/* Visuals */}
          <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 md:p-8">
             <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
               <Camera size={20} className="text-primary-500" /> Branding
             </h3>

             <div className="space-y-6">
                <div>
                   <label className="block text-sm font-semibold text-gray-700 mb-2">Cover Image</label>
                   <div className="relative aspect-video rounded-xl bg-gray-50 border-2 border-dashed border-gray-200 overflow-hidden group">
                      {coverPreview ? (
                        <>
                          <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                          <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                             <div className="bg-white/90 text-gray-900 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-white">
                                <Upload size={16} /> Change
                             </div>
                             <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, 'cover')} />
                          </label>
                        </>
                      ) : (
                        <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors">
                           <Upload size={24} className="text-gray-400 mb-2" />
                           <span className="text-xs font-semibold text-gray-500">Upload Cover</span>
                           <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, 'cover')} />
                        </label>
                      )}
                   </div>
                </div>

                <div>
                   <label className="block text-sm font-semibold text-gray-700 mb-2">Logo</label>
                   <div className="flex items-center gap-4">
                      <div className="relative h-20 w-20 rounded-full bg-gray-50 border-2 border-dashed border-gray-200 overflow-hidden group shrink-0">
                         {logoPreview ? (
                           <>
                             <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                             <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                <Upload size={16} className="text-white" />
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, 'logo')} />
                             </label>
                           </>
                         ) : (
                           <label className="absolute inset-0 flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors">
                              <Upload size={16} className="text-gray-400" />
                              <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, 'logo')} />
                           </label>
                         )}
                      </div>
                      <p className="text-xs text-gray-500">Recommended size: 500x500px. JPG or PNG.</p>
                   </div>
                </div>
             </div>
          </div>

          {/* Operating Hours */}
          <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 md:p-8">
             <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
               <Clock size={20} className="text-primary-500" /> Operating Hours
             </h3>

             {errors.hours && <div className="mb-4 p-3 bg-red-50 rounded-lg text-xs text-red-600 flex items-center gap-2 font-medium border border-red-100"><AlertCircle size={14}/> {errors.hours}</div>}

             <div className="flex flex-col gap-2">
                {DAYS.map(day => {
                   const schedule = hours[day as keyof OperatingHours];
                   return (
                     <div key={day} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:shadow-sm transition-all group">
                        
                        {/* Day & Toggle */}
                        <div className="flex items-center gap-3 w-32">
                           <label className="relative inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                className="sr-only peer"
                                checked={!schedule.isClosed}
                                onChange={(e) => handleScheduleChange(day, 'isClosed', !e.target.checked)}
                              />
                              <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
                           </label>
                           <span className={`text-sm font-bold capitalize ${!schedule.isClosed ? 'text-gray-900' : 'text-gray-400'}`}>{day}</span>
                        </div>
                        
                        {/* Time Inputs */}
                        {schedule.isClosed ? (
                           <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-3 py-1.5 rounded-lg flex-1 text-center">Closed</span>
                        ) : (
                           <div className="flex items-center gap-2 flex-1 justify-end">
                              <input 
                                type="time" 
                                className={`bg-white border rounded-lg px-2 py-1.5 text-xs font-medium text-gray-700 outline-none shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all ${errors.hours ? 'border-red-300' : 'border-gray-200'}`}
                                value={schedule.open}
                                onChange={(e) => handleScheduleChange(day, 'open', e.target.value)}
                              />
                              <span className="text-gray-400 text-xs font-bold">to</span>
                              <input 
                                type="time" 
                                className={`bg-white border rounded-lg px-2 py-1.5 text-xs font-medium text-gray-700 outline-none shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all ${errors.hours ? 'border-red-300' : 'border-gray-200'}`}
                                value={schedule.close}
                                onChange={(e) => handleScheduleChange(day, 'close', e.target.value)}
                              />
                           </div>
                        )}
                     </div>
                   );
                })}
             </div>
          </div>

        </div>

      </div>
    </div>
  );
};
