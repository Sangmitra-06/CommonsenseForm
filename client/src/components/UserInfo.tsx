import React, { useState } from 'react';
import { UserInfo, UserInfoErrors, REGIONS } from '../types/index.ts';

interface UserInfoProps {
  onSubmit: (userInfo: UserInfo) => void;
  isLoading: boolean;
}

export default function UserInfoForm({ onSubmit, isLoading }: UserInfoProps) {
  const [formData, setFormData] = useState<UserInfo>({
    prolificId: '',
    region: 'North',
    age: 0,
    yearsInRegion: 0
  });
  const [errors, setErrors] = useState<UserInfoErrors>({});

  // Real-time Prolific ID validation (keeping format validation only)
  const validateProlificId = (id: string): string => {
    if (!id) {
      return 'Prolific ID is required';
    }
    if (id.length !== 24) {
      return `Prolific ID must be exactly 24 characters (current: ${id.length})`;
    }
    if (!/^[a-zA-Z0-9]+$/.test(id)) {
      return 'Prolific ID can only contain letters and numbers (no symbols or spaces)';
    }
    return '';
  };

  const validateForm = (): boolean => {
    const newErrors: UserInfoErrors = {};

    // Validate Prolific ID (format only, no duplicate check)
    const prolificError = validateProlificId(formData.prolificId);
    if (prolificError) {
      newErrors.prolificId = prolificError;
    }

    if (!formData.region) {
      newErrors.region = 'Please select your region';
    }

    if (!formData.age || formData.age < 18 || formData.age > 100) {
      newErrors.age = 'Please enter a valid age (18-100)';
    }

    if (formData.yearsInRegion < 0 || formData.yearsInRegion > formData.age) {
      newErrors.yearsInRegion = 'Years in region cannot exceed your age';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleRegionChange = (region: keyof typeof REGIONS) => {
    setFormData(prev => ({ ...prev, region }));
    if (errors.region) {
      setErrors(prev => ({ ...prev, region: undefined }));
    }
  };

  const handleProlificIdChange = (value: string) => {
    // Remove any non-alphanumeric characters and limit to 24
    const cleanValue = value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 24);
    setFormData(prev => ({ ...prev, prolificId: cleanValue }));
    
    // Clear format validation errors when user starts typing
    if (errors.prolificId) {
      setErrors(prev => ({ ...prev, prolificId: undefined }));
    }
  };

  // Check if form is valid (simplified without duplicate check)
  const isFormValid = Object.keys(errors).length === 0 && 
                     formData.prolificId.length === 24 && 
                     formData.region && 
                     formData.age && 
                     formData.yearsInRegion >= 0;

  return (
    <div className="min-h-screen bg-custom-cream flex items-center justify-center p-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8 md:p-12 animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-custom-dark-brown mb-4">
            Tell us about yourself
          </h1>
          <p className="text-custom-olive">
            This information helps us understand the regional context of your responses
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Prolific ID - TOP PRIORITY */}
          <div>
            <label className="block text-lg font-semibold text-custom-dark-brown mb-2">
              Prolific ID <span className="text-red-500">*</span>
            </label>
            <p className="text-sm text-custom-olive mb-4">
              Enter your Prolific participant ID 
            </p>
            <div className="relative">
              <input
                type="text"
                value={formData.prolificId}
                onChange={(e) => handleProlificIdChange(e.target.value)}
                placeholder="e.g., 507f1f77bcf86cd799439011"
                className={`w-full px-4 py-3 text-lg rounded-lg border-2 transition-all duration-200 font-mono pr-12
                  ${errors.prolificId 
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                    : formData.prolificId.length === 24
                      ? 'border-green-500 focus:ring-green-500 focus:border-green-500'
                      : 'border-custom-blue-gray focus:ring-custom-olive focus:border-custom-olive'
                  } focus:ring-2`}
                maxLength={24}
                autoComplete="off"
                style={{
                  color: 'var(--color-dark-brown)'
                }}
              />
              
              {/* Simple status indicator for valid length */}
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                {formData.prolificId.length === 24 && !errors.prolificId && (
                  <span className="text-green-500 text-xl">✅</span>
                )}
              </div>
            </div>
            
            {errors.prolificId && (
              <p className="text-red-600 text-sm mt-2 flex items-center">
                ⚠️ {errors.prolificId}
              </p>
            )}
            
          </div>

          {/* Region Selection */}
          <div>
            <label className="block text-lg font-semibold text-custom-dark-brown mb-4">
              Which region of India are you from? *
            </label>
            <div className="space-y-4">
              {Object.entries(REGIONS).map(([region, states]) => (
                <div key={region} className="relative">
                  <label className="flex items-start space-x-3 cursor-pointer p-4 border-2 border-custom-blue-gray rounded-lg hover:bg-custom-blue-gray hover:bg-opacity-30 transition-colors">
                    <input
                      type="radio"
                      name="region"
                      value={region}
                      checked={formData.region === region}
                      onChange={() => handleRegionChange(region as keyof typeof REGIONS)}
                      className="mt-1 h-4 w-4 text-custom-olive focus:ring-custom-olive border-custom-olive"
                      style={{
                        accentColor: 'var(--color-olive)'
                      }}
                    />
                    <div className="flex-1">
                      <div className="font-medium text-custom-dark-brown">{region} India</div>
                      <div className="text-sm text-custom-olive mt-1">
                        {states.join(', ')}
                      </div>
                    </div>
                  </label>
                </div>
              ))}
            </div>
            {errors.region && (
              <p className="mt-2 text-sm text-red-600">{errors.region}</p>
            )}
          </div>

          {/* Age Input */}
          <div>
            <label htmlFor="age" className="block text-lg font-semibold text-custom-dark-brown mb-2">
              What is your age? *
            </label>
            <input
              type="number"
              id="age"
              min="18"
              max="100"
              value={formData.age || ''}
              onChange={(e) => {
                const newAge = parseInt(e.target.value) || 0;
                setFormData(prev => ({ ...prev, age: newAge }));
                if (errors.age) {
                  setErrors(prev => ({ ...prev, age: undefined }));
                }
              }}
              className="w-full px-4 py-3 border-2 border-custom-blue-gray rounded-lg focus:ring-2 focus:ring-custom-olive focus:border-custom-olive text-lg text-custom-dark-brown placeholder-custom-olive placeholder-opacity-60"
              placeholder="Enter your age"
            />
            {errors.age && (
              <p className="mt-2 text-sm text-red-600">{errors.age}</p>
            )}
          </div>

          {/* Years in Region Input */}
          <div>
            <label htmlFor="yearsInRegion" className="block text-lg font-semibold text-custom-dark-brown mb-2">
              How many years have you lived in this region? *
            </label>
            <input
              type="number"
              id="yearsInRegion"
              min="0"
              max={formData.age || 100}
              value={formData.yearsInRegion || ''}
              onChange={(e) => {
                const newYears = parseInt(e.target.value) || 0;
                setFormData(prev => ({ ...prev, yearsInRegion: newYears }));
                if (errors.yearsInRegion) {
                  setErrors(prev => ({ ...prev, yearsInRegion: undefined }));
                }
              }}
              className="w-full px-4 py-3 border-2 border-custom-blue-gray rounded-lg focus:ring-2 focus:ring-custom-olive focus:border-custom-olive text-lg text-custom-dark-brown placeholder-custom-olive placeholder-opacity-60"
              placeholder="Enter number of years"
            />
            {errors.yearsInRegion && (
              <p className="mt-2 text-sm text-red-600">{errors.yearsInRegion}</p>
            )}
            <p className="mt-2 text-sm text-custom-olive">
              This includes childhood and any time spent living in this region
            </p>
          </div>

          {/* Submit button - Simplified */}
          <div className="pt-6">
            <button
              type="submit"
              disabled={isLoading || !isFormValid}
              className={`w-full font-bold py-4 px-6 rounded-xl text-lg transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center ${
                isFormValid && !isLoading
                  ? 'text-white transform hover:scale-105'
                  : 'text-gray-500 bg-gray-300 cursor-not-allowed'
              }`}
              style={{
                background: isLoading || !isFormValid
                  ? '#d1d5db'
                  : 'var(--btn-primary-bg)',
                backgroundImage: isLoading || !isFormValid
                  ? 'none'
                  : 'var(--btn-primary-bg)'
              }}
              onMouseEnter={(e) => {
                if (!isLoading && isFormValid) {
                  e.currentTarget.style.backgroundImage = 'var(--btn-primary-hover)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading && isFormValid) {
                  e.currentTarget.style.backgroundImage = 'var(--btn-primary-bg)';
                }
              }}
            >
              {isLoading ? (
                <>
                  <span className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-2 inline-block"></span>
                  Creating your session...
                </>
              ) : (
                'Start Survey'
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center text-sm text-custom-olive">
          <p>All information is kept confidential and used only for research purposes.</p>
        </div>
      </div>
    </div>
  );
}