import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  DiaryEntry,
  DoseSchedule,
  Medicine,
  ObservationSession,
  Patient,
  Prescription,
  SymptomDefinition,
} from "@/models";
import { apiRequest, isApiConfigured } from "./api";

const KEYS = {
  AUTH_TOKEN: "auth_token",
  PATIENT: "patient",
  PATIENT_ID: "patient_id",
  PRESCRIPTIONS: "prescriptions",
  OBSERVATION_SESSIONS: "observation_sessions",
  DIARY_ENTRIES: "diary_entries",
};

type ApiAuthResponse = {
  token: string;
  username: string;
  patientId?: number;
  pharmacyId?: number;
};

type RegisterRole = "PATIENT" | "PHARMACY";

type RegisterInput = {
  username: string;
  password: string;
  role: RegisterRole;
  name?: string;
  email?: string;
  phoneNumber?: string;
  pharmacyName?: string;
  pharmacistName?: string;
  lat?: number;
  lng?: number;
};

type ApiPatientDto = {
  id: number;
  name: string;
  email: string;
  phoneNumber: string;
};

type ApiMedicineDto = {
  id: number;
  name: string;
  buyPrice?: number | string | null;
  sellPrice?: number | string | null;
  pharmaceuticalForm?: string | null;
  box?: number | string | null;
  capacity?: number | string | null;
  capacityMetric?: string | null;
  factoryId?: number | null;
  factoryName?: string | null;
  factory?: string | null;
};

type ApiCreateMedicineRequest = {
  name: string;
  buyPrice: number;
  sellPrice: number;
  pharmaceuticalForm: string;
  box: number;
  capacity: number;
  capacityMetric: string;
  factoryId?: number | null;
};

type ApiPrescriptionDto = {
  id: string;
  patientId: number;
  medicineId: number;
  medicineName?: string | null;
  dose?: string | null;
  frequency?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  issuedAt?: string | null;
  byPharmacist?: boolean | null;
  pharmacyId?: number | null;
  foodRequirement?: string | null;
};

type ApiDoseScheduleDto = {
  id: number;
  prescriptionId: string;
  takeAt?: string | null;
  taken?: boolean | null;
  takenAt?: string | null;
  patientPersonalNote?: string | null;
};

type ApiPageResponse<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
};

type ApiSymptomDefinitionDto = {
  id: string;
  name: string;
  type: string;
  unit?: string | null;
  minValue?: number | null;
  maxValue?: number | null;
  description?: string | null;
};

type ApiSymptomMeasurementDto = {
  id: string;
  symptomId: string;
  symptomName: string;
  measurementId: string;
  measurementName: string;
  minValue?: string | null;
  maxValue?: string | null;
  meanValue?: string | null;
};

type ApiObservationDto = {
  id: string;
  observationSessionId: string;
  patientId: number;
  doseScheduleId?: number | null;
  symptomType: string;
  measurementUnit: string;
  valueBoolean?: boolean | null;
  valueNumeric?: number | null;
  valueText?: string | null;
  createdAt: string;
};

function isNumericId(value: string): boolean {
  return /^\d+$/.test(value);
}

function extractTime(value?: string | null): string {
  if (!value) return "08:00";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "08:00";
  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function mapFoodRequirement(
  value?: string | null,
): Prescription["foodRequirement"] {
  switch ((value ?? "").toLowerCase()) {
    case "before_meal":
      return "before_meal";
    case "after_meal":
      return "after_meal";
    case "with_meal":
      return "with_meal";
    default:
      return "any_time";
  }
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

function mapMedicine(dto: ApiMedicineDto): Medicine {
  const strengthParts = [dto.capacity, dto.capacityMetric].filter(Boolean);
  const strength =
    strengthParts.length > 0
      ? strengthParts.join("")
      : dto.box != null
        ? `${dto.box} units`
        : "";

  return {
    id: String(dto.id),
    name: dto.name,
    genericName: dto.name,
    dosageForm: mapDosageForm(dto.pharmaceuticalForm),
    strength: strength || "Unknown",
    manufacturer: dto.factoryName ?? dto.factory ?? undefined,
    description: dto.pharmaceuticalForm ?? undefined,
  };
}

function toBackendDateTime(value: string, endOfDay = false): string {
  const trimmed = value.trim();
  if (trimmed.includes("T")) {
    return trimmed;
  }
  return `${trimmed}T${endOfDay ? "23:59:59" : "08:00:00"}`;
}

function toBackendFrequency(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (normalized === "once daily") return "24 hours";
  if (normalized === "twice daily") return "12 hours";
  if (normalized === "three times daily") return "8 hours";
  if (normalized === "four times daily") return "6 hours";
  if (normalized === "weekly") return "168 hours";
  if (normalized === "as needed") return "24 hours";

  const match = normalized.match(/(\d+)/);
  if (match) {
    return `${match[1]} hours`;
  }

  return "24 hours";
}

function symptomKey(
  symptomType: string,
  measurementUnit?: string | null,
): string {
  return `${symptomType.trim().toLowerCase()}::${(measurementUnit ?? "").trim().toLowerCase()}`;
}

function inferSymptomTypeFromObservation(
  observation: ApiObservationDto,
): SymptomDefinition["type"] {
  if (observation.valueBoolean != null) return "boolean";
  if (observation.valueNumeric != null) return "numeric";
  return "text";
}

function mapPrescription(
  dto: ApiPrescriptionDto,
  medicine: Medicine,
  schedules: ApiDoseScheduleDto[],
): Prescription {
  return {
    id: dto.id,
    patientId: String(dto.patientId),
    medicineId: String(dto.medicineId),
    medicine,
    dose: dto.dose ?? "As directed",
    frequency: dto.frequency ?? "As directed",
    foodRequirement: mapFoodRequirement(dto.foodRequirement),
    startDate: dto.startDate ?? new Date().toISOString().split("T")[0],
    ...(dto.endDate ? { endDate: dto.endDate } : {}),
    prescribedBy: dto.byPharmacist ? "Pharmacist" : "Doctor",
    doseSchedules: schedules
      .slice()
      .sort((a, b) =>
        extractTime(a.takeAt).localeCompare(extractTime(b.takeAt)),
      )
      .map((schedule) => ({
        id: String(schedule.id),
        prescriptionId: String(dto.id),
        scheduledTime: extractTime(schedule.takeAt),
        status: schedule.taken ? "taken" : "pending",
        ...(schedule.takenAt ? { takenAt: schedule.takenAt } : {}),
        ...(schedule.patientPersonalNote
          ? { patientNote: schedule.patientPersonalNote }
          : {}),
      })),
  };
}

async function getStoredPatient(): Promise<Patient | null> {
  const stored = await AsyncStorage.getItem(KEYS.PATIENT);
  if (!stored) return null;
  return JSON.parse(stored) as Patient;
}

async function getStoredPatientId(): Promise<number | null> {
  const explicitId = await AsyncStorage.getItem(KEYS.PATIENT_ID);
  if (explicitId) {
    const parsedExplicit = Number.parseInt(explicitId, 10);
    if (Number.isFinite(parsedExplicit)) return parsedExplicit;
  }

  const storedPatient = await getStoredPatient();
  if (!storedPatient?.id) return null;
  const parsed = Number.parseInt(storedPatient.id, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

async function requestApi<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
  return apiRequest<T>(path, options, token);
}

async function resolveMedicineIdByName(name: string): Promise<number> {
  const token = await getAuthToken();
  if (!token) {
    throw new Error("Missing auth token.");
  }

  const normalizedName = name.trim();
  if (!normalizedName) {
    throw new Error("Custom medicine name is required.");
  }

  const searchParams = new URLSearchParams({
    page: "0",
    size: "100",
    name: normalizedName,
  });

  const existing = await requestApi<ApiPageResponse<ApiMedicineDto>>(
    `/medicines?${searchParams}`,
    {},
    token,
  );

  const exactMatch = existing.content.find(
    (item) => item.name.trim().toLowerCase() === normalizedName.toLowerCase(),
  );
  if (exactMatch) {
    return exactMatch.id;
  }

  const created = await requestApi<ApiMedicineDto>(
    "/medicines",
    {
      method: "POST",
      body: JSON.stringify({
        name: normalizedName,
        buyPrice: 0,
        sellPrice: 0,
        pharmaceuticalForm: "tablet",
        box: 1,
        capacity: 1,
        capacityMetric: "unit",
      } satisfies ApiCreateMedicineRequest),
    },
    token,
  );

  return created.id;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return fallback;
}

function isUuid(value?: string | null): value is string {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function extractObservationValue(observation: ApiObservationDto) {
  if (observation.valueBoolean != null) return observation.valueBoolean;
  if (observation.valueNumeric != null) return observation.valueNumeric;
  return observation.valueText ?? "";
}

async function loadRemotePrescriptions(): Promise<Prescription[] | null> {
  if (!isApiConfigured()) return null;

  const token = await getAuthToken();
  const patientId = await getStoredPatientId();
  if (!token || patientId == null) return null;

  try {
    const [prescriptionsPage, schedulesPage] = await Promise.all([
      requestApi<ApiPageResponse<ApiPrescriptionDto>>(
        `/patients/${patientId}/prescriptions?page=0&size=100`,
        {},
        token,
      ),
      requestApi<ApiPageResponse<ApiDoseScheduleDto>>(
        `/patients/${patientId}/dose-schedules?page=0&size=200`,
        {},
        token,
      ),
    ]);

    const medicineIds = [
      ...new Set(prescriptionsPage.content.map((item) => item.medicineId)),
    ];
    const medicines = await Promise.all(
      medicineIds.map(async (medicineId) => {
        const medicine = await requestApi<ApiMedicineDto>(
          `/medicines/${medicineId}`,
          {},
          token,
        );
        return [medicineId, mapMedicine(medicine)] as const;
      }),
    );
    const medicineById = new Map<number, Medicine>(medicines);

    const schedulesByPrescription = new Map<string, ApiDoseScheduleDto[]>();
    for (const schedule of schedulesPage.content) {
      const current =
        schedulesByPrescription.get(schedule.prescriptionId) ?? [];
      current.push(schedule);
      schedulesByPrescription.set(schedule.prescriptionId, current);
    }

    const prescriptions = prescriptionsPage.content.map((prescription) =>
      mapPrescription(
        prescription,
        medicineById.get(prescription.medicineId) ??
          mapMedicine({
            id: prescription.medicineId,
            name: prescription.medicineName ?? "Medicine",
            pharmaceuticalForm: "tablet",
          }),
        schedulesByPrescription.get(prescription.id) ?? [],
      ),
    );

    await AsyncStorage.setItem(
      KEYS.PRESCRIPTIONS,
      JSON.stringify(prescriptions),
    );
    return prescriptions;
  } catch (error) {
    console.warn("Failed to load prescriptions from API:", error);
    return null;
  }
}

async function loadRemoteSymptomDefinitions(): Promise<
  SymptomDefinition[] | null
> {
  if (!isApiConfigured()) return null;

  try {
    const token = await getAuthToken();
    const definitions = await requestApi<ApiSymptomDefinitionDto[]>(
      "/symptoms/definitions",
      {},
      token,
    );

    return definitions.map((definition) => ({
      id: definition.id,
      name: definition.name,
      type: definition.type as SymptomDefinition["type"],
      unit: definition.unit ?? undefined,
      minValue: definition.minValue ?? undefined,
      maxValue: definition.maxValue ?? undefined,
      description: definition.description ?? undefined,
    }));
  } catch (error) {
    console.warn("Failed to load symptom definitions from API:", error);
    return null;
  }
}

export async function saveAuthToken(token: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.AUTH_TOKEN, token);
}

export async function getAuthToken(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.AUTH_TOKEN);
}

export async function clearAuthToken(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.AUTH_TOKEN);
}

export async function login(
  username: string,
  password: string,
): Promise<{ success: boolean; token?: string; error?: string }> {
  if (!isApiConfigured()) {
    return {
      success: false,
      error: "Backend API is not configured.",
    };
  }

  try {
    const auth = await requestApi<ApiAuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        username,
        password,
        role: "PATIENT",
      }),
    });

    await saveAuthToken(auth.token);

    if (auth.patientId != null) {
      await AsyncStorage.setItem(KEYS.PATIENT_ID, String(auth.patientId));
      const patient = await requestApi<ApiPatientDto>(
        `/patients/${auth.patientId}`,
        {},
        auth.token,
      );

      const currentPatient: Patient = {
        id: String(patient.id),
        username: auth.username,
        name: patient.name,
        token: auth.token,
      };
      await AsyncStorage.setItem(KEYS.PATIENT, JSON.stringify(currentPatient));
    }

    return { success: true, token: auth.token };
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error, "Login failed"),
    };
  }
}

export async function register(
  input: RegisterInput,
): Promise<{ success: boolean; token?: string; error?: string }> {
  if (!isApiConfigured()) {
    return {
      success: false,
      error: "Backend API is not configured.",
    };
  }

  try {
    const auth = await requestApi<ApiAuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    });

    if (input.role === "PATIENT" && auth.patientId != null) {
      await saveAuthToken(auth.token);
      await AsyncStorage.setItem(KEYS.PATIENT_ID, String(auth.patientId));
      const patient = await requestApi<ApiPatientDto>(
        `/patients/${auth.patientId}`,
        {},
        auth.token,
      );

      const currentPatient: Patient = {
        id: String(patient.id),
        username: auth.username,
        name: patient.name,
        token: auth.token,
      };
      await AsyncStorage.setItem(KEYS.PATIENT, JSON.stringify(currentPatient));
    }

    return {
      success: true,
      token: input.role === "PATIENT" ? auth.token : undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error, "Registration failed"),
    };
  }
}

export async function logout(): Promise<void> {
  await AsyncStorage.multiRemove([
    KEYS.AUTH_TOKEN,
    KEYS.PATIENT,
    KEYS.PATIENT_ID,
  ]);
}

export async function getPrescriptions(): Promise<Prescription[]> {
  const remote = await loadRemotePrescriptions();
  if (remote) return remote;
  throw new Error("Failed to load prescriptions from backend.");
}

export async function updateDoseSchedule(
  prescriptionId: string,
  doseScheduleId: string,
  updates: Partial<DoseSchedule>,
): Promise<Prescription[]> {
  if (!isApiConfigured() || !isNumericId(doseScheduleId)) {
    throw new Error("Dose schedule update requires backend data.");
  }

  const token = await getAuthToken();
  const nextStatus = updates.status as string | undefined;
  if (!token) {
    throw new Error("Missing auth token.");
  }

  if (nextStatus === "taken") {
    await requestApi(
      `/dose-schedules/${doseScheduleId}/take`,
      {
        method: "POST",
        body: JSON.stringify({
          patientPersonalNote: updates.patientNote ?? null,
        }),
      },
      token,
    );
  } else {
    await requestApi(
      `/dose-schedules/${doseScheduleId}`,
      {
        method: "PUT",
        body: JSON.stringify({
          taken: nextStatus === "taken",
          takenAt: updates.takenAt ?? null,
          patientPersonalNote: updates.patientNote ?? null,
        }),
      },
      token,
    );
  }

  const refreshed = await loadRemotePrescriptions();
  if (!refreshed) {
    throw new Error("Failed to refresh prescriptions after update.");
  }
  return refreshed;
}

export async function getObservationSessions(): Promise<ObservationSession[]> {
  if (!isApiConfigured()) {
    throw new Error("Observation loading requires backend connection.");
  }

  const token = await getAuthToken();
  const patientId = await getStoredPatientId();
  if (!token || patientId == null) return [];

  const [observationsPage, definitions] = await Promise.all([
    requestApi<ApiPageResponse<ApiObservationDto>>(
      `/patients/${patientId}/observations?page=0&size=500`,
      {},
      token,
    ),
    loadRemoteSymptomDefinitions(),
  ]);

  const definitionsById = new Map<string, SymptomDefinition>(
    (definitions ?? []).map((definition) => [definition.id, definition]),
  );

  const bySession = new Map<string, ObservationSession>();
  for (const item of observationsPage.content) {
    const symptomDefinitionId = symptomKey(
      item.symptomType,
      item.measurementUnit,
    );
    const symptomDefinition = definitionsById.get(symptomDefinitionId) ?? {
      id: symptomDefinitionId,
      name: item.symptomType,
      type: inferSymptomTypeFromObservation(item),
      unit: item.measurementUnit || undefined,
    };

    const mappedObservation = {
      id: item.id,
      sessionId: item.observationSessionId,
      symptomDefinitionId,
      symptomDefinition,
      value: extractObservationValue(item),
      recordedAt: item.createdAt,
    };

    const existing = bySession.get(item.observationSessionId);
    if (!existing) {
      bySession.set(item.observationSessionId, {
        id: item.observationSessionId,
        doseScheduleId: String(item.doseScheduleId ?? ""),
        startedAt: item.createdAt,
        endedAt: item.createdAt,
        observations: [mappedObservation],
      });
      continue;
    }

    existing.observations.push(mappedObservation);
  }

  return Array.from(bySession.values());
}

export async function saveObservationSession(
  session: ObservationSession,
): Promise<void> {
  if (!isApiConfigured()) {
    throw new Error("Observation saving requires backend connection.");
  }

  const token = await getAuthToken();
  const patientId = await getStoredPatientId();
  if (!token || patientId == null) {
    throw new Error("Missing auth token or patient id.");
  }

  const existingPage = await requestApi<ApiPageResponse<ApiObservationDto>>(
    `/patients/${patientId}/observations?page=0&size=500`,
    {},
    token,
  );

  const existingForDose = existingPage.content.filter(
    (item) =>
      item.observationSessionId === session.id ||
      (isNumericId(session.doseScheduleId) &&
        item.doseScheduleId != null &&
        String(item.doseScheduleId) === session.doseScheduleId),
  );
  const existingBySymptomKey = new Map<string, ApiObservationDto>(
    existingForDose.map((item) => [
      symptomKey(item.symptomType, item.measurementUnit),
      item,
    ]),
  );

  let observationSessionId = isUuid(session.id)
    ? session.id
    : existingForDose[0]?.observationSessionId;

  for (const observation of session.observations) {
    const symptomType = observation.symptomDefinition.name.trim();
    const measurementUnit =
      observation.symptomDefinition.unit?.trim() || "text";

    const payload: {
      valueBoolean?: boolean;
      valueNumeric?: number;
      valueText?: string;
    } = {};

    if (typeof observation.value === "boolean") {
      payload.valueBoolean = observation.value;
    } else if (typeof observation.value === "number") {
      payload.valueNumeric = observation.value;
    } else {
      payload.valueText = String(observation.value ?? "");
    }

    const existingObservation = existingBySymptomKey.get(
      symptomKey(symptomType, measurementUnit),
    );
    if (existingObservation) {
      await requestApi(
        `/observations/${existingObservation.id}`,
        {
          method: "PUT",
          body: JSON.stringify({
            symptomType,
            measurementUnit,
            valueBoolean: payload.valueBoolean ?? null,
            valueNumeric: payload.valueNumeric ?? null,
            valueText: payload.valueText ?? null,
          }),
        },
        token,
      );
      continue;
    }

    const created = await requestApi<ApiObservationDto>(
      "/observations",
      {
        method: "POST",
        body: JSON.stringify({
          patientId,
          symptomType,
          measurementUnit,
          ...(observationSessionId ? { observationSessionId } : {}),
          valueBoolean: payload.valueBoolean ?? null,
          valueNumeric: payload.valueNumeric ?? null,
          valueText: payload.valueText ?? null,
        }),
      },
      token,
    );

    observationSessionId = created.observationSessionId;
  }
}

export async function getObservationSessionByDose(
  doseScheduleId: string,
): Promise<ObservationSession | null> {
  const sessions = await getObservationSessions();
  return sessions.find((s) => s.doseScheduleId === doseScheduleId) ?? null;
}

export async function deleteObservationSession(
  sessionId: string,
): Promise<ObservationSession[]> {
  if (!isApiConfigured()) {
    throw new Error("Observation deletion requires backend connection.");
  }

  const token = await getAuthToken();
  const patientId = await getStoredPatientId();
  if (!token || patientId == null) {
    throw new Error("Missing auth token or patient id.");
  }

  const existingPage = await requestApi<ApiPageResponse<ApiObservationDto>>(
    `/patients/${patientId}/observations?page=0&size=500`,
    {},
    token,
  );

  const toDelete = existingPage.content.filter(
    (item) => item.observationSessionId === sessionId,
  );

  await Promise.all(
    toDelete.map((item) =>
      requestApi(`/observations/${item.id}`, { method: "DELETE" }, token),
    ),
  );

  return getObservationSessions();
}

export async function addPrescription(
  prescription: Prescription,
): Promise<Prescription[]> {
  if (!isApiConfigured()) {
    throw new Error("Prescription creation requires a backend connection.");
  }

  const token = await getAuthToken();
  const patientId = await getStoredPatientId();
  if (!token || patientId == null) {
    throw new Error("Missing patient authentication details.");
  }

  const medicineId = isNumericId(prescription.medicineId)
    ? Number.parseInt(prescription.medicineId, 10)
    : await resolveMedicineIdByName(prescription.medicine.name);

  await requestApi(
    "/prescriptions",
    {
      method: "POST",
      body: JSON.stringify({
        patientId,
        medicineId,
        dose: prescription.dose,
        frequency: toBackendFrequency(prescription.frequency),
        startDate: toBackendDateTime(prescription.startDate),
        endDate: prescription.endDate
          ? toBackendDateTime(prescription.endDate, true)
          : null,
        byPharmacist: false,
        foodRequirement: prescription.foodRequirement,
      }),
    },
    token,
  );

  const refreshed = await loadRemotePrescriptions();
  if (!refreshed) {
    throw new Error("Failed to refresh prescriptions after creation.");
  }
  return refreshed;
}

export async function removePrescription(
  prescriptionId: string,
): Promise<Prescription[]> {
  if (!isApiConfigured()) {
    throw new Error("Prescription deletion requires backend connection.");
  }

  const token = await getAuthToken();
  if (!token) {
    throw new Error("Missing auth token.");
  }

  await requestApi(
    `/prescriptions/${prescriptionId}`,
    { method: "DELETE" },
    token,
  );
  const refreshed = await loadRemotePrescriptions();
  if (!refreshed) {
    throw new Error("Failed to refresh prescriptions after deletion.");
  }
  return refreshed;
}

export async function updatePrescription(
  prescriptionId: string,
  prescription: Prescription,
): Promise<Prescription[]> {
  if (!isApiConfigured()) {
    throw new Error("Prescription update requires backend connection.");
  }

  const token = await getAuthToken();
  if (!token) {
    throw new Error("Missing auth token.");
  }

  await requestApi(
    `/prescriptions/${prescriptionId}`,
    {
      method: "PUT",
      body: JSON.stringify({
        dose: prescription.dose,
        frequency: toBackendFrequency(prescription.frequency),
        startDate: toBackendDateTime(prescription.startDate),
        endDate: prescription.endDate
          ? toBackendDateTime(prescription.endDate, true)
          : null,
        byPharmacist: false,
        foodRequirement: prescription.foodRequirement,
      }),
    },
    token,
  );

  const refreshed = await loadRemotePrescriptions();
  if (!refreshed) {
    throw new Error("Failed to refresh prescriptions after update.");
  }
  return refreshed;
}

export async function getDiaryEntries(): Promise<DiaryEntry[]> {
  const stored = await AsyncStorage.getItem(KEYS.DIARY_ENTRIES);
  if (stored) return JSON.parse(stored);
  return [];
}

export async function saveDiaryEntry(entry: DiaryEntry): Promise<void> {
  const entries = await getDiaryEntries();
  const idx = entries.findIndex((e) => e.id === entry.id);
  if (idx >= 0) entries[idx] = entry;
  else entries.unshift(entry);
  await AsyncStorage.setItem(KEYS.DIARY_ENTRIES, JSON.stringify(entries));
}

export async function deleteDiaryEntry(entryId: string): Promise<void> {
  const entries = await getDiaryEntries();
  const updated = entries.filter((e) => e.id !== entryId);
  await AsyncStorage.setItem(KEYS.DIARY_ENTRIES, JSON.stringify(updated));
}

export async function getSymptomDefinitions(): Promise<SymptomDefinition[]> {
  const remote = await loadRemoteSymptomDefinitions();
  return remote ?? [];
}
