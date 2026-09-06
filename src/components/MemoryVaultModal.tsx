import React, { useState, useEffect } from 'react';
import { Memory, MemoryType, UserProfile } from '../types';
import {
  X,
  Trash2,
  Plus,
  Check,
  Calendar,
  MapPin,
  Loader2,
  User
} from 'lucide-react';

interface MemoryVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  memories: Memory[];
  onDeleteMemory: (id: string) => Promise<void>;
  onCreateMemory: (memory: { type: MemoryType; content: string; importance: number }) => Promise<void>;
  isCustomKey?: boolean;
  onSetCustomPassphrase?: (pass: string) => Promise<void>;
  userProfile?: UserProfile | null;
  onUpdateProfile?: (profile: {
    dateOfBirth?: string;
    location?: string;
    displayName?: string;
    bio?: string;
  }) => Promise<void>;
}

export const MemoryVaultModal: React.FC<MemoryVaultModalProps> = ({
  isOpen,
  onClose,
  memories,
  onDeleteMemory,
  onCreateMemory,
  userProfile,
  onUpdateProfile
}) => {
  // Personal Context state
  const [displayName, setDisplayName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [location, setLocation] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSavedSuccess, setProfileSavedSuccess] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationMessage, setLocationMessage] = useState('');

  // Memory list state
  const [activeFilter, setActiveFilter] = useState<'all' | MemoryType>('all');
  const [isAddingMemory, setIsAddingMemory] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState<MemoryType>('insight');
  const [isSavingMemory, setIsSavingMemory] = useState(false);

  // Sync profile when opened or userProfile changes
  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || '');
      setDateOfBirth(userProfile.dateOfBirth || '');
      setLocation(userProfile.location || '');
    }
  }, [userProfile, isOpen]);

  if (!isOpen) return null;

  // Age & Zodiac computation
  const calculateAge = (dob: string): number | null => {
    if (!dob) return null;
    const birth = new Date(dob);
    if (isNaN(birth.getTime())) return null;
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
    return age >= 0 && age <= 125 ? age : null;
  };

  const getZodiacSign = (dob: string): string | null => {
    if (!dob) return null;
    const d = new Date(dob);
    if (isNaN(d.getTime())) return null;
    const day = d.getDate();
    const month = d.getMonth() + 1;
    if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 'Aquarius';
    if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return 'Pisces';
    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 'Aries';
    if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 'Taurus';
    if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 'Gemini';
    if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 'Cancer';
    if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'Leo';
    if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'Virgo';
    if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 'Libra';
    if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 'Scorpio';
    if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return 'Sagittarius';
    return 'Capricorn';
  };

  const calculatedAge = calculateAge(dateOfBirth);
  const zodiac = getZodiacSign(dateOfBirth);

  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!onUpdateProfile || isSavingProfile) return;
    setIsSavingProfile(true);
    try {
      await onUpdateProfile({
        displayName: displayName.trim(),
        dateOfBirth: dateOfBirth.trim(),
        location: location.trim()
      });
      setProfileSavedSuccess(true);
      setTimeout(() => setProfileSavedSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to save profile:', err);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleDetectLocation = () => {
    setIsDetectingLocation(true);
    setLocationMessage('');

    const fallbackTimeZoneCity = () => {
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const city = tz.split('/')[1]?.replace(/_/g, ' ');
        if (city) {
          setLocation(city);
          setLocationMessage(`Detected: ${city}`);
          setTimeout(() => setLocationMessage(''), 2500);
        }
      } catch {
        // no-op
      }
      setIsDetectingLocation(false);
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
            if (res.ok) {
              const data = await res.json();
              const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || '';
              const state = data.address?.state || '';
              const country = data.address?.country || '';
              const parts = [city, state, country].filter(Boolean);
              const detected = parts.slice(0, 2).join(', ') || country;
              if (detected) {
                setLocation(detected);
                setLocationMessage('Detected!');
                setTimeout(() => setLocationMessage(''), 2500);
                setIsDetectingLocation(false);
                return;
              }
            }
          } catch {
            // fallback
          }
          fallbackTimeZoneCity();
        },
        () => {
          fallbackTimeZoneCity();
        },
        { timeout: 5000 }
      );
    } else {
      fallbackTimeZoneCity();
    }
  };

  const handleSaveMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim() || isSavingMemory) return;
    setIsSavingMemory(true);
    try {
      await onCreateMemory({
        type: newType,
        content: newContent.trim(),
        importance: 4
      });
      setNewContent('');
      setIsAddingMemory(false);
    } finally {
      setIsSavingMemory(false);
    }
  };

  const filteredMemories = activeFilter === 'all'
    ? memories
    : memories.filter(m => m.type === activeFilter);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#FAF9F6] border border-[#E8E4DF] rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E8E4DF] bg-white flex items-center justify-between">
          <h2
            className="text-xl sm:text-2xl font-light text-[#1A1A1A] tracking-tight"
            style={{ fontFamily: '"Georgia", Cambria, serif' }}
          >
            Personal Vault
          </h2>

          <button
            onClick={onClose}
            className="p-2 text-[#8C8781] hover:text-[#1A1A1A] rounded-full hover:bg-[#F0EEEA] transition-colors cursor-pointer shrink-0 ml-2"
            title="Close Vault"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">

          {/* SECTION 1: Personal Details (Preferred Name, Date of Birth, Location) */}
          <div className="bg-white rounded-2xl border border-[#E8E4DF] p-5 shadow-2xs space-y-4">
            <form onSubmit={handleSaveProfile} className="space-y-4">
              
              {/* Preferred Name (Moved up) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-[#2D2A26] flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#FF6321]" />
                    <span>Preferred Name</span>
                  </label>
                  {(calculatedAge !== null || location) && (
                    <div className="flex items-center gap-2 text-[11px] text-[#6B665F] font-mono bg-[#FAF9F6] px-2.5 py-0.5 rounded-full border border-[#E8E4DF]">
                      {calculatedAge !== null && <span>Age {calculatedAge}{zodiac ? ` · ${zodiac}` : ''}</span>}
                      {calculatedAge !== null && location && <span>•</span>}
                      {location && <span className="truncate max-w-[130px]">{location}</span>}
                    </div>
                  )}
                </div>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="How Reflect addresses you"
                  className="w-full px-3 py-2 bg-[#FAF9F6] border border-[#E8E4DF] rounded-xl text-xs text-[#1A1A1A] focus:outline-none focus:border-[#FF6321] transition-colors"
                />
              </div>

              {/* Date of Birth & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Date of Birth Field */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-[#2D2A26] flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#FF6321]" />
                      <span>Date of Birth</span>
                    </label>
                    {calculatedAge !== null && (
                      <span className="text-[10px] font-semibold text-[#FF6321] bg-[#FAF9F6] px-2 py-0.5 rounded-md border border-[#E8E4DF]">
                        {calculatedAge} yrs {zodiac ? `(${zodiac})` : ''}
                      </span>
                    )}
                  </div>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 bg-[#FAF9F6] border border-[#E8E4DF] rounded-xl text-xs text-[#1A1A1A] focus:outline-none focus:border-[#FF6321] transition-colors"
                  />
                </div>

                {/* Location Details Field */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-[#2D2A26] flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#FF6321]" />
                      <span>Location / City</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleDetectLocation}
                      disabled={isDetectingLocation}
                      className="text-[10px] text-[#FF6321] hover:underline cursor-pointer flex items-center gap-1"
                      title="Detect current city from device"
                    >
                      {isDetectingLocation ? (
                        <Loader2 className="w-2.5 h-2.5 animate-spin" />
                      ) : (
                        <MapPin className="w-2.5 h-2.5" />
                      )}
                      <span>{isDetectingLocation ? 'Detecting...' : 'Detect location'}</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. San Francisco, CA or London, UK"
                    className="w-full px-3 py-2 bg-[#FAF9F6] border border-[#E8E4DF] rounded-xl text-xs text-[#1A1A1A] placeholder-[#8C8781] focus:outline-none focus:border-[#FF6321] transition-colors"
                  />
                  {locationMessage && (
                    <p className="text-[10px] text-emerald-600 font-medium">{locationMessage}</p>
                  )}
                </div>

              </div>

              {/* Action Bar */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#F0EEEA]">
                {profileSavedSuccess && (
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                    <Check className="w-3.5 h-3.5" />
                    <span>Saved</span>
                  </span>
                )}
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-4 py-1.5 rounded-full text-xs font-medium bg-[#1A1A1A] hover:bg-[#333333] text-white transition-colors cursor-pointer shadow-2xs"
                >
                  {isSavingProfile ? 'Saving...' : 'Save Details'}
                </button>
              </div>
            </form>
          </div>

          {/* SECTION 2: Durable Memories */}
          <div className="bg-white rounded-2xl border border-[#E8E4DF] p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#F0EEEA]">
              <h3 className="text-sm font-semibold text-[#1A1A1A] flex items-center gap-2">
                <span>Durable Memories</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-[#FAF9F6] border border-[#E8E4DF] text-[#6B665F]">
                  {memories.length}
                </span>
              </h3>

              <button
                type="button"
                onClick={() => setIsAddingMemory(!isAddingMemory)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[#FAF9F6] hover:bg-[#F0EEEA] text-[#FF6321] border border-[#E8E4DF] transition-colors cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Memory</span>
              </button>
            </div>

            {/* Add Memory Form */}
            {isAddingMemory && (
              <form onSubmit={handleSaveMemory} className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E8E4DF] space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[#1A1A1A]">
                    Record a personal memory or rule
                  </span>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as MemoryType)}
                    className="text-xs border border-[#E8E4DF] rounded-lg px-2.5 py-1 bg-white text-[#1A1A1A] capitalize"
                  >
                    <option value="insight">Insight</option>
                    <option value="goal">Goal</option>
                    <option value="decision">Decision</option>
                    <option value="theme">Theme</option>
                  </select>
                </div>

                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="e.g. Prioritize deep focused mornings over reactive meetings..."
                  rows={2}
                  className="w-full text-xs text-[#1A1A1A] p-2.5 bg-white border border-[#E8E4DF] rounded-xl focus:outline-none focus:border-[#FF6321] resize-none"
                />

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingMemory(false)}
                    className="px-3 py-1 text-xs text-[#8C8781] hover:text-[#1A1A1A] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newContent.trim() || isSavingMemory}
                    className="px-4 py-1 text-xs font-medium bg-[#FF6321] hover:bg-[#E8591E] text-white rounded-full transition-colors cursor-pointer shadow-2xs"
                  >
                    {isSavingMemory ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            )}

            {/* Filter Chips */}
            {memories.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {(['all', 'insight', 'goal', 'decision', 'theme'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-3 py-1 rounded-full text-[11px] font-medium capitalize transition-colors cursor-pointer ${
                      activeFilter === filter
                        ? 'bg-[#1A1A1A] text-white'
                        : 'bg-[#FAF9F6] text-[#6B665F] hover:bg-[#F0EEEA] border border-[#E8E4DF]'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            )}

            {/* Memory Items List */}
            <div className="space-y-2.5">
              {filteredMemories.length === 0 ? (
                <div className="py-6 text-center bg-[#FAF9F6] rounded-xl border border-dashed border-[#E8E4DF] px-4">
                  <p className="text-xs text-[#8C8781]">
                    {memories.length === 0
                      ? 'No memories recorded yet.'
                      : `No memories in "${activeFilter}".`}
                  </p>
                </div>
              ) : (
                filteredMemories.map((mem) => (
                  <div
                    key={mem.id}
                    className="group p-3.5 rounded-xl bg-[#FAF9F6] border border-[#E8E4DF] hover:border-[#FF6321]/60 transition-all flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-white border border-[#E8E4DF] text-[#6B665F]">
                          {mem.type.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] text-[#8C8781]">
                          {new Date(mem.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-[#1A1A1A] leading-relaxed">
                        {mem.rawPlaintext || mem.content}
                      </p>
                    </div>

                    <button
                      onClick={() => onDeleteMemory(mem.id)}
                      title="Delete Memory"
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-[#8C8781] hover:text-red-600 rounded-lg hover:bg-white transition-all cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#E8E4DF] bg-white flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-1.5 bg-[#1A1A1A] hover:bg-[#333333] text-white font-medium rounded-full text-xs transition-colors cursor-pointer shadow-2xs"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
