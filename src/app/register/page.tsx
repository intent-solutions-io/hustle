'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { signUp } from '@/lib/firebase/auth';

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Password strength calculation
  const getPasswordStrength = (password: string): { strength: number; label: string; color: string } => {
    if (!password) return { strength: 0, label: '', color: '' };

    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    if (strength <= 2) return { strength, label: 'Weak', color: 'bg-red-500' };
    if (strength <= 3) return { strength, label: 'Fair', color: 'bg-yellow-500' };
    if (strength <= 4) return { strength, label: 'Good', color: 'bg-blue-500' };
    return { strength, label: 'Strong', color: 'bg-green-500' };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+?[1-9]\d{9,14}$/.test(formData.phone.replace(/[\s-()]/g, ''))) {
      newErrors.phone = 'Enter valid phone (e.g., +1234567890 or 1234567890)';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[RegisterPage] Form submitted');

    if (!validateForm()) {
      console.log('[RegisterPage] Form validation failed');
      return;
    }

    setIsLoading(true);
    setErrors({}); // Clear previous errors
    console.log('[RegisterPage] Starting signup for:', formData.email);

    try {
      const result = await signUp({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone.replace(/[\s-()]/g, ''),
        password: formData.password,
        agreedToTerms: true,
        agreedToPrivacy: true,
        isParentGuardian: true,
      });

      console.log('[RegisterPage] Signup successful, redirecting to login');
      // Redirect to login with success message
      window.location.href = '/login?registered=true';
    } catch (error: unknown) {
      console.error('[RegisterPage] Signup failed:', error);

      // Handle Firebase Auth errors
      const firebaseError = error as { code?: string; message?: string };
      console.error('[RegisterPage] Error code:', firebaseError.code);
      console.error('[RegisterPage] Error message:', firebaseError.message);

      if (firebaseError.code === 'auth/email-already-in-use') {
        setErrors({ submit: 'An account with this email already exists.' });
      } else if (firebaseError.code === 'auth/weak-password') {
        setErrors({ submit: 'Password is too weak. Please use a stronger password.' });
      } else if (firebaseError.code === 'auth/invalid-email') {
        setErrors({ submit: 'Please enter a valid email address.' });
      } else if (firebaseError.code === 'auth/network-request-failed') {
        setErrors({ submit: 'Network error. Please check your internet connection.' });
      } else if (firebaseError.code === 'auth/too-many-requests') {
        setErrors({ submit: 'Too many attempts. Please try again later.' });
      } else if (firebaseError.message?.includes('timed out')) {
        setErrors({ submit: 'Request timed out. Please try again.' });
      } else {
        setErrors({ submit: firebaseError.message || 'An error occurred. Please try again.' });
      }
    } finally {
      console.log('[RegisterPage] Setting isLoading to false');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Back to Home */}
      <Link
        href="/"
        className="absolute top-8 left-8 flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </Link>

      {/* Registration Card */}
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-8 h-8 bg-zinc-900 rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-sm">H</span>
            </div>
            <CardTitle className="text-2xl font-bold text-zinc-900">Create Account</CardTitle>
          </div>
          <CardDescription className="text-zinc-600">
            Parent/Guardian Account Registration (athlete registration inside)
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-zinc-700">
                  First Name
                </Label>
                <Input
                  id="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className={errors.firstName ? 'border-red-500' : ''}
                  disabled={isLoading}
                />
                {errors.firstName && (
                  <p className="text-xs text-red-600">{errors.firstName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-zinc-700">
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className={errors.lastName ? 'border-red-500' : ''}
                  disabled={isLoading}
                />
                {errors.lastName && (
                  <p className="text-xs text-red-600">{errors.lastName}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-zinc-700">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={errors.email ? 'border-red-500' : ''}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-xs text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-zinc-700">
                Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1234567890 or 1234567890"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className={errors.phone ? 'border-red-500' : ''}
                disabled={isLoading}
              />
              {errors.phone && (
                <p className="text-xs text-red-600">{errors.phone}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-zinc-700">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={errors.password ? 'border-red-500 pr-10' : 'pr-10'}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {formData.password && (
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1 bg-zinc-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${passwordStrength.color} transition-all`}
                      style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                    />
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      passwordStrength.label === 'Weak' ? 'text-red-600 border-red-600' :
                      passwordStrength.label === 'Fair' ? 'text-yellow-600 border-yellow-600' :
                      passwordStrength.label === 'Good' ? 'text-blue-600 border-blue-600' :
                      'text-green-600 border-green-600'
                    }`}
                  >
                    {passwordStrength.label}
                  </Badge>
                </div>
              )}
              {errors.password && (
                <p className="text-xs text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-zinc-700">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className={errors.confirmPassword ? 'border-red-500' : ''}
                disabled={isLoading}
              />
              {errors.confirmPassword && (
                <p className="text-xs text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-zinc-900 hover:bg-zinc-800 text-white h-11"
              disabled={isLoading}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>

            {/* Legal Consent Notice */}
            <p className="text-center text-xs text-zinc-500 leading-relaxed">
              By creating an account, you agree to our{' '}
              <Link href="/terms" target="_blank" className="text-zinc-900 underline hover:text-zinc-700">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" target="_blank" className="text-zinc-900 underline hover:text-zinc-700">
                Privacy Policy
              </Link>
              , and certify that you are 18+ and the parent/legal guardian of any minors whose data you enter.
            </p>

            {/* Login Link */}
            <p className="text-center text-sm text-zinc-600">
              Already have an account?{' '}
              <Link href="/login" className="text-zinc-900 font-medium hover:underline">
                Sign In
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
