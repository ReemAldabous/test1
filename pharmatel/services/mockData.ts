import type {
  DoseSchedule,
  Medicine,
  ObservationSession,
  Patient,
  Prescription,
  SymptomDefinition,
} from "@/models";

export const MOCK_PATIENT: Patient = {
  id: "patient_001",
  username: "john.doe",
  name: "John Doe",
  dateOfBirth: "1985-03-15",
};

export const MOCK_MEDICINES: Medicine[] = [
  {
    id: "med_001",
    name: "Metformin",
    genericName: "Metformin Hydrochloride",
    dosageForm: "tablet",
    strength: "500mg",
    manufacturer: "Mylan",
    description: "Used to treat type 2 diabetes by lowering blood sugar levels.",
    sideEffects: ["Nausea", "Diarrhea", "Stomach upset"],
  },
  {
    id: "med_002",
    name: "Lisinopril",
    genericName: "Lisinopril",
    dosageForm: "tablet",
    strength: "10mg",
    manufacturer: "Zestril",
    description: "ACE inhibitor used to treat high blood pressure and heart failure.",
    sideEffects: ["Dry cough", "Dizziness", "Headache"],
  },
  {
    id: "med_003",
    name: "Atorvastatin",
    genericName: "Atorvastatin Calcium",
    dosageForm: "tablet",
    strength: "20mg",
    manufacturer: "Pfizer",
    description: "Statin medication used to prevent cardiovascular disease.",
    sideEffects: ["Muscle pain", "Headache", "Nausea"],
  },
  {
    id: "med_004",
    name: "Omeprazole",
    genericName: "Omeprazole",
    dosageForm: "capsule",
    strength: "20mg",
    manufacturer: "AstraZeneca",
    description: "Proton pump inhibitor for acid reflux and stomach ulcers.",
    sideEffects: ["Headache", "Nausea", "Constipation"],
  },
];

export const TODAY = new Date().toISOString().split("T")[0];

export const MOCK_PRESCRIPTIONS: Prescription[] = [
  {
    id: "rx_001",
    patientId: "patient_001",
    medicineId: "med_001",
    medicine: MOCK_MEDICINES[0],
    dose: "500mg",
    frequency: "Twice daily",
    foodRequirement: "after_meal",
    startDate: "2024-01-01",
    endDate: "2027-12-31",
    prescribedBy: "Dr. Sarah Johnson",
    notes: "Take with plenty of water",
    doseSchedules: [
      {
        id: "ds_001a",
        prescriptionId: "rx_001",
        scheduledTime: "08:00",
        status: "taken",
        takenAt: new Date().toISOString(),
        patientNote: "Took with breakfast",
      },
      {
        id: "ds_001b",
        prescriptionId: "rx_001",
        scheduledTime: "20:00",
        status: "pending",
      },
    ],
  },
  {
    id: "rx_002",
    patientId: "patient_001",
    medicineId: "med_002",
    medicine: MOCK_MEDICINES[1],
    dose: "10mg",
    frequency: "Once daily",
    foodRequirement: "any_time",
    startDate: "2024-02-15",
    prescribedBy: "Dr. Michael Chen",
    doseSchedules: [
      {
        id: "ds_002a",
        prescriptionId: "rx_002",
        scheduledTime: "07:00",
        status: "missed",
      },
    ],
  },
  {
    id: "rx_003",
    patientId: "patient_001",
    medicineId: "med_003",
    medicine: MOCK_MEDICINES[2],
    dose: "20mg",
    frequency: "Once daily at night",
    foodRequirement: "after_meal",
    startDate: "2024-03-01",
    prescribedBy: "Dr. Sarah Johnson",
    doseSchedules: [
      {
        id: "ds_003a",
        prescriptionId: "rx_003",
        scheduledTime: "21:00",
        status: "pending",
      },
    ],
  },
  {
    id: "rx_004",
    patientId: "patient_001",
    medicineId: "med_004",
    medicine: MOCK_MEDICINES[3],
    dose: "20mg",
    frequency: "Once daily before breakfast",
    foodRequirement: "before_meal",
    startDate: "2024-03-10",
    endDate: "2027-06-10",
    prescribedBy: "Dr. Emma Wilson",
    doseSchedules: [
      {
        id: "ds_004a",
        prescriptionId: "rx_004",
        scheduledTime: "06:30",
        status: "missed",
      },
    ],
  },
];

export const MOCK_SYMPTOM_DEFINITIONS: SymptomDefinition[] = [
  {
    id: "sym_001",
    name: "Pain Level",
    type: "numeric",
    unit: "/10",
    minValue: 0,
    maxValue: 10,
    description: "Rate your pain from 0 (none) to 10 (severe)",
  },
  {
    id: "sym_002",
    name: "Nausea",
    type: "boolean",
    description: "Are you experiencing nausea?",
  },
  {
    id: "sym_003",
    name: "Dizziness",
    type: "boolean",
    description: "Are you feeling dizzy?",
  },
  {
    id: "sym_004",
    name: "Headache",
    type: "boolean",
    description: "Do you have a headache?",
  },
  {
    id: "sym_005",
    name: "Energy Level",
    type: "numeric",
    unit: "/10",
    minValue: 0,
    maxValue: 10,
    description: "Rate your energy level from 0 (exhausted) to 10 (energetic)",
  },
  {
    id: "sym_006",
    name: "Additional Notes",
    type: "text",
    description: "Any other symptoms or observations",
  },
];

export const MOCK_OBSERVATION_SESSIONS: ObservationSession[] = [
  {
    id: "obs_001",
    doseScheduleId: "ds_001a",
    startedAt: new Date().toISOString(),
    endedAt: new Date().toISOString(),
    observations: [
      {
        id: "ob_001",
        sessionId: "obs_001",
        symptomDefinitionId: "sym_001",
        symptomDefinition: MOCK_SYMPTOM_DEFINITIONS[0],
        value: 3,
        recordedAt: new Date().toISOString(),
      },
      {
        id: "ob_002",
        sessionId: "obs_001",
        symptomDefinitionId: "sym_002",
        symptomDefinition: MOCK_SYMPTOM_DEFINITIONS[1],
        value: false,
        recordedAt: new Date().toISOString(),
      },
    ],
  },
];
