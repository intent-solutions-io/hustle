'use client';

/**
 * Survey Section Page - Multi-Step Survey Form
 *
 * @description Renders individual sections of the 68-question parent survey.
 *              Implements localStorage persistence, comprehensive question type support,
 *              and robust error handling.
 *
 * Features:
 * - Supports all question types: radio, checkbox, text, email, phone, textarea, rating, ranking, select
 * - Automatic response persistence via localStorage
 * - Progress tracking with visual progress bar
 * - Form validation with inline error messages
 * - Responsive design for mobile and desktop
 * - Graceful error handling with user-friendly messages
 *
 * @see /lib/survey-data-complete.ts for survey structure
 * @see /01-Docs/survey-remediation/issue-001-root-cause-analysis.md for implementation details
 */

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { surveyData } from '@/lib/survey-data-complete';

const STORAGE_KEY = 'hustle-survey-responses';
const TOTAL_SECTIONS = 15;

export default function SurveySection() {
  const params = useParams();
  const router = useRouter();
  const sectionNum = parseInt(params.section as string);

  const [responses, setResponses] = useState<Record<string, string | string[] | number | Record<string, number>>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load saved responses from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsedData = JSON.parse(saved);
        setResponses(parsedData);
        console.log('[Survey] Loaded saved responses:', Object.keys(parsedData).length, 'fields');
      }
    } catch (error) {
      console.error('[Survey] Failed to load saved responses:', error);
      // Don't block user if localStorage fails - continue with empty responses
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save responses to localStorage whenever they change (debounced)
  useEffect(() => {
    if (isLoading) return; // Don't save during initial load

    const timeoutId = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(responses));
        console.log('[Survey] Auto-saved responses');
      } catch (error) {
        console.error('[Survey] Failed to save responses:', error);
        // Notify user if storage is full or unavailable
        if (error instanceof Error && error.name === 'QuotaExceededError') {
          alert('Storage is full. Please clear your browser data or use a different browser.');
        }
      }
    }, 500); // Debounce saves by 500ms

    return () => clearTimeout(timeoutId);
  }, [responses, isLoading]);

  // Find the current section
  const section = surveyData.find(s => s.id === sectionNum);

  // Handle section not found
  if (!section) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 text-center">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-neutral-900 mb-2">Section Not Found</h2>
            <p className="text-neutral-600 mb-6">
              The requested section ({sectionNum}) does not exist. There are only {TOTAL_SECTIONS} sections in this survey.
            </p>
            <button
              onClick={() => router.push('/survey/1')}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all"
            >
              Return to Start
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent mb-4"></div>
          <p className="text-neutral-600">Loading your survey...</p>
        </div>
      </div>
    );
  }

  /**
   * Handle response change for any question type
   */
  const handleChange = (questionId: string, value: string | string[] | number | Record<string, number>) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));

    // Clear error when user provides input
    if (errors[questionId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[questionId];
        return newErrors;
      });
    }
  };

  /**
   * Handle checkbox changes (multiple selections)
   */
  const handleCheckboxChange = (questionId: string, option: string, checked: boolean) => {
    const currentValues = Array.isArray(responses[questionId]) ? responses[questionId] : [];

    const newValues = checked
      ? [...currentValues, option]
      : currentValues.filter((v: string) => v !== option);

    handleChange(questionId, newValues);
  };

  /**
   * Handle ranking changes (drag-and-drop or number input)
   */
  const handleRankingChange = (questionId: string, option: string, rank: number) => {
    const currentRankings = (responses[questionId] as Record<string, number>) || {};
    handleChange(questionId, {
      ...currentRankings,
      [option]: rank
    });
  };

  /**
   * Validate current section before navigation
   */
  const validateSection = (): boolean => {
    const newErrors: Record<string, string> = {};

    section.questions.forEach(question => {
      if (!question.required) return;

      const value = responses[question.id];

      // Check if value exists
      if (!value || (Array.isArray(value) && value.length === 0)) {
        newErrors[question.id] = 'This field is required';
        return;
      }

      // Validate email format
      if (question.type === 'email' && typeof value === 'string') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          newErrors[question.id] = 'Please enter a valid email address';
        }
      }

      // Validate phone format
      if (question.type === 'phone' && typeof value === 'string') {
        const phoneRegex = /^[\d\s\-\(\)]+$/;
        if (!phoneRegex.test(value) || value.length < 10) {
          newErrors[question.id] = 'Please enter a valid phone number';
        }
      }

      // Validate checkbox minimum selections (if specified)
      if (question.type === 'checkbox' && Array.isArray(value)) {
        const maxSelections = question.max || Infinity;
        if (value.length > maxSelections) {
          newErrors[question.id] = `Please select up to ${maxSelections} options`;
        }
      }

      // Validate ranking completeness
      if (question.type === 'ranking' && question.options) {
        const rankings = value as Record<string, number>;
        if (Object.keys(rankings).length !== question.options.length) {
          newErrors[question.id] = 'Please rank all options';
        }
      }
    });

    setErrors(newErrors);

    // Scroll to first error if validation fails
    if (Object.keys(newErrors).length > 0) {
      const firstErrorId = Object.keys(newErrors)[0];
      const errorElement = document.getElementById(`question-${firstErrorId}`);
      errorElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle Next button click
   */
  const handleNext = async () => {
    if (!validateSection()) {
      return;
    }

    // Check for "No thanks" consent response
    if (responses.consent === 'No thanks') {
      // Clear survey data and return to home
      localStorage.removeItem(STORAGE_KEY);
      router.push('/');
      return;
    }

    setIsSaving(true);

    try {
      // If this is the last section, submit the entire survey
      if (sectionNum === TOTAL_SECTIONS) {
        await handleSubmit();
      } else {
        // Navigate to next section
        router.push(`/survey/${sectionNum + 1}`);
      }
    } catch (error) {
      console.error('[Survey] Navigation error:', error);
      alert('An error occurred. Your progress has been saved. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Handle Back button click
   */
  const handleBack = () => {
    if (sectionNum === 1) {
      // Confirm before leaving survey
      if (Object.keys(responses).length > 0) {
        const confirmLeave = window.confirm(
          'Your progress is saved. You can return later to continue. Are you sure you want to leave?'
        );
        if (!confirmLeave) return;
      }
      router.push('/');
    } else {
      router.push(`/survey/${sectionNum - 1}`);
    }
  };

  /**
   * Submit complete survey data
   */
  const handleSubmit = async () => {
    try {
      console.log('[Survey] Submitting survey data...', Object.keys(responses).length, 'fields');

      // Submit to API endpoint
      const response = await fetch('/api/survey/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(responses),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit survey');
      }

      const result = await response.json();
      console.log('[Survey] Submission successful:', result.submissionId);

      // Verify we got a submission ID (confirms data was saved)
      if (!result.submissionId) {
        throw new Error('No submission ID received - data may not have saved');
      }

      // Clear localStorage after successful submission
      localStorage.removeItem(STORAGE_KEY);
      console.log('[Survey] localStorage cleared');

      // Wait a moment to ensure all state updates complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Navigate to thank you page with multiple fallback methods
      console.log('[Survey] Redirecting to thank you page...');

      // Try Next.js router first
      try {
        router.push('/survey/complete');

        // Fallback: if router.push doesn't redirect within 500ms, use window.location
        setTimeout(() => {
          if (window.location.pathname !== '/survey/complete') {
            console.log('[Survey] Router redirect slow, using window.location fallback');
            window.location.href = '/survey/complete';
          }
        }, 500);
      } catch (routerError) {
        // If router fails, immediately use window.location
        console.error('[Survey] Router failed, using window.location:', routerError);
        window.location.href = '/survey/complete';
      }

    } catch (error) {
      console.error('[Survey] Submission error:', error);
      alert('Failed to submit survey. Your responses are saved locally. Please try again or contact support.');
      throw error;
    }
  };

  const progress = (sectionNum / TOTAL_SECTIONS) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Progress Bar */}
      <div className="sticky top-0 z-50 bg-white border-b border-neutral-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-neutral-700">
              Section {sectionNum} of {TOTAL_SECTIONS}
            </p>
            <p className="text-sm text-neutral-600">
              {Math.round(progress)}% Complete
            </p>
          </div>
          <div className="w-full bg-neutral-200 rounded-full h-2">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Survey Content */}
      <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-10">
          {/* Section Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-3">
              {section.title}
            </h1>
            {section.description && (
              <p className="text-lg text-neutral-600">
                {section.description}
              </p>
            )}
          </div>

          {/* Questions */}
          <div className="space-y-8">
            {section.questions.map((question) => (
              <div key={question.id} id={`question-${question.id}`} className="space-y-3">
                <label className="block">
                  <span className="text-lg font-medium text-neutral-900">
                    {question.text}
                    {question.required && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </span>
                  {question.description && (
                    <span className="block text-sm text-neutral-500 mt-1">
                      {question.description}
                    </span>
                  )}
                </label>

                {/* Radio buttons */}
                {question.type === 'radio' && (
                  <div className="space-y-3">
                    {question.options?.map((option) => (
                      <label
                        key={option}
                        className="flex items-center p-4 border-2 border-neutral-200 rounded-lg hover:border-purple-300 cursor-pointer transition-colors"
                      >
                        <input
                          type="radio"
                          name={question.id}
                          value={option}
                          checked={responses[question.id] === option}
                          onChange={(e) => handleChange(question.id, e.target.value)}
                          className="w-5 h-5 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="ml-3 text-base text-neutral-900">{option}</span>
                      </label>
                    ))}
                  </div>
                )}

                {/* Checkboxes */}
                {question.type === 'checkbox' && (
                  <div className="space-y-3">
                    {question.options?.map((option) => {
                      const isChecked = Array.isArray(responses[question.id]) &&
                                      (responses[question.id] as string[]).includes(option);
                      return (
                        <label
                          key={option}
                          className="flex items-center p-4 border-2 border-neutral-200 rounded-lg hover:border-purple-300 cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => handleCheckboxChange(question.id, option, e.target.checked)}
                            className="w-5 h-5 text-purple-600 focus:ring-purple-500 rounded"
                          />
                          <span className="ml-3 text-base text-neutral-900">{option}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {/* Text input */}
                {question.type === 'text' && (
                  <input
                    type="text"
                    value={(responses[question.id] as string) || ''}
                    onChange={(e) => handleChange(question.id, e.target.value)}
                    placeholder={question.placeholder}
                    className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-colors"
                  />
                )}

                {/* Email input */}
                {question.type === 'email' && (
                  <input
                    type="email"
                    value={(responses[question.id] as string) || ''}
                    onChange={(e) => handleChange(question.id, e.target.value)}
                    placeholder={question.placeholder || 'your.email@example.com'}
                    className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-colors"
                  />
                )}

                {/* Phone input */}
                {question.type === 'phone' && (
                  <input
                    type="tel"
                    value={(responses[question.id] as string) || ''}
                    onChange={(e) => handleChange(question.id, e.target.value)}
                    placeholder={question.placeholder || '(555) 123-4567'}
                    className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-colors"
                  />
                )}

                {/* Textarea */}
                {question.type === 'textarea' && (
                  <textarea
                    value={(responses[question.id] as string) || ''}
                    onChange={(e) => handleChange(question.id, e.target.value)}
                    placeholder={question.placeholder}
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-colors resize-none"
                  />
                )}

                {/* Select dropdown */}
                {question.type === 'select' && (
                  <select
                    value={(responses[question.id] as string) || ''}
                    onChange={(e) => handleChange(question.id, e.target.value)}
                    className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-colors"
                  >
                    <option value="">Select an option...</option>
                    {question.options?.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                )}

                {/* Rating scale */}
                {question.type === 'rating' && (
                  <div className="flex items-center justify-between gap-2 max-w-md">
                    {Array.from({ length: (question.max || 5) - (question.min || 1) + 1 }, (_, i) => {
                      const value = (question.min || 1) + i;
                      const isSelected = responses[question.id] === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => handleChange(question.id, value)}
                          className={`flex-1 py-3 px-4 border-2 rounded-lg font-semibold transition-all ${
                            isSelected
                              ? 'border-purple-600 bg-purple-600 text-white shadow-md'
                              : 'border-neutral-200 bg-white text-neutral-700 hover:border-purple-300'
                          }`}
                        >
                          {value}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Ranking */}
                {question.type === 'ranking' && (
                  <div className="space-y-3">
                    <p className="text-sm text-neutral-600">
                      Assign a rank to each option (1 = most important)
                    </p>
                    {question.options?.map((option) => {
                      const currentRankings = (responses[question.id] as Record<string, number>) || {};
                      return (
                        <div key={option} className="flex items-center gap-3 p-4 border-2 border-neutral-200 rounded-lg">
                          <input
                            type="number"
                            min="1"
                            max={question.options?.length}
                            value={currentRankings[option] || ''}
                            onChange={(e) => handleRankingChange(question.id, option, parseInt(e.target.value))}
                            placeholder="#"
                            className="w-16 px-3 py-2 border-2 border-neutral-300 rounded-lg text-center font-semibold focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                          />
                          <span className="text-base text-neutral-900">{option}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Error message */}
                {errors[question.id] && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-red-700">{errors[question.id]}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-8 mt-8 border-t border-neutral-200">
            <button
              onClick={handleBack}
              disabled={isSaving}
              className="px-6 py-3 text-base font-medium text-neutral-700 hover:text-neutral-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Back
            </button>
            <button
              onClick={handleNext}
              disabled={isSaving}
              className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-base rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>{sectionNum === TOTAL_SECTIONS ? 'Submitting Survey...' : 'Saving...'}</span>
                </>
              ) : sectionNum === TOTAL_SECTIONS ? (
                '✓ Submit Survey'
              ) : (
                'Next →'
              )}
            </button>
          </div>

          {/* Auto-save indicator */}
          <div className="mt-4 text-center">
            <p className="text-xs text-neutral-500">
              Your responses are automatically saved to this device
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
