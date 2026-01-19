import { useState } from 'react'
import { apiEndpoints } from '../config/env'
import { saveUserSession } from '../utils/sessionManager'
import { logAPICall } from '../utils/apiDebug'

interface FormData {
  namaLengkap: string
  idNip: string
  direktorat: string
  organisasiCode: string
}

interface PortalFormProps {
  onSubmit: (data: FormData) => void
}

export function PortalForm({ onSubmit }: PortalFormProps) {
  const [formData, setFormData] = useState<FormData>({
    namaLengkap: '',
    idNip: '',
    direktorat: '',
    organisasiCode: '',
  })

  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    // Validation
    if (!formData.namaLengkap || !formData.idNip || !formData.direktorat || !formData.organisasiCode) {
      alert('Semua field harus diisi!')
      return
    }

    // Skip API, save langsung ke sessionStorage (dummy auth)
    console.log('✓ Portal form submitted (dummy mode)')
    
    // Set dummy token
    sessionStorage.setItem('authToken', 'dummy-token-' + Date.now())
    sessionStorage.setItem('userId', 'user-' + Math.random().toString(36).substr(2, 9))
    
    // Simpan session
    saveUserSession({
      namaLengkap: formData.namaLengkap,
      idNip: formData.idNip,
      direktorat: formData.direktorat,
      organisasiCode: formData.organisasiCode,
      timestamp: Date.now(),
    })
    
    onSubmit(formData)
  }

  return (
    <div className="portal-wrapper">
      <div className="portal-card">
        {/* Icon */}
        <div className="icon-container">
          <div className="icon">📦</div>
        </div>

        {/* Title */}
        <h1 className="portal-title">Portal Lelang Barang Kantor</h1>
        
        {/* Subtitle */}
        <p className="portal-subtitle">Masukkan data Anda untuk mulai melakukan penaawaran</p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="form">
          {/* Full Name */}
          <div className="form-group">
            <label htmlFor="namaLengkap" className="form-label">
              <span className="label-icon">👤</span> Nama Lengkap
            </label>
            <input
              type="text"
              id="namaLengkap"
              name="namaLengkap"
              placeholder="Falah"
              value={formData.namaLengkap}
              onChange={handleChange}
              className="form-input"
            />
          </div>

          {/* ID / NIP */}
          <div className="form-group">
            <label htmlFor="idNip" className="form-label">
              <span className="label-icon">🔢</span> ID / NIP
            </label>
            <input
              type="text"
              id="idNip"
              name="idNip"
              placeholder="728282"
              value={formData.idNip}
              onChange={handleChange}
              className="form-input"
            />
          </div>

          {/* Directorate / Division */}
          <div className="form-group">
            <label htmlFor="direktorat" className="form-label">
              <span className="label-icon">🏢</span> Direktorat / Bagian
            </label>
            <input
              type="text"
              id="direktorat"
              name="direktorat"
              placeholder="Infra"
              value={formData.direktorat}
              onChange={handleChange}
              className="form-input"
            />
          </div>

{/* Organization Code */}
            <div className="form-group">
              <label htmlFor="organisasiCode" className="form-label">
                <span className="label-icon">🏛️</span> Organisasi Code
              </label>
              <input
                type="text"
                id="organisasiCode"
                name="organisasiCode"
                placeholder="ORG-001"
                value={formData.organisasiCode}
              onChange={handleChange}
              className="form-input"
            />
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            className="submit-button"
            disabled={loading}
          >
            {loading ? 'Memproses...' : 'Lanjut ke Daftar Lelang →'}
          </button>
        </form>

        {/* Privacy Notice */}
        <div className="privacy-notice">
          <span className="privacy-icon">📋</span>
          <p>Data Anda akan disimpan untuk mencatat setiap penaawaran yang Anda lakukan</p>
        </div>
      </div>
    </div>
  )
}
