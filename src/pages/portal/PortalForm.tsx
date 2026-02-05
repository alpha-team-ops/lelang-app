import { useState, useEffect } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { saveUserSession } from './utils/sessionManager';
import { authService } from '../../data/services';
import './styles/portal.css';

interface FormData {
  fullName: string;
  corporateIdNip: string;
  directorate: string;
  invitationCode: string;
}

interface FormErrors {
  fullName?: string;
  corporateIdNip?: string;
  directorate?: string;
  invitationCode?: string;
}

export default function PortalForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    corporateIdNip: '',
    directorate: '',
    invitationCode: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string>('');

  // Auto-fill invitation code from URL parameter if provided
  useEffect(() => {
    const invitationCodeFromUrl = searchParams.get('invitationCode');
    if (invitationCodeFromUrl) {
      setFormData((prev) => ({
        ...prev,
        invitationCode: invitationCodeFromUrl,
      }));
    }
  }, [searchParams]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error on field change
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.corporateIdNip.trim()) {
      newErrors.corporateIdNip = 'Corporate ID / NIP is required';
    }

    if (!formData.directorate.trim()) {
      newErrors.directorate = 'Directorate is required';
    }

    if (!formData.invitationCode.trim()) {
      newErrors.invitationCode = 'Invitation code is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setApiError('');

    try {
      // Call portal login API
      const response = await authService.portalLogin({
        fullName: formData.fullName,
        corporateIdNip: formData.corporateIdNip,
        directorate: formData.directorate,
        invitationCode: formData.invitationCode,
      });

      // Save session data with token info
      saveUserSession({
        fullName: formData.fullName,
        corporateIdNip: formData.corporateIdNip,
        directorate: formData.directorate,
        invitationCode: formData.invitationCode,
        timestamp: Date.now(),
        portalToken: response.portalToken,
        userId: response.userId,
      });

      // Save invitation code to localStorage for API requests
      localStorage.setItem('invitationCode', formData.invitationCode);

      // Navigate to auction list
      navigate('/portal/auctions');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed. Please try again.';
      setApiError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="portal-wrapper">
      <div className="portal-card">
        <div className="icon-container">
          <span className="icon">🏛️</span>
        </div>
        <h1 className="portal-title">Auction Portal</h1>
        <p className="portal-subtitle">Enter your information to start participating in auctions</p>

        {apiError && (
          <div style={{ background: '#fee2e2', color: '#991b1b', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', fontWeight: '500', textAlign: 'center' }}>
            ❌ {apiError}
          </div>
        )}

        <form className="form" onSubmit={handleSubmit}>
          {/* Full Name */}
          <div className="form-group">
            <label className="form-label">
              <span className="label-icon">👤</span>
              Full Name
            </label>
            <input
              type="text"
              className="form-input"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Enter your full name"
              disabled={isSubmitting}
            />
            {errors.fullName && (
              <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                {errors.fullName}
              </span>
            )}
          </div>

          {/* ID */}
          <div className="form-group">
            <label className="form-label">
              <span className="label-icon">🆔</span>
              Corporate ID / NIP
            </label>
            <input
              type="text"
              className="form-input"
              name="corporateIdNip"
              value={formData.corporateIdNip}
              onChange={handleChange}
              placeholder="Enter your corporate ID or NIP"
              disabled={isSubmitting}
            />
            {errors.corporateIdNip && (
              <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                {errors.corporateIdNip}
              </span>
            )}
          </div>

          {/* Directorate */}
          <div className="form-group">
            <label className="form-label">
              <span className="label-icon">🏢</span>
              Directorate
            </label>
            <select
              className="form-select"
              name="directorate"
              value={formData.directorate}
              onChange={handleChange}
              disabled={isSubmitting}
            >
              <option value="">-- Select Directorate --</option>
              <option value="IT">IT Directorate</option>
              <option value="HR">HR Directorate</option>
              <option value="Finance">Finance Directorate</option>
              <option value="Operations">Operations Directorate</option>
              <option value="Sales">Sales Directorate</option>
            </select>
            {errors.directorate && (
              <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                {errors.directorate}
              </span>
            )}
          </div>

          {/* Invitation Code */}
          <div className="form-group">
            <label className="form-label">
              <span className="label-icon">🔐</span>
              Invitation Code
            </label>
            <input
              type="text"
              className="form-input"
              name="invitationCode"
              value={formData.invitationCode}
              onChange={handleChange}
              placeholder="Enter your invitation code"
              disabled={isSubmitting}
            />
            {errors.invitationCode && (
              <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                {errors.invitationCode}
              </span>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="form-button"
            disabled={isSubmitting}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {isSubmitting ? (
              <>
                <span className="loader"></span>
                Processing...
              </>
            ) : (
              <>
                <span>✓</span>
                Enter Auction
              </>
            )}
          </button>
        </form>

        <div
          style={{
            marginTop: '24px',
            paddingTop: '20px',
            borderTop: '1px solid #e5e7eb',
            fontSize: '12px',
            color: '#6b7280',
            textAlign: 'center',
            lineHeight: '1.6',
          }}
        >
          <p>Your data will be stored in browser session for security.</p>
          <p>Session will expire after 30 minutes of inactivity.</p>
        </div>
      </div>
    </div>
  );
}
