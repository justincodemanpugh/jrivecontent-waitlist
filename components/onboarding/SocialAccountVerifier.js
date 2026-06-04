"use client";

import { useState } from "react";
import { Check, X, Loader2 } from "lucide-react";

const PLATFORM_CONFIGS = {
  instagram: {
    name: "Instagram",
    baseUrl: "https://instagram.com/",
    placeholder: "handle",
    pattern: /^[a-zA-Z0-9._]{1,30}$/,
  },
  tiktok: {
    name: "TikTok", 
    baseUrl: "https://tiktok.com/@",
    placeholder: "handle",
    pattern: /^[a-zA-Z0-9._]{2,24}$/,
  },
  youtube: {
    name: "YouTube",
    baseUrl: "https://youtube.com/@",
    placeholder: "handle",
    pattern: /^[a-zA-Z0-9._\-]{3,100}$/,
  },
};

export default function SocialAccountVerifier({ 
  instagram, 
  tiktok, 
  youtube, 
  onInstagramChange, 
  onTiktokChange, 
  onYoutubeChange,
  onVerificationChange 
}) {
  const [verifying, setVerifying] = useState({});
  const [verified, setVerified] = useState({
    instagram: false,
    tiktok: false, 
    youtube: false,
  });

  const verifyAccount = async (platform, handle) => {
    if (!handle || !handle.trim()) {
      setVerified(prev => ({ ...prev, [platform]: false }));
      onVerificationChange(platform, false);
      return;
    }

    const config = PLATFORM_CONFIGS[platform];
    if (!config.pattern.test(handle)) {
      setVerified(prev => ({ ...prev, [platform]: false }));
      onVerificationChange(platform, false);
      return;
    }

    setVerifying(prev => ({ ...prev, [platform]: true }));
    
    try {
      // Basic verification - check if the profile URL exists
      const response = await fetch(`/api/verify-social?platform=${platform}&handle=${handle}`);
      const data = await response.json();
      
      const isVerified = data.exists && data.valid;
      setVerified(prev => ({ ...prev, [platform]: isVerified }));
      onVerificationChange(platform, isVerified);
    } catch (error) {
      console.error(`Failed to verify ${platform}:`, error);
      setVerified(prev => ({ ...prev, [platform]: false }));
      onVerificationChange(platform, false);
    } finally {
      setVerifying(prev => ({ ...prev, [platform]: false }));
    }
  };

  const handleInputChange = (platform, value) => {
    const cleanValue = value.replace(/^@/, "").trim();
    
    switch (platform) {
      case 'instagram':
        onInstagramChange(cleanValue);
        break;
      case 'tiktok':
        onTiktokChange(cleanValue);
        break;
      case 'youtube':
        onYoutubeChange(cleanValue);
        break;
    }
    
    // Auto-verify after a short delay
    const timeoutId = setTimeout(() => {
      verifyAccount(platform, cleanValue);
    }, 1000);
    
    return () => clearTimeout(timeoutId);
  };

  const hasAnyVerified = Object.values(verified).some(v => v);

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
              hasAnyVerified ? 'bg-green-500' : 'bg-amber-500'
            }`}>
              {hasAnyVerified ? (
                <Check size={12} className="text-white" />
              ) : (
                <div className="w-2 h-2 bg-white rounded-full" />
              )}
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900">
              {hasAnyVerified ? "Social accounts connected!" : "Connect at least one social account"}
            </p>
            <p className="text-xs text-blue-700 mt-1">
              Brands need to see your content quality. Connect your social media accounts to continue.
            </p>
          </div>
        </div>
      </div>

      {Object.entries(PLATFORM_CONFIGS).map(([platform, config]) => {
        const value = platform === 'instagram' ? instagram : platform === 'tiktok' ? tiktok : youtube;
        const isVerifying = verifying[platform];
        const isVerified = verified[platform];
        
        return (
          <div key={platform} className="space-y-2">
            <label className="block text-sm font-medium text-brand-ink">
              {config.name}
              {isVerified && (
                <span className="ml-2 inline-flex items-center gap-1 text-xs text-green-600">
                  <Check size={14} /> Verified
                </span>
              )}
            </label>
            <div className="relative">
              <div className="flex items-center rounded-lg border border-slate-200 bg-white focus-within:border-brand-skyDeep focus-within:ring-2 focus-within:ring-brand-sky/30">
                <span className="pl-3 text-sm text-slate-400">@</span>
                <input
                  type="text"
                  value={value}
                  onChange={(e) => handleInputChange(platform, e.target.value)}
                  placeholder={config.placeholder}
                  className={`flex-1 bg-transparent px-2 py-2.5 text-sm text-brand-ink placeholder-slate-400 focus:outline-none ${
                    isVerified ? 'text-green-700' : ''
                  }`}
                  maxLength={platform === 'instagram' ? 30 : platform === 'tiktok' ? 24 : 100}
                />
                {isVerifying && (
                  <div className="pr-3">
                    <Loader2 size={16} className="animate-spin text-slate-400" />
                  </div>
                )}
                {!isVerifying && value && (
                  <div className="pr-3">
                    {isVerified ? (
                      <Check size={16} className="text-green-500" />
                    ) : (
                      <X size={16} className="text-red-500" />
                    )}
                  </div>
                )}
              </div>
              {value && !isVerified && !isVerifying && (
                <p className="mt-1 text-xs text-red-600">
                  Could not verify this account. Please check the handle.
                </p>
              )}
              {isVerified && (
                <p className="mt-1 text-xs text-green-600">
                  Account verified! Brands will be able to see your content.
                </p>
              )}
            </div>
          </div>
        );
      })}

      {!hasAnyVerified && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
          <p className="text-xs text-amber-800">
            <strong>Required:</strong> At least one social account must be verified to continue.
          </p>
        </div>
      )}
    </div>
  );
}
