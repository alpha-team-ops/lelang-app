import { useState } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveUserSession } from './utils/sessionManager';
import './styles/portal.css';

interface FormData {
  namaLengkap: string;
  idNip: string;
  direktorat: string;
  organisasiCode: string;
}

interface FormErrors {
  namaLengkap?: string;
  idNip?: string;
  direktorat?: string;
  organisasiCode?: string;
}

export default function PortalForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    namaLengkap: '',
    idNip: '',
    direktorat: '',
    organisasiCode: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    if (!formData.namaLengkap.trim()) {
      newErrors.namaLengkap = 'Nama lengkap harus diisi';
    }

    if (!formData.idNip.trim()) {
      newErrors.idNip = 'ID/NIP harus diisi';
    }

    if (!formData.direktorat.trim()) {
      newErrors.direktorat = 'Direktorat harus diisi';
    }

    if (!formData.organisasiCode.trim()) {
      newErrors.organisasiCode = 'Organisasi Code harus diisi';
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

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Save session data
      saveUserSession({
        namaLengkap: formData.namaLengkap,
        idNip: formData.idNip,
        direktorat: formData.direktorat,
        organisasiCode: formData.organisasiCode,
        timestamp: Date.now(),
      });

      // Navigate to auction list
      navigate('/portal/auctions');
    } catch (error) {
      console.error('Login error:', error);
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
        <h1 className="portal-title">Portal Lelang</h1>
        <p className="portal-subtitle">Masukkan data Anda untuk mulai mengikuti lelang</p>

        <form className="form" onSubmit={handleSubmit}>
          {/* Nama Lengkap */}
          <div className="form-group">
            <label className="form-label">
              <span className="label-icon">👤</span>
              Nama Lengkap
            </label>
            <input
              type="text"
              className="form-input"
              name="namaLengkap"
              value={formData.namaLengkap}
              onChange={handleChange}
              placeholder="Masukkan nama lengkap Anda"
              disabled={isSubmitting}
            />
            {errors.namaLengkap && (
              <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                {errors.namaLengkap}
              </span>
            )}
          </div>

          {/* ID/NIP */}
          <div className="form-group">
            <label className="form-label">
              <span className="label-icon">🆔</span>
              ID/NIP
            </label>
            <input
              type="text"
              className="form-input"
              name="idNip"
              value={formData.idNip}
              onChange={handleChange}
              placeholder="Masukkan ID atau NIP Anda"
              disabled={isSubmitting}
            />
            {errors.idNip && (
              <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                {errors.idNip}
              </span>
            )}
          </div>

          {/* Direktorat */}
          <div className="form-group">
            <label className="form-label">
              <span className="label-icon">🏢</span>
              Direktorat
            </label>
            <select
              className="form-select"
              name="direktorat"
              value={formData.direktorat}
              onChange={handleChange}
              disabled={isSubmitting}
            >
              <option value="">-- Pilih Direktorat --</option>
              <option value="IT">Direktorat IT</option>
              <option value="HR">Direktorat HR</option>
              <option value="Finance">Direktorat Finance</option>
              <option value="Operations">Direktorat Operations</option>
              <option value="Sales">Direktorat Sales</option>
            </select>
            {errors.direktorat && (
              <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                {errors.direktorat}
              </span>
            )}
          </div>

          {/* Organisasi Code */}
          <div className="form-group">
            <label className="form-label">
              <span className="label-icon">📋</span>
              Organisasi Code
            </label>
            <input
              type="text"
              className="form-input"
              name="organisasiCode"
              value={formData.organisasiCode}
              onChange={handleChange}
              placeholder="e.g., ORG-001"
              disabled={isSubmitting}
            />
            {errors.organisasiCode && (
              <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                {errors.organisasiCode}
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
                Memproses...
              </>
            ) : (
              <>
                <span>✓</span>
                Masuk Ke Lelang
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
          <p>Data Anda akan disimpan dalam sesi browser untuk keamanan.</p>
          <p>Sesi akan kadaluarsa setelah 30 menit tidak ada aktivitas.</p>
        </div>
      </div>
    </div>
  );
}
