
import { Mission, Route } from '@/types/lunar';

export const LUNAR_MISSIONS: Mission[] = [
  {
    id: 'apollo-11',
    name: 'Apollo 11',
    year: 1969,
    agency: 'NASA',
    type: 'Manned',
    coordinates: { lat: 0.6741, lng: 23.4730 },
    description: 'First manned moon landing. Tranquility Base.'
  },
  {
    id: 'luna-2',
    name: 'Luna 2',
    year: 1959,
    agency: 'USSR',
    type: 'Impactor',
    coordinates: { lat: 29.1, lng: 0.0 },
    description: 'First spacecraft to reach the surface of the Moon.'
  },
  {
    id: 'change-4',
    name: 'Chang\'e 4',
    year: 2019,
    agency: 'CNSA',
    type: 'Rover',
    coordinates: { lat: -45.4561, lng: 177.5885 },
    description: 'First soft landing on the far side of the Moon.'
  },
  {
    id: 'apollo-17',
    name: 'Apollo 17',
    year: 1972,
    agency: 'NASA',
    type: 'Manned',
    coordinates: { lat: 20.1908, lng: 30.7717 },
    description: 'Final mission of the Apollo program. Taurus-Littrow.'
  }
];

export const LUNAR_CRATERS = [
  { name: 'Tycho', lat: -43.3, lng: -11.2 },
  { name: 'Copernicus', lat: 9.7, lng: -20.0 },
  { name: 'Aristarchus', lat: 23.7, lng: -47.4 },
  { name: 'Plato', lat: 51.6, lng: -9.4 },
  { name: 'Shackleton', lat: -89.9, lng: 0.0 }
];
