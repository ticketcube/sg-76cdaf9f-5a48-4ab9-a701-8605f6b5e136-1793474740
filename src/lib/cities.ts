// Major world cities for mood map plotting
// Used when listener count is too low for the listener map to show city-level detail
export interface CityCoords {
  city: string;
  country: string;
  lat: number;
  lng: number;
}

export const MAJOR_CITIES: CityCoords[] = [
  // United States
  { city: "Los Angeles", country: "United States", lat: 34.05, lng: -118.24 },
  { city: "New York", country: "United States", lat: 40.71, lng: -74.01 },
  { city: "Chicago", country: "United States", lat: 41.88, lng: -87.63 },
  { city: "Houston", country: "United States", lat: 29.76, lng: -95.37 },
  { city: "Phoenix", country: "United States", lat: 33.45, lng: -112.07 },
  { city: "Philadelphia", country: "United States", lat: 39.95, lng: -75.17 },
  { city: "San Antonio", country: "United States", lat: 29.42, lng: -98.49 },
  { city: "San Diego", country: "United States", lat: 32.72, lng: -117.16 },
  { city: "Dallas", country: "United States", lat: 32.78, lng: -96.80 },
  { city: "San Jose", country: "United States", lat: 37.34, lng: -121.89 },
  { city: "Austin", country: "United States", lat: 30.27, lng: -97.74 },
  { city: "Jacksonville", country: "United States", lat: 30.33, lng: -81.66 },
  { city: "San Francisco", country: "United States", lat: 37.77, lng: -122.42 },
  { city: "Columbus", country: "United States", lat: 39.96, lng: -82.99 },
  { city: "Fort Worth", country: "United States", lat: 32.76, lng: -97.33 },
  { city: "Indianapolis", country: "United States", lat: 39.77, lng: -86.16 },
  { city: "Charlotte", country: "United States", lat: 35.23, lng: -80.84 },
  { city: "Seattle", country: "United States", lat: 47.61, lng: -122.33 },
  { city: "Denver", country: "United States", lat: 39.74, lng: -104.99 },
  { city: "Washington", country: "United States", lat: 38.91, lng: -77.04 },
  { city: "Boston", country: "United States", lat: 42.36, lng: -71.06 },
  { city: "Nashville", country: "United States", lat: 36.16, lng: -86.78 },
  { city: "Detroit", country: "United States", lat: 42.33, lng: -83.05 },
  { city: "Portland", country: "United States", lat: 45.52, lng: -122.68 },
  { city: "Las Vegas", country: "United States", lat: 36.17, lng: -115.14 },
  { city: "Memphis", country: "United States", lat: 35.15, lng: -90.05 },
  { city: "Atlanta", country: "United States", lat: 33.75, lng: -84.39 },
  { city: "Miami", country: "United States", lat: 25.76, lng: -80.19 },
  
  // Canada
  { city: "Toronto", country: "Canada", lat: 43.65, lng: -79.38 },
  { city: "Montreal", country: "Canada", lat: 45.50, lng: -73.57 },
  { city: "Vancouver", country: "Canada", lat: 49.28, lng: -123.12 },
  { city: "Calgary", country: "Canada", lat: 51.05, lng: -114.07 },
  { city: "Ottawa", country: "Canada", lat: 45.42, lng: -75.69 },
  
  // Mexico
  { city: "Mexico City", country: "Mexico", lat: 19.43, lng: -99.13 },
  { city: "Guadalajara", country: "Mexico", lat: 20.67, lng: -103.35 },
  { city: "Monterrey", country: "Mexico", lat: 25.67, lng: -100.31 },
  
  // United Kingdom
  { city: "London", country: "United Kingdom", lat: 51.51, lng: -0.13 },
  { city: "Manchester", country: "United Kingdom", lat: 53.48, lng: -2.24 },
  { city: "Birmingham", country: "United Kingdom", lat: 52.48, lng: -1.90 },
  { city: "Leeds", country: "United Kingdom", lat: 53.80, lng: -1.55 },
  { city: "Glasgow", country: "United Kingdom", lat: 55.86, lng: -4.26 },
  
  // France
  { city: "Paris", country: "France", lat: 48.86, lng: 2.35 },
  { city: "Marseille", country: "France", lat: 43.30, lng: 5.37 },
  { city: "Lyon", country: "France", lat: 45.76, lng: 4.84 },
  
  // Germany
  { city: "Berlin", country: "Germany", lat: 52.52, lng: 13.41 },
  { city: "Munich", country: "Germany", lat: 48.14, lng: 11.58 },
  { city: "Hamburg", country: "Germany", lat: 53.55, lng: 9.99 },
  { city: "Frankfurt", country: "Germany", lat: 50.11, lng: 8.68 },
  
  // Spain
  { city: "Madrid", country: "Spain", lat: 40.42, lng: -3.70 },
  { city: "Barcelona", country: "Spain", lat: 41.39, lng: 2.16 },
  
  // Italy
  { city: "Rome", country: "Italy", lat: 41.90, lng: 12.50 },
  { city: "Milan", country: "Italy", lat: 45.46, lng: 9.19 },
  
  // Netherlands
  { city: "Amsterdam", country: "Netherlands", lat: 52.37, lng: 4.89 },
  
  // Belgium
  { city: "Brussels", country: "Belgium", lat: 50.85, lng: 4.35 },
  
  // Australia
  { city: "Sydney", country: "Australia", lat: -33.87, lng: 151.21 },
  { city: "Melbourne", country: "Australia", lat: -37.81, lng: 144.96 },
  { city: "Brisbane", country: "Australia", lat: -27.47, lng: 153.03 },
  
  // Japan
  { city: "Tokyo", country: "Japan", lat: 35.68, lng: 139.65 },
  { city: "Osaka", country: "Japan", lat: 34.69, lng: 135.50 },
  
  // Brazil
  { city: "São Paulo", country: "Brazil", lat: -23.55, lng: -46.63 },
  { city: "Rio de Janeiro", country: "Brazil", lat: -22.91, lng: -43.17 },
];

// Case-insensitive city lookup
export function findCity(cityName: string): CityCoords | undefined {
  const normalized = cityName.toLowerCase().trim();
  return MAJOR_CITIES.find(c => c.city.toLowerCase() === normalized);
}