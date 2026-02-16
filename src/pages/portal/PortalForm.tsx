import { useState, useEffect } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import portalAuthService from '../../data/services/portalAuthService';
import type { PortalDirectorate, PortalOrganization } from '../../data/services/portalAuthService';
import { saveUserSession, savePortalCodePersistent, getPortalCodePersistent } from './utils/sessionManager';
import './styles/portal.css';

interface FormData {
  fullName: string;
  corporateIdNip: string;
  directoriateId: string;
  portalCode: string;
}

interface FormErrors {
  fullName?: string;
  corporateIdNip?: string;
  directoriateId?: string;
  portalCode?: string;
}

export default function PortalForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    corporateIdNip: '',
    directoriateId: '',
    portalCode: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string>('');
  const [directorates, setDirectorates] = useState<PortalDirectorate[]>([]);
  const [loadingDirectorates, setLoadingDirectorates] = useState(true);
  const [organizationInfo, setOrganizationInfo] = useState<PortalOrganization | null>(null);
  const [organizationError, setOrganizationError] = useState<string>('');

  // Fetch organization info, directorates, and auto-fill portal code from URL or localStorage
  useEffect(() => {
    const portalCodeFromUrl = searchParams.get('portalCode') || searchParams.get('invitationCode');
    const portalCodeFromStorage = getPortalCodePersistent();
    const portalCode = portalCodeFromUrl || portalCodeFromStorage;

    const fetchData = async () => {
      try {
        if (!portalCode) {
          setLoadingDirectorates(false);
          return;
        }

        // Fetch organization info
        try {
          const orgData = await portalAuthService.getOrganizationInfo(portalCode);
          setOrganizationInfo(orgData);
          setOrganizationError('');
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'Failed to fetch organization info';
          console.error('Error fetching organization info:', err);
          setOrganizationError(errorMsg);
        }

        // Fetch directorates
        try {
          const dirsData = await portalAuthService.getDirectorates(portalCode);
          setDirectorates(dirsData);
        } catch (err) {
          console.error('Failed to fetch directorates:', err);
        }

        // Auto-fill portal code
        setFormData((prev) => ({
          ...prev,
          portalCode: portalCode,
        }));
      } finally {
        setLoadingDirectorates(false);
      }
    };

    fetchData();
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

    // Full Name is optional per spec
    // if (!formData.fullName.trim()) {
    //   newErrors.fullName = 'Full name is required';
    // }

    if (!formData.corporateIdNip.trim()) {
      newErrors.corporateIdNip = 'Corporate ID / NIP is required';
    }

    // Directorate is optional per spec
    // if (!formData.directoriateId.trim()) {
    //   newErrors.directoriateId = 'Directorate is required';
    // }

    if (!formData.portalCode.trim()) {
      newErrors.portalCode = 'Portal code is required';
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
      // Call portal login API with new spec
      const response = await portalAuthService.login({
        corporateIdNip: formData.corporateIdNip,
        portalCode: formData.portalCode,
        fullName: formData.fullName || undefined,
        directoriateId: formData.directoriateId || undefined,
      });

      // Get accessLevel from top level response (per spec: Skenario 1 & 2)
      const accessLevel = (response as any).accessLevel || 'FULL';

      // Save portal session to sessionStorage using the correct format
      const sessionData = {
        fullName: response.data.user.fullName,
        corporateIdNip: response.data.user.corporateIdNip,
        directorate: response.data.user.directorate,
        invitationCode: formData.portalCode,
        timestamp: Date.now(),
        portalToken: response.data.portalToken, // Can be null for VIEW_ONLY
        userId: response.data.user.id, // Can be null for VIEW_ONLY
        accessLevel: accessLevel,
      };
      
      saveUserSession(sessionData);

      // Save portal code persistently (24 hours)
      savePortalCodePersistent(formData.portalCode);
      
      // Save to localStorage for other uses
      localStorage.setItem('accessLevel', accessLevel);
      
      // Save portalToken to localStorage if FULL access (for use in other tabs)
      if (response.data.portalToken) {
        localStorage.setItem('portalToken', response.data.portalToken);
      } else {
        localStorage.removeItem('portalToken');
      }

      // Navigate to auction list (works for both FULL and VIEW_ONLY)
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
        {organizationError && (
          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '12px', marginBottom: '16px', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: '14px', color: '#991b1b', fontWeight: '500' }}>
              ⚠️ Error: {organizationError}
            </p>
          </div>
        )}
        {organizationInfo && (
          <div style={{ backgroundColor: '#f0f9ff', border: '1px solid #0ea5e9', borderRadius: '8px', padding: '12px', marginBottom: '16px', textAlign: 'center' }}>
            <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#0369a1' }}>Organization</p>
            <p style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1e40af' }}>
              {organizationInfo.organizationName}
            </p>
            {organizationInfo.description && (
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#0369a1' }}>
                {organizationInfo.description}
              </p>
            )}
          </div>
        )}
        <p className="portal-subtitle">Enter your information to start participating in auctions</p>

        {apiError && (
          <div style={{ background: '#fee2e2', color: '#991b1b', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', fontWeight: '500', textAlign: 'center' }}>
            ❌ {apiError}
          </div>
        )}

        <form className="form" onSubmit={handleSubmit}>
          {/* Full Name - Optional */}
          <div className="form-group">
            <label className="form-label">
              <span className="label-icon">👤</span>
              Full Name <span style={{ color: '#999', fontSize: '12px' }}>(Optional)</span>
            </label>
            <input
              type="text"
              className="form-input"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Enter your full name (optional)"
              disabled={isSubmitting}
            />
            {errors.fullName && (
              <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                {errors.fullName}
              </span>
            )}
          </div>

          {/* Corporate ID / NIP - Required */}
          <div className="form-group">
            <label className="form-label">
              <span className="label-icon">🆔</span>
              Corporate ID / NIP <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              type="text"
              className="form-input"
              name="corporateIdNip"
              value={formData.corporateIdNip}
              onChange={handleChange}
              placeholder="Enter your NIP"
              disabled={isSubmitting}
              required
            />
            {errors.corporateIdNip && (
              <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                {errors.corporateIdNip}
              </span>
            )}
          </div>

          {/* Directorate - Optional, fetched from API */}
          <div className="form-group">
            <label className="form-label">
              <span className="label-icon">🏢</span>
              Directorate <span style={{ color: '#999', fontSize: '12px' }}>(Optional)</span>
            </label>
            <select
              className="form-select"
              name="directoriateId"
              value={formData.directoriateId}
              onChange={handleChange}
              disabled={isSubmitting || loadingDirectorates}
            >
              <option value="">-- Select Directorate --</option>
              {directorates.map((dir) => (
                <option key={dir.id} value={dir.id}>
                  {dir.name}
                </option>
              ))}
            </select>
            {errors.directoriateId && (
              <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                {errors.directoriateId}
              </span>
            )}
          </div>

          {/* Portal Code - Required */}
          <div className="form-group">
            <label className="form-label">
              <span className="label-icon">🔐</span>
              Portal Code <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              type="text"
              className="form-input"
              name="portalCode"
              value={formData.portalCode}
              onChange={handleChange}
              placeholder="Enter your portal code"
              disabled={isSubmitting}
              required
            />
            {errors.portalCode && (
              <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                {errors.portalCode}
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
