import { useState } from 'react'
import { apiEndpoints } from '../config/env'

interface Barang {
  id: string
  nama: string
  kategori: string
  kondisi: string
  hargaAwal: number
  hargaSaatIni: number
  sisaWaktu: string
  peserta: number
  deskripsi: string
}

interface AuctionModalProps {
  barang: Barang | null
  isOpen: boolean
  onClose: () => void
  onSubmit: (hargaTawar: number) => void
}

export function AuctionModal({ barang, isOpen, onClose, onSubmit }: AuctionModalProps) {
  const [hargaTawar, setHargaTawar] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  if (!barang || !isOpen) return null

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(angka)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!hargaTawar) {
      setError('Masukkan harga penawaran')
      return
    }

    const harga = parseFloat(hargaTawar)
    if (isNaN(harga)) {
      setError('Harga tidak valid')
      return
    }

    if (harga <= barang.hargaSaatIni) {
      setError(`Harga tawar harus lebih tinggi dari ${formatRupiah(barang.hargaSaatIni)}`)
      return
    }

    if (harga < minimalHarga) {
      setError(`Harga minimal adalah ${formatRupiah(minimalHarga)}`)
      return
    }

    // Validasi harga harus kelipatan 50000
    if (harga % 50000 !== 0) {
      setError('Harga harus kelipatan Rp50.000')
      return
    }

    setLoading(true)

    // Submit ke API
    const token = sessionStorage.getItem('authToken')
    if (!token) {
      setError('Token tidak ditemukan. Silakan login terlebih dahulu.')
      setLoading(false)
      return
    }

    fetch(apiEndpoints.submitBidding, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        barangId: barang.id,
        hargaTawar: harga,
      }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          console.log('✓ Penawaran berhasil dikirim:', data)
          alert('Penawaran Anda berhasil dikirim!')
          setHargaTawar('')
          setLoading(false)
          onSubmit(harga)
          onClose()
        } else {
          throw new Error(data.error || 'Penawaran gagal')
        }
      })
      .catch(err => {
        console.error('❌ Error submit bidding:', err)
        setError(`Gagal mengirim penawaran: ${err.message}`)
        setLoading(false)
      })
  }

  const handleClose = () => {
    setHargaTawar('')
    setError('')
    onClose()
  }

  const minimalHarga = Math.ceil((barang.hargaSaatIni + 50000) / 50000) * 50000

  return (
    <>
      {/* Backdrop */}
      <div className="modal-backdrop" onClick={handleClose} />
      
      {/* Modal */}
      <div className="auction-modal">
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">📋 Form Penawaran Lelang</h2>
          <button className="modal-close" onClick={handleClose}>✕</button>
        </div>

        {/* Content */}
        <div className="modal-content">
          {/* Barang Info */}
          <div className="barang-detail">
            <h3 className="detail-title">{barang.nama}</h3>
            
            <div className="detail-info">
              <div className="info-row">
                <span className="info-label">Kategori</span>
                <span className="info-value">{barang.kategori}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Kondisi</span>
                <span className="info-value kondisi">{barang.kondisi}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Harga Awal</span>
                <span className="info-value">{formatRupiah(barang.hargaAwal)}</span>
              </div>
              <div className="info-row highlight">
                <span className="info-label">Harga Saat Ini</span>
                <span className="info-value current-price">{formatRupiah(barang.hargaSaatIni)}</span>
              </div>
            </div>

            {/* Deskripsi */}
            <div className="detail-description">
              <h4 className="description-title">Deskripsi Barang</h4>
              <p className="description-text">{barang.deskripsi}</p>
            </div>

            <div className="detail-stats">
              <div className="stat">
                <span className="stat-icon">⏱️</span>
                <div>
                  <div className="stat-label">Sisa Waktu</div>
                  <div className="stat-value">{barang.sisaWaktu}</div>
                </div>
              </div>
              <div className="stat">
                <span className="stat-icon">👥</span>
                <div>
                  <div className="stat-label">Peserta</div>
                  <div className="stat-value">{barang.peserta} orang</div>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="modal-divider" />

          {/* Form */}
          <form onSubmit={handleSubmit} className="modal-form">
            <div className="form-group">
              <label htmlFor="hargaTawar" className="form-label">
                💰 Harga Penawaran
              </label>
              <div className="input-wrapper">
                <span className="currency">Rp</span>
                <input
                  type="number"
                  id="hargaTawar"
                  placeholder={minimalHarga.toLocaleString('id-ID')}
                  value={hargaTawar}
                  onChange={(e) => setHargaTawar(e.target.value)}
                  min={minimalHarga}
                  step="50000"
                  className="form-input modal-input"
                />
              </div>
              <p className="help-text">
                Minimal: {formatRupiah(minimalHarga)} • Kelipatan: Rp50.000
              </p>
              {error && <p className="error-text">{error}</p>}
            </div>

            <button
              type="submit"
              className="submit-button modal-submit"
              disabled={loading}
            >
              {loading ? '⏳ Memproses...' : '✓ Kirim Penawaran'}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
