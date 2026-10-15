import type { Location } from '../types'

export const LOCATIONS: Location[] = [
  { name: 'Chulalongkorn University, Pathum Wan', shortName: 'Chulalongkorn University', lat: 13.7384, lng: 100.5321, placeId: 'demo-chula' },
  { name: 'Future Park Rangsit, Pathum Thani', shortName: 'Future Park Rangsit', lat: 13.9892, lng: 100.6183, placeId: 'demo-future-park' },
  { name: 'Samyan Mitrtown, Pathum Wan', shortName: 'Samyan Mitrtown', lat: 13.7333, lng: 100.5281, placeId: 'demo-samyan' },
  { name: 'Kasetsart University, Bang Khen', shortName: 'Kasetsart University', lat: 13.8476, lng: 100.5696, placeId: 'demo-kasetsart' },
  { name: 'Siam Square, Pathum Wan', shortName: 'Siam Square', lat: 13.7466, lng: 100.5347, placeId: 'demo-siam' },
  { name: 'Thammasat University Rangsit', shortName: 'Thammasat Rangsit', lat: 14.0744, lng: 100.6008, placeId: 'demo-tu-rangsit' },
  { name: 'Ari, Phaya Thai', shortName: 'Ari', lat: 13.7798, lng: 100.5447, placeId: 'demo-ari' },
  { name: 'Bang Na, Bangkok', shortName: 'Bang Na', lat: 13.6682, lng: 100.6046, placeId: 'demo-bangna' },
  { name: 'Chonburi City', shortName: 'Chonburi', lat: 13.3611, lng: 100.9847, placeId: 'demo-chonburi' },
]

export const locationById = (id: string) => LOCATIONS.find((location) => location.placeId === id) ?? LOCATIONS[0]
