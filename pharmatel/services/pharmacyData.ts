import type { Pharmacy } from "@/models";

// Mock pharmacies near a central location (New York City area)
const BASE_PHARMACIES: Pharmacy[] = [
  {
    id: "ph_001",
    name: "CityMed Pharmacy",
    address: "123 Broadway, New York, NY 10006",
    phone: "+1 (212) 555-0101",
    lat: 40.7128,
    lng: -74.006,
    openHours: "Mon-Fri 8am-9pm, Sat-Sun 9am-6pm",
    inStock: true,
    price: "$12.50",
    rating: 4.7,
  },
  {
    id: "ph_002",
    name: "QuickCare Drugstore",
    address: "456 5th Avenue, New York, NY 10018",
    phone: "+1 (212) 555-0202",
    lat: 40.7549,
    lng: -73.984,
    openHours: "Open 24 hours",
    inStock: true,
    price: "$14.99",
    rating: 4.3,
  },
  {
    id: "ph_003",
    name: "Wellness Plus",
    address: "789 Park Ave, New York, NY 10021",
    phone: "+1 (212) 555-0303",
    lat: 40.7698,
    lng: -73.9643,
    openHours: "Mon-Sun 9am-8pm",
    inStock: false,
    rating: 4.5,
  },
  {
    id: "ph_004",
    name: "MedExpress Pharmacy",
    address: "321 W 34th St, New York, NY 10001",
    phone: "+1 (212) 555-0404",
    lat: 40.748,
    lng: -73.9967,
    openHours: "Mon-Fri 7am-10pm, Sat 8am-8pm",
    inStock: true,
    price: "$11.75",
    rating: 4.6,
  },
  {
    id: "ph_005",
    name: "Health Hub Pharmacy",
    address: "654 Lexington Ave, New York, NY 10022",
    phone: "+1 (212) 555-0505",
    lat: 40.7589,
    lng: -73.9705,
    openHours: "Mon-Sat 8am-9pm",
    inStock: true,
    price: "$13.25",
    rating: 4.4,
  },
  {
    id: "ph_006",
    name: "GreenCross Pharmacy",
    address: "99 Wall St, New York, NY 10005",
    phone: "+1 (212) 555-0606",
    lat: 40.7074,
    lng: -74.0113,
    openHours: "Mon-Fri 8am-7pm",
    inStock: true,
    price: "$10.99",
    rating: 4.8,
  },
];

// Return pharmacies with slight variation for each medicine
export function getPharmaciesForMedicine(medicineId: string): Pharmacy[] {
  // Shuffle and vary stock based on medicineId to give different results per medicine
  const seed = medicineId.charCodeAt(medicineId.length - 1);
  return BASE_PHARMACIES.map((ph, i) => ({
    ...ph,
    inStock: (i + seed) % 3 !== 0,
    distance: `${((i + 1) * 0.4 + seed * 0.05).toFixed(1)} km`,
  })).sort((a, b) => (a.inStock === b.inStock ? 0 : a.inStock ? -1 : 1));
}

export function searchMedicines(query: string) {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  return ALL_SEARCHABLE_MEDICINES.filter(
    (m) =>
      m.name.toLowerCase().includes(q) ||
      m.genericName.toLowerCase().includes(q) ||
      m.category.toLowerCase().includes(q)
  );
}

export const ALL_SEARCHABLE_MEDICINES = [
  { id: "med_001", name: "Metformin", genericName: "Metformin Hydrochloride", category: "Diabetes", strength: "500mg", dosageForm: "tablet" as const },
  { id: "med_002", name: "Lisinopril", genericName: "Lisinopril", category: "Blood Pressure", strength: "10mg", dosageForm: "tablet" as const },
  { id: "med_003", name: "Atorvastatin", genericName: "Atorvastatin Calcium", category: "Cholesterol", strength: "20mg", dosageForm: "tablet" as const },
  { id: "med_004", name: "Omeprazole", genericName: "Omeprazole", category: "Acid Reflux", strength: "20mg", dosageForm: "capsule" as const },
  { id: "med_005", name: "Amoxicillin", genericName: "Amoxicillin Trihydrate", category: "Antibiotic", strength: "500mg", dosageForm: "capsule" as const },
  { id: "med_006", name: "Ibuprofen", genericName: "Ibuprofen", category: "Pain Relief", strength: "400mg", dosageForm: "tablet" as const },
  { id: "med_007", name: "Cetirizine", genericName: "Cetirizine Hydrochloride", category: "Allergy", strength: "10mg", dosageForm: "tablet" as const },
  { id: "med_008", name: "Salbutamol", genericName: "Salbutamol Sulfate", category: "Respiratory", strength: "100mcg", dosageForm: "inhaler" as const },
  { id: "med_009", name: "Sertraline", genericName: "Sertraline Hydrochloride", category: "Antidepressant", strength: "50mg", dosageForm: "tablet" as const },
  { id: "med_010", name: "Metoprolol", genericName: "Metoprolol Tartrate", category: "Heart", strength: "25mg", dosageForm: "tablet" as const },
  { id: "med_011", name: "Amlodipine", genericName: "Amlodipine Besylate", category: "Blood Pressure", strength: "5mg", dosageForm: "tablet" as const },
  { id: "med_012", name: "Pantoprazole", genericName: "Pantoprazole Sodium", category: "Acid Reflux", strength: "40mg", dosageForm: "tablet" as const },
  { id: "med_013", name: "Prednisolone", genericName: "Prednisolone", category: "Anti-inflammatory", strength: "5mg", dosageForm: "tablet" as const },
  { id: "med_014", name: "Azithromycin", genericName: "Azithromycin Dihydrate", category: "Antibiotic", strength: "250mg", dosageForm: "tablet" as const },
  { id: "med_015", name: "Furosemide", genericName: "Furosemide", category: "Diuretic", strength: "40mg", dosageForm: "tablet" as const },
  { id: "med_016", name: "Clonazepam", genericName: "Clonazepam", category: "Anxiety", strength: "0.5mg", dosageForm: "tablet" as const },
  { id: "med_017", name: "Levothyroxine", genericName: "Levothyroxine Sodium", category: "Thyroid", strength: "50mcg", dosageForm: "tablet" as const },
  { id: "med_018", name: "Warfarin", genericName: "Warfarin Sodium", category: "Blood Thinner", strength: "5mg", dosageForm: "tablet" as const },
];
