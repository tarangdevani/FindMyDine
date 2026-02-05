
import React, { useState, useEffect } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { Button } from '../UI/Button';
import { RestaurantProfile, OperatingHours, DaySchedule } from '../../types';
import { updateRestaurantProfile, getRestaurantProfile } from '../../services/restaurantService';
import { deleteFileFromUrl } from '../../services/storageService';
import { storage } from '../../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useToast } from '../../context/ToastContext';

// Import Child Components
import { BasicInfo } from './Profile/BasicInfo';
import { LocationInfo } from './Profile/LocationInfo';
import { BrandingInfo } from './Profile/BrandingInfo';
import { OperatingHoursInfo } from './Profile/OperatingHoursInfo';

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
  const { showToast } = useToast();
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
    try {
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
    } catch (error) {
      console.error("Failed to load profile", error);
      showToast("Failed to load profile details", "error");
    } finally {
      setIsLoading(false);
    }
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
            showToast("Address location updated on map", "info");
        } else {
            console.error("Geocoding failed: No results found");
            showToast("Could not find location for address", "warning");
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

          showToast("Location detected successfully!", "success");
        },
        (error) => {
          console.error("Error detecting location", error);
          showToast("Could not detect location. Please check browser permissions.", "error");
        }
      );
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        showToast("Please fix the errors in the form.", "error");
        return;
    }

    setIsSaving(true);
    try {
      let coverUrl = profile.coverImageUrl;
      let logoUrl = profile.logoUrl;

      // Handle Cover Image Upload & Cleanup
      if (coverImage) {
        // Delete old cover if exists
        if (profile.coverImageUrl) {
            await deleteFileFromUrl(profile.coverImageUrl);
        }
        
        const refCover = ref(storage, `restaurants/${userId}/cover_${Date.now()}`);
        await uploadBytes(refCover, coverImage);
        coverUrl = await getDownloadURL(refCover);
      }

      // Handle Logo Upload & Cleanup
      if (logoImage) {
        // Delete old logo if exists
        if (profile.logoUrl) {
            await deleteFileFromUrl(profile.logoUrl);
        }

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
        showToast("Profile updated successfully!", "success");
        // Clear file inputs state after successful save
        setCoverImage(null);
        setLogoImage(null);
      } else {
        showToast("Failed to update profile.", "error");
      }
    } catch (error) {
      console.error("Save error:", error);
      showToast("An error occurred while saving.", "error");
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
          
          <BasicInfo 
            name={name} setName={setName}
            description={description} setDescription={setDescription}
            cuisineInput={cuisineInput} setCuisineInput={setCuisineInput}
            phone={phone} setPhone={setPhone}
            errors={errors} setErrors={setErrors}
          />

          <LocationInfo 
            address={address} setAddress={setAddress}
            handleAddressBlur={handleAddressBlur}
            handleGeoLocation={handleGeoLocation}
            mapUrl={mapUrl}
            isGeocoding={isGeocoding}
            errors={errors} setErrors={setErrors}
          />

        </div>

        {/* RIGHT COLUMN: Visuals & Hours */}
        <div className="space-y-8">
          
          <BrandingInfo 
            coverPreview={coverPreview}
            logoPreview={logoPreview}
            handleImageChange={handleImageChange}
          />

          <OperatingHoursInfo 
            hours={hours}
            handleScheduleChange={handleScheduleChange}
            errors={errors}
          />

        </div>

      </div>
    </div>
  );
};
