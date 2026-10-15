import type { User } from '../types'

export const demoUsers: User[] = [
  {
    id: 'driver-nicha', name: 'Nicha S.', initials: 'NS', gender: 'female', role: 'driver',
    phoneVerified: true, identityVerified: true, driverVerified: true, vehicleVerified: true,
    vehicleName: 'Toyota Yaris', vehiclePlateMasked: '•••• 1234', accent: '#7165E8',
  },
  {
    id: 'driver-arin', name: 'Arin K.', initials: 'AK', gender: 'male', role: 'driver',
    phoneVerified: true, identityVerified: true, driverVerified: true, vehicleVerified: true,
    vehicleName: 'Honda City', vehiclePlateMasked: '•••• 8062', accent: '#E06A48',
  },
  {
    id: 'driver-mali', name: 'Mali P.', initials: 'MP', gender: 'female', role: 'driver',
    phoneVerified: true, identityVerified: true, driverVerified: true, vehicleVerified: true,
    vehicleName: 'Nissan Kicks', vehiclePlateMasked: '•••• 4910', accent: '#0F9F78',
  },
  {
    id: 'driver-krit', name: 'Krit T.', initials: 'KT', gender: 'male', role: 'driver',
    phoneVerified: true, identityVerified: true, driverVerified: true, vehicleVerified: true,
    vehicleName: 'Mazda 2', vehiclePlateMasked: '•••• 2771', accent: '#1677FF',
  },
  {
    id: 'passenger-pim', name: 'Pim L.', initials: 'PL', gender: 'female', role: 'passenger',
    phoneVerified: true, identityVerified: true, driverVerified: false, vehicleVerified: false,
    accent: '#F1A33C',
  },
]

export const getUser = (id: string) => demoUsers.find((user) => user.id === id) ?? demoUsers[0]
