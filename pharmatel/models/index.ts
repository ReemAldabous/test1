export interface Patient {
  id: string;
  username: string;
  name: string;
  dateOfBirth?: string;
  token?: string;
}

export interface Medicine {
  id: string;
  name: string;
  genericName: string;
  dosageForm:
    | "tablet"
    | "capsule"
    | "liquid"
    | "injection"
    | "cream"
    | "inhaler";
  strength: string;
  manufacturer?: string;
  description?: string;
  sideEffects?: string[];
}

export interface Prescription {
  id: string;
  patientId: string;
  medicineId: string;
  medicine: Medicine;
  dose: string;
  frequency: string;
  foodRequirement: "before_meal" | "after_meal" | "with_meal" | "any_time";
  startDate: string;
  endDate?: string;
  prescribedBy: string;
  notes?: string;
  doseSchedules: DoseSchedule[];
}

export interface DoseSchedule {
  id: string;
  prescriptionId: string;
  scheduledTime: string;
  dayOfWeek?: string[];
  status: "pending" | "taken" | "missed" | "skipped";
  takenAt?: string;
  patientNote?: string;
  observationSessionId?: string;
}

export interface ObservationSession {
  id: string;
  doseScheduleId: string;
  startedAt: string;
  endedAt?: string;
  observations: Observation[];
}

export interface Observation {
  id: string;
  sessionId: string;
  symptomDefinitionId: string;
  symptomDefinition: SymptomDefinition;
  value: string | number | boolean;
  recordedAt: string;
}

export interface SymptomDefinition {
  id: string;
  name: string;
  type: "numeric" | "boolean" | "text";
  unit?: string;
  minValue?: number;
  maxValue?: number;
  description?: string;
}

export interface TodayDose {
  doseSchedule: DoseSchedule;
  prescription: Prescription;
  medicine: Medicine;
}

export interface DiaryMetric {
  id: string;
  type: string;
  label: string;
  value: string | number;
  unit: string;
  icon: string;
}

export interface DiaryEntry {
  id: string;
  patientId: string;
  date: string;
  time: string;
  metrics: DiaryMetric[];
  generalNotes?: string;
  mood?: number;
  createdAt: string;
}

export interface MetricDefinition {
  type: string;
  label: string;
  unit: string;
  icon: string;
  inputType: "numeric" | "text" | "scale";
  min?: number;
  max?: number;
  placeholder?: string;
  color: string;
}

export interface Pharmacy {
  id: string;
  name: string;
  pharmacistName?: string;
  address?: string;
  phone?: string;
  lat?: number;
  lng?: number;
  openHours?: string;
  distance?: string;
  inStock: boolean;
  quantity?: number;
  price?: string;
  rating?: number;
}
