import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Medicine, Pharmacy } from "@/models";
import { apiRequest } from "./api";

type ApiPageResponse<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
};

type ApiMedicineDto = {
  id: number;
  name: string;
  pharmaceuticalForm?: string | null;
  box?: number | string | null;
  capacity?: number | string | null;
  capacityMetric?: string | null;
};

type ApiPharmacyDto = {
  id: number;
  name: string;
  pharmacistName?: string | null;
  address?: string | null;
  phone?: string | null;
  phoneNumber?: string | null;
  lat?: number | null;
  lng?: number | null;
};

type ApiPharmacyMedicineDto = {
  pharmacyMedicineId: number;
  medicineId: number;
  medicineName: string;
  quantity: number;
};

type NearbyParams = {
  lat: number;
  lng: number;
};

export type SearchableMedicine = {
  id: string;
  name: string;
  genericName: string;
  category: string;
  strength: string;
  dosageForm: Medicine["dosageForm"];
};

const AUTH_TOKEN_KEY = "auth_token";
const DEFAULT_NEARBY_PARAMS: NearbyParams = { lat: 40.7389, lng: -73.9903 };

function fallbackCoordinates(index: number): { lat: number; lng: number } {
  const angle = ((index % 8) * Math.PI) / 4;
  const radius = 0.01 + (index % 3) * 0.004;
  return {
    lat: DEFAULT_NEARBY_PARAMS.lat + Math.sin(angle) * radius,
    lng: DEFAULT_NEARBY_PARAMS.lng + Math.cos(angle) * radius,
  };
}

function mapDosageForm(value?: string | null): Medicine["dosageForm"] {
  const form = (value ?? "tablet").toLowerCase();
  if (form.includes("capsule")) return "capsule";
  if (
    form.includes("liquid") ||
    form.includes("syrup") ||
    form.includes("solution")
  )
    return "liquid";
  if (form.includes("injection")) return "injection";
  if (
    form.includes("cream") ||
    form.includes("ointment") ||
    form.includes("gel")
  )
    return "cream";
  if (form.includes("inhal")) return "inhaler";
  return "tablet";
}

function mapStrength(dto: ApiMedicineDto): string {
  const parts = [dto.capacity, dto.capacityMetric].filter(Boolean);
  if (parts.length > 0) {
    return parts.join(" ");
  }
  if (dto.box != null) {
    return `${dto.box} units`;
  }
  return "Unknown";
}

function mapMedicine(dto: ApiMedicineDto): SearchableMedicine {
  const category = dto.pharmaceuticalForm?.trim() || "Medication";
  return {
    id: String(dto.id),
    name: dto.name,
    genericName: dto.name,
    category,
    strength: mapStrength(dto),
    dosageForm: mapDosageForm(dto.pharmaceuticalForm),
  };
}

async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(AUTH_TOKEN_KEY);
}

export async function fetchMedicinesCatalog(
  query: string,
  size = 100,
): Promise<SearchableMedicine[]> {
  const token = await getToken();
  const search = query.trim();
  const params = new URLSearchParams({
    page: "0",
    size: String(size),
  });
  if (search) params.set("name", search);

  const response = await apiRequest<ApiPageResponse<ApiMedicineDto>>(
    `/medicines?${params}`,
    {},
    token,
  );

  return response.content.map(mapMedicine);
}

export async function fetchPharmaciesForMedicine(
  medicineId: string,
): Promise<Pharmacy[]> {
  const numericMedicineId = Number.parseInt(medicineId, 10);
  if (!Number.isFinite(numericMedicineId)) {
    return [];
  }

  const token = await getToken();
  const params = new URLSearchParams({
    lat: String(DEFAULT_NEARBY_PARAMS.lat),
    lng: String(DEFAULT_NEARBY_PARAMS.lng),
  });

  const nearby = await apiRequest<ApiPharmacyDto[]>(
    `/pharmacies/nearby?${params}`,
    {},
    token,
  );

  if (nearby.length === 0) {
    return [];
  }

  const medicineByPharmacyId = new Map<number, ApiPharmacyMedicineDto>();
  await Promise.all(
    nearby.map(async (pharmacy) => {
      const medicines = await apiRequest<ApiPharmacyMedicineDto[]>(
        `/pharmacies/${pharmacy.id}/medicines`,
        {},
        token,
      );

      const match = medicines.find(
        (item) => item.medicineId === numericMedicineId,
      );
      if (match) {
        medicineByPharmacyId.set(pharmacy.id, match);
      }
    }),
  );

  return nearby
    .map((pharmacy, index) => {
      const match = medicineByPharmacyId.get(pharmacy.id);
      if (!match) return null;

      const fallback = fallbackCoordinates(index);
      const lat = pharmacy.lat ?? fallback.lat;
      const lng = pharmacy.lng ?? fallback.lng;

      return {
        id: String(pharmacy.id),
        name: pharmacy.name,
        pharmacistName: pharmacy.pharmacistName ?? undefined,
        address: pharmacy.address ?? undefined,
        phone: pharmacy.phone ?? pharmacy.phoneNumber ?? undefined,
        lat,
        lng,
        inStock: match.quantity > 0,
        quantity: match.quantity,
      } as Pharmacy;
    })
    .filter((item): item is Pharmacy => Boolean(item))
    .sort((a, b) => {
      if (a.inStock !== b.inStock) return a.inStock ? -1 : 1;
      return (b.quantity ?? 0) - (a.quantity ?? 0);
    });
}
