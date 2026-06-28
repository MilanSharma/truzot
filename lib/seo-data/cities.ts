export const CITIES = [
  { id: "new-york", name: "New York", state: "NY", region: "Northeast", population: 8336817, keywords: ["new york headshot", "nyc headshot photographer"] },
  { id: "los-angeles", name: "Los Angeles", state: "CA", region: "West", population: 3979576, keywords: ["los angeles headshot", "la headshot photographer"] },
  { id: "chicago", name: "Chicago", state: "IL", region: "Midwest", population: 2693976, keywords: ["chicago headshot", "professional headshot chicago"] },
  { id: "houston", name: "Houston", state: "TX", region: "South", population: 2320268, keywords: ["houston headshot", "professional headshot houston"] },
  { id: "phoenix", name: "Phoenix", state: "AZ", region: "Southwest", population: 1680992, keywords: ["phoenix headshot", "professional headshot phoenix"] },
  { id: "philadelphia", name: "Philadelphia", state: "PA", region: "Northeast", population: 1584064, keywords: ["philadelphia headshot", "philly headshot photographer"] },
  { id: "san-antonio", name: "San Antonio", state: "TX", region: "South", population: 1547253, keywords: ["san antonio headshot", "professional headshot san antonio"] },
  { id: "san-diego", name: "San Diego", state: "CA", region: "West", population: 1423851, keywords: ["san diego headshot", "professional headshot san diego"] },
  { id: "dallas", name: "Dallas", state: "TX", region: "South", population: 1343573, keywords: ["dallas headshot", "professional headshot dallas"] },
  { id: "san-jose", name: "San Jose", state: "CA", region: "West", population: 1021795, keywords: ["san jose headshot", "professional headshot san jose"] },
  { id: "austin", name: "Austin", state: "TX", region: "South", population: 978908, keywords: ["austin headshot", "professional headshot austin"] },
  { id: "london", name: "London", state: "UK", region: "Europe", population: 8982000, keywords: ["london headshot", "professional headshot london"] },
  { id: "toronto", name: "Toronto", state: "ON", region: "North America", population: 2930000, keywords: ["toronto headshot", "professional headshot toronto"] },
] as const;
export type City = (typeof CITIES)[number];
