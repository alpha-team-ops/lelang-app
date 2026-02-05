export interface OrganizationSettings {
  organizationCode: string;
  name: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  city: string;
  country: string;
  logo: string;
  description: string;
  timezone: string;
  currency: string;
  language: string;
  emailNotifications: boolean;
  auctionNotifications: boolean;
  bidNotifications: boolean;
  twoFactorAuth: boolean;
  maintenanceMode: boolean;
}

export const mockOrganizationSettings: OrganizationSettings = {
  organizationCode: 'ORG-DERALY-001',
  name: 'Deraly Lelang',
  email: 'contact@deraly.id',
  phone: '+62-812-3456-7890',
  website: 'https://deraly.id',
  address: 'Jl. Merdeka No. 123',
  city: 'Jakarta',
  country: 'Indonesia',
  logo: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22 viewBox=%220 0 200 200%22%3E%3Crect fill=%22%23667eea%22 width=%22200%22 height=%22200%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 font-size=%2228%22 font-weight=%22bold%22 fill=%22white%22 text-anchor=%22middle%22 dy=%22.3em%22%3EDERALY%3C/text%3E%3C/svg%3E',
  description: 'Platform lelang online terpercaya untuk berbagai kategori barang',
  timezone: 'Asia/Jakarta',
  currency: 'IDR',
  language: 'id',
  emailNotifications: true,
  auctionNotifications: true,
  bidNotifications: true,
  twoFactorAuth: false,
  maintenanceMode: false,
};
