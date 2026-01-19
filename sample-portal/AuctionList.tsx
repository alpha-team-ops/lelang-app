import { useState, useEffect } from 'react'
import { AuctionModal } from './AuctionModal'
import { ImageModal } from './ImageModal'
import { useAuctions } from '../hooks/useAuctions'
import { getSessionRemainingTime, formatRemainingTime, clearUserSession } from '../utils/sessionManager'

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
  gambar?: string
}

interface AuctionListProps {
  userData: {
    namaLengkap: string
    idNip: string
    direktorat: string
    organisasiCode: string
  }
  onBack: () => void
}

// Dummy data barang lelang
const dummyBarang: Barang[] = [
  {
    id: '1',
    nama: 'Laptop HP ProBook 450',
    kategori: 'Elektronik',
    kondisi: 'Baik',
    hargaAwal: 5000000,
    hargaSaatIni: 6500000,
    sisaWaktu: '2 hari 4 jam',
    peserta: 8,
    deskripsi: 'Laptop HP ProBook 450 dengan spesifikasi Intel Core i7, RAM 16GB, SSD 512GB. Layar 15.6 inch Full HD, baterai awet hingga 8 jam. Kondisi prima, jarang digunakan. Cocok untuk profesional dan editing ringan.',
  },
  {
    id: '2',
    nama: 'Meja Kantor Kayu Jati',
    kategori: 'Furniture',
    kondisi: 'Baik',
    hargaAwal: 2000000,
    hargaSaatIni: 2300000,
    sisaWaktu: '1 hari 6 jam',
    peserta: 5,
    deskripsi: 'Meja kantor minimalis dari kayu jati berkualitas tinggi. Ukuran 120x60cm dengan laci penyimpanan. Desain elegan dan kokoh, sudah teruji bertahun-tahun. Material solid wood tanpa cat berbahaya.',
  },
  {
    id: '3',
    nama: 'Printer Canon ImageRunner',
    kategori: 'Peralatan Kantor',
    kondisi: 'Sangat Baik',
    hargaAwal: 8000000,
    hargaSaatIni: 9200000,
    sisaWaktu: '3 hari 2 jam',
    peserta: 12,
    deskripsi: 'Printer multifungsi Canon ImageRunner dengan teknologi print, copy, scan dan fax. Kecepatan cetak hingga 50 ppm, kapasitas kertas 1000 lembar. Cocok untuk departemen dengan volume tinggi. Unit terawat dengan baik.',
  },
  {
    id: '4',
    nama: 'AC Panasonic 2 PK',
    kategori: 'Elektronik',
    kondisi: 'Baik',
    hargaAwal: 3500000,
    hargaSaatIni: 4100000,
    sisaWaktu: '5 jam 30 menit',
    peserta: 3,
    deskripsi: 'AC Panasonic 2 PK dengan teknologi Inverter hemat energi. Pendingin ruangan hingga 25m². Remote digital dengan display LED. Sudah diservis rutin, unit original bergaransi resmi.',
  },
  {
    id: '5',
    nama: 'Rak Penyimpanan Besi',
    kategori: 'Furniture',
    kondisi: 'Baik',
    hargaAwal: 1500000,
    hargaSaatIni: 1750000,
    sisaWaktu: '4 hari 1 jam',
    peserta: 6,
    deskripsi: 'Rak penyimpanan industrial dari besi berkualitas tinggi. 5 tingkat, kapasitas beban hingga 100kg per tingkat. Dimensi 90x40x150cm. Cocok untuk penyimpanan kantor maupun gudang. Desain fungsional dan tahan lama.',
  },
  {
    id: '6',
    nama: 'Monitor LED LG 24 Inch',
    kategori: 'Elektronik',
    kondisi: 'Baik',
    hargaAwal: 1200000,
    hargaSaatIni: 1400000,
    sisaWaktu: '1 hari 12 jam',
    peserta: 4,
    deskripsi: 'Monitor LG 24 inch Full HD IPS dengan resolusi 1920x1080. Panel IPS memberikan sudut pandang lebar dan warna akurat. Response time 5ms, cocok untuk design dan editing. Kondisi normal tanpa dead pixel.',
  },
]

export function AuctionList({ userData, onBack }: AuctionListProps) {
  const { data: barangList, loading, error, isUsingDummyData } = useAuctions()
  const [selectedBarang, setSelectedBarang] = useState<Barang | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<{ placeholder: string; nama: string } | null>(null)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const [sessionRemaining, setSessionRemaining] = useState<string>('')

  // Update remaining session time setiap detik
  useEffect(() => {
    const updateSessionTime = () => {
      const remaining = getSessionRemainingTime()
      if (remaining !== null) {
        setSessionRemaining(formatRemainingTime(remaining))
      }
    }

    updateSessionTime() // Initial update
    const interval = setInterval(updateSessionTime, 1000)
    return () => clearInterval(interval)
  }, [])

  const handleLogout = () => {
    clearUserSession()
    onBack() // Kembali ke portal form
  }

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(angka)
  }

  const handleTawar = (barang: Barang) => {
    setSelectedBarang(barang)
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedBarang(null)
  }

  const handleModalSubmit = (hargaTawar: number) => {
    console.log('Penawaran:', {
      barang: selectedBarang?.nama,
      hargaTawar: hargaTawar,
      user: userData.namaLengkap,
    })
    // TODO: Kirim ke API nanti
  }

  const handleImageClick = (barang: Barang) => {
    const placeholder = barang.kategori === 'Elektronik' ? '🖥️'
      : barang.kategori === 'Furniture' ? '🪑'
      : '🖨️'
    setSelectedImage({
      placeholder,
      nama: barang.nama,
    })
    setIsImageModalOpen(true)
  }

  const handleImageModalClose = () => {
    setIsImageModalOpen(false)
    setSelectedImage(null)
  }

  return (
    <div className="auction-container">
      {/* Header */}
      <div className="auction-header">
        <button onClick={onBack} className="back-button">
          ← Kembali
        </button>
        <div className="user-info">
          <h2>Selamat Datang, {userData.namaLengkap}</h2>
          <p>{userData.direktorat} • ID: {userData.idNip}</p>
        </div>
        {/* Session Info */}
        <div className="session-info">
          {sessionRemaining && (
            <>
              <span className="session-timer">⏱️ Sesi: {sessionRemaining}</span>
              <button onClick={handleLogout} className="logout-button">Logout</button>
            </>
          )}
        </div>
      </div>

      {/* Title */}
      <div className="auction-title-section">
        <h1>📦 Daftar Barang Lelang</h1>
        <p>Pilih barang yang ingin Anda tawar</p>
        {isUsingDummyData && (
          <div className="data-status-warning">
            ⚠️ Menampilkan data dummy (API tidak tersedia)
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Memuat data barang lelang...</p>
        </div>
      )}

      {/* Barang List */}
      {!loading && (
        <div className="barang-grid">
          {barangList.map((barang) => (
          <div key={barang.id} className="barang-card">
            <div className="barang-image" onClick={() => handleImageClick(barang)}>
              <div className="image-placeholder">
                {barang.kategori === 'Elektronik' && '🖥️'}
                {barang.kategori === 'Furniture' && '🪑'}
                {barang.kategori === 'Peralatan Kantor' && '🖨️'}
              </div>
            </div>

            <div className="barang-content">
              <h3 className="barang-nama">{barang.nama}</h3>
              
              <div className="barang-info">
                <span className="kategori-badge">{barang.kategori}</span>
                <span className="kondisi-badge">{barang.kondisi}</span>
              </div>

              <div className="barang-harga">
                <div className="harga-row">
                  <span className="label">Harga Awal:</span>
                  <span className="harga-awal">{formatRupiah(barang.hargaAwal)}</span>
                </div>
                <div className="harga-row highlight">
                  <span className="label">Harga Saat Ini:</span>
                  <span className="harga-saat-ini">{formatRupiah(barang.hargaSaatIni)}</span>
                </div>
              </div>

              <div className="barang-stats">
                <div className="stat">
                  <span className="stat-label">Sisa Waktu</span>
                  <span className="stat-value">⏱️ {barang.sisaWaktu}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Peserta</span>
                  <span className="stat-value">👥 {barang.peserta}</span>
                </div>
              </div>

              <button className="tawar-button" onClick={() => handleTawar(barang)}>Tawar Sekarang</button>
            </div>
          </div>
        ))}
        </div>
      )}
      <AuctionModal
        barang={selectedBarang}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
      />

      {/* Image Modal */}
      <ImageModal
        imagePlaceholder={selectedImage?.placeholder || ''}
        barangNama={selectedImage?.nama || ''}
        isOpen={isImageModalOpen}
        onClose={handleImageModalClose}
      />
    </div>
  )
}
