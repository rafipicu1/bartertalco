import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { INDONESIA_LOCATIONS, getProvince, getCity } from '@/data/indonesiaLocations';
import { MapPin } from 'lucide-react';

interface LocationSelectorProps {
  province: string;
  city: string;
  district: string;
  onProvinceChange: (province: string) => void;
  onCityChange: (city: string) => void;
  onDistrictChange: (district: string) => void;
  required?: boolean;
}

export function LocationSelector({
  province,
  city,
  district,
  onProvinceChange,
  onCityChange,
  onDistrictChange,
  required = false,
}: LocationSelectorProps) {
  const [availableCities, setAvailableCities] = useState<{ name: string }[]>([]);
  const [availableDistricts, setAvailableDistricts] = useState<{ name: string }[]>([]);

  // Update available cities when province changes
  useEffect(() => {
    if (province) {
      const provinceData = getProvince(province);
      setAvailableCities(provinceData?.cities || []);
      // Reset city and district when province changes
      if (!provinceData?.cities.find(c => c.name === city)) {
        onCityChange('');
        onDistrictChange('');
      }
    } else {
      setAvailableCities([]);
    }
  }, [province]);

  // Update available districts when city changes
  useEffect(() => {
    if (province && city) {
      const cityData = getCity(province, city);
      setAvailableDistricts(cityData?.districts || []);
      // Reset district when city changes
      if (!cityData?.districts.find(d => d.name === district)) {
        onDistrictChange('');
      }
    } else {
      setAvailableDistricts([]);
    }
  }, [province, city]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-primary">
        <MapPin className="h-4 w-4" />
        Lokasi
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Province */}
        <div className="space-y-2">
          <Label htmlFor="province" className="text-xs text-muted-foreground">
            Provinsi {required && <span className="text-destructive">*</span>}
          </Label>
          <Select value={province} onValueChange={onProvinceChange}>
            <SelectTrigger id="province" className="bg-background">
              <SelectValue placeholder="Pilih Provinsi" />
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-lg z-50">
              {INDONESIA_LOCATIONS.map((p) => (
                <SelectItem key={p.name} value={p.name}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* City */}
        <div className="space-y-2">
          <Label htmlFor="city" className="text-xs text-muted-foreground">
            Kota/Kabupaten {required && <span className="text-destructive">*</span>}
          </Label>
          <Select 
            value={city} 
            onValueChange={onCityChange}
            disabled={!province}
          >
            <SelectTrigger id="city" className="bg-background">
              <SelectValue placeholder="Pilih Kota" />
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-lg z-50">
              {availableCities.map((c) => (
                <SelectItem key={c.name} value={c.name}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* District */}
        <div className="space-y-2">
          <Label htmlFor="district" className="text-xs text-muted-foreground">
            Kecamatan {required && <span className="text-destructive">*</span>}
          </Label>
          <Select 
            value={district} 
            onValueChange={onDistrictChange}
            disabled={!city}
          >
            <SelectTrigger id="district" className="bg-background">
              <SelectValue placeholder="Pilih Kecamatan" />
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-lg z-50">
              {availableDistricts.map((d) => (
                <SelectItem key={d.name} value={d.name}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Location Preview */}
      {city && district && (
        <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
          <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
          <span className="text-sm font-medium">
            {city} — {district}
          </span>
        </div>
      )}
    </div>
  );
}
