import React, { useState } from 'react';
import { UserInfo, UserInfoErrors, REGIONS } from '../types/index.ts';

interface UserInfoProps {
  onSubmit: (userInfo: UserInfo) => void;
  isLoading: boolean;
}

export default function UserInfoForm({ onSubmit, isLoading }: UserInfoProps) {
  const [formData, setFormData] = useState<UserInfo>({
    region: 'North',
    age: 0,
    yearsInRegion: 0
  });
  const [errors, setErrors] = useState<UserInfoErrors>({});

  const validateForm = (): boolean => {
    const newErrors: UserInfoErrors = {};

    if (!formData.region) {
      newErrors.region = 'Please select your region';
    }

    if (!formData.age || formData.age < 1 || formData.age > 120) {
      newErrors.age = 'Please enter a valid age (1-120)';
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
              min="1"
              max="120"
              value={formData.age || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, age: parseInt(e.target.value) || 0 }))}
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
              max={formData.age || 120}
              value={formData.yearsInRegion || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, yearsInRegion: parseInt(e.target.value) || 0 }))}
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

          <div className="pt-6">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full text-white font-bold py-4 px-6 rounded-xl text-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:transform-none disabled:shadow-md"
              style={{
                background: isLoading 
                  ? 'linear-gradient(to right, #9ca3af, #6b7280)' 
                  : 'var(--btn-primary-bg)',
                backgroundImage: isLoading 
                  ? 'linear-gradient(to right, #9ca3af, #6b7280)' 
                  : 'var(--btn-primary-bg)'
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.backgroundImage = 'var(--btn-primary-hover)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.backgroundImage = 'var(--btn-primary-bg)';
                }
              }}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-2"></div>
                  Creating your session...
                </div>
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
