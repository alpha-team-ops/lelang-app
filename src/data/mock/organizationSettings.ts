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
  logo: 'https://via.placeholder.com/200',
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
