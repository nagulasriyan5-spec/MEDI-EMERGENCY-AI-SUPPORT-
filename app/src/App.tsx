import { useEffect, useState, useRef } from 'react';
import { 
  Ambulance, Hospital as HospitalIcon, Phone, AlertCircle, User, MapPin, 
  Droplet, Stethoscope, Activity, ChevronRight, ChevronLeft,
  Camera, Upload, CheckCircle, XCircle, Clock, Bed, Wind,
  Flame, Shield, Baby, Users, AlertTriangle, Heart, Plus, Download, Share2, Pill,
  Languages, Copyright, Scan, Brain, Fingerprint, ScanFace, ClipboardList, MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { translations, type Language } from './i18n/translations';
import { translateRuntimeText } from './i18n/runtimeTranslations';
import { hospitals, type Hospital } from './utils/hospitalDatabase';
import { analyzeEmergency, analyzePhoto, type AIAnalysis, type PatientData } from './utils/aiEngine';
import './App.css';

type Role = 'none' | 'public' | 'hospital' | 'pharmacy' | 'admin';
type View = 'home' | 'photo' | 'form' | 'results' | 'hospitals' | 'bloodbank' | 'firstaid' | 'dashboard' | 'appointments' | 'care' | 'pharmacy' | 'safety' | 'women-health';
type LoginPortal = 'public' | 'hospital' | 'pharmacy' | 'admin';
type ManagedPortal = 'public' | 'hospital' | 'pharmacy';
type BiometricMode = 'fingerprint' | 'face';
type AuthStage = 'register' | 'login';

interface EmergencyContact {
  name: string;
  number: string;
  icon: React.ReactNode;
  color: string;
}

type TriageWorkflowStatus = 'waiting' | 'in-treatment' | 'admitted' | 'discharged';

interface MedicationStock {
  id: number;
  name: string;
  available: number;
  reorderLevel: number;
  unit: string;
}

interface EmergencyAlertItem {
  id: number;
  hospitalId: number;
  patient: string;
  severity: string;
  status: 'pending' | 'accepted' | 'rejected';
  remainingSeconds: number;
  createdAtMs: number;
}

interface AppointmentItem {
  id: number;
  hospitalId: number;
  hospitalName: string;
  patientName: string;
  contactNumber: string;
  reason: string;
  appointmentAt: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  createdAt: string;
}

interface PrescriptionItem {
  id: number;
  hospitalId: number;
  hospitalName: string;
  patientName: string;
  doctorName: string;
  medicines: string;
  advice: string;
  createdAt: string;
}

interface ReportAnalysisResult {
  severity: 'urgent' | 'attention' | 'stable';
  summary: string;
  nextSteps: string[];
  cause: string;
}

interface ReportReferralItem {
  id: number;
  hospitalId: number;
  hospitalName: string;
  patientName: string;
  doctorSpecialty: string;
  severity: string;
  cause: string;
  summary: string;
  source: string;
  reportExcerpt: string;
  createdAt: string;
}

interface FirstAidCoachPlan {
  analysis: AIAnalysis;
  immediateActions: string[];
  avoidActions: string[];
  monitoringChecks: string[];
  escalationTrigger: string;
}

type WomenLifeStage = 'adolescent' | 'reproductive' | 'pregnancy' | 'postpartum' | 'perimenopause' | 'postmenopause';
type PregnancyTrimester = 'first' | 'second' | 'third';

interface WomenHealthPlan {
  riskLevel: 'high' | 'moderate' | 'routine';
  focusAreas: string[];
  screeningPlan: string[];
  medicationGuide: string[];
  redFlags: string[];
  pregnancyPlan: string[];
  pregnancyChecklist: string[];
  trimesterLabel: string;
  estimatedWeek: number | null;
  dueDate: string;
  majorProblemTracks: {
    title: string;
    severity: 'high' | 'moderate' | 'watch' | 'low';
    summary: string;
    actions: string[];
  }[];
  sectionOrder: string[];
}

interface DoctorQueryItem {
  id: number;
  hospitalId: number;
  hospitalName: string;
  patientName: string;
  department: string;
  disease: string;
  question: string;
  status: 'pending' | 'answered';
  doctorName: string;
  answer: string;
  createdAt: string;
  answeredAt: string;
}

interface LocationPoint {
  lat: number;
  lng: number;
  accuracy: number;
  updatedAt: string;
}

interface NearbyPharmacyItem {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  distanceKm: number;
}

interface EmergencyMedicineOrderItem {
  id: number;
  pharmacyName: string;
  patientName: string;
  patientPhone: string;
  medicine: string;
  quantity: number;
  notes: string;
  locationLabel: string;
  status: 'pending' | 'accepted' | 'completed' | 'rejected';
  remainingSeconds: number;
  createdAt: string;
}

interface PharmacyPortalAccount {
  id: number;
  key: string;
  name: string;
  area: string;
  phone: string;
  password: string;
  kind: 'pharmacy' | 'medical-shop';
  open24x7: boolean;
  homeDelivery: boolean;
  avgDeliveryMins: number;
  rating: number;
  licenseStatus: 'verified' | 'pending';
}

interface PharmacyInventoryItem {
  id: number;
  name: string;
  stock: number;
  minStock: number;
  unit: string;
}

interface MedicineCatalogItem {
  id: number;
  name: string;
  category: string;
  otc: boolean;
}

interface PublicIssueItem {
  id: number;
  title: string;
  detail: string;
  priority: 'high' | 'medium' | 'low';
  status: 'open' | 'in-progress' | 'resolved';
  createdAt: string;
}

interface CrashIncidentLogItem {
  id: number;
  status: 'detected' | 'dispatched' | 'cancelled';
  message: string;
  createdAt: string;
}

interface CrashAIFeatures {
  gForce: number;
  jerk: number;
  orientationShift: number;
  speedKmph: number;
  timeRisk: number;
  roadRisk: number;
}

interface CrashAIPrediction {
  crashProbability: number;
  severityClass: 'low' | 'medium' | 'high';
  confidence: number;
  falsePositiveRisk: number;
  modelVotes: { model: string; score: number }[];
  reasons: string[];
  recommendedActions: string[];
}

interface PortalSettings {
  maintenanceMode: boolean;
  publicEnabled: boolean;
  hospitalEnabled: boolean;
  pharmacyEnabled: boolean;
}

interface AdminStats {
  hospitalsRegistered: number;
  pendingAppointments: number;
  prescriptionsIssued: number;
  pendingDoctorQueries: number;
  pendingPharmacyOrders: number;
  acceptedPharmacyOrders: number;
  completedPharmacyOrders: number;
  crashIncidentCount: number;
  activePharmacyOps: number;
}

interface BlockchainRecordItem {
  id: number;
  blockNumber: number;
  previousHash: string;
  payloadHash: string;
  hash: string;
  eventType: string;
  entityType: string;
  entityId: string;
  actor: string;
  hospitalId: number;
  summary: string;
  timestamp: string;
}

interface BlockchainVerification {
  valid: boolean;
  checkedBlocks: number;
  latestBlockNumber: number;
  latestHash: string;
  invalidBlockNumber: number | null;
  reason: string;
  verifiedAt: string;
}

interface MedicineDemandTrend {
  medicine: string;
  weeklyDemand: number[];
}

interface DrugRecallItem {
  id: number;
  medicine: string;
  batch: string;
  reason: string;
  severity: 'critical' | 'moderate';
  status: 'active' | 'resolved';
}

interface HyderabadZoneSLA {
  zone: string;
  avgMinutes: number;
  delayedCount: number;
}

interface SeasonalAwarenessFrame {
  season: string;
  headline: string;
  diseases: string[];
  awareness: string[];
  precautions: string[];
}

interface WomenAwarenessFrame {
  title: string;
  category: string;
  riskSignals: string[];
  prevention: string[];
  whenToSeekCare: string;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const emergencyContacts: EmergencyContact[] = [
  { name: 'Emergency Ambulance', number: '108', icon: <Ambulance className="w-6 h-6" />, color: 'bg-red-500' },
  { name: 'National Ambulance', number: '102', icon: <Ambulance className="w-6 h-6" />, color: 'bg-red-600' },
  { name: 'Police', number: '100', icon: <Shield className="w-6 h-6" />, color: 'bg-blue-600' },
  { name: 'Fire Brigade', number: '101', icon: <Flame className="w-6 h-6" />, color: 'bg-orange-500' },
  { name: 'Universal Emergency', number: '112', icon: <AlertCircle className="w-6 h-6" />, color: 'bg-purple-600' },
  { name: 'Medical Helpline', number: '104', icon: <Stethoscope className="w-6 h-6" />, color: 'bg-green-600' },
  { name: 'Women Helpline', number: '1091', icon: <Users className="w-6 h-6" />, color: 'bg-pink-600' },
  { name: 'Child Helpline', number: '1098', icon: <Baby className="w-6 h-6" />, color: 'bg-yellow-500' },
  { name: 'Senior Citizen', number: '14567', icon: <Heart className="w-6 h-6" />, color: 'bg-teal-600' },
  { name: 'Disaster Management', number: '1070', icon: <AlertTriangle className="w-6 h-6" />, color: 'bg-indigo-600' },
];

const defaultMedicationStock: MedicationStock[] = [
  { id: 1, name: 'O+ Blood Units', available: 22, reorderLevel: 15, unit: 'units' },
  { id: 2, name: 'Adrenaline', available: 14, reorderLevel: 10, unit: 'vials' },
  { id: 3, name: 'IV Saline', available: 60, reorderLevel: 30, unit: 'bags' },
  { id: 4, name: 'Pain Killers', available: 48, reorderLevel: 20, unit: 'strips' },
  { id: 5, name: 'Antibiotics', available: 18, reorderLevel: 12, unit: 'packs' },
];

const SEASONAL_AWARENESS_BY_MONTH: SeasonalAwarenessFrame[] = [
  {
    season: 'Winter Respiratory Season',
    headline: 'High vigilance for respiratory infections and flu-like viruses.',
    diseases: ['Influenza (Flu)', 'COVID-19 variants', 'RSV', 'Pneumonia', 'Viral fever'],
    awareness: [
      'Older adults, children, and people with chronic illness are higher risk.',
      'Persistent fever, breathlessness, chest pain, or low oxygen needs urgent care.',
      'Avoid self-medication with antibiotics for viral infections.',
    ],
    precautions: [
      'Wear mask in crowded indoor spaces if symptomatic.',
      'Hydrate, rest, and isolate when fever/cough is present.',
      'Monitor SpO2 and seek hospital support if below safe range.',
    ],
  },
  {
    season: 'Summer Heat and Water-borne Season',
    headline: 'Heat-related illness and contamination-driven infections increase.',
    diseases: ['Heat stroke', 'Dehydration', 'Typhoid', 'Acute gastroenteritis', 'Hepatitis A/E'],
    awareness: [
      'Children and outdoor workers are vulnerable to rapid dehydration.',
      'Unsafe water and street food raise GI infection risk.',
      'Confusion, fainting, very high temperature are emergency signs.',
    ],
    precautions: [
      'Drink safe water frequently and avoid direct afternoon heat exposure.',
      'Eat freshly cooked food and avoid stale uncovered meals.',
      'Use ORS early for vomiting/diarrhea and seek care for persistent symptoms.',
    ],
  },
  {
    season: 'Monsoon Vector-borne Season',
    headline: 'Mosquito-borne diseases and viral outbreaks need early detection.',
    diseases: ['Dengue', 'Chikungunya', 'Malaria', 'Leptospirosis', 'Viral fever clusters'],
    awareness: [
      'Fever with body pain, rash, vomiting, or bleeding signs must be evaluated quickly.',
      'Water stagnation near homes drives mosquito breeding.',
      'Platelet panic should be avoided; clinical status matters more.',
    ],
    precautions: [
      'Use mosquito repellents, full sleeves, and eliminate stagnant water.',
      'Do not take painkillers without advice when dengue is suspected.',
      'Seek hospital testing early for persistent or high fever.',
    ],
  },
  {
    season: 'Post-Monsoon Mixed Infection Season',
    headline: 'Respiratory and vector illnesses overlap; watch for mixed symptoms.',
    diseases: ['Seasonal flu', 'Dengue tail cases', 'Typhoid', 'Sinus/respiratory infections', 'Norovirus outbreaks'],
    awareness: [
      'Mixed symptoms can hide severity; early medical triage is safer.',
      'Household spread is common in schools and workplaces.',
      'Uncontrolled diabetes or kidney disease can worsen outcomes.',
    ],
    precautions: [
      'Hand hygiene and cough etiquette reduce spread significantly.',
      'Complete doctor-advised treatment and hydration plans.',
      'Book timely consultation for persistent fever beyond 48 hours.',
    ],
  },
];

const LIVE_AWARENESS_NOTICES = [
  'Live Watch: Fever + breathlessness cases rising in urban clusters.',
  'Live Watch: Mosquito density alerts active in water-logging zones.',
  'Live Watch: Viral gastroenteritis clusters reported in schools/workplaces.',
  'Live Watch: Senior citizens with chronic disease should monitor symptoms early.',
];

const WOMEN_AWARENESS_FEED: WomenAwarenessFrame[] = [
  {
    title: 'Breast Cancer Early Awareness',
    category: 'Cancer Screening',
    riskSignals: ['New lump in breast/underarm', 'Nipple inversion or discharge', 'Skin dimpling or persistent redness'],
    prevention: ['Monthly self-breast awareness check', 'Clinical exam and mammogram by age/risk profile', 'Maintain activity, healthy weight, and low alcohol'],
    whenToSeekCare: 'If any new breast lump or persistent change appears for more than 2 weeks, book a breast clinic visit quickly.',
  },
  {
    title: 'Cervical Cancer and HPV Awareness',
    category: 'Reproductive Health',
    riskSignals: ['Bleeding after intercourse', 'Bleeding between periods', 'Persistent foul vaginal discharge or pelvic pain'],
    prevention: ['HPV vaccination as per age guidance', 'Pap/HPV screening at doctor-recommended interval', 'Practice safer sex and genital hygiene'],
    whenToSeekCare: 'Do not ignore abnormal bleeding or chronic discharge; schedule gynecology screening early.',
  },
  {
    title: 'Menstrual Hygiene and Pad Safety',
    category: 'Menstrual Care',
    riskSignals: ['Bad odor, itching, rash, irritation', 'Recurrent fungal infection', 'Skin breakdown in genital area'],
    prevention: ['Change pad every 4-6 hours', 'Use breathable cotton underwear', 'Keep area dry and avoid scented products'],
    whenToSeekCare: 'If irritation or discharge persists for 3 days or with fever/pain, seek medical care.',
  },
  {
    title: 'UTI and Vaginal Infection Awareness',
    category: 'Infection Prevention',
    riskSignals: ['Burning urine', 'Lower abdominal pain', 'Thick/foul discharge or fever'],
    prevention: ['Hydrate well and avoid delayed urination', 'Front-to-back cleansing habits', 'Avoid repeated self-antibiotic use'],
    whenToSeekCare: 'Fever, flank pain, vomiting, pregnancy, or worsening urinary symptoms need urgent evaluation.',
  },
  {
    title: 'PCOS, Thyroid, and Metabolic Health',
    category: 'Hormonal Health',
    riskSignals: ['Irregular cycles', 'Sudden weight changes', 'Acne, hair growth changes, fatigue'],
    prevention: ['Track cycles and sleep', 'Balanced plate with protein and fiber', 'Periodic thyroid, sugar, and lipid checks'],
    whenToSeekCare: 'If cycles stay irregular for 3 months or symptoms worsen, get endocrine/gyne review.',
  },
  {
    title: 'Pregnancy Warning Awareness',
    category: 'Maternal Health',
    riskSignals: ['Bleeding or fluid leak', 'Severe headache/blurred vision', 'Reduced fetal movement'],
    prevention: ['Regular antenatal visits', 'Blood pressure and glucose monitoring', 'Emergency contact and hospital readiness plan'],
    whenToSeekCare: 'Any red-flag symptom in pregnancy needs same-day obstetric consultation or emergency care.',
  },
  {
    title: 'Postpartum Mental and Physical Recovery',
    category: 'Postpartum Care',
    riskSignals: ['Heavy bleeding, high fever', 'Sadness/anxiety lasting beyond 2 weeks', 'Breast pain, feeding difficulty'],
    prevention: ['Postnatal review in first 6 weeks', 'Family support and sleep protection', 'Early lactation counseling'],
    whenToSeekCare: 'Urgent help is needed for suicidal thoughts, severe bleeding, chest pain, or breathlessness.',
  },
  {
    title: 'Violence, Consent, and Safety Awareness',
    category: 'Safety and Rights',
    riskSignals: ['Threats, stalking, forced control', 'Physical or sexual violence', 'Fear of returning home'],
    prevention: ['Keep trusted contacts informed', 'Use emergency helplines 1091/112', 'Preserve evidence and seek legal-medical support'],
    whenToSeekCare: 'If immediate danger exists, trigger safety alert and contact emergency services right away.',
  },
];

const hospitalCredentials: Record<number, string> = {
  1: 'hospital123',
  2: 'hospital123',
  3: 'hospital123',
  4: 'hospital123',
  5: 'apollo123',
  6: 'lifecare123',
  7: 'hospital123',
  8: 'hospital123',
  9: 'hospital123',
  10: 'hospital123',
  11: 'hospital123',
  12: 'hospital123',
};

const hospitalAuthKeysById: Record<number, string> = {
  1: 'citygeneral',
  2: 'osmania',
  3: 'nims',
  4: 'gandhi',
  5: 'apollo',
  6: 'lifecare',
  7: 'yashoda',
  8: 'kims',
  9: 'continental',
  10: 'srisai',
  11: 'gleneagles',
  12: 'aig',
};

const pharmacyPortalAccounts: PharmacyPortalAccount[] = [
  { id: 1, key: 'apollo-pharmacy-jh', name: 'Apollo Pharmacy', area: 'Jubilee Hills', phone: '040-40000011', password: 'pharmacy123', kind: 'pharmacy', open24x7: true, homeDelivery: true, avgDeliveryMins: 24, rating: 4.6, licenseStatus: 'verified' },
  { id: 2, key: 'medplus-banjara', name: 'MedPlus', area: 'Banjara Hills', phone: '040-40000012', password: 'pharmacy123', kind: 'pharmacy', open24x7: true, homeDelivery: true, avgDeliveryMins: 22, rating: 4.5, licenseStatus: 'verified' },
  { id: 3, key: 'wellness-hitech', name: 'Wellness Forever', area: 'Hitech City', phone: '040-40000013', password: 'pharmacy123', kind: 'pharmacy', open24x7: true, homeDelivery: true, avgDeliveryMins: 19, rating: 4.4, licenseStatus: 'verified' },
  { id: 4, key: 'careplus-gachibowli', name: 'CarePlus Pharmacy', area: 'Gachibowli', phone: '040-40000014', password: 'pharmacy123', kind: 'medical-shop', open24x7: false, homeDelivery: true, avgDeliveryMins: 31, rating: 4.2, licenseStatus: 'verified' },
  { id: 5, key: 'srinivasa-amberpet', name: 'Srinivasa Medical & General', area: 'Amberpet', phone: '040-40000015', password: 'pharmacy123', kind: 'medical-shop', open24x7: false, homeDelivery: false, avgDeliveryMins: 45, rating: 4.0, licenseStatus: 'verified' },
  { id: 6, key: 'lifeline-kukatpally', name: 'LifeLine Pharmacy', area: 'Kukatpally', phone: '040-40000016', password: 'pharmacy123', kind: 'pharmacy', open24x7: true, homeDelivery: true, avgDeliveryMins: 28, rating: 4.3, licenseStatus: 'verified' },
  { id: 7, key: 'metro-miyapur', name: 'Metro Medical Shop', area: 'Miyapur', phone: '040-40000017', password: 'pharmacy123', kind: 'medical-shop', open24x7: false, homeDelivery: true, avgDeliveryMins: 34, rating: 4.1, licenseStatus: 'verified' },
  { id: 8, key: 'healthfirst-secunderabad', name: 'HealthFirst Pharmacy', area: 'Secunderabad', phone: '040-40000018', password: 'pharmacy123', kind: 'pharmacy', open24x7: true, homeDelivery: true, avgDeliveryMins: 23, rating: 4.5, licenseStatus: 'verified' },
  { id: 9, key: 'greencross-tarnaka', name: 'GreenCross Medical', area: 'Tarnaka', phone: '040-40000019', password: 'pharmacy123', kind: 'medical-shop', open24x7: false, homeDelivery: true, avgDeliveryMins: 38, rating: 4.0, licenseStatus: 'verified' },
  { id: 10, key: 'suncare-lb-nagar', name: 'SunCare Pharmacy', area: 'LB Nagar', phone: '040-40000020', password: 'pharmacy123', kind: 'pharmacy', open24x7: true, homeDelivery: true, avgDeliveryMins: 27, rating: 4.2, licenseStatus: 'verified' },
  { id: 11, key: 'navodaya-mehdipatnam', name: 'Navodaya Medicals', area: 'Mehdipatnam', phone: '040-40000021', password: 'pharmacy123', kind: 'medical-shop', open24x7: false, homeDelivery: false, avgDeliveryMins: 42, rating: 3.9, licenseStatus: 'pending' },
  { id: 12, key: 'prime-pharma-malakpet', name: 'Prime Pharma', area: 'Malakpet', phone: '040-40000022', password: 'pharmacy123', kind: 'pharmacy', open24x7: true, homeDelivery: true, avgDeliveryMins: 26, rating: 4.3, licenseStatus: 'verified' },
  { id: 13, key: 'citymed-dilsukhnagar', name: 'CityMed Medical Shop', area: 'Dilsukhnagar', phone: '040-40000023', password: 'pharmacy123', kind: 'medical-shop', open24x7: false, homeDelivery: true, avgDeliveryMins: 36, rating: 4.0, licenseStatus: 'verified' },
  { id: 14, key: 'rapidcare-kompally', name: 'RapidCare Pharmacy', area: 'Kompally', phone: '040-40000024', password: 'pharmacy123', kind: 'pharmacy', open24x7: true, homeDelivery: true, avgDeliveryMins: 29, rating: 4.4, licenseStatus: 'verified' },
];

const defaultPharmacyInventory: PharmacyInventoryItem[] = [
  { id: 1, name: 'Paracetamol 650mg', stock: 120, minStock: 40, unit: 'strips' },
  { id: 2, name: 'ORS Sachets', stock: 85, minStock: 30, unit: 'packs' },
  { id: 3, name: 'Insulin Vials', stock: 32, minStock: 12, unit: 'vials' },
  { id: 4, name: 'Salbutamol Inhalers', stock: 26, minStock: 10, unit: 'units' },
  { id: 5, name: 'Bandages / Gauze', stock: 140, minStock: 50, unit: 'packs' },
];

const MEDICINE_CATALOG: MedicineCatalogItem[] = [
  { id: 1, name: 'Paracetamol 650mg', category: 'Fever/Pain', otc: true },
  { id: 2, name: 'Ibuprofen 400mg', category: 'Pain/Inflammation', otc: true },
  { id: 3, name: 'Cetirizine 10mg', category: 'Allergy', otc: true },
  { id: 4, name: 'ORS Sachets', category: 'Dehydration', otc: true },
  { id: 5, name: 'Pantoprazole 40mg', category: 'Acidity', otc: true },
  { id: 6, name: 'Azithromycin 500mg', category: 'Antibiotic', otc: false },
  { id: 7, name: 'Amoxicillin 500mg', category: 'Antibiotic', otc: false },
  { id: 8, name: 'Dolo 650', category: 'Fever/Pain', otc: true },
  { id: 9, name: 'Insulin Vials', category: 'Diabetes', otc: false },
  { id: 10, name: 'Metformin 500mg', category: 'Diabetes', otc: false },
  { id: 11, name: 'Telmisartan 40mg', category: 'Blood Pressure', otc: false },
  { id: 12, name: 'Amlodipine 5mg', category: 'Blood Pressure', otc: false },
  { id: 13, name: 'Salbutamol Inhalers', category: 'Respiratory', otc: false },
  { id: 14, name: 'Budesonide Inhaler', category: 'Respiratory', otc: false },
  { id: 15, name: 'Vitamin C Tablets', category: 'Supplements', otc: true },
  { id: 16, name: 'Multivitamin Capsules', category: 'Supplements', otc: true },
  { id: 17, name: 'Bandages / Gauze', category: 'First Aid', otc: true },
  { id: 18, name: 'Betadine Solution', category: 'First Aid', otc: true },
  { id: 19, name: 'Nebulizer Solution', category: 'Respiratory', otc: false },
  { id: 20, name: 'Ondansetron 4mg', category: 'Nausea/Vomiting', otc: false },
];

const HYDERABAD_AREAS = [
  'Jubilee Hills',
  'Banjara Hills',
  'Hitech City',
  'Gachibowli',
  'Kukatpally',
  'Miyapur',
  'Secunderabad',
  'LB Nagar',
  'Mehdipatnam',
  'Dilsukhnagar',
];

const MEDICINE_DEMAND_TRENDS: MedicineDemandTrend[] = [
  { medicine: 'Paracetamol 650mg', weeklyDemand: [120, 145, 132, 160, 148, 172, 168] },
  { medicine: 'ORS Sachets', weeklyDemand: [80, 92, 88, 96, 110, 105, 118] },
  { medicine: 'Insulin Vials', weeklyDemand: [40, 44, 47, 46, 52, 55, 53] },
  { medicine: 'Salbutamol Inhalers', weeklyDemand: [28, 31, 35, 33, 38, 41, 39] },
  { medicine: 'Ondansetron 4mg', weeklyDemand: [56, 61, 59, 67, 63, 74, 71] },
];

const DRUG_RECALL_DATA: DrugRecallItem[] = [
  { id: 1, medicine: 'Amoxicillin 500mg', batch: 'AMX-24-09A', reason: 'Packaging integrity issue', severity: 'moderate', status: 'active' },
  { id: 2, medicine: 'Nebulizer Solution', batch: 'NEB-24-11F', reason: 'Contamination risk under review', severity: 'critical', status: 'active' },
  { id: 3, medicine: 'Multivitamin Capsules', batch: 'MVC-24-03C', reason: 'Labeling mismatch', severity: 'moderate', status: 'resolved' },
];

const HYDERABAD_ZONE_SLA: HyderabadZoneSLA[] = [
  { zone: 'West (Hitech/Gachibowli)', avgMinutes: 24, delayedCount: 3 },
  { zone: 'North (Secunderabad/Kompally)', avgMinutes: 33, delayedCount: 8 },
  { zone: 'South (Mehdipatnam/LB Nagar)', avgMinutes: 29, delayedCount: 5 },
  { zone: 'East (Dilsukhnagar/Malakpet)', avgMinutes: 31, delayedCount: 6 },
  { zone: 'Central (Banjara/Jubilee)', avgMinutes: 21, delayedCount: 2 },
];

const generateSeedEmergencyOrders = (): EmergencyMedicineOrderItem[] => {
  const patientNames = [
    'Ravi Kumar', 'Suma Reddy', 'Arjun Rao', 'Meena Devi', 'Kiran Varma',
    'Sandeep Goud', 'Priya Nair', 'Rahul Teja', 'Lakshmi Prasad', 'Anita Sharma',
  ];
  const notes = [
    'Urgent refill needed tonight',
    'Senior citizen patient - high priority',
    'Prescription uploaded in app',
    'Home delivery requested',
    'Post-surgery medication required',
  ];
  const now = Date.now();
  let orderId = 100000;
  const orders: EmergencyMedicineOrderItem[] = [];

  pharmacyPortalAccounts.forEach((pharmacy, pIndex) => {
    for (let i = 0; i < 16; i += 1) {
      const med = MEDICINE_CATALOG[(pIndex * 3 + i) % MEDICINE_CATALOG.length];
      const area = HYDERABAD_AREAS[(pIndex + i) % HYDERABAD_AREAS.length];
      const status: EmergencyMedicineOrderItem['status'] =
        i < 8 ? 'pending' : i < 12 ? 'accepted' : i < 15 ? 'completed' : 'rejected';
      const remainingSeconds = status === 'pending'
        ? 2400 - i * 35
        : status === 'accepted'
          ? 1200 - i * 20
          : 0;

      orders.push({
        id: orderId++,
        pharmacyName: pharmacy.name,
        patientName: patientNames[(i + pIndex) % patientNames.length],
        patientPhone: `9${(870000000 + pIndex * 10000 + i * 73).toString().padStart(9, '0')}`,
        medicine: med.name,
        quantity: (i % 3) + 1,
        notes: notes[(i + pIndex) % notes.length],
        locationLabel: `${area}, Hyderabad`,
        status,
        remainingSeconds: Math.max(0, remainingSeconds),
        createdAt: new Date(now - (i * 7 + pIndex * 3) * 60000).toLocaleString(),
      });
    }
  });

  return orders;
};

const API_BASE_URL = (import.meta.env.VITE_API_URL ?? '').trim().replace(/\/$/, '');
const getApiUrl = (path: string) => (API_BASE_URL ? `${API_BASE_URL}${path}` : path);
const HOSPITAL_BIOMETRIC_KEY = 'medirescue_hospital_biometric';
const PHARMACY_BIOMETRIC_KEY = 'medirescue_pharmacy_biometric';
const ADMIN_BIOMETRIC_KEY = 'medirescue_admin_biometric';
const WEBAUTHN_CREDENTIALS_KEY = 'medirescue_webauthn_credentials';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';

const BrandMark = ({ bpm, compact = false, subtitle }: { bpm?: number; compact?: boolean; subtitle?: string }) => (
  <div className={`brand-mark ${compact ? 'brand-mark-compact' : ''}`}>
    <div className="brand-core" aria-hidden="true">
      <div className="brand-core-glow" />
      <div className="brand-core-plus">
        <Plus className="w-5 h-5" />
      </div>
    </div>
    <div className="brand-copy">
      <div className="brand-title-row">
        <span className="brand-title">Medi - EMERGENCY AI SUPPORT</span>
        {typeof bpm === 'number' && (
          <span className="brand-rate">
            <Activity className="w-3.5 h-3.5" />
            <span>{bpm} BPM</span>
            <span className="brand-rate-dot" />
          </span>
        )}
      </div>
      {subtitle && <p className="brand-subtitle">{subtitle}</p>}
    </div>
  </div>
);

function App() {
  const [role, setRole] = useState<Role>('none');
  const [view, setView] = useState<View>('home');
  const [language, setLanguage] = useState<Language>('en');
  const [showEmergencyContacts, setShowEmergencyContacts] = useState(false);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [activeLoginPortal, setActiveLoginPortal] = useState<LoginPortal>('public');
  const [authStage, setAuthStage] = useState<AuthStage>('register');
  const [publicLoginName, setPublicLoginName] = useState('');
  const [publicPhoneNumber, setPublicPhoneNumber] = useState('');
  const [hospitalLoginId, setHospitalLoginId] = useState('');
  const [hospitalLoginPassword, setHospitalLoginPassword] = useState('');
  const [pharmacyLoginId, setPharmacyLoginId] = useState('');
  const [pharmacyLoginPassword, setPharmacyLoginPassword] = useState('');
  const [adminLoginName, setAdminLoginName] = useState('');
  const [adminLoginPassword, setAdminLoginPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [biometricStatus, setBiometricStatus] = useState('');
  const [biometricLoading, setBiometricLoading] = useState<BiometricMode | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState<BiometricMode | null>(null);
  const [adminMaintenanceMode, setAdminMaintenanceMode] = useState(false);
  const [adminPortalAccess, setAdminPortalAccess] = useState<Record<ManagedPortal, boolean>>({
    public: true,
    hospital: true,
    pharmacy: true,
  });
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [blockchainRecords, setBlockchainRecords] = useState<BlockchainRecordItem[]>([]);
  const [blockchainVerification, setBlockchainVerification] = useState<BlockchainVerification | null>(null);
  const [livePulse, setLivePulse] = useState(76);
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const [hospitalBiometric, setHospitalBiometric] = useState<Record<number, { fingerprint: boolean; face: boolean }>>(() => {
    try {
      const saved = window.localStorage.getItem(HOSPITAL_BIOMETRIC_KEY);
      if (!saved) return {};
      const parsed = JSON.parse(saved) as Record<string, { fingerprint?: boolean; face?: boolean }>;
      const normalized: Record<number, { fingerprint: boolean; face: boolean }> = {};
      Object.entries(parsed).forEach(([key, value]) => {
        const id = Number(key);
        if (id > 0) {
          normalized[id] = { fingerprint: Boolean(value.fingerprint), face: Boolean(value.face) };
        }
      });
      return normalized;
    } catch {
      return {};
    }
  });
  const [pharmacyBiometric, setPharmacyBiometric] = useState<Record<number, { fingerprint: boolean; face: boolean }>>(() => {
    try {
      const saved = window.localStorage.getItem(PHARMACY_BIOMETRIC_KEY);
      if (!saved) return {};
      const parsed = JSON.parse(saved) as Record<string, { fingerprint?: boolean; face?: boolean }>;
      const normalized: Record<number, { fingerprint: boolean; face: boolean }> = {};
      Object.entries(parsed).forEach(([key, value]) => {
        const id = Number(key);
        if (id > 0) {
          normalized[id] = { fingerprint: Boolean(value.fingerprint), face: Boolean(value.face) };
        }
      });
      return normalized;
    } catch {
      return {};
    }
  });
  const [adminBiometric, setAdminBiometric] = useState<{ fingerprint: boolean; face: boolean }>(() => {
    try {
      const saved = window.localStorage.getItem(ADMIN_BIOMETRIC_KEY);
      if (!saved) return { fingerprint: false, face: false };
      const parsed = JSON.parse(saved) as { fingerprint?: boolean; face?: boolean };
      return { fingerprint: Boolean(parsed.fingerprint), face: Boolean(parsed.face) };
    } catch {
      return { fingerprint: false, face: false };
    }
  });
  const [webauthnCredentialsByUser, setWebauthnCredentialsByUser] = useState<Record<string, string[]>>(() => {
    try {
      const saved = window.localStorage.getItem(WEBAUTHN_CREDENTIALS_KEY);
      if (!saved) return {};
      const parsed = JSON.parse(saved) as Record<string, unknown>;
      const normalized: Record<string, string[]> = {};
      Object.entries(parsed).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          normalized[key] = value.filter((id): id is string => typeof id === 'string');
        }
      });
      return normalized;
    } catch {
      return {};
    }
  });
  
  // Analysis states
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [photoUploaded, setPhotoUploaded] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [detectedInjury, setDetectedInjury] = useState<{type: string; bodyPart: string; severity: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form states
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientGender, setPatientGender] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [firstAidSymptomsDraft, setFirstAidSymptomsDraft] = useState('');
  const [firstAidConcern, setFirstAidConcern] = useState('');
  const [firstAidCoachPlan, setFirstAidCoachPlan] = useState<FirstAidCoachPlan | null>(null);
  const [firstAidCoachError, setFirstAidCoachError] = useState('');
  const [womenLifeStage, setWomenLifeStage] = useState<WomenLifeStage>('reproductive');
  const [womenSymptomsInput, setWomenSymptomsInput] = useState('');
  const [womenCurrentMedicines, setWomenCurrentMedicines] = useState('');
  const [pregnancyTrimester, setPregnancyTrimester] = useState<PregnancyTrimester>('first');
  const [pregnancyDueDate, setPregnancyDueDate] = useState('');
  const [pregnancyWarningSignals, setPregnancyWarningSignals] = useState('');
  const [womenHealthPlan, setWomenHealthPlan] = useState<WomenHealthPlan | null>(null);
  const [womenSafetyDetected, setWomenSafetyDetected] = useState(false);
  const [womenSafetyCountdown, setWomenSafetyCountdown] = useState(0);
  const [womenSafetyStatusMessage, setWomenSafetyStatusMessage] = useState('');
  const [womenDoctorHospitalId, setWomenDoctorHospitalId] = useState('');
  const [womenDoctorDepartment, setWomenDoctorDepartment] = useState('Gynecology');
  const [womenDoctorCondition, setWomenDoctorCondition] = useState('');
  const [womenDoctorQuestion, setWomenDoctorQuestion] = useState('');
  const [womenDoctorStatusMessage, setWomenDoctorStatusMessage] = useState('');
  const [location, setLocation] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [allergies, setAllergies] = useState('');
  const [knownConditions, setKnownConditions] = useState('');
  const [painScale, setPainScale] = useState(5);
  const [bodyTemperature, setBodyTemperature] = useState('98.4');
  const [oxygenSaturation, setOxygenSaturation] = useState('98');
  const [pulseRate, setPulseRate] = useState('82');
  
  // Hospital dashboard states
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [selectedPharmacyPortal, setSelectedPharmacyPortal] = useState<PharmacyPortalAccount | null>(null);
  const [emergencyAlerts, setEmergencyAlerts] = useState<EmergencyAlertItem[]>([]);
  const [triageStatusByAlertId, setTriageStatusByAlertId] = useState<Record<number, TriageWorkflowStatus>>({});
  const [medicationStock, setMedicationStock] = useState<MedicationStock[]>(defaultMedicationStock);
  const [dischargeNote, setDischargeNote] = useState('');
  const [clinicalSaved, setClinicalSaved] = useState(false);
  const [publicAppointments, setPublicAppointments] = useState<AppointmentItem[]>([]);
  const [hospitalAppointments, setHospitalAppointments] = useState<AppointmentItem[]>([]);
  const [publicPrescriptions, setPublicPrescriptions] = useState<PrescriptionItem[]>([]);
  const [hospitalPrescriptions, setHospitalPrescriptions] = useState<PrescriptionItem[]>([]);
  const [appointmentHospitalId, setAppointmentHospitalId] = useState('');
  const [appointmentDateTime, setAppointmentDateTime] = useState('');
  const [appointmentReason, setAppointmentReason] = useState('');
  const [appointmentContact, setAppointmentContact] = useState('');
  const [appointmentStatusMessage, setAppointmentStatusMessage] = useState('');
  const [prescriptionPatientName, setPrescriptionPatientName] = useState('');
  const [prescriptionDoctorName, setPrescriptionDoctorName] = useState('');
  const [prescriptionMedicines, setPrescriptionMedicines] = useState('');
  const [prescriptionAdvice, setPrescriptionAdvice] = useState('');
  const [prescriptionStatusMessage, setPrescriptionStatusMessage] = useState('');
  const [scanReportText, setScanReportText] = useState('');
  const [scanReportAnalysis, setScanReportAnalysis] = useState<ReportAnalysisResult | null>(null);
  const [scanReportHospitalId, setScanReportHospitalId] = useState('');
  const [scanReportStatusMessage, setScanReportStatusMessage] = useState('');
  const [hospitalReportReferrals, setHospitalReportReferrals] = useState<ReportReferralItem[]>([]);
  const [publicDoctorQueries, setPublicDoctorQueries] = useState<DoctorQueryItem[]>([]);
  const [hospitalDoctorQueries, setHospitalDoctorQueries] = useState<DoctorQueryItem[]>([]);
  const [askDoctorHospitalId, setAskDoctorHospitalId] = useState('');
  const [askDoctorDepartment, setAskDoctorDepartment] = useState('');
  const [askDoctorRequestType, setAskDoctorRequestType] = useState<'general' | 'prescription'>('general');
  const [askDoctorDisease, setAskDoctorDisease] = useState('');
  const [askDoctorQuestion, setAskDoctorQuestion] = useState('');
  const [askDoctorCurrentMedicines, setAskDoctorCurrentMedicines] = useState('');
  const [askDoctorStatusMessage, setAskDoctorStatusMessage] = useState('');
  const [doctorResponseByQuery, setDoctorResponseByQuery] = useState<Record<number, { doctorName: string; answer: string }>>({});
  const [liveLocation, setLiveLocation] = useState<LocationPoint | null>(null);
  const [locationTracking, setLocationTracking] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [ambulanceDispatchMessage, setAmbulanceDispatchMessage] = useState('');
  const [crashMonitoring, setCrashMonitoring] = useState(false);
  const [crashCountdown, setCrashCountdown] = useState(0);
  const [crashDetected, setCrashDetected] = useState(false);
  const [crashStatusMessage, setCrashStatusMessage] = useState('');
  const [liveSpeedKmph, setLiveSpeedKmph] = useState(0);
  const [crashRiskScore, setCrashRiskScore] = useState(0);
  const [crashAIFeatures, setCrashAIFeatures] = useState<CrashAIFeatures | null>(null);
  const [crashAIPrediction, setCrashAIPrediction] = useState<CrashAIPrediction | null>(null);
  const [aiIncidentSummary, setAiIncidentSummary] = useState('');
  const [safetyContactOne, setSafetyContactOne] = useState('');
  const [safetyContactTwo, setSafetyContactTwo] = useState('');
  const [medicalIdNote, setMedicalIdNote] = useState('');
  const [crashIncidentLog, setCrashIncidentLog] = useState<CrashIncidentLogItem[]>([]);
  const [nearbyPharmacies, setNearbyPharmacies] = useState<NearbyPharmacyItem[]>([]);
  const [pharmacyLoading, setPharmacyLoading] = useState(false);
  const [pharmacyError, setPharmacyError] = useState('');
  const [selectedPharmacyForOrder, setSelectedPharmacyForOrder] = useState<NearbyPharmacyItem | null>(null);
  const [emergencyMedicineName, setEmergencyMedicineName] = useState('');
  const [emergencyMedicineQuantity, setEmergencyMedicineQuantity] = useState('1');
  const [emergencyMedicineNotes, setEmergencyMedicineNotes] = useState('');
  const [emergencyMedicineOrderStatus, setEmergencyMedicineOrderStatus] = useState('');
  const [emergencyMedicineOrders, setEmergencyMedicineOrders] = useState<EmergencyMedicineOrderItem[]>(() => generateSeedEmergencyOrders());
  const [pharmacyInventory, setPharmacyInventory] = useState<PharmacyInventoryItem[]>(defaultPharmacyInventory);
  const [pharmacySearchTerm, setPharmacySearchTerm] = useState('');
  const [medicineSearchTerm, setMedicineSearchTerm] = useState('');
  const [issueTitle, setIssueTitle] = useState('');
  const [issueDetail, setIssueDetail] = useState('');
  const [recallItems, setRecallItems] = useState<DrugRecallItem[]>(DRUG_RECALL_DATA);
  const [transferMedicine, setTransferMedicine] = useState('');
  const [transferFromPharmacyId, setTransferFromPharmacyId] = useState('');
  const [transferToPharmacyId, setTransferToPharmacyId] = useState('');
  const [transferQuantity, setTransferQuantity] = useState('10');
  const [transferStatusMessage, setTransferStatusMessage] = useState('');
  const [publicIssues, setPublicIssues] = useState<PublicIssueItem[]>([
    {
      id: 1,
      title: 'Medicine not available at nearby stores',
      detail: 'Public users report stock-out for diabetes medicines during evening hours.',
      priority: 'high',
      status: 'open',
      createdAt: new Date().toLocaleString(),
    },
    {
      id: 2,
      title: 'Late emergency delivery in outskirts',
      detail: 'Average dispatch time above 45 minutes in Kompally and Miyapur.',
      priority: 'medium',
      status: 'in-progress',
      createdAt: new Date().toLocaleString(),
    },
  ]);
  const locationWatchIdRef = useRef<number | null>(null);
  const lastCrashDetectedAtRef = useRef<number>(0);
  const lastMotionSampleRef = useRef<{ gForce: number; ts: number }>({ gForce: 0, ts: 0 });
  const lastGeoSampleRef = useRef<{ lat: number; lng: number; ts: number } | null>(null);
  const womenDoctorSectionRef = useRef<HTMLDivElement | null>(null);
  const runtimeI18nTextRef = useRef<WeakMap<Text, string>>(new WeakMap());
  const runtimeI18nAttrRef = useRef<WeakMap<Element, Record<string, string>>>(new WeakMap());

  const t = translations[language];
  const getSeasonalFrameIndexByMonth = () => {
    const month = new Date().getMonth();
    if (month >= 11 || month <= 1) return 0;
    if (month >= 2 && month <= 4) return 1;
    if (month >= 5 && month <= 8) return 2;
    return 3;
  };
  const [awarenessFrameIndex, setAwarenessFrameIndex] = useState<number>(() => getSeasonalFrameIndexByMonth());
  const [awarenessUpdatedAt, setAwarenessUpdatedAt] = useState<string>(() => new Date().toLocaleTimeString());
  const [awarenessPaused, setAwarenessPaused] = useState(false);
  const [womenAwarenessIndex, setWomenAwarenessIndex] = useState(0);
  const [womenAwarenessUpdatedAt, setWomenAwarenessUpdatedAt] = useState<string>(() => new Date().toLocaleTimeString());
  const [womenAwarenessPaused, setWomenAwarenessPaused] = useState(false);
  const seasonalFrame = SEASONAL_AWARENESS_BY_MONTH[awarenessFrameIndex % SEASONAL_AWARENESS_BY_MONTH.length];
  const liveAwarenessNotice = LIVE_AWARENESS_NOTICES[awarenessFrameIndex % LIVE_AWARENESS_NOTICES.length];
  const liveWomenAwareness = WOMEN_AWARENESS_FEED[womenAwarenessIndex % WOMEN_AWARENESS_FEED.length];

  const getDistanceKm = (fromLat: number, fromLng: number, toLat: number, toLng: number) => {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const earthRadiusKm = 6371;
    const dLat = toRad(toLat - fromLat);
    const dLng = toRad(toLng - fromLng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(fromLat)) * Math.cos(toRad(toLat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadiusKm * c;
  };

  const nearestHospitals = liveLocation
    ? hospitals
        .map((hospital) => ({
          hospital,
          distanceKm: getDistanceKm(
            liveLocation.lat,
            liveLocation.lng,
            hospital.coordinates.lat,
            hospital.coordinates.lng
          ),
        }))
        .sort((a, b) => a.distanceKm - b.distanceKm)
        .slice(0, 3)
    : [];

  const getGoogleMapsDirectionsUrl = (lat: number, lng: number) => {
    if (liveLocation) {
      return `https://www.google.com/maps/dir/?api=1&origin=${liveLocation.lat},${liveLocation.lng}&destination=${lat},${lng}&travelmode=driving`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  };

  const loadNearbyPharmacies = async () => {
    if (!liveLocation) {
      setPharmacyError('Start live location tracking first to find nearby pharmacies.');
      return;
    }
    setPharmacyLoading(true);
    setPharmacyError('');
    try {
      const lat = liveLocation.lat;
      const lng = liveLocation.lng;
      const delta = 0.12;
      const viewBox = `${lng - delta},${lat + delta},${lng + delta},${lat - delta}`;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&q=pharmacy&limit=30&bounded=1&viewbox=${encodeURIComponent(viewBox)}`,
        {
          headers: {
            Accept: 'application/json',
          },
        }
      );
      if (!response.ok) {
        throw new Error('Unable to load nearby pharmacies right now.');
      }
      const data = await response.json() as Array<{
        place_id: number;
        name?: string;
        display_name?: string;
        lat: string;
        lon: string;
      }>;

      const normalized = data
        .map((item) => {
          const latValue = Number(item.lat);
          const lngValue = Number(item.lon);
          if (Number.isNaN(latValue) || Number.isNaN(lngValue)) {
            return null;
          }
          const addressParts = String(item.display_name || '').split(',');
          const name = (item.name && item.name.trim()) || addressParts[0]?.trim() || 'Nearby Pharmacy';
          const distanceKm = getDistanceKm(lat, lng, latValue, lngValue);
          return {
            id: String(item.place_id),
            name,
            address: item.display_name || 'Address unavailable',
            lat: latValue,
            lng: lngValue,
            distanceKm,
          } satisfies NearbyPharmacyItem;
        })
        .filter((item): item is NearbyPharmacyItem => Boolean(item))
        .sort((a, b) => a.distanceKm - b.distanceKm)
        .slice(0, 15);

      setNearbyPharmacies(normalized);
      if (normalized.length === 0) {
        setPharmacyError('No nearby pharmacies found for your current location.');
      }
    } catch (error) {
      setPharmacyError(error instanceof Error ? error.message : 'Unable to load nearby pharmacies.');
      setNearbyPharmacies([]);
    } finally {
      setPharmacyLoading(false);
    }
  };

  const handlePlaceEmergencyMedicineOrder = async () => {
    if (!selectedPharmacyForOrder) {
      setEmergencyMedicineOrderStatus('Select a pharmacy first.');
      return;
    }
    const medicine = emergencyMedicineName.trim();
    const quantity = Number(emergencyMedicineQuantity);
    if (!medicine || !quantity || quantity < 1) {
      setEmergencyMedicineOrderStatus('Enter medicine name and valid quantity.');
      return;
    }

    const locationLabel = liveLocation
      ? `${liveLocation.lat.toFixed(5)}, ${liveLocation.lng.toFixed(5)}`
      : 'Location unavailable';
    const nextOrder: EmergencyMedicineOrderItem = {
      id: Date.now(),
      pharmacyName: selectedPharmacyForOrder.name,
      patientName: publicLoginName.trim() || 'Public User',
      patientPhone: publicPhoneNumber.trim(),
      medicine,
      quantity,
      notes: emergencyMedicineNotes.trim(),
      locationLabel,
      status: 'pending',
      remainingSeconds: 2400,
      createdAt: new Date().toLocaleString(),
    };
    setEmergencyMedicineOrders((prev) => [nextOrder, ...prev].slice(0, 300));
    try {
      const response = await postJson<{ data: EmergencyMedicineOrderItem }>('/api/pharmacy-orders', nextOrder);
      if (response?.data) {
        setEmergencyMedicineOrders((prev) => [response.data, ...prev.filter((item) => item.id !== nextOrder.id)]);
      }
    } catch {
      // Keep local fallback when backend endpoint is unavailable.
    }
    setEmergencyMedicineOrderStatus(
      `Emergency order prepared for ${selectedPharmacyForOrder.name}. Open Google Maps directions and call the pharmacy to confirm dispatch.`
    );
    setEmergencyMedicineName('');
    setEmergencyMedicineQuantity('1');
    setEmergencyMedicineNotes('');
  };

  const resetAuthFeedback = () => {
    setAuthError('');
    setBiometricStatus('');
    setBiometricLoading(null);
  };

  const isManagedPortalBlocked = (portal: ManagedPortal) => {
    return adminMaintenanceMode || !adminPortalAccess[portal];
  };

  const handleLogout = () => {
    setRole('none');
    setSelectedHospital(null);
    setSelectedPharmacyPortal(null);
    resetAuthFeedback();
  };

  const postJson = async <T,>(path: string, payload: unknown): Promise<T> => {
    const response = await fetch(getApiUrl(path), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const errorMessage = typeof data?.error === 'string' ? data.error : 'Request failed';
      throw new Error(errorMessage);
    }
    return data as T;
  };

  const getJson = async <T,>(path: string): Promise<T> => {
    const response = await fetch(getApiUrl(path));
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const errorMessage = typeof data?.error === 'string' ? data.error : 'Request failed';
      throw new Error(errorMessage);
    }
    return data as T;
  };

  const patchJson = async <T,>(path: string, payload: unknown): Promise<T> => {
    const response = await fetch(getApiUrl(path), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const errorMessage = typeof data?.error === 'string' ? data.error : 'Request failed';
      throw new Error(errorMessage);
    }
    return data as T;
  };

  const applyPortalSettings = (settings: PortalSettings) => {
    setAdminMaintenanceMode(Boolean(settings.maintenanceMode));
    setAdminPortalAccess({
      public: Boolean(settings.publicEnabled),
      hospital: Boolean(settings.hospitalEnabled),
      pharmacy: Boolean(settings.pharmacyEnabled),
    });
  };

  const loadPortalSettings = async () => {
    try {
      const response = await getJson<{ data: PortalSettings }>('/api/portal-settings');
      applyPortalSettings(response.data);
    } catch {
      // Keep local defaults when backend endpoint is unavailable.
    }
  };

  const savePortalSettings = async (next: PortalSettings) => {
    applyPortalSettings(next);
    try {
      await patchJson<{ data: PortalSettings }>('/api/portal-settings', next);
    } catch {
      // Keep UI responsive if backend is unavailable; local state remains applied.
    }
  };

  const loadPharmacyOrders = async (pharmacyName?: string) => {
    try {
      const query = pharmacyName ? `?pharmacyName=${encodeURIComponent(pharmacyName)}` : '';
      const response = await getJson<{ data: EmergencyMedicineOrderItem[] }>(`/api/pharmacy-orders${query}`);
      setEmergencyMedicineOrders(response?.data ?? []);
    } catch {
      // Keep seeded/local data as fallback.
    }
  };

  const loadCrashIncidents = async () => {
    try {
      const response = await getJson<{ data: CrashIncidentLogItem[] }>('/api/crash-incidents?limit=50');
      if (response?.data) {
        setCrashIncidentLog(response.data);
      }
    } catch {
      // Keep local crash log fallback.
    }
  };

  const loadAdminStats = async () => {
    try {
      const response = await getJson<{ data: AdminStats }>('/api/admin/stats');
      setAdminStats(response.data);
    } catch {
      setAdminStats(null);
    }
  };

  const loadBlockchainRecords = async () => {
    try {
      const response = await getJson<{ data: BlockchainRecordItem[] }>('/api/blockchain/records?limit=10');
      setBlockchainRecords(response.data ?? []);
    } catch {
      setBlockchainRecords([]);
    }
  };

  const verifyBlockchain = async () => {
    try {
      const response = await getJson<{ data: BlockchainVerification }>('/api/blockchain/verify');
      setBlockchainVerification(response.data ?? null);
    } catch {
      setBlockchainVerification(null);
    }
  };

  const persistHospitalBiometric = (next: Record<number, { fingerprint: boolean; face: boolean }>) => {
    setHospitalBiometric(next);
    window.localStorage.setItem(HOSPITAL_BIOMETRIC_KEY, JSON.stringify(next));
  };

  const persistPharmacyBiometric = (next: Record<number, { fingerprint: boolean; face: boolean }>) => {
    setPharmacyBiometric(next);
    window.localStorage.setItem(PHARMACY_BIOMETRIC_KEY, JSON.stringify(next));
  };

  const persistAdminBiometric = (next: { fingerprint: boolean; face: boolean }) => {
    setAdminBiometric(next);
    window.localStorage.setItem(ADMIN_BIOMETRIC_KEY, JSON.stringify(next));
  };

  const persistWebauthnCredentials = (next: Record<string, string[]>) => {
    setWebauthnCredentialsByUser(next);
    window.localStorage.setItem(WEBAUTHN_CREDENTIALS_KEY, JSON.stringify(next));
  };

  const encodeBase64Url = (buffer: ArrayBuffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };

  const decodeBase64Url = (value: string) => {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    const padding = '='.repeat((4 - (normalized.length % 4)) % 4);
    const binary = atob(normalized + padding);
    return Uint8Array.from(binary, (char) => char.charCodeAt(0));
  };

  const randomChallenge = (size = 32) => {
    const bytes = new Uint8Array(size);
    window.crypto.getRandomValues(bytes);
    return bytes;
  };

  const getBiometricUserKey = (portal: LoginPortal, hospitalId?: number) => {
    if (portal === 'admin') return 'admin';
    if (portal === 'hospital') return `hospital:${hospitalId ?? 0}`;
    if (portal === 'pharmacy') return `pharmacy:${hospitalId ?? 0}`;
    return 'public';
  };

  const registerWebAuthnCredential = async (userKey: string, displayName: string) => {
    if (!window.PublicKeyCredential || !navigator.credentials?.create) {
      throw new Error('Biometric passkeys are not supported on this browser/device.');
    }
    const host = window.location.hostname;
    const secureAllowed = window.isSecureContext || host === 'localhost' || host === '127.0.0.1';
    if (!secureAllowed) {
      throw new Error('Biometrics require HTTPS (or localhost) on this device/browser.');
    }
    const existing = webauthnCredentialsByUser[userKey] ?? [];
    const credential = await navigator.credentials.create({
      publicKey: {
        challenge: randomChallenge(),
        rp: { name: 'Medi - EMERGENCY AI SUPPORT', id: window.location.hostname },
        user: {
          id: new TextEncoder().encode(userKey),
          name: userKey,
          displayName,
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },
          { type: 'public-key', alg: -257 },
        ],
        timeout: 60000,
        attestation: 'none',
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'preferred',
          residentKey: 'preferred',
        },
        excludeCredentials: existing.map((id) => ({
          id: decodeBase64Url(id),
          type: 'public-key' as const,
        })),
      },
    }) as PublicKeyCredential | null;

    if (!credential) {
      throw new Error('Biometric registration was cancelled.');
    }

    const credentialId = encodeBase64Url(credential.rawId);
    if (!existing.includes(credentialId)) {
      persistWebauthnCredentials({
        ...webauthnCredentialsByUser,
        [userKey]: [...existing, credentialId],
      });
    }
  };

  const verifyWebAuthnCredential = async (userKey: string) => {
    if (!window.PublicKeyCredential || !navigator.credentials?.get) {
      throw new Error('Biometric passkeys are not supported on this browser/device.');
    }
    const host = window.location.hostname;
    const secureAllowed = window.isSecureContext || host === 'localhost' || host === '127.0.0.1';
    if (!secureAllowed) {
      throw new Error('Biometrics require HTTPS (or localhost) on this device/browser.');
    }
    const allowedIds = webauthnCredentialsByUser[userKey] ?? [];
    if (allowedIds.length === 0) {
      throw new Error('No biometric credential registered for this account.');
    }

    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: randomChallenge(),
        allowCredentials: allowedIds.map((id) => ({
          id: decodeBase64Url(id),
          type: 'public-key' as const,
        })),
        timeout: 60000,
        userVerification: 'preferred',
      },
    });

    if (!assertion) {
      throw new Error('Biometric verification was cancelled.');
    }
  };

  const isPortalBiometricRegistered = (portal: LoginPortal) => {
    if (portal === 'admin') {
      return adminBiometric.fingerprint || adminBiometric.face || (webauthnCredentialsByUser.admin?.length ?? 0) > 0;
    }
    if (portal === 'public') {
      return false;
    }
    if (portal === 'hospital') {
      const hospitalId = Number(hospitalLoginId);
      const reg = hospitalBiometric[hospitalId];
      return Boolean(reg?.fingerprint || reg?.face || (webauthnCredentialsByUser[getBiometricUserKey('hospital', hospitalId)]?.length ?? 0) > 0);
    }
    const pharmacyId = Number(pharmacyLoginId);
    const reg = pharmacyBiometric[pharmacyId];
    return Boolean(reg?.fingerprint || reg?.face || (webauthnCredentialsByUser[getBiometricUserKey('pharmacy', pharmacyId)]?.length ?? 0) > 0);
  };

  const handleRegisterBiometric = async (portal: LoginPortal, mode: BiometricMode) => {
    resetAuthFeedback();
    if (portal === 'public') {
      setAuthError('Public portal now uses simple login and does not require biometric.');
      return;
    }
    setRegisterLoading(mode);

    try {
      if (portal === 'admin') {
        await registerWebAuthnCredential(getBiometricUserKey('admin'), 'Admin Portal');
        persistAdminBiometric({ ...adminBiometric, [mode]: true });
        setBiometricStatus(`${mode === 'fingerprint' ? 'Fingerprint' : 'Face'} registered for Admin Portal.`);
        setAuthStage('login');
        return;
      }
      if (portal === 'hospital') {
        const hospitalId = Number(hospitalLoginId);
        const hospitalKey = hospitalAuthKeysById[hospitalId];
        if (!hospitalId) {
          setAuthError('Select hospital before biometric registration.');
          return;
        }

        const selected = hospitals.find((hospital) => hospital.id === hospitalId);
        await registerWebAuthnCredential(
          getBiometricUserKey('hospital', hospitalId),
          selected?.name || `Hospital ${hospitalId}`
        );

        try {
          if (hospitalKey) {
            const endpoint = mode === 'fingerprint' ? '/api/auth/fingerprint-enroll' : '/api/auth/face-enroll';
            await postJson(endpoint, { hospitalId: hospitalKey });
          }
        } catch {
          // Optional backend enroll; WebAuthn credential is already registered client-side.
        }

        persistHospitalBiometric({
          ...hospitalBiometric,
          [hospitalId]: {
            fingerprint: mode === 'fingerprint' ? true : Boolean(hospitalBiometric[hospitalId]?.fingerprint),
            face: mode === 'face' ? true : Boolean(hospitalBiometric[hospitalId]?.face),
          },
        });
        setBiometricStatus(`${mode === 'fingerprint' ? 'Fingerprint' : 'Face'} registered for selected hospital.`);
        setAuthStage('login');
        return;
      }

      const pharmacyId = Number(pharmacyLoginId);
      const selectedPharmacy = pharmacyPortalAccounts.find((item) => item.id === pharmacyId);
      if (!selectedPharmacy) {
        setAuthError('Select pharmacy before biometric registration.');
        return;
      }
      await registerWebAuthnCredential(
        getBiometricUserKey('pharmacy', pharmacyId),
        selectedPharmacy.name
      );
      persistPharmacyBiometric({
        ...pharmacyBiometric,
        [pharmacyId]: {
          fingerprint: mode === 'fingerprint' ? true : Boolean(pharmacyBiometric[pharmacyId]?.fingerprint),
          face: mode === 'face' ? true : Boolean(pharmacyBiometric[pharmacyId]?.face),
        },
      });
      setBiometricStatus(`${mode === 'fingerprint' ? 'Fingerprint' : 'Face'} registered for selected pharmacy.`);
      setAuthStage('login');
    } finally {
      setRegisterLoading(null);
    }
  };

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    setShowLanguageSelector(false);
  };

  useEffect(() => {
    document.documentElement.lang = language === 'hi' ? 'hi' : language === 'te' ? 'te' : 'en';
  }, [language]);

  useEffect(() => {
    const root = document.getElementById('root');
    if (!root) {
      return;
    }

    const attrNames = ['placeholder', 'title', 'aria-label'] as const;
    const ignoredTags = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT']);

    const translateTextNode = (textNode: Text) => {
      const parentTag = textNode.parentElement?.tagName;
      if (parentTag && ignoredTags.has(parentTag)) {
        return;
      }
      if (!runtimeI18nTextRef.current.has(textNode)) {
        runtimeI18nTextRef.current.set(textNode, textNode.nodeValue || '');
      }
      const currentValue = textNode.nodeValue || '';
      let source = runtimeI18nTextRef.current.get(textNode) || '';
      const expectedFromCache = translateRuntimeText(source, language);
      // React can reuse text nodes; refresh source cache when node content changes.
      if (currentValue !== expectedFromCache && currentValue !== source) {
        source = currentValue;
        runtimeI18nTextRef.current.set(textNode, source);
      }
      const translated = translateRuntimeText(source, language);
      if (currentValue !== translated) {
        textNode.nodeValue = translated;
      }
    };

    const translateElementAttributes = (element: Element) => {
      if (!runtimeI18nAttrRef.current.has(element)) {
        runtimeI18nAttrRef.current.set(element, {});
      }
      const cache = runtimeI18nAttrRef.current.get(element) || {};
      attrNames.forEach((attr) => {
        const currentValue = element.getAttribute(attr);
        if (!currentValue) {
          return;
        }
        if (!cache[attr]) {
          cache[attr] = currentValue;
        }
        const expectedFromCache = translateRuntimeText(cache[attr], language);
        // Keep attribute source aligned when React updates placeholders/labels.
        if (currentValue !== expectedFromCache && currentValue !== cache[attr]) {
          cache[attr] = currentValue;
        }
        const translated = translateRuntimeText(cache[attr], language);
        if (currentValue !== translated) {
          element.setAttribute(attr, translated);
        }
      });
      runtimeI18nAttrRef.current.set(element, cache);
    };

    const translateTree = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        translateTextNode(node as Text);
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) {
        return;
      }
      const element = node as Element;
      translateElementAttributes(element);
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
      while (walker.nextNode()) {
        const current = walker.currentNode;
        if (current.nodeType === Node.TEXT_NODE) {
          translateTextNode(current as Text);
        } else if (current.nodeType === Node.ELEMENT_NODE) {
          translateElementAttributes(current as Element);
        }
      }
    };

    translateTree(root);
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'characterData' && mutation.target.nodeType === Node.TEXT_NODE) {
          translateTextNode(mutation.target as Text);
        }
        if (mutation.type === 'attributes' && mutation.target.nodeType === Node.ELEMENT_NODE) {
          translateElementAttributes(mutation.target as Element);
        }
        mutation.addedNodes.forEach((addedNode) => {
          translateTree(addedNode);
        });
      });
    });

    observer.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: [...attrNames],
    });

    return () => observer.disconnect();
  }, [language]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
        setPhotoUploaded(true);
        // Start AI analysis after image is loaded
        analyzeImage();
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    setAnalyzing(true);
    
    // Simulate AI photo analysis with delay
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    const result = await analyzePhoto();
    
    setDetectedInjury({
      type: result.injuryType,
      bodyPart: result.bodyPart,
      severity: result.severity
    });
    
    // Auto-fill form based on analysis
    if (result.severity === 'critical') {
      setSymptoms(`${result.injuryType} on ${result.bodyPart}, severe pain, bleeding`);
    } else {
      setSymptoms(`${result.injuryType} on ${result.bodyPart}, pain`);
    }
    
    setAnalyzing(false);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSubmitForm = () => {
    const patientData: PatientData = {
      age: parseInt(patientAge) || undefined,
      gender: patientGender,
      symptoms: symptoms.split(',').map(s => s.trim()).filter(s => s),
    };
    
    const result = analyzeEmergency(patientData);
    setAnalysis(result);
    setView('results');
  };

  const openFirstAidTool = () => {
    if (!firstAidSymptomsDraft.trim()) {
      setFirstAidSymptomsDraft(symptoms.trim());
    }
    setFirstAidCoachError('');
    setView('firstaid');
  };

  const runFirstAidCoach = () => {
    const mergedInput = `${firstAidSymptomsDraft}, ${firstAidConcern}`.trim();
    const parsedSymptoms = mergedInput
      .split(/[,;\n]/)
      .map((item) => item.trim())
      .filter((item, index, arr) => item && arr.indexOf(item) === index);

    if (parsedSymptoms.length === 0) {
      setFirstAidCoachError('Add at least one symptom or concern to generate AI first-aid guidance.');
      setFirstAidCoachPlan(null);
      return;
    }

    const aiResult = analyzeEmergency({
      age: Number(patientAge) || undefined,
      gender: patientGender || undefined,
      symptoms: parsedSymptoms,
      heartRate: Number(pulseRate) || undefined,
      injuries: detectedInjury ? [detectedInjury.type] : undefined,
    });

    const immediateActions = [...aiResult.firstAid];
    if (painScale >= 8 && !immediateActions.some((step) => step.toLowerCase().includes('call 108'))) {
      immediateActions.unshift('Pain is severe (8+/10): seek emergency medical support immediately.');
    }

    const avoidActions = [
      'Do not give food, alcohol, or sedatives before doctor evaluation.',
      'Avoid moving the patient if spine/head injury is suspected.',
      allergies.trim()
        ? `Avoid medicines that may trigger known allergies: ${allergies.trim()}.`
        : 'Do not self-medicate unless advised by a clinician.',
    ];

    const monitoringChecks = [
      `Track breathing comfort every 2-3 minutes (SpO2: ${oxygenSaturation || 'N/A'}%).`,
      `Recheck pulse trend regularly (current: ${pulseRate || 'N/A'} bpm).`,
      `Watch for warning signs: confusion, fainting, severe bleeding, worsening chest pain.`,
    ];

    const escalationTrigger =
      aiResult.severity === 'critical'
        ? 'Escalate now: call 108/112 immediately and transport to nearest emergency center.'
        : aiResult.severity === 'moderate'
        ? 'Escalate within 60 minutes if symptoms persist or worsen.'
        : 'Escalate if fever, pain, breathing issue, or dizziness increases over the next few hours.';

    setFirstAidCoachError('');
    setFirstAidCoachPlan({
      analysis: aiResult,
      immediateActions,
      avoidActions,
      monitoringChecks,
      escalationTrigger,
    });
  };

  const openWomenHealthHub = () => {
    if (!womenSymptomsInput.trim()) {
      setWomenSymptomsInput(symptoms.trim());
    }
    if (!womenCurrentMedicines.trim()) {
      setWomenCurrentMedicines(knownConditions.trim());
    }
    setView('women-health');
  };

  const generateWomenHealthPlan = () => {
    const ageValue = Number(patientAge) || 0;
    const normalizedSymptoms = womenSymptomsInput.toLowerCase();
    const normalizedConditions = knownConditions.toLowerCase();
    const normalizedPregnancySignals = pregnancyWarningSignals.toLowerCase();
    const isPregnancyStage = womenLifeStage === 'pregnancy';
    const trimesterLabel =
      pregnancyTrimester === 'first' ? 'First Trimester (0-13 weeks)'
      : pregnancyTrimester === 'second' ? 'Second Trimester (14-27 weeks)'
      : 'Third Trimester (28-40 weeks)';
    const parsedDueDate = pregnancyDueDate ? new Date(`${pregnancyDueDate}T00:00:00`) : null;
    const isDueDateValid = Boolean(parsedDueDate && !Number.isNaN(parsedDueDate.getTime()));
    const dueDaysRemaining = isDueDateValid && parsedDueDate
      ? Math.ceil((parsedDueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null;
    const estimatedWeek = dueDaysRemaining === null ? null : Math.max(1, Math.min(42, 40 - Math.floor(dueDaysRemaining / 7)));
    const hasAnemiaSignal = ['fatigue', 'weakness', 'pale', 'heavy period', 'dizziness'].some((term) => normalizedSymptoms.includes(term));
    const hasThyroidSignal = ['weight gain', 'weight loss', 'hair fall', 'cold intolerance', 'palpitations'].some((term) => normalizedSymptoms.includes(term));
    const hasDiabetesSignal = ['frequent urination', 'thirst', 'blurred vision', 'slow healing'].some((term) => normalizedSymptoms.includes(term));
    const hasMentalHealthSignal = ['anxiety', 'depressed', 'low mood', 'insomnia', 'stress'].some((term) => normalizedSymptoms.includes(term));
    const hasBoneRisk = womenLifeStage === 'postmenopause' || womenLifeStage === 'perimenopause' || ageValue >= 45;
    const hasMenstrualSignal = ['irregular period', 'missed period', 'heavy period', 'cramps', 'pelvic pain', 'spotting'].some((term) => normalizedSymptoms.includes(term));
    const hasPcosSignal = ['pcos', 'acne', 'facial hair', 'weight gain', 'irregular period', 'insulin resistance'].some((term) => normalizedSymptoms.includes(term)) || normalizedConditions.includes('pcos');
    const hasFertilitySignal = ['infertility', 'trying to conceive', 'miscarriage', 'ovulation', 'conceive'].some((term) => normalizedSymptoms.includes(term));
    const hasInfectionSignal = ['discharge', 'itching', 'burning urine', 'foul smell', 'uti', 'fever'].some((term) => normalizedSymptoms.includes(term));
    const hasPregnancyEmergencySignal = [
      'bleeding',
      'severe headache',
      'blurred vision',
      'swelling',
      'reduced fetal movement',
      'fluid leak',
      'contractions',
      'high fever',
      'persistent vomiting',
      'severe abdominal pain',
    ].some((term) => normalizedSymptoms.includes(term) || normalizedPregnancySignals.includes(term));
    const hasMenopauseSignal = ['hot flashes', 'night sweats', 'sleep disturbance', 'vaginal dryness', 'mood swing'].some((term) => normalizedSymptoms.includes(term))
      || womenLifeStage === 'perimenopause'
      || womenLifeStage === 'postmenopause';

    const focusAreas: string[] = [];
    const screeningPlan: string[] = [];
    const medicationGuide: string[] = [];
    const pregnancyPlan: string[] = [];
    const pregnancyChecklist: string[] = [];
    const redFlags: string[] = [
      'Chest discomfort with nausea, breathlessness, or unusual fatigue: seek urgent cardiac evaluation.',
      'Severe vaginal bleeding, fainting, or sudden confusion: call emergency services immediately.',
      'Suicidal thoughts, panic episodes, or sudden behavior change: urgent psychiatric support is required.',
    ];
    const majorProblemTracks: WomenHealthPlan['majorProblemTracks'] = [];

    if (hasAnemiaSignal || normalizedConditions.includes('anemia')) {
      focusAreas.push('Anemia care: prioritize iron-rich diet, vitamin C pairing, and CBC/ferritin follow-up.');
      medicationGuide.push('Common doctor-led options: oral iron (ferrous sulfate/ascorbate), folic acid, vitamin B12 if deficient.');
    }
    if (hasThyroidSignal || normalizedConditions.includes('thyroid')) {
      focusAreas.push('Thyroid care: monitor TSH, free T4/T3 and track weight, mood, and menstrual changes.');
      medicationGuide.push('Common doctor-led options: Levothyroxine for hypothyroid; antithyroid medicines for hyperthyroid.');
    }
    if (hasDiabetesSignal || normalizedConditions.includes('diabetes')) {
      focusAreas.push('Diabetes care: stronger heart-kidney risk tracking in women, with glucose and BP control.');
      medicationGuide.push('Common doctor-led options: Metformin, insulin, and cardio-renal protective medicines as advised.');
    }
    if (hasMentalHealthSignal) {
      focusAreas.push('Mental health support: hormonal-phase-aware screening for depression/anxiety and sleep quality.');
      medicationGuide.push('Common doctor-led options: SSRIs/SNRIs, short-term sleep support, and structured counseling.');
    }
    if (hasBoneRisk) {
      focusAreas.push('Bone health: post-menopause calcium/vitamin D optimization and fall-risk prevention.');
      medicationGuide.push('Common doctor-led options: Calcium + Vitamin D; anti-resorptive therapy if osteoporosis is confirmed.');
    }
    if (normalizedConditions.includes('lupus') || normalizedConditions.includes('rheumatoid') || normalizedConditions.includes('multiple sclerosis')) {
      focusAreas.push('Autoimmune conditions: regular flare tracking and rheumatology follow-up.');
      medicationGuide.push('Common doctor-led options: anti-inflammatory agents, DMARDs, biologics based on diagnosis.');
    }
    if (isPregnancyStage) {
      focusAreas.push('Pregnancy care: structured antenatal visits, BP/sugar tracking, hydration, and daily fetal wellbeing observation.');
      medicationGuide.push('Pregnancy medicines must be obstetrician-approved only. Avoid self-starting painkillers/antibiotics/hormones.');
      pregnancyChecklist.push('Daily: hydrate, eat protein + iron + folate rich food, and rest in left lateral position when needed.');
      pregnancyChecklist.push('Weekly: track blood pressure, weight trend, swelling, and baby movement pattern (after 28 weeks).');
      pregnancyChecklist.push('Hospital readiness: keep emergency numbers, blood group details, and delivery bag prepared.');

      if (pregnancyTrimester === 'first') {
        pregnancyPlan.push('First trimester focus: folic acid adherence, nausea control, dating scan, and avoid infection exposure.');
        pregnancyPlan.push('Confirm baseline tests with your obstetrician: CBC, blood group/Rh, urine, TSH, sugar, and viral screening.');
      } else if (pregnancyTrimester === 'second') {
        pregnancyPlan.push('Second trimester focus: anomaly scan window, anemia prevention, and gestational diabetes screening timeline.');
        pregnancyPlan.push('Track energy, appetite, and fetal growth milestones with regular antenatal follow-up.');
      } else {
        pregnancyPlan.push('Third trimester focus: fetal movement count, BP monitoring, labor warning signs, and delivery planning.');
        pregnancyPlan.push('Discuss birth plan, hospital admission triggers, and postpartum breastfeeding support in advance.');
      }

      if (dueDaysRemaining !== null) {
        if (dueDaysRemaining > 0) {
          pregnancyPlan.push(`Estimated time to due date: ${dueDaysRemaining} days. Keep transport and hospital contact ready.`);
        } else {
          pregnancyPlan.push('Due date has passed or is very near. Contact obstetrics team for active delivery guidance.');
        }
      }

      redFlags.push('During pregnancy: reduced fetal movement, heavy bleeding, severe headache/blurred vision, fluid leak, or painful contractions need urgent care.');
      screeningPlan.push('Pregnancy checks: ANC visit schedule, anomaly scan, glucose screening, Hb monitoring, and blood pressure surveillance.');
    }
    if (pregnancyWarningSignals.trim()) {
      pregnancyPlan.push(`Reported pregnancy warning signals: ${pregnancyWarningSignals.trim()}. Seek obstetric review today if symptoms persist.`);
    }

    majorProblemTracks.push({
      title: 'Menstrual Disorders and PCOS',
      severity: hasPcosSignal || (hasMenstrualSignal && hasThyroidSignal) ? 'high' : hasMenstrualSignal ? 'moderate' : 'low',
      summary: hasPcosSignal
        ? 'Pattern suggests possible PCOS/hormonal irregularity. Early endocrine-gynecology review helps reduce long-term metabolic risk.'
        : hasMenstrualSignal
        ? 'Cycle or pain symptoms need structured menstrual evaluation and symptom diary.'
        : 'No strong menstrual/PCOS signal from current input.',
      actions: [
        'Track cycle dates, flow level, and pain score for 2-3 cycles.',
        'Discuss thyroid profile, insulin resistance markers, and pelvic ultrasound with gynecology.',
      ],
    });

    majorProblemTracks.push({
      title: 'Anemia, Thyroid, and Metabolic Risk',
      severity: (hasAnemiaSignal && hasThyroidSignal) || hasDiabetesSignal ? 'high' : (hasAnemiaSignal || hasThyroidSignal) ? 'moderate' : 'watch',
      summary: hasAnemiaSignal || hasThyroidSignal || hasDiabetesSignal
        ? 'These are common hidden causes of fatigue, mood changes, and cycle imbalance in women.'
        : 'Maintain routine annual metabolic and thyroid checks.',
      actions: [
        'Prioritize CBC, ferritin, TSH/free T4, HbA1c, and lipid profile as advised.',
        'Build a meal plan with protein, iron, fiber, and hydration consistency.',
      ],
    });

    majorProblemTracks.push({
      title: 'Fertility, Pregnancy, and Postpartum Support',
      severity:
        womenLifeStage === 'pregnancy' || womenLifeStage === 'postpartum'
          ? 'high'
          : hasFertilitySignal
          ? 'moderate'
          : 'watch',
      summary:
        womenLifeStage === 'pregnancy'
          ? 'Pregnancy stage selected. Regular antenatal visits and warning-sign monitoring are essential.'
          : womenLifeStage === 'postpartum'
          ? 'Postpartum stage selected. Focus on bleeding, mood, feeding, and blood pressure follow-up.'
          : hasFertilitySignal
          ? 'Fertility-focused concern detected. Timed specialist guidance can reduce delay in care.'
          : 'No immediate fertility/pregnancy signal detected.',
      actions: [
        'For pregnancy/postpartum concerns, keep emergency contact and hospital plan ready.',
        'Consult obstetrics/gynecology for conception planning, supplements, and trimester-safe medication review.',
      ],
    });

    majorProblemTracks.push({
      title: 'Menopause, Bone, and Heart Protection',
      severity: hasMenopauseSignal || hasBoneRisk ? 'moderate' : 'watch',
      summary: hasMenopauseSignal || hasBoneRisk
        ? 'Hormonal transition increases bone and heart risk; preventive tracking is important.'
        : 'Maintain preventive habits for long-term bone and cardiovascular health.',
      actions: [
        'Review calcium, vitamin D, BP, sleep, and strength activity with your clinician.',
        'Discuss DEXA timing and menopausal symptom management options.',
      ],
    });

    majorProblemTracks.push({
      title: 'Mental Health, Sleep, and Safety',
      severity: hasMentalHealthSignal ? 'high' : 'watch',
      summary: hasMentalHealthSignal
        ? 'Mood/sleep stress signal detected. Early counseling and doctor support improves outcomes.'
        : 'Keep stress, sleep, and emotional wellbeing checks in your routine care.',
      actions: [
        'Use daily mood and sleep check-ins for 2 weeks and share trend with doctor.',
        'Use Women Safety Alert and Women Doctor support if you feel unsafe or overwhelmed.',
      ],
    });

    majorProblemTracks.push({
      title: 'Infection and Reproductive Tract Care',
      severity: hasInfectionSignal ? 'high' : 'low',
      summary: hasInfectionSignal
        ? 'Possible UTI/reproductive infection symptom pattern detected. Timely treatment prevents complications.'
        : 'No infection signal from current inputs.',
      actions: [
        'Do not self-medicate repeatedly; request urine/culture or gyne evaluation as advised.',
        'Escalate immediately if fever with pelvic pain, vomiting, or worsening symptoms.',
      ],
    });

    screeningPlan.push('Cervical screening: Pap every 3 years or HPV testing interval per doctor guidance (ages 30-65).');
    screeningPlan.push('Breast health: monthly self-awareness and mammogram scheduling by risk profile/age.');
    screeningPlan.push('Bone density (DEXA): at 65+ or earlier if risk factors/postmenopause.');
    screeningPlan.push('STI screening: yearly chlamydia/gonorrhea check for sexually active women under 25.');
    screeningPlan.push('Metabolic panel: HbA1c, lipid profile, kidney function, and thyroid panel at advised intervals.');

    let riskLevel: WomenHealthPlan['riskLevel'] = 'routine';
    if (hasDiabetesSignal || hasAnemiaSignal || hasThyroidSignal || hasMentalHealthSignal || hasBoneRisk) {
      riskLevel = 'moderate';
    }
    if (
      (hasDiabetesSignal && (hasThyroidSignal || hasMentalHealthSignal)) ||
      (hasInfectionSignal && hasMenstrualSignal) ||
      (hasPcosSignal && hasDiabetesSignal) ||
      (isPregnancyStage && (hasPregnancyEmergencySignal || hasInfectionSignal)) ||
      normalizedConditions.includes('heart') ||
      normalizedConditions.includes('kidney')
    ) {
      riskLevel = 'high';
    }

    setWomenHealthPlan({
      riskLevel,
      focusAreas: focusAreas.length ? focusAreas : ['General preventive women wellness with nutrition, activity, and regular screening.'],
      screeningPlan,
      medicationGuide: medicationGuide.length
        ? medicationGuide
        : ['Medication should be individualized by clinician after blood tests and full history.'],
      redFlags,
      pregnancyPlan: pregnancyPlan.length
        ? pregnancyPlan
        : ['No pregnancy-specific module selected. Switch life stage to Pregnancy to unlock trimester planning.'],
      pregnancyChecklist: pregnancyChecklist.length
        ? pregnancyChecklist
        : ['Pregnancy checklist appears only when Pregnancy life stage is selected.'],
      trimesterLabel: isPregnancyStage ? trimesterLabel : 'Not in pregnancy stage',
      estimatedWeek: isPregnancyStage ? estimatedWeek : null,
      dueDate: pregnancyDueDate,
      majorProblemTracks,
      sectionOrder: [
        'Step 1: Enter life stage, medicines, symptoms, and pregnancy fields if applicable.',
        'Step 2: Generate AI risk + major-problem analysis.',
        'Step 3: Review actionable focus, pregnancy module, and screening plan.',
        'Step 4: Use safety and emergency cards for urgent help.',
        'Step 5: Escalate to women doctor in preferred hospital.',
      ],
    });
  };

  const triggerWomenSafetyAlert = () => {
    setWomenSafetyDetected(true);
    setWomenSafetyCountdown(10);
    setWomenSafetyStatusMessage('Women safety alert started. Auto-dispatch in 10 seconds unless cancelled.');
    void addCrashLog('detected', 'Women safety alert detected. Countdown started for emergency dispatch.');
  };

  const cancelWomenSafetyAlert = () => {
    setWomenSafetyDetected(false);
    setWomenSafetyCountdown(0);
    setWomenSafetyStatusMessage('Women safety alert cancelled by user confirmation.');
    void addCrashLog('cancelled', 'Women safety alert cancelled by user.');
  };

  const dispatchWomenSafetyAlert = async () => {
    const patientNameToUse = publicLoginName.trim() || 'Public User';
    const phone = publicPhoneNumber.trim();
    const locationLabel = liveLocation ? `${liveLocation.lat.toFixed(5)}, ${liveLocation.lng.toFixed(5)}` : 'Location unavailable';
    try {
      if (liveLocation && nearestHospitals.length > 0) {
        const nearest = nearestHospitals[0].hospital;
        await postJson('/api/alerts', {
          hospitalId: nearest.id,
          patient: `${patientNameToUse}${phone ? ` | ${phone}` : ''} | Women Safety Alert | ${locationLabel}`,
          severity: 'critical',
        });
        const msg = `Women safety alert dispatched to ${nearest.name}. Location: ${locationLabel}.`;
        setWomenSafetyStatusMessage(msg);
        void addCrashLog('dispatched', msg);
      } else {
        const msg = 'Women safety alert generated, but live location is unavailable. Please call 1091/112 immediately.';
        setWomenSafetyStatusMessage(msg);
        void addCrashLog('dispatched', msg);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unable to dispatch women safety alert.';
      setWomenSafetyStatusMessage(msg);
      void addCrashLog('dispatched', msg);
    } finally {
      setWomenSafetyDetected(false);
      setWomenSafetyCountdown(0);
    }
  };

  const handlePrepareWomenDoctorAssist = () => {
    if (!womenHealthPlan) {
      setWomenDoctorStatusMessage('Generate AI plan first to prepare doctor assist details.');
      return;
    }

    const defaultCondition =
      womenHealthPlan.riskLevel === 'high'
        ? 'High-risk women health review'
        : womenHealthPlan.riskLevel === 'moderate'
        ? 'Moderate-risk women health review'
        : 'Women preventive health review';

    const focusSummary = womenHealthPlan.focusAreas.slice(0, 3).join(' | ');
    const screeningSummary = womenHealthPlan.screeningPlan.slice(0, 2).join(' | ');
    const symptomSummary = womenSymptomsInput.trim() || 'No additional symptoms shared';
    const medicineSummary = womenCurrentMedicines.trim() || 'No current medicines shared';

    setWomenDoctorDepartment((prev) => prev.trim() || 'Gynecology');
    setWomenDoctorCondition((prev) => prev.trim() || defaultCondition);
    setWomenDoctorQuestion(
      `Please review my women health AI analysis and suggest next steps. Risk tier: ${womenHealthPlan.riskLevel.toUpperCase()}. Symptoms: ${symptomSummary}. Current medicines: ${medicineSummary}. Focus areas: ${focusSummary}. Screening priorities: ${screeningSummary}. I prefer consultation with a women doctor for comfort and privacy.`
    );
    setWomenDoctorStatusMessage('AI analysis copied. Select preferred hospital and send query to connect with women doctor.');

    setTimeout(() => {
      womenDoctorSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  };

  const handleWomenDoctorQuery = async () => {
    const hospitalId = Number(womenDoctorHospitalId);
    const selectedHospitalData = hospitals.find((item) => item.id === hospitalId);
    const patientNameToUse = publicLoginName.trim();
    if (!selectedHospitalData || !patientNameToUse || !womenDoctorDepartment.trim() || !womenDoctorCondition.trim() || !womenDoctorQuestion.trim()) {
      setWomenDoctorStatusMessage('Fill preferred hospital, department, condition and question fields.');
      return;
    }

    const queryPayload = `[Women Health][Women Doctor Preferred] ${womenDoctorQuestion.trim()}${
      womenCurrentMedicines.trim() ? ` | Current medicines: ${womenCurrentMedicines.trim()}` : ''
    }`;
    try {
      await postJson<{ data: DoctorQueryItem }>('/api/doctor-queries', {
        hospitalId,
        hospitalName: selectedHospitalData.name,
        patientName: patientNameToUse,
        department: `${womenDoctorDepartment.trim()} | Women Doctor Preferred`,
        disease: womenDoctorCondition.trim(),
        question: queryPayload,
      });
      setWomenDoctorStatusMessage('Women health query sent to preferred hospital with women doctor preference.');
      setWomenDoctorCondition('');
      setWomenDoctorQuestion('');
      await loadPublicDoctorQueries();
    } catch (error) {
      setWomenDoctorStatusMessage(error instanceof Error ? error.message : 'Unable to send women health query.');
    }
  };

  const stopLiveLocationTracking = () => {
    if (locationWatchIdRef.current !== null) {
      navigator.geolocation.clearWatch(locationWatchIdRef.current);
      locationWatchIdRef.current = null;
    }
    lastGeoSampleRef.current = null;
    setLiveSpeedKmph(0);
    setLocationTracking(false);
  };

  const startLiveLocationTracking = () => {
    setLocationError('');
    setAmbulanceDispatchMessage('');
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported on this device/browser.');
      return;
    }

    if (locationWatchIdRef.current !== null) {
      navigator.geolocation.clearWatch(locationWatchIdRef.current);
      locationWatchIdRef.current = null;
    }

    setLocationTracking(true);
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const ts = Date.now();
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const directSpeed = typeof position.coords.speed === 'number' && !Number.isNaN(position.coords.speed)
          ? position.coords.speed * 3.6
          : null;
        let estimatedSpeed = directSpeed ?? 0;
        if (directSpeed === null && lastGeoSampleRef.current) {
          const prev = lastGeoSampleRef.current;
          const dtSeconds = Math.max(1, (ts - prev.ts) / 1000);
          const distanceKm = getDistanceKm(prev.lat, prev.lng, lat, lng);
          estimatedSpeed = (distanceKm / dtSeconds) * 3600;
        }
        lastGeoSampleRef.current = { lat, lng, ts };
        setLiveSpeedKmph(clamp(estimatedSpeed, 0, 180));
        setLiveLocation({
          lat,
          lng,
          accuracy: position.coords.accuracy,
          updatedAt: new Date().toLocaleTimeString(),
        });
      },
      (error) => {
        setLocationTracking(false);
        setLocationError(error.message || 'Unable to get live location.');
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      }
    );
    locationWatchIdRef.current = watchId;
  };

  const handleRequestNearestAmbulance = async () => {
    if (!liveLocation || nearestHospitals.length === 0) {
      setAmbulanceDispatchMessage('Start live location tracking first.');
      return;
    }
    const nearest = nearestHospitals[0].hospital;
    const patientNameToUse = publicLoginName.trim() || 'Public User';
    const phone = publicPhoneNumber.trim();
    const locationLabel = `${liveLocation.lat.toFixed(5)}, ${liveLocation.lng.toFixed(5)}`;

    try {
      await postJson('/api/alerts', {
        hospitalId: nearest.id,
        patient: `${patientNameToUse}${phone ? ` | ${phone}` : ''} | ${locationLabel}`,
        severity: 'critical',
      });
      setAmbulanceDispatchMessage(
        `Ambulance request sent to ${nearest.name}. Location shared: ${locationLabel}${phone ? `, Contact: ${phone}` : ''}`
      );
    } catch (error) {
      setAmbulanceDispatchMessage(error instanceof Error ? error.message : 'Unable to send ambulance request.');
    }
  };

  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

  const sigmoid = (value: number) => 1 / (1 + Math.exp(-value));

  const inferCrashWithAI = (features: CrashAIFeatures): CrashAIPrediction => {
    const fusionModel = sigmoid(
      features.gForce * 0.23 +
      features.jerk * 0.07 +
      features.orientationShift * 0.04 +
      features.speedKmph * 0.015 +
      features.roadRisk * 0.8 +
      features.timeRisk * 0.4 -
      6.2
    );
    const anomalyModel = sigmoid(features.gForce * 0.2 + features.jerk * 0.1 + features.orientationShift * 0.06 - 5.1);
    const contextModel = sigmoid(features.speedKmph * 0.03 + features.roadRisk * 0.95 + features.timeRisk * 0.55 - 2.4);
    const ensembleScore = clamp(fusionModel * 0.5 + anomalyModel * 0.3 + contextModel * 0.2, 0, 1);
    const confidence = clamp(0.45 + Math.abs(ensembleScore - 0.5) * 0.9, 0, 0.99);
    const falsePositiveRisk = clamp((1 - features.speedKmph / 80) * 0.25 + (1 - features.gForce / 28) * 0.25, 0.03, 0.7);

    const reasons: string[] = [];
    if (features.gForce >= 24) reasons.push(`High impact force detected (${features.gForce.toFixed(1)}g).`);
    if (features.jerk >= 8) reasons.push(`Rapid motion delta / jerk spike (${features.jerk.toFixed(1)}).`);
    if (features.orientationShift >= 60) reasons.push(`Significant orientation shift (${features.orientationShift.toFixed(0)} deg/s).`);
    if (features.speedKmph >= 40) reasons.push(`Vehicle-speed context elevated (${features.speedKmph.toFixed(0)} km/h).`);
    if (features.timeRisk > 0.65) reasons.push('High-risk time window detected (late-night/low visibility).');

    const severityClass: CrashAIPrediction['severityClass'] =
      ensembleScore >= 0.82 ? 'high' : ensembleScore >= 0.58 ? 'medium' : 'low';

    const recommendedActions =
      severityClass === 'high'
        ? [
            'Dispatch emergency services immediately.',
            'Share live location and medical ID with nearest trauma center.',
            'Notify emergency contacts and keep line open for responders.',
          ]
        : severityClass === 'medium'
          ? [
              'Initiate assisted safety check and monitor vitals.',
              'Keep countdown active unless user confirms safe.',
              'Prepare nearest hospital routing in background.',
            ]
          : [
              'Mark as potential false positive and continue monitoring.',
              'Prompt user confirmation and self-check guidance.',
              'Escalate only if repeated high-risk motion spikes occur.',
            ];

    return {
      crashProbability: ensembleScore,
      severityClass,
      confidence,
      falsePositiveRisk,
      modelVotes: [
        { model: 'FusionNet', score: fusionModel },
        { model: 'Temporal Anomaly Detector', score: anomalyModel },
        { model: 'Context Risk Model', score: contextModel },
        { model: 'Ensemble Decision', score: ensembleScore },
      ],
      reasons: reasons.length > 0 ? reasons : ['No strong crash evidence from current sensor window.'],
      recommendedActions,
    };
  };

  const buildAIIncidentSummary = (prediction: CrashAIPrediction, features: CrashAIFeatures) => {
    return `AI Incident Summary: ${prediction.severityClass.toUpperCase()} risk | Probability ${(prediction.crashProbability * 100).toFixed(0)}% | Confidence ${(prediction.confidence * 100).toFixed(0)}% | g=${features.gForce.toFixed(1)} | speed=${features.speedKmph.toFixed(0)} km/h`;
  };

  const addCrashLog = async (status: CrashIncidentLogItem['status'], message: string) => {
    const localItem: CrashIncidentLogItem = {
      id: Date.now(),
      status,
      message,
      createdAt: new Date().toLocaleString(),
    };
    setCrashIncidentLog((prev) => [localItem, ...prev].slice(0, 50));
    try {
      const response = await postJson<{ data: CrashIncidentLogItem }>('/api/crash-incidents', { status, message });
      if (response?.data) {
        setCrashIncidentLog((prev) => [response.data, ...prev.filter((item) => item.id !== localItem.id)].slice(0, 50));
      }
    } catch {
      // Keep local fallback when backend is unavailable.
    }
  };

  const triggerCrashDetection = (source: string, gForce?: number, prediction?: CrashAIPrediction) => {
    const now = Date.now();
    if (now - lastCrashDetectedAtRef.current < 15000) {
      return;
    }
    lastCrashDetectedAtRef.current = now;
    setCrashDetected(true);
    setCrashCountdown(10);
    const aiSuffix = prediction
      ? ` AI risk ${(prediction.crashProbability * 100).toFixed(0)}% (${prediction.severityClass.toUpperCase()})`
      : '';
    const message = gForce
      ? `Possible crash detected from ${source} (${gForce.toFixed(1)}g).${aiSuffix} Auto emergency dispatch in 10s unless cancelled.`
      : `Possible crash detected from ${source}.${aiSuffix} Auto emergency dispatch in 10s unless cancelled.`;
    setCrashStatusMessage(message);
    void addCrashLog('detected', message);
  };

  const handleAutoCrashEmergencyDispatch = async () => {
    const patientNameToUse = publicLoginName.trim() || 'Public User';
    const phone = publicPhoneNumber.trim();
    const contacts = [safetyContactOne.trim(), safetyContactTwo.trim()].filter(Boolean).join(', ');
    const locationLabel = liveLocation ? `${liveLocation.lat.toFixed(5)}, ${liveLocation.lng.toFixed(5)}` : 'Location unavailable';

    const derivedSeverity = crashAIPrediction?.severityClass === 'high'
      ? 'critical'
      : crashAIPrediction?.severityClass === 'medium'
        ? 'moderate'
        : 'moderate';
    try {
      if (liveLocation && nearestHospitals.length > 0) {
        const nearest = nearestHospitals[0].hospital;
        await postJson('/api/alerts', {
          hospitalId: nearest.id,
          patient: `${patientNameToUse}${phone ? ` | ${phone}` : ''} | Crash Alert | ${locationLabel} | ${aiIncidentSummary || 'AI summary unavailable'}`,
          severity: derivedSeverity,
        });
        const msg = `Crash alert dispatched to ${nearest.name}. Location: ${locationLabel}. Emergency contacts notified: ${contacts || 'Not configured'}.`;
        setCrashStatusMessage(msg);
        void addCrashLog('dispatched', msg);
      } else {
        const msg = `Crash alert generated, but live location was not available. Emergency contacts notified: ${contacts || 'Not configured'}.`;
        setCrashStatusMessage(msg);
        void addCrashLog('dispatched', msg);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unable to dispatch crash emergency alert.';
      setCrashStatusMessage(msg);
      void addCrashLog('dispatched', msg);
    } finally {
      setCrashDetected(false);
      setCrashCountdown(0);
    }
  };

  const cancelCrashAlert = () => {
    setCrashDetected(false);
    setCrashCountdown(0);
    const msg = 'Crash alert countdown cancelled by user confirmation.';
    setCrashStatusMessage(msg);
    void addCrashLog('cancelled', msg);
  };

  const requestMotionPermissionIfNeeded = async () => {
    const eventType = DeviceMotionEvent as typeof DeviceMotionEvent & {
      requestPermission?: () => Promise<'granted' | 'denied'>;
    };
    if (typeof eventType.requestPermission === 'function') {
      const permission = await eventType.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Motion sensor permission denied.');
      }
    }
  };

  const startCrashMonitoring = async () => {
    try {
      await requestMotionPermissionIfNeeded();
      if (!liveLocation) {
        startLiveLocationTracking();
      }
      setCrashMonitoring(true);
      setCrashStatusMessage('Smart crash monitoring is active with AI sensor fusion.');
    } catch (error) {
      setCrashStatusMessage(error instanceof Error ? error.message : 'Unable to start crash monitoring.');
    }
  };

  const stopCrashMonitoring = () => {
    setCrashMonitoring(false);
    setCrashStatusMessage('Smart crash monitoring stopped.');
  };

  const loadHospitalAlerts = async (hospitalId: number) => {
    if (!hospitalId) {
      setEmergencyAlerts([]);
      return;
    }
    try {
      const response = await getJson<{ data: EmergencyAlertItem[] }>(`/api/alerts?hospitalId=${hospitalId}`);
      setEmergencyAlerts(response.data);
    } catch {
      // Silent fail to keep dashboard usable if backend is unavailable.
    }
  };

  const handleAcceptAlert = async (id: number) => {
    try {
      await patchJson(`/api/alerts/${id}`, { status: 'accepted' });
      setTriageStatusByAlertId((prev) => ({ ...prev, [id]: 'in-treatment' }));
      if (selectedHospital) {
        await loadHospitalAlerts(selectedHospital.id);
      }
    } catch {
      // Silent fail to avoid blocking dashboard interactions.
    }
  };

  const handleRejectAlert = async (id: number) => {
    try {
      await patchJson(`/api/alerts/${id}`, { status: 'rejected' });
      setTriageStatusByAlertId((prev) => ({ ...prev, [id]: 'discharged' }));
      if (selectedHospital) {
        await loadHospitalAlerts(selectedHospital.id);
      }
    } catch {
      // Silent fail to avoid blocking dashboard interactions.
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500 text-white';
      case 'moderate': return 'bg-yellow-500 text-black';
      default: return 'bg-green-500 text-white';
    }
  };

  const getAlertAgeLabel = (createdAtMs: number) => {
    const ageSeconds = Math.max(0, Math.floor((Date.now() - createdAtMs) / 1000));
    if (ageSeconds < 60) {
      return `${ageSeconds}s ago`;
    }
    const ageMinutes = Math.floor(ageSeconds / 60);
    return `${ageMinutes} min ago`;
  };

  const getVitalsRisk = () => {
    const temp = Number(bodyTemperature);
    const spo2 = Number(oxygenSaturation);
    const pulse = Number(pulseRate);
    if (Number.isNaN(temp) || Number.isNaN(spo2) || Number.isNaN(pulse)) {
      return { level: 'unknown', advice: 'Enter valid vitals to assess risk.' };
    }
    if (spo2 < 92 || pulse > 120 || temp >= 102) {
      return { level: 'critical', advice: 'Critical vitals detected. Contact emergency services immediately.' };
    }
    if (spo2 < 95 || pulse > 105 || temp >= 100) {
      return { level: 'moderate', advice: 'Moderate risk. Seek medical consultation soon.' };
    }
    return { level: 'stable', advice: 'Vitals look stable. Continue monitoring every 30 minutes.' };
  };

  const updateTriageStatus = async (id: number, status: TriageWorkflowStatus) => {
    try {
      if (status === 'in-treatment' || status === 'admitted') {
        await patchJson(`/api/alerts/${id}`, { status: 'accepted' });
      } else if (status === 'discharged') {
        await patchJson(`/api/alerts/${id}`, { status: 'rejected' });
      } else {
        await patchJson(`/api/alerts/${id}`, { status: 'pending' });
      }
      setTriageStatusByAlertId((prev) => ({ ...prev, [id]: status }));
      if (selectedHospital) {
        await loadHospitalAlerts(selectedHospital.id);
      }
    } catch {
      // Silent fail to avoid blocking dashboard interactions.
    }
  };

  const adjustMedication = (id: number, delta: number) => {
    setMedicationStock((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, available: Math.max(0, item.available + delta) }
          : item
      )
    );
  };

  const updateEmergencyMedicineOrderStatus = async (id: number, status: EmergencyMedicineOrderItem['status']) => {
    setEmergencyMedicineOrders((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status, remainingSeconds: status === 'completed' || status === 'rejected' ? 0 : item.remainingSeconds }
          : item
      )
    );
    try {
      await patchJson<{ data: EmergencyMedicineOrderItem }>(`/api/pharmacy-orders/${id}`, { status });
    } catch {
      // Keep optimistic status update locally if backend is unavailable.
    }
  };

  const adjustPharmacyInventory = (id: number, delta: number) => {
    setPharmacyInventory((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, stock: Math.max(0, item.stock + delta) }
          : item
      )
    );
  };

  const getNetworkAvailability = (pharmacyId: number, medicineId: number): 'In Stock' | 'Limited' | 'Out of Stock' => {
    const score = (pharmacyId * 11 + medicineId * 7) % 10;
    if (score <= 1) return 'Out of Stock';
    if (score <= 4) return 'Limited';
    return 'In Stock';
  };

  const getSubstituteMedicines = (medicineName: string) => {
    const fallbackMap: Record<string, string[]> = {
      'Paracetamol 650mg': ['Dolo 650', 'Ibuprofen 400mg'],
      'Dolo 650': ['Paracetamol 650mg', 'Ibuprofen 400mg'],
      'Insulin Vials': ['Metformin 500mg'],
      'Salbutamol Inhalers': ['Budesonide Inhaler', 'Nebulizer Solution'],
      'Azithromycin 500mg': ['Amoxicillin 500mg'],
    };
    return fallbackMap[medicineName] ?? [];
  };

  const createPublicIssue = () => {
    if (!issueTitle.trim() || !issueDetail.trim()) {
      return;
    }
    const newIssue: PublicIssueItem = {
      id: Date.now(),
      title: issueTitle.trim(),
      detail: issueDetail.trim(),
      priority: 'medium',
      status: 'open',
      createdAt: new Date().toLocaleString(),
    };
    setPublicIssues((prev) => [newIssue, ...prev].slice(0, 30));
    setIssueTitle('');
    setIssueDetail('');
  };

  const updatePublicIssueStatus = (id: number, status: PublicIssueItem['status']) => {
    setPublicIssues((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
  };

  const resolveRecall = (id: number) => {
    setRecallItems((prev) => prev.map((item) => (item.id === id ? { ...item, status: 'resolved' } : item)));
  };

  const handleStockTransfer = () => {
    const fromId = Number(transferFromPharmacyId);
    const toId = Number(transferToPharmacyId);
    const qty = Number(transferQuantity);
    const medicine = transferMedicine.trim();
    if (!fromId || !toId || fromId === toId || !medicine || qty <= 0) {
      setTransferStatusMessage('Select source, destination, medicine and valid quantity.');
      return;
    }
    const fromPharmacy = pharmacyPortalAccounts.find((item) => item.id === fromId);
    const toPharmacy = pharmacyPortalAccounts.find((item) => item.id === toId);
    if (!fromPharmacy || !toPharmacy) {
      setTransferStatusMessage('Invalid pharmacy selection.');
      return;
    }
    setTransferStatusMessage(
      `Transfer initiated: ${qty} units of ${medicine} from ${fromPharmacy.name} to ${toPharmacy.name}.`
    );
    setTransferQuantity('10');
  };

  const formatOrderTimer = (seconds: number) => {
    const safe = Math.max(0, seconds);
    const minutes = Math.floor(safe / 60).toString().padStart(2, '0');
    const secs = Math.floor(safe % 60).toString().padStart(2, '0');
    return `${minutes}:${secs}`;
  };

  const getPriorityBadgeClass = (priority: 'high' | 'medium' | 'low') => {
    if (priority === 'high') return 'bg-red-600';
    if (priority === 'medium') return 'bg-yellow-500 text-black';
    return 'bg-emerald-600';
  };

  const getPriorityFromSeverity = (severity: string): 'high' | 'medium' | 'low' => {
    if (severity === 'critical') return 'high';
    if (severity === 'moderate') return 'medium';
    return 'low';
  };

  const getConditionFromSeverity = (severity: string) => {
    if (severity === 'critical') return 'Severe trauma / unstable condition';
    if (severity === 'moderate') return 'Urgent assessment required';
    return 'Stable but needs observation';
  };

  const getVitalsFromAlert = (alert: EmergencyAlertItem) => {
    if (alert.severity === 'critical') {
      return `BP ${88 + (alert.id % 8)}/${56 + (alert.id % 6)}, SpO2 ${88 + (alert.id % 4)}%`;
    }
    if (alert.severity === 'moderate') {
      return `BP ${102 + (alert.id % 10)}/${66 + (alert.id % 8)}, SpO2 ${93 + (alert.id % 4)}%`;
    }
    return `BP ${112 + (alert.id % 8)}/${72 + (alert.id % 8)}, SpO2 ${97 + (alert.id % 2)}%`;
  };

  const getTriageStatusFromAlert = (alert: EmergencyAlertItem): TriageWorkflowStatus => {
    const overridden = triageStatusByAlertId[alert.id];
    if (overridden) {
      return overridden;
    }
    if (alert.status === 'accepted') {
      return alert.id % 2 === 0 ? 'admitted' : 'in-treatment';
    }
    if (alert.status === 'rejected') {
      return 'discharged';
    }
    return 'waiting';
  };

  const getReportPreviewMeta = (item: ReportReferralItem) => {
    const corpus = `${item.source} ${item.summary} ${item.cause} ${item.reportExcerpt}`.toLowerCase();
    if (corpus.includes('x-ray') || corpus.includes('xray')) {
      return { label: 'X-RAY', accent: '#38bdf8' };
    }
    if (corpus.includes('ct')) {
      return { label: 'CT SCAN', accent: '#22d3ee' };
    }
    if (corpus.includes('mri')) {
      return { label: 'MRI', accent: '#a78bfa' };
    }
    if (corpus.includes('ultrasound') || corpus.includes('usg')) {
      return { label: 'ULTRASOUND', accent: '#34d399' };
    }
    if (corpus.includes('ecg') || corpus.includes('echo')) {
      return { label: 'CARDIAC', accent: '#f59e0b' };
    }
    if (corpus.includes('urine')) {
      return { label: 'URINE TEST', accent: '#eab308' };
    }
    if (corpus.includes('cbc') || corpus.includes('blood') || corpus.includes('troponin') || corpus.includes('d-dimer')) {
      return { label: 'BLOOD TEST', accent: '#ef4444' };
    }
    return { label: 'LAB REPORT', accent: '#14b8a6' };
  };

  const getReportPreviewImage = (item: ReportReferralItem) => {
    const meta = getReportPreviewMeta(item);
    const patient = item.patientName.slice(0, 22);
    const excerpt = item.reportExcerpt.slice(0, 44);
    const now = new Date().toLocaleTimeString();
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='640' height='360' viewBox='0 0 640 360'>
      <defs>
        <linearGradient id='bg' x1='0' y1='0' x2='1' y2='1'>
          <stop offset='0%' stop-color='#0f172a'/>
          <stop offset='100%' stop-color='#1e293b'/>
        </linearGradient>
      </defs>
      <rect width='640' height='360' fill='url(#bg)'/>
      <rect x='24' y='24' width='592' height='312' rx='16' fill='#0b1222' stroke='${meta.accent}' stroke-width='2'/>
      <rect x='44' y='72' width='552' height='180' rx='10' fill='#111827' stroke='#334155' stroke-width='1.5' stroke-dasharray='8 6'/>
      <polyline points='50,210 120,192 180,198 250,170 320,182 390,146 460,160 530,136 590,148' fill='none' stroke='${meta.accent}' stroke-width='3'/>
      <circle cx='130' cy='150' r='36' fill='none' stroke='${meta.accent}' stroke-width='3' opacity='0.7'/>
      <line x1='94' y1='150' x2='166' y2='150' stroke='${meta.accent}' stroke-width='2'/>
      <line x1='130' y1='114' x2='130' y2='186' stroke='${meta.accent}' stroke-width='2'/>
      <text x='44' y='54' font-family='Arial, sans-serif' font-size='22' fill='${meta.accent}' font-weight='700'>${meta.label}</text>
      <text x='44' y='284' font-family='Arial, sans-serif' font-size='18' fill='#e2e8f0'>Patient: ${patient}</text>
      <text x='44' y='312' font-family='Arial, sans-serif' font-size='15' fill='#94a3b8'>${excerpt}</text>
      <text x='516' y='54' font-family='Arial, sans-serif' font-size='14' fill='#94a3b8'>Live ${now}</text>
    </svg>`;
    return {
      label: meta.label,
      image: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`,
    };
  };

  const liveTriageQueue = emergencyAlerts
    .map((alert) => ({
      id: alert.id,
      name: alert.patient,
      condition: getConditionFromSeverity(alert.severity),
      priority: getPriorityFromSeverity(alert.severity),
      vitals: getVitalsFromAlert(alert),
      status: getTriageStatusFromAlert(alert),
      remainingSeconds: alert.remainingSeconds,
      severity: alert.severity,
    }))
    .sort((a, b) => {
      const priorityScore = { high: 0, medium: 1, low: 2 };
      return priorityScore[a.priority] - priorityScore[b.priority];
    });

  const triageBuckets: Record<TriageWorkflowStatus, typeof liveTriageQueue> = {
    waiting: [],
    'in-treatment': [],
    admitted: [],
    discharged: [],
  };
  liveTriageQueue.forEach((item) => {
    triageBuckets[item.status].push(item);
  });

  const getExpectedHospitalPassword = (hospitalId: number) => {
    return hospitalCredentials[hospitalId] ?? 'hospital123';
  };

  const loadPublicAppointments = async () => {
    const username = publicLoginName.trim() || 'Public User';
    try {
      const response = await getJson<{ data: AppointmentItem[] }>('/api/appointments');
      setPublicAppointments(response.data.filter((item) => item.patientName.toLowerCase() === username.toLowerCase()));
    } catch {
      // Silent fail to keep portal responsive if backend is unavailable.
    }
  };

  const loadPublicPrescriptions = async () => {
    const username = publicLoginName.trim();
    if (!username) {
      setPublicPrescriptions([]);
      return;
    }
    try {
      const response = await getJson<{ data: PrescriptionItem[] }>(`/api/prescriptions?patientName=${encodeURIComponent(username)}`);
      setPublicPrescriptions(response.data);
    } catch {
      // Silent fail to keep portal responsive if backend is unavailable.
    }
  };

  const loadHospitalAppointments = async (hospitalId: number) => {
    if (!hospitalId) {
      setHospitalAppointments([]);
      return;
    }
    try {
      const response = await getJson<{ data: AppointmentItem[] }>(`/api/appointments?hospitalId=${hospitalId}`);
      setHospitalAppointments(response.data);
    } catch {
      // Silent fail to keep portal responsive if backend is unavailable.
    }
  };

  const loadHospitalPrescriptions = async (hospitalId: number) => {
    if (!hospitalId) {
      setHospitalPrescriptions([]);
      return;
    }
    try {
      const response = await getJson<{ data: PrescriptionItem[] }>(`/api/prescriptions?hospitalId=${hospitalId}`);
      setHospitalPrescriptions(response.data);
    } catch {
      // Silent fail to keep portal responsive if backend is unavailable.
    }
  };

  const loadHospitalReportReferrals = async (hospitalId: number) => {
    if (!hospitalId) {
      setHospitalReportReferrals([]);
      return;
    }
    try {
      const response = await getJson<{ data: ReportReferralItem[] }>(`/api/report-referrals?hospitalId=${hospitalId}`);
      setHospitalReportReferrals(response.data);
    } catch {
      // Silent fail to keep portal responsive if backend is unavailable.
    }
  };

  const loadPublicDoctorQueries = async () => {
    const username = publicLoginName.trim();
    if (!username) {
      setPublicDoctorQueries([]);
      return;
    }
    try {
      const response = await getJson<{ data: DoctorQueryItem[] }>(`/api/doctor-queries?patientName=${encodeURIComponent(username)}`);
      setPublicDoctorQueries(response.data);
    } catch {
      // Silent fail to keep portal responsive if backend is unavailable.
    }
  };

  const loadHospitalDoctorQueries = async (hospitalId: number) => {
    if (!hospitalId) {
      setHospitalDoctorQueries([]);
      return;
    }
    try {
      const response = await getJson<{ data: DoctorQueryItem[] }>(`/api/doctor-queries?hospitalId=${hospitalId}`);
      setHospitalDoctorQueries(response.data);
    } catch {
      // Silent fail to keep portal responsive if backend is unavailable.
    }
  };

  const handleAskDoctorQuestion = async () => {
    const hospitalId = Number(askDoctorHospitalId);
    const selectedHospitalData = hospitals.find((item) => item.id === hospitalId);
    const patientNameToUse = publicLoginName.trim();
    if (!selectedHospitalData || !patientNameToUse || !askDoctorDepartment.trim() || !askDoctorDisease.trim() || !askDoctorQuestion.trim()) {
      setAskDoctorStatusMessage('Fill hospital, department, disease and question fields.');
      return;
    }
    const requestPrefix = askDoctorRequestType === 'prescription'
      ? 'Prescription Request'
      : 'General Query';
    const questionPayload = askDoctorRequestType === 'prescription'
      ? `${requestPrefix}: ${askDoctorQuestion.trim()}${
          askDoctorCurrentMedicines.trim()
            ? ` | Current medicines/history: ${askDoctorCurrentMedicines.trim()}`
            : ''
        }`
      : askDoctorQuestion.trim();
    try {
      await postJson<{ data: DoctorQueryItem }>('/api/doctor-queries', {
        hospitalId,
        hospitalName: selectedHospitalData.name,
        patientName: patientNameToUse,
        department: askDoctorDepartment.trim(),
        disease: askDoctorDisease.trim(),
        question: questionPayload,
      });
      setAskDoctorStatusMessage(
        askDoctorRequestType === 'prescription'
          ? 'Medicine prescription request sent to the concerned doctor.'
          : 'Question sent to concerned doctors.'
      );
      setAskDoctorDepartment('');
      setAskDoctorDisease('');
      setAskDoctorQuestion('');
      setAskDoctorCurrentMedicines('');
      setAskDoctorRequestType('general');
      await loadPublicDoctorQueries();
    } catch (error) {
      setAskDoctorStatusMessage(error instanceof Error ? error.message : 'Unable to send doctor query.');
    }
  };

  const handleAnswerDoctorQuery = async (queryId: number) => {
    const responseInput = doctorResponseByQuery[queryId];
    if (!responseInput?.doctorName?.trim() || !responseInput?.answer?.trim()) {
      return;
    }
    try {
      await patchJson(`/api/doctor-queries/${queryId}`, {
        doctorName: responseInput.doctorName.trim(),
        answer: responseInput.answer.trim(),
      });
      if (selectedHospital) {
        await loadHospitalDoctorQueries(selectedHospital.id);
      }
      setDoctorResponseByQuery((prev) => ({
        ...prev,
        [queryId]: { doctorName: '', answer: '' },
      }));
    } catch {
      // Silent fail to avoid blocking dashboard interactions.
    }
  };

  const handleAnalyzeScanReport = async () => {
    const reportText = scanReportText.trim();
    if (!reportText) {
      setScanReportStatusMessage('Please paste scan or test report text first.');
      return;
    }
    setScanReportStatusMessage('Analyzing report with AI...');
    try {
      const response = await postJson<{ data: ReportAnalysisResult }>('/api/report-analysis', { reportText });
      setScanReportAnalysis(response.data);
      setScanReportStatusMessage('Report analyzed successfully.');
    } catch (error) {
      setScanReportStatusMessage(error instanceof Error ? error.message : 'Unable to analyze report right now.');
    }
  };

  const handleSendReportToHospital = async () => {
    const hospitalId = Number(scanReportHospitalId);
    const selectedHospitalData = hospitals.find((item) => item.id === hospitalId);
    if (!selectedHospitalData) {
      setScanReportStatusMessage('Please select a hospital to send the analysis.');
      return;
    }
    if (!scanReportAnalysis) {
      setScanReportStatusMessage('Analyze the report first, then send it to hospital.');
      return;
    }

    try {
      await postJson<{ data: ReportReferralItem }>('/api/report-referrals', {
        hospitalId: selectedHospitalData.id,
        hospitalName: selectedHospitalData.name,
        patientName: publicLoginName.trim() || 'Public User',
        doctorSpecialty: scanReportAnalysis.severity === 'urgent' ? 'Emergency Medicine' : 'General Medicine',
        severity: scanReportAnalysis.severity,
        cause: scanReportAnalysis.cause,
        summary: scanReportAnalysis.summary,
        source: 'text',
        reportExcerpt: scanReportText.trim().slice(0, 700),
      });
      setScanReportStatusMessage('Analysis sent to selected hospital successfully.');
    } catch (error) {
      setScanReportStatusMessage(error instanceof Error ? error.message : 'Unable to send report to hospital.');
    }
  };

  const handleBookAppointment = async () => {
    const hospitalId = Number(appointmentHospitalId);
    const selectedHospitalData = hospitals.find((item) => item.id === hospitalId);
    const patientNameToUse = publicLoginName.trim();
    if (!selectedHospitalData || !patientNameToUse || !appointmentDateTime.trim()) {
      setAppointmentStatusMessage('Please select hospital, username, and appointment time.');
      return;
    }
    try {
      await postJson<{ data: AppointmentItem }>('/api/appointments', {
        hospitalId,
        hospitalName: selectedHospitalData.name,
        patientName: patientNameToUse,
        contactNumber: appointmentContact.trim(),
        reason: appointmentReason.trim() || 'General consultation',
        appointmentAt: appointmentDateTime.trim(),
      });
      setAppointmentStatusMessage('Appointment sent to hospital portal successfully.');
      setAppointmentReason('');
      setAppointmentContact('');
      setAppointmentDateTime('');
      await loadPublicAppointments();
    } catch (error) {
      setAppointmentStatusMessage(error instanceof Error ? error.message : 'Unable to book appointment right now.');
    }
  };

  const updateAppointmentStatus = async (appointmentId: number, status: AppointmentItem['status']) => {
    try {
      await patchJson(`/api/appointments/${appointmentId}`, { status });
      if (selectedHospital) {
        await loadHospitalAppointments(selectedHospital.id);
      }
    } catch {
      // Silent fail to avoid blocking dashboard interactions.
    }
  };

  const handleCreatePrescription = async () => {
    if (!selectedHospital || !prescriptionPatientName.trim()) {
      setPrescriptionStatusMessage('Select patient name and fill required fields.');
      return;
    }
    try {
      await postJson<{ data: PrescriptionItem }>('/api/prescriptions', {
        hospitalId: selectedHospital.id,
        hospitalName: selectedHospital.name,
        patientName: prescriptionPatientName.trim(),
        doctorName: prescriptionDoctorName.trim() || 'Duty Doctor',
        medicines: prescriptionMedicines.trim(),
        advice: prescriptionAdvice.trim(),
      });
      setPrescriptionStatusMessage('Prescription delivered to public portal.');
      setPrescriptionPatientName('');
      setPrescriptionDoctorName('');
      setPrescriptionMedicines('');
      setPrescriptionAdvice('');
      await loadHospitalPrescriptions(selectedHospital.id);
    } catch (error) {
      setPrescriptionStatusMessage(error instanceof Error ? error.message : 'Unable to save prescription.');
    }
  };

  useEffect(() => {
    if (role !== 'none') {
      return undefined;
    }
    const pulseIntervalId = window.setInterval(() => {
      setLivePulse((prev) => {
        const next = prev + Math.round((Math.random() - 0.5) * 8);
        return Math.min(108, Math.max(64, next));
      });
    }, 1200);
    return () => window.clearInterval(pulseIntervalId);
  }, [role]);

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPromptEvent(event as BeforeInstallPromptEvent);
    };
    const onAppInstalled = () => {
      setInstallPromptEvent(null);
      setShowInstallHelp(false);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  useEffect(() => {
    if (role === 'public') {
      loadPublicAppointments();
      loadPublicPrescriptions();
      loadPublicDoctorQueries();
      loadPharmacyOrders();
      loadCrashIncidents();
      const intervalId = window.setInterval(() => {
        loadPublicAppointments();
        loadPublicPrescriptions();
        loadPublicDoctorQueries();
        loadPharmacyOrders();
        loadCrashIncidents();
      }, 8000);
      return () => window.clearInterval(intervalId);
    }
    return undefined;
  }, [role, publicLoginName]);

  useEffect(() => {
    loadPortalSettings();
    loadPharmacyOrders();
    loadCrashIncidents();
  }, []);

  useEffect(() => {
    if (role === 'pharmacy' || role === 'admin') {
      loadPharmacyOrders();
      const intervalId = window.setInterval(() => {
        loadPharmacyOrders();
      }, 5000);
      return () => window.clearInterval(intervalId);
    }
    return undefined;
  }, [role]);

  useEffect(() => {
    if (role === 'admin') {
      loadAdminStats();
      loadPortalSettings();
      loadBlockchainRecords();
      verifyBlockchain();
      const intervalId = window.setInterval(() => {
        loadAdminStats();
        loadPortalSettings();
        loadBlockchainRecords();
        verifyBlockchain();
      }, 5000);
      return () => window.clearInterval(intervalId);
    }
    return undefined;
  }, [role]);

  useEffect(() => {
    if (role !== 'public' || awarenessPaused) {
      return undefined;
    }
    const awarenessIntervalId = window.setInterval(() => {
      setAwarenessFrameIndex((prev) => (prev + 1) % SEASONAL_AWARENESS_BY_MONTH.length);
      setAwarenessUpdatedAt(new Date().toLocaleTimeString());
    }, 15000);
    return () => window.clearInterval(awarenessIntervalId);
  }, [role, awarenessPaused]);

  useEffect(() => {
    if (role !== 'public' || womenAwarenessPaused) {
      return undefined;
    }
    const womenAwarenessIntervalId = window.setInterval(() => {
      setWomenAwarenessIndex((prev) => (prev + 1) % WOMEN_AWARENESS_FEED.length);
      setWomenAwarenessUpdatedAt(new Date().toLocaleTimeString());
    }, 12000);
    return () => window.clearInterval(womenAwarenessIntervalId);
  }, [role, womenAwarenessPaused]);

  useEffect(() => {
    if (role !== 'public' && locationWatchIdRef.current !== null) {
      navigator.geolocation.clearWatch(locationWatchIdRef.current);
      locationWatchIdRef.current = null;
      setLocationTracking(false);
      lastGeoSampleRef.current = null;
      setLiveSpeedKmph(0);
    }
    if (role !== 'public' && crashMonitoring) {
      setCrashMonitoring(false);
      setCrashDetected(false);
      setCrashCountdown(0);
    }
    return () => {
      if (locationWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(locationWatchIdRef.current);
        locationWatchIdRef.current = null;
      }
    };
  }, [role, crashMonitoring]);

  useEffect(() => {
    if (!crashDetected) {
      return undefined;
    }
    if (crashCountdown <= 0) {
      void handleAutoCrashEmergencyDispatch();
      return undefined;
    }
    const countdownId = window.setTimeout(() => {
      setCrashCountdown((prev) => prev - 1);
    }, 1000);
    return () => window.clearTimeout(countdownId);
  }, [crashDetected, crashCountdown]);

  useEffect(() => {
    if (!womenSafetyDetected) {
      return undefined;
    }
    if (womenSafetyCountdown <= 0) {
      void dispatchWomenSafetyAlert();
      return undefined;
    }
    const countdownId = window.setTimeout(() => {
      setWomenSafetyCountdown((prev) => prev - 1);
    }, 1000);
    return () => window.clearTimeout(countdownId);
  }, [womenSafetyDetected, womenSafetyCountdown]);

  useEffect(() => {
    if (!crashMonitoring || role !== 'public') {
      return undefined;
    }
    const motionHandler = (event: DeviceMotionEvent) => {
      const acceleration = event.acceleration || event.accelerationIncludingGravity;
      if (!acceleration) return;
      const x = acceleration.x ?? 0;
      const y = acceleration.y ?? 0;
      const z = acceleration.z ?? 0;
      const gForce = Math.sqrt(x * x + y * y + z * z);
      const now = Date.now();
      const prev = lastMotionSampleRef.current;
      const dtSeconds = prev.ts > 0 ? Math.max(0.016, (now - prev.ts) / 1000) : 0.016;
      const jerk = Math.abs(gForce - prev.gForce) / dtSeconds;
      lastMotionSampleRef.current = { gForce, ts: now };
      const orientationShift = Math.abs(event.rotationRate?.alpha ?? 0) + Math.abs(event.rotationRate?.beta ?? 0) + Math.abs(event.rotationRate?.gamma ?? 0);
      const hour = new Date().getHours();
      const timeRisk = (hour >= 22 || hour <= 5) ? 0.85 : (hour >= 18 || hour <= 7) ? 0.55 : 0.25;
      const roadRisk = liveSpeedKmph > 70 ? 0.85 : liveSpeedKmph > 40 ? 0.6 : 0.3;

      const features: CrashAIFeatures = {
        gForce,
        jerk,
        orientationShift,
        speedKmph: liveSpeedKmph,
        timeRisk,
        roadRisk,
      };
      const prediction = inferCrashWithAI(features);
      setCrashAIFeatures(features);
      setCrashAIPrediction(prediction);
      setCrashRiskScore(prediction.crashProbability);
      setAiIncidentSummary(buildAIIncidentSummary(prediction, features));

      if (prediction.crashProbability >= 0.82 || gForce >= 24) {
        triggerCrashDetection('AI sensor fusion', gForce, prediction);
      }
    };
    window.addEventListener('devicemotion', motionHandler);
    return () => window.removeEventListener('devicemotion', motionHandler);
  }, [crashMonitoring, role, liveSpeedKmph]);

  useEffect(() => {
    const activeIds = new Set(emergencyAlerts.map((alert) => alert.id));
    setTriageStatusByAlertId((prev) => {
      const next: Record<number, TriageWorkflowStatus> = {};
      Object.entries(prev).forEach(([id, status]) => {
        if (activeIds.has(Number(id))) {
          next[Number(id)] = status;
        }
      });
      return next;
    });
  }, [emergencyAlerts]);

  useEffect(() => {
    if (role === 'hospital' && selectedHospital) {
      loadHospitalAlerts(selectedHospital.id);
      loadHospitalAppointments(selectedHospital.id);
      loadHospitalPrescriptions(selectedHospital.id);
      loadHospitalReportReferrals(selectedHospital.id);
      loadHospitalDoctorQueries(selectedHospital.id);
      const alertsIntervalId = window.setInterval(() => {
        loadHospitalAlerts(selectedHospital.id);
      }, 1000);
      const dataIntervalId = window.setInterval(() => {
        loadHospitalAppointments(selectedHospital.id);
        loadHospitalPrescriptions(selectedHospital.id);
        loadHospitalReportReferrals(selectedHospital.id);
        loadHospitalDoctorQueries(selectedHospital.id);
      }, 8000);
      return () => {
        window.clearInterval(alertsIntervalId);
        window.clearInterval(dataIntervalId);
      };
    }
    return undefined;
  }, [role, selectedHospital]);

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setEmergencyMedicineOrders((prev) =>
        prev.map((order) => {
          if ((order.status === 'pending' || order.status === 'accepted') && order.remainingSeconds > 0) {
            return { ...order, remainingSeconds: order.remainingSeconds - 1 };
          }
          return order;
        })
      );
    }, 1000);
    return () => window.clearInterval(timerId);
  }, []);

  const handlePortalLogin = async () => {
    resetAuthFeedback();
    if (activeLoginPortal === 'admin') {
      if (adminLoginName.trim().toLowerCase() !== ADMIN_USERNAME || adminLoginPassword.trim() !== ADMIN_PASSWORD) {
        setAuthError('Invalid admin credentials. Use admin / admin123 for demo.');
        return;
      }
      setRole('admin');
      return;
    }
    if (isManagedPortalBlocked(activeLoginPortal)) {
      setAuthError(adminMaintenanceMode ? 'Portal access is temporarily disabled due to system maintenance.' : 'Portal access is disabled by admin.');
      return;
    }
    if (activeLoginPortal === 'public') {
      const name = publicLoginName.trim();
      const phone = publicPhoneNumber.trim();
      if (!name || !phone) {
        setAuthError('Please enter name and phone number to continue.');
        return;
      }
      const normalizedDigits = phone.replace(/\D/g, '');
      if (normalizedDigits.length < 10) {
        setAuthError('Please enter a valid phone number (at least 10 digits).');
        return;
      }
      setView('home');
      setRole('public');
      return;
    }
    if (activeLoginPortal === 'pharmacy') {
      const pharmacyId = Number(pharmacyLoginId);
      const selectedPharmacy = pharmacyPortalAccounts.find((item) => item.id === pharmacyId);
      if (!selectedPharmacy) {
        setAuthError('Please select your pharmacy before login.');
        return;
      }
      if (pharmacyLoginPassword.trim() !== selectedPharmacy.password) {
        setAuthError('Invalid pharmacy password.');
        return;
      }
      setSelectedPharmacyPortal(selectedPharmacy);
      setRole('pharmacy');
      return;
    }

    const hospitalId = Number(hospitalLoginId);
    const selected = hospitals.find((hospital) => hospital.id === hospitalId);
    if (!selected) {
      setAuthError('Please select your hospital before login.');
      return;
    }
    setAuthLoading(true);
    try {
      const hospitalKey = hospitalAuthKeysById[hospitalId];
      if (hospitalKey) {
        await postJson('/api/auth/hospital-login', {
          hospitalId: hospitalKey,
          password: hospitalLoginPassword.trim(),
        });
      } else if (hospitalLoginPassword.trim() !== getExpectedHospitalPassword(hospitalId)) {
        setAuthError('Invalid hospital password.');
        return;
      }
    } catch {
      if (hospitalLoginPassword.trim() !== getExpectedHospitalPassword(hospitalId)) {
        setAuthError('Invalid hospital password.');
        return;
      }
    } finally {
      setAuthLoading(false);
    }

    setSelectedHospital(selected);
    setRole('hospital');
  };

  const handleBiometricLogin = async (portal: LoginPortal, mode: BiometricMode) => {
    resetAuthFeedback();
    if (portal !== 'admin' && portal !== 'public' && isManagedPortalBlocked(portal)) {
      setAuthError(adminMaintenanceMode ? 'Portal access is temporarily disabled due to system maintenance.' : 'Portal access is disabled by admin.');
      return;
    }
    if (portal === 'public') {
      setAuthError('Public portal now uses simple login and does not require biometric.');
      return;
    }
    if (!isPortalBiometricRegistered(portal)) {
      setAuthError('Register fingerprint or face first, then use biometric login.');
      setAuthStage('register');
      return;
    }
    setBiometricLoading(mode);

    if (portal === 'admin') {
      try {
        await verifyWebAuthnCredential(getBiometricUserKey('admin'));
        setBiometricStatus(`${mode === 'fingerprint' ? 'Fingerprint' : 'Face'} verified successfully.`);
        setRole('admin');
      } catch (error) {
        setAuthError(error instanceof Error ? error.message : 'Biometric verification failed.');
      } finally {
        setBiometricLoading(null);
      }
      return;
    }
    if (portal === 'hospital') {
      const hospitalId = Number(hospitalLoginId);
      const selected = hospitals.find((hospital) => hospital.id === hospitalId);
      if (!selected) {
        setAuthError('Select hospital first to continue with biometric login.');
        setBiometricLoading(null);
        return;
      }

      try {
        await verifyWebAuthnCredential(getBiometricUserKey('hospital', hospitalId));
        const hospitalKey = hospitalAuthKeysById[hospitalId];
        if (hospitalKey) {
          if (mode === 'fingerprint') {
            await postJson('/api/auth/fingerprint-verify', { hospitalId: hospitalKey });
          } else {
            await postJson('/api/auth/face-verify', { hospitalId: hospitalKey });
          }
        }
      } catch (error) {
        setAuthError(error instanceof Error ? error.message : 'Biometric verification failed.');
        return;
      } finally {
        setBiometricLoading(null);
      }

      setBiometricStatus(`${mode === 'fingerprint' ? 'Fingerprint' : 'Face'} verified successfully.`);
      setSelectedHospital(selected);
      setRole('hospital');
      return;
    }

    const pharmacyId = Number(pharmacyLoginId);
    const selectedPharmacy = pharmacyPortalAccounts.find((item) => item.id === pharmacyId);
    if (!selectedPharmacy) {
      setAuthError('Select pharmacy first to continue with biometric login.');
      setBiometricLoading(null);
      return;
    }
    try {
      await verifyWebAuthnCredential(getBiometricUserKey('pharmacy', pharmacyId));
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Biometric verification failed.');
      return;
    } finally {
      setBiometricLoading(null);
    }
    setBiometricStatus(`${mode === 'fingerprint' ? 'Fingerprint' : 'Face'} verified successfully.`);
    setSelectedPharmacyPortal(selectedPharmacy);
    setRole('pharmacy');
  };

  const portalGuidance: Record<LoginPortal, { label: string; steps: string[]; disclaimer: string; privacy: string; accessModes: string[] }> = {
    public: {
      label: 'Public Portal',
      steps: [
        'Enter your full name.',
        'Enter a valid phone number (minimum 10 digits).',
        'Tap Enter Public Portal to access emergency tools.',
      ],
      disclaimer: 'Guidance is assistive only and does not replace doctor diagnosis or emergency responders.',
      privacy: 'Only share correct patient details to help ambulance dispatch and hospital coordination.',
      accessModes: ['Name + Phone'],
    },
    hospital: {
      label: 'Hospital Portal',
      steps: [
        'Select your hospital from the list.',
        'Enter hospital password.',
        authStage === 'register'
          ? 'Register fingerprint/face first, then switch to Enter Portal.'
          : 'Use credentials or biometric verification to open clinical dashboard.',
      ],
      disclaimer: 'Portal actions affect live patient workflow; use verified clinical judgment before triage decisions.',
      privacy: 'Hospital users should enter only authorized clinical data and follow institutional policy.',
      accessModes: ['Hospital Credentials', 'Biometric'],
    },
    pharmacy: {
      label: 'Pharmacy Portal',
      steps: [
        'Select your pharmacy from the list.',
        'Enter pharmacy password.',
        authStage === 'register'
          ? 'Register fingerprint/face first, then switch to Enter Portal.'
          : 'Use credentials or biometric verification to open pharmacy operations dashboard.',
      ],
      disclaimer: 'Dispensing and emergency order actions must follow licensed pharmacist protocols and legal requirements.',
      privacy: 'Pharmacy users should handle patient data only for emergency fulfillment and authorized care continuity.',
      accessModes: ['Pharmacy Credentials', 'Biometric'],
    },
    admin: {
      label: 'Admin Portal',
      steps: [
        'Use admin username/password for direct access.',
        authStage === 'register'
          ? 'Optionally register biometric for faster secure entry.'
          : 'You can also verify with registered biometric login.',
        'Monitor portals and resources from centralized control.',
      ],
      disclaimer: 'Admin controls are operational tools and should not be used as sole basis for medical decisions.',
      privacy: 'Access and monitor only permitted system data required for emergency operations.',
      accessModes: ['Admin Credentials', 'Biometric'],
    },
  };
  const activePortalGuide = portalGuidance[activeLoginPortal];
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  const ua = window.navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(ua);
  const isAndroid = /android/.test(ua);
  const canNativeInstallPrompt = Boolean(installPromptEvent);

  const handleInstallApp = async () => {
    if (installPromptEvent) {
      await installPromptEvent.prompt();
      await installPromptEvent.userChoice;
      setInstallPromptEvent(null);
      return;
    }
    setShowInstallHelp((prev) => !prev);
  };

  const installSteps = isIOS
    ? [
        'Open this site in Safari.',
        'Tap Share icon.',
        'Select Add to Home Screen, then tap Add.',
      ]
    : isAndroid
    ? canNativeInstallPrompt
      ? [
          'Tap Install App.',
          'Confirm install in browser prompt.',
          'Open app from home screen.',
        ]
      : [
          'Open browser menu (3 dots).',
          'Tap Install app or Add to Home screen.',
          'Confirm install and open from home screen.',
        ]
    : canNativeInstallPrompt
    ? [
        'Tap Install App.',
        'Confirm installation in browser dialog.',
        'Launch from desktop/taskbar/apps.',
      ]
    : [
        'Open browser menu.',
        'Choose Install App / Create Shortcut.',
        'Pin app to desktop or taskbar.',
      ];

  // Role Selector Screen
  if (role === 'none') {
    return (
      <div className="login-shell min-h-screen flex items-center justify-center p-4 md:p-6">
        <div className="login-backdrop-glow login-backdrop-glow-a" />
        <div className="login-backdrop-glow login-backdrop-glow-b" />
        <div className="w-full max-w-7xl login-layout relative z-10">
          <section className="login-hero">
            <BrandMark bpm={livePulse} subtitle={t.tagline} />
            <p className="login-hero-copy">
              Unified emergency intake for citizens, hospitals, and command teams with real-time biometric readiness.
            </p>
            <div className="login-hero-controls">
              <Button
                variant="outline"
                onClick={() => setShowLanguageSelector(!showLanguageSelector)}
                className="login-action-chip"
              >
                <Languages className="w-4 h-4 mr-2" />
                {t.selectLanguage}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowEmergencyContacts(true)}
                className="login-action-chip login-action-chip-emergency"
              >
                <Phone className="w-4 h-4 mr-2" />
                {t.emergencyContacts}
              </Button>
              {!isStandalone && (
                <Button
                  variant="outline"
                  onClick={() => {
                    void handleInstallApp();
                  }}
                  className="login-action-chip"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Install App
                </Button>
              )}
            </div>
            {showLanguageSelector && (
              <div className="flex flex-wrap gap-2 mt-4">
                <Button
                  onClick={() => handleLanguageChange('en')}
                  className={`px-5 py-2 ${language === 'en' ? 'bg-cyan-600' : 'bg-slate-800'} text-white`}
                >
                  English
                </Button>
                <Button
                  onClick={() => handleLanguageChange('hi')}
                  className={`px-5 py-2 ${language === 'hi' ? 'bg-cyan-600' : 'bg-slate-800'} text-white`}
                >
                  Hindi
                </Button>
                <Button
                  onClick={() => handleLanguageChange('te')}
                  className={`px-5 py-2 ${language === 'te' ? 'bg-cyan-600' : 'bg-slate-800'} text-white`}
                >
                  Telugu
                </Button>
              </div>
            )}
            {!isStandalone && (showInstallHelp || !canNativeInstallPrompt) && (
              <div className="login-info-card login-install-card">
                <p className="login-info-title">Install On This Device</p>
                <div className="login-install-badges">
                  <Badge className={`login-install-badge ${isAndroid ? 'login-install-badge-active' : ''}`}>Android</Badge>
                  <Badge className={`login-install-badge ${isIOS ? 'login-install-badge-active' : ''}`}>iOS</Badge>
                  <Badge className={`login-install-badge ${!isAndroid && !isIOS ? 'login-install-badge-active' : ''}`}>Desktop</Badge>
                </div>
                <ul className="login-info-list">
                  {installSteps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ul>
                {isIOS && (
                  <p className="login-info-text">
                    iOS requires Safari for installation. Use <Share2 className="w-3.5 h-3.5 inline-block align-text-bottom" /> Share
                    then <strong>Add to Home Screen</strong>.
                  </p>
                )}
              </div>
            )}
            <div className="login-info-stack">
              <div className={`login-info-card login-guide-card login-guide-${activeLoginPortal}`}>
                <p className="login-info-title">How To Login - {activePortalGuide.label}</p>
                <div className="login-guide-mode-row">
                  {activePortalGuide.accessModes.map((mode) => (
                    <Badge key={mode} className="login-guide-mode-badge">
                      {mode}
                    </Badge>
                  ))}
                </div>
                <ul className="login-info-list">
                  {activePortalGuide.steps.map((step, index) => (
                    <li key={step}>
                      <span className="login-guide-step-index">{index + 1}</span>
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="login-info-card login-info-disclaimer">
                <p className="login-info-title">Important Disclaimer - {activePortalGuide.label}</p>
                <p className="login-info-text">
                  {activePortalGuide.disclaimer} In life-threatening emergencies, call <strong>108/112</strong> immediately and follow official medical advice.
                </p>
                <p className="login-info-text">
                  {activePortalGuide.privacy}
                </p>
              </div>
            </div>
            <div className="login-hero-foot">
              <div className="login-patent-block gov-notice-block">
                <div className="gov-notice-head">
                  <p className="gov-notice-title flex items-center gap-2">
                    <Copyright className="w-4 h-4" />
                    OFFICIAL INTELLECTUAL PROPERTY NOTICE
                  </p>
                  <p className="gov-notice-code">Reference Framework: Patent Act, 1970 (India)</p>
                </div>
                <div className="gov-notice-grid">
                  <p className="login-patent-line">
                    Copyright Holder: <span className="gov-owner-name">NAGULA SRIYAN</span>
                  </p>
                  <p className="login-patent-line">
                    Applicable framework: Patent Act, 1970 (India) and applicable Patent Rules (as amended).
                  </p>
                  <p className="login-patent-line">
                    Official registry and status verification authority: Controller General of Patents, Designs and Trade Marks (CGPDTM), Government of India.
                  </p>
                  <p className="login-patent-line">
                    {t.patentRights}. Any filing or grant status must be verified through official IP India records.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="login-panel">
            <div className="grid md:grid-cols-4 gap-4 mb-5">
              <button
                onClick={() => {
                  setActiveLoginPortal('public');
                  setAuthStage('login');
                  resetAuthFeedback();
                }}
                disabled={isManagedPortalBlocked('public')}
                className={`portal-card portal-card-public ${activeLoginPortal === 'public' ? 'portal-card-active' : ''}`}
              >
                <div className="portal-card-content relative z-10">
                  <div className="portal-card-logo">
                    <User className="w-9 h-9 text-white" />
                  </div>
                  <h2 className="portal-card-title text-white">{t.publicPortal}</h2>
                  <p className="portal-card-desc text-blue-100">{t.publicDesc}</p>
                  <Badge className="portal-card-tag bg-cyan-500/20 text-cyan-200 border border-cyan-400/30">Citizen Emergency Access</Badge>
                  {isManagedPortalBlocked('public') && (
                    <p className="text-red-200 text-xs mt-2">{adminMaintenanceMode ? 'Temporarily under maintenance' : 'Disabled by Admin'}</p>
                  )}
                </div>
              </button>

              <button
                onClick={() => {
                  setActiveLoginPortal('hospital');
                  setAuthStage('register');
                  resetAuthFeedback();
                }}
                disabled={isManagedPortalBlocked('hospital')}
                className={`portal-card portal-card-hospital ${activeLoginPortal === 'hospital' ? 'portal-card-active' : ''}`}
              >
                <div className="portal-card-content relative z-10">
                  <div className="portal-card-logo">
                    <HospitalIcon className="w-9 h-9 text-white" />
                  </div>
                  <h2 className="portal-card-title text-white">{t.hospitalDashboard}</h2>
                  <p className="portal-card-desc text-emerald-100">{t.hospitalDesc}</p>
                  <Badge className="portal-card-tag bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">Clinical Operations</Badge>
                  {isManagedPortalBlocked('hospital') && (
                    <p className="text-red-200 text-xs mt-2">{adminMaintenanceMode ? 'Temporarily under maintenance' : 'Disabled by Admin'}</p>
                  )}
                </div>
              </button>

              <button
                onClick={() => {
                  setActiveLoginPortal('admin');
                  setAuthStage('login');
                  resetAuthFeedback();
                }}
                className={`portal-card portal-card-admin ${activeLoginPortal === 'admin' ? 'portal-card-active' : ''}`}
              >
                <div className="portal-card-content relative z-10">
                  <div className="portal-card-logo">
                    <Shield className="w-9 h-9 text-white" />
                  </div>
                  <h2 className="portal-card-title text-white">Admin Control</h2>
                  <p className="portal-card-desc text-amber-100">Central command for all portals, resources, and response overview.</p>
                  <Badge className="portal-card-tag bg-amber-500/20 text-amber-200 border border-amber-400/30">System Supervisor</Badge>
                </div>
              </button>

              <button
                onClick={() => {
                  setActiveLoginPortal('pharmacy');
                  setAuthStage('register');
                  resetAuthFeedback();
                }}
                disabled={isManagedPortalBlocked('pharmacy')}
                className={`portal-card portal-card-hospital ${activeLoginPortal === 'pharmacy' ? 'portal-card-active' : ''}`}
              >
                <div className="portal-card-content relative z-10">
                  <div className="portal-card-logo">
                    <Pill className="w-9 h-9 text-white" />
                  </div>
                  <h2 className="portal-card-title text-white">Pharmacy Portal</h2>
                  <p className="portal-card-desc text-teal-100">Manage emergency medicine orders and critical pharmacy stock.</p>
                  <Badge className="portal-card-tag bg-teal-500/20 text-teal-200 border border-teal-400/30">Medicine Operations</Badge>
                  {isManagedPortalBlocked('pharmacy') && (
                    <p className="text-red-200 text-xs mt-2">{adminMaintenanceMode ? 'Temporarily under maintenance' : 'Disabled by Admin'}</p>
                  )}
                </div>
              </button>
            </div>

            <Card className="login-auth-card">
              <CardHeader>
                <CardTitle className="text-white text-2xl flex items-center gap-2">
                  {activeLoginPortal === 'public' && <User className="w-5 h-5 text-cyan-300" />}
                  {activeLoginPortal === 'hospital' && <HospitalIcon className="w-5 h-5 text-emerald-300" />}
                  {activeLoginPortal === 'pharmacy' && <Pill className="w-5 h-5 text-teal-300" />}
                  {activeLoginPortal === 'admin' && <Shield className="w-5 h-5 text-amber-300" />}
                  {activeLoginPortal === 'public'
                    ? t.publicPortal
                    : activeLoginPortal === 'hospital'
                      ? t.hospitalDashboard
                      : activeLoginPortal === 'pharmacy'
                        ? 'Pharmacy Portal'
                      : 'Admin Control Portal'}
                </CardTitle>
                <CardDescription className="text-slate-300">
                  {activeLoginPortal === 'public'
                    ? 'Simple entry: just name and phone number.'
                    : activeLoginPortal === 'admin'
                    ? 'Register and verify platform biometrics (fingerprint/face/passkey) in real time.'
                    : activeLoginPortal === 'pharmacy'
                    ? authStage === 'register'
                      ? 'Step 1: Register pharmacy biometric access.'
                      : 'Step 2: Enter pharmacy portal with credentials or biometric login.'
                    : authStage === 'register'
                      ? 'Step 1: Register fingerprint or face before portal entry.'
                      : 'Step 2: Enter the portal using registered biometric.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {activeLoginPortal !== 'public' && (
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={authStage === 'register' ? 'default' : 'outline'}
                    onClick={() => setAuthStage('register')}
                    className={authStage === 'register'
                      ? 'bg-cyan-600 hover:bg-cyan-500'
                      : 'bg-slate-700 border-slate-600 text-white'}
                  >
                    Register Biometrics
                  </Button>
                  <Button
                    type="button"
                    variant={authStage === 'login' ? 'default' : 'outline'}
                    onClick={() => setAuthStage('login')}
                    className={authStage === 'login' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-slate-700 border-slate-600 text-white'}
                  >
                    Enter Portal
                  </Button>
                </div>
                )}

                {activeLoginPortal === 'public' ? (
                  <>
                    <div>
                      <Label className="text-slate-300">Name</Label>
                      <Input
                        value={publicLoginName}
                        onChange={(e) => setPublicLoginName(e.target.value)}
                        placeholder="Enter your name"
                        className="login-input"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Phone Number</Label>
                      <Input
                        value={publicPhoneNumber}
                        onChange={(e) => setPublicPhoneNumber(e.target.value)}
                        type="tel"
                        placeholder="Enter your phone number"
                        className="login-input"
                      />
                    </div>
                    <p className="text-xs text-slate-400">
                      Enter these two details to access Public Portal.
                    </p>
                  </>
                ) : activeLoginPortal === 'hospital' ? (
                  <>
                    <div>
                      <Label className="text-slate-300">Hospital</Label>
                      <Select value={hospitalLoginId} onValueChange={setHospitalLoginId}>
                        <SelectTrigger className="login-input">
                          <SelectValue placeholder="Select your hospital" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-700 border-slate-600">
                          {hospitals.map((hospital) => (
                            <SelectItem key={hospital.id} value={String(hospital.id)}>
                              {hospital.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-slate-300">Password</Label>
                      <Input
                        value={hospitalLoginPassword}
                        onChange={(e) => setHospitalLoginPassword(e.target.value)}
                        type="password"
                        placeholder="Enter hospital password"
                        className="login-input"
                      />
                    </div>
                    <p className="text-xs text-slate-400">
                      Demo passwords: mostly <code>hospital123</code>, Apollo <code>apollo123</code>, Care <code>lifecare123</code>.
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      <Badge className={hospitalBiometric[Number(hospitalLoginId)]?.fingerprint ? 'bg-emerald-600' : 'bg-slate-600'}>
                        Fingerprint {hospitalBiometric[Number(hospitalLoginId)]?.fingerprint ? 'Registered' : 'Not Registered'}
                      </Badge>
                      <Badge className={hospitalBiometric[Number(hospitalLoginId)]?.face ? 'bg-emerald-600' : 'bg-slate-600'}>
                        Face {hospitalBiometric[Number(hospitalLoginId)]?.face ? 'Registered' : 'Not Registered'}
                      </Badge>
                    </div>
                  </>
                ) : activeLoginPortal === 'pharmacy' ? (
                  <>
                    <div>
                      <Label className="text-slate-300">Pharmacy</Label>
                      <Select value={pharmacyLoginId} onValueChange={setPharmacyLoginId}>
                        <SelectTrigger className="login-input">
                          <SelectValue placeholder="Select your pharmacy" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-700 border-slate-600">
                          {pharmacyPortalAccounts.map((pharmacy) => (
                            <SelectItem key={pharmacy.id} value={String(pharmacy.id)}>
                              {pharmacy.name} - {pharmacy.area}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-slate-300">Password</Label>
                      <Input
                        value={pharmacyLoginPassword}
                        onChange={(e) => setPharmacyLoginPassword(e.target.value)}
                        type="password"
                        placeholder="Enter pharmacy password"
                        className="login-input"
                      />
                    </div>
                    <p className="text-xs text-slate-400">
                      Demo pharmacy password: <code>pharmacy123</code>
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      <Badge className={pharmacyBiometric[Number(pharmacyLoginId)]?.fingerprint ? 'bg-emerald-600' : 'bg-slate-600'}>
                        Fingerprint {pharmacyBiometric[Number(pharmacyLoginId)]?.fingerprint ? 'Registered' : 'Not Registered'}
                      </Badge>
                      <Badge className={pharmacyBiometric[Number(pharmacyLoginId)]?.face ? 'bg-emerald-600' : 'bg-slate-600'}>
                        Face {pharmacyBiometric[Number(pharmacyLoginId)]?.face ? 'Registered' : 'Not Registered'}
                      </Badge>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <Label className="text-slate-300">Admin Username</Label>
                      <Input
                        value={adminLoginName}
                        onChange={(e) => setAdminLoginName(e.target.value)}
                        placeholder="Enter admin username"
                        className="login-input"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Admin Password</Label>
                      <Input
                        value={adminLoginPassword}
                        onChange={(e) => setAdminLoginPassword(e.target.value)}
                        type="password"
                        placeholder="Enter admin password"
                        className="login-input"
                      />
                    </div>
                    <Alert className="bg-amber-500/10 border-amber-500/40">
                      <Shield className="w-4 h-4 text-amber-300" />
                      <AlertDescription className="text-amber-100">
                        Demo admin credentials: <code>admin</code> / <code>admin123</code>
                      </AlertDescription>
                    </Alert>
                    <div className="flex gap-2 flex-wrap">
                      <Badge className={adminBiometric.fingerprint ? 'bg-emerald-600' : 'bg-slate-600'}>
                        Fingerprint {adminBiometric.fingerprint ? 'Registered' : 'Not Registered'}
                      </Badge>
                      <Badge className={adminBiometric.face ? 'bg-emerald-600' : 'bg-slate-600'}>
                        Face {adminBiometric.face ? 'Registered' : 'Not Registered'}
                      </Badge>
                    </div>
                  </>
                )}

                {activeLoginPortal === 'public' ? (
                  <div className="pt-2">
                    <Button onClick={handlePortalLogin} disabled={authLoading} className="w-full h-11 bg-cyan-600 hover:bg-cyan-700">
                      {authLoading ? 'Entering...' : 'Enter Public Portal'}
                    </Button>
                  </div>
                ) : authStage === 'register' ? (
                  <div className="pt-2">
                    <p className="text-sm text-slate-300 mb-3">Register at least one biometric method</p>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        onClick={() => handleRegisterBiometric(activeLoginPortal, 'fingerprint')}
                        disabled={registerLoading !== null || authLoading}
                        className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                      >
                        <Fingerprint className="w-4 h-4 mr-2" />
                        {registerLoading === 'fingerprint' ? 'Registering...' : 'Register Fingerprint'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleRegisterBiometric(activeLoginPortal, 'face')}
                        disabled={registerLoading !== null || authLoading}
                        className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                      >
                        <ScanFace className="w-4 h-4 mr-2" />
                        {registerLoading === 'face' ? 'Registering...' : 'Register Face'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="pt-2">
                    <Button onClick={handlePortalLogin} disabled={authLoading} className="w-full h-11 bg-blue-600 hover:bg-blue-700 mb-3">
                      {authLoading ? 'Logging in...' : 'Login with Credentials'}
                    </Button>
                    <p className="text-sm text-slate-300 mb-3">Login using registered biometric</p>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        onClick={() => handleBiometricLogin(activeLoginPortal, 'fingerprint')}
                        disabled={biometricLoading !== null || authLoading}
                        className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                      >
                        <Fingerprint className="w-4 h-4 mr-2" />
                        {biometricLoading === 'fingerprint' ? 'Verifying...' : 'Fingerprint Login'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleBiometricLogin(activeLoginPortal, 'face')}
                        disabled={biometricLoading !== null || authLoading}
                        className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                      >
                        <ScanFace className="w-4 h-4 mr-2" />
                        {biometricLoading === 'face' ? 'Verifying...' : 'Face Recognition Login'}
                      </Button>
                    </div>
                  </div>
                )}

                <div className="pt-1">
                  <p className="text-xs text-slate-400">
                    {activeLoginPortal === 'public'
                      ? 'Public login is simplified to name + phone number only.'
                      : activeLoginPortal === 'admin'
                      ? 'Admin supports both credentials and real-time biometric verification.'
                      : activeLoginPortal === 'pharmacy'
                      ? 'Pharmacy registration is required first. Then use credentials or biometric login.'
                      : 'Registration is required first. After that, biometric login opens the selected portal directly.'}
                  </p>
                </div>

                {(activeLoginPortal === 'hospital' || activeLoginPortal === 'pharmacy') && (
                <div className="pt-1">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <Button type="button" variant="ghost" onClick={() => setAuthStage('register')} className="text-slate-300 hover:text-white">
                      Go to Registration
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => setAuthStage('login')} className="text-slate-300 hover:text-white">
                      Go to Portal Entry
                    </Button>
                  </div>
                </div>
                )}

                {authError && (
                  <Alert className="bg-red-600/20 border-red-500">
                    <XCircle className="w-4 h-4 text-red-400" />
                    <AlertDescription className="text-red-300">{authError}</AlertDescription>
                  </Alert>
                )}
                {biometricStatus && (
                  <Alert className="bg-emerald-600/20 border-emerald-500">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <AlertDescription className="text-emerald-300">{biometricStatus}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </section>
        </div>

        {/* Emergency Contacts Dialog */}
        <Dialog open={showEmergencyContacts} onOpenChange={setShowEmergencyContacts}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-2xl text-white flex items-center gap-3">
                <Phone className="w-8 h-8 text-red-500" />
                {t.emergencyContacts}
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              {emergencyContacts.map((contact, index) => (
                <a
                  key={index}
                  href={`tel:${contact.number}`}
                  className="flex items-center gap-4 p-4 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors"
                >
                  <div className={`${contact.color} p-3 rounded-full`}>
                    {contact.icon}
                  </div>
                  <div>
                    <p className="text-white font-semibold">{contact.name}</p>
                    <p className="text-2xl font-bold text-red-400">{contact.number}</p>
                  </div>
                </a>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Public Portal
  if (role === 'public') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Navigation */}
        <nav className="bg-slate-800/50 backdrop-blur-md border-b border-slate-700 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BrandMark compact />
              </div>
              <div className="flex items-center justify-end gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEmergencyContacts(true)}
                  className="bg-red-600/20 border-red-500 text-red-200 hover:bg-red-600 hover:text-white"
                >
                  <Phone className="w-4 h-4 mr-1" />
                  SOS 108
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="bg-slate-700 text-white border-slate-400 hover:bg-slate-600"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back to Login
                </Button>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 py-8">
          {view !== 'home' && (
            <div className="flex flex-wrap gap-2 mb-4">
              <Button variant="outline" onClick={() => setView('home')} className="text-white border-slate-500 bg-slate-800 hover:bg-slate-700">
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back to Home
              </Button>
              <Button variant="outline" onClick={handleLogout} className="text-white border-slate-500 bg-slate-800 hover:bg-slate-700">
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back to Login
              </Button>
            </div>
          )}
          {view === 'home' && (
            <div className="space-y-6">
              <Card
                className="bg-slate-800 border-cyan-500/40 shadow-[0_0_25px_rgba(34,211,238,0.12)]"
                onMouseEnter={() => setAwarenessPaused(true)}
                onMouseLeave={() => setAwarenessPaused(false)}
                onTouchStart={() => setAwarenessPaused(true)}
                onTouchEnd={() => setAwarenessPaused(false)}
                onTouchCancel={() => setAwarenessPaused(false)}
              >
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2 flex-wrap">
                    <AlertTriangle className="w-5 h-5 text-cyan-300" />
                    Public Health Awareness Frame
                    <Badge className="bg-cyan-500/20 text-cyan-200 border border-cyan-400/30">Live Updates</Badge>
                    {awarenessPaused && <Badge className="bg-amber-500/20 text-amber-200 border border-amber-400/30">Paused</Badge>}
                  </CardTitle>
                  <CardDescription className="text-slate-300">
                    {seasonalFrame.season}: {seasonalFrame.headline}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-cyan-600/10 border border-cyan-500/40 rounded-lg p-3">
                    <p className="text-cyan-100 text-sm">
                      <span className="font-semibold">Live Alert:</span> {liveAwarenessNotice}
                    </p>
                    <p className="text-cyan-300/80 text-xs mt-1">Last updated: {awarenessUpdatedAt}</p>
                  </div>
                  <div className="grid md:grid-cols-3 gap-3">
                    <div className="bg-slate-700/70 border border-slate-600 rounded-xl p-4">
                      <p className="text-cyan-300 font-semibold mb-2">Seasonal Diseases & Viruses</p>
                      <div className="space-y-2">
                        {seasonalFrame.diseases.map((item) => (
                          <p key={item} className="text-slate-100 text-sm">• {item}</p>
                        ))}
                      </div>
                    </div>
                    <div className="bg-slate-700/70 border border-slate-600 rounded-xl p-4">
                      <p className="text-amber-300 font-semibold mb-2">Public Awareness</p>
                      <div className="space-y-2">
                        {seasonalFrame.awareness.map((item) => (
                          <p key={item} className="text-slate-100 text-sm">• {item}</p>
                        ))}
                      </div>
                    </div>
                    <div className="bg-slate-700/70 border border-slate-600 rounded-xl p-4">
                      <p className="text-emerald-300 font-semibold mb-2">Precautions</p>
                      <div className="space-y-2">
                        {seasonalFrame.precautions.map((item) => (
                          <p key={item} className="text-slate-100 text-sm">• {item}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                  <Alert className="bg-cyan-600/10 border-cyan-500/40">
                    <AlertDescription className="text-cyan-100 text-sm">
                      Touch and hold this frame to pause updates for reading. Release to resume live rotation.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-2">Welcome to Public Portal</h2>
                      <p className="text-slate-300">Use the quick actions below to get emergency help in under a minute.</p>
                    </div>
                    <Badge className="bg-emerald-600 text-white">User Friendly Mode</Badge>
                  </div>
                  <div className="grid md:grid-cols-3 gap-3 mt-4">
                    <div className="bg-slate-700/70 rounded-xl p-3">
                      <p className="text-sm text-slate-300">Step 1</p>
                      <p className="text-white font-semibold">Upload injury photo</p>
                    </div>
                    <div className="bg-slate-700/70 rounded-xl p-3">
                      <p className="text-sm text-slate-300">Step 2</p>
                      <p className="text-white font-semibold">Submit basic details</p>
                    </div>
                    <div className="bg-slate-700/70 rounded-xl p-3">
                      <p className="text-sm text-slate-300">Step 3</p>
                      <p className="text-white font-semibold">Find nearest hospital fast</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setView('photo')}
                  className="bg-blue-600 hover:bg-blue-700 p-6 rounded-2xl text-white transition-all"
                >
                  <Camera className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm font-medium">{t.uploadPhoto}</p>
                </button>
                <button
                  onClick={() => setView('form')}
                  className="bg-emerald-600 hover:bg-emerald-700 p-6 rounded-2xl text-white transition-all"
                >
                  <Activity className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm font-medium">{t.accidentForm}</p>
                </button>
                <button
                  onClick={() => setView('hospitals')}
                  className="bg-purple-600 hover:bg-purple-700 p-6 rounded-2xl text-white transition-all"
                >
                  <MapPin className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm font-medium">{t.findHospital}</p>
                </button>
                <button
                  onClick={() => setView('bloodbank')}
                  className="bg-red-600 hover:bg-red-700 p-6 rounded-2xl text-white transition-all"
                >
                  <Droplet className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm font-medium">{t.bloodBank}</p>
                </button>
                <button
                  onClick={() => setView('appointments')}
                  className="bg-cyan-600 hover:bg-cyan-700 p-6 rounded-2xl text-white transition-all"
                >
                  <Clock className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm font-medium">Appointments</p>
                </button>
                <button
                  onClick={() => setView('care')}
                  className="bg-amber-600 hover:bg-amber-700 p-6 rounded-2xl text-white transition-all"
                >
                  <ClipboardList className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm font-medium">Reports & Medicine</p>
                </button>
                <button
                  onClick={() => setView('pharmacy')}
                  className="bg-teal-600 hover:bg-teal-700 p-6 rounded-2xl text-white transition-all"
                >
                  <Pill className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm font-medium">Pharmacy Near Me</p>
                </button>
                <button
                  onClick={() => setView('safety')}
                  className="bg-indigo-600 hover:bg-indigo-700 p-6 rounded-2xl text-white transition-all"
                >
                  <Shield className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm font-medium">Crash Guard</p>
                </button>
                <button
                  onClick={openFirstAidTool}
                  className="bg-rose-600 hover:bg-rose-700 p-6 rounded-2xl text-white transition-all"
                >
                  <Stethoscope className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm font-medium">{t.firstAid}</p>
                </button>
                <button
                  onClick={openWomenHealthHub}
                  className="bg-pink-600 hover:bg-pink-700 p-6 rounded-2xl text-white transition-all"
                >
                  <Heart className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm font-medium">Women's Health AI</p>
                </button>
              </div>

              <Card className="bg-slate-800 border-cyan-500/40 shadow-[0_0_25px_rgba(34,211,238,0.1)]">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-cyan-300" />
                    Live Emergency Location Tracker
                  </CardTitle>
                  <CardDescription>
                    Track your live location, identify nearest hospital, and send ambulance request instantly.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={startLiveLocationTracking} className="bg-cyan-600 hover:bg-cyan-700">
                      Start Live Tracking
                    </Button>
                    <Button variant="outline" onClick={stopLiveLocationTracking} className="border-slate-500 text-white bg-slate-800 hover:bg-slate-700">
                      Stop Tracking
                    </Button>
                    <Button onClick={handleRequestNearestAmbulance} className="bg-red-600 hover:bg-red-700">
                      Request Nearest Ambulance
                    </Button>
                  </div>

                  {locationTracking && (
                    <Badge className="bg-cyan-600">Live Tracking Active</Badge>
                  )}
                  {locationError && (
                    <Alert className="bg-red-600/20 border-red-500">
                      <AlertDescription className="text-red-200">{locationError}</AlertDescription>
                    </Alert>
                  )}

                  {liveLocation && (
                    <div className="bg-slate-700/60 border border-slate-600 rounded-lg p-3 text-sm text-slate-200">
                      <p>Latitude: {liveLocation.lat.toFixed(6)}</p>
                      <p>Longitude: {liveLocation.lng.toFixed(6)}</p>
                      <p>Accuracy: {Math.round(liveLocation.accuracy)} m</p>
                      <p>Updated: {liveLocation.updatedAt}</p>
                    </div>
                  )}

                  {nearestHospitals.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-slate-300 text-sm font-semibold">Nearest Hospitals</p>
                      {nearestHospitals.map((entry) => (
                        <div key={entry.hospital.id} className="bg-slate-700/60 border border-slate-600 rounded-lg p-3 flex items-center justify-between gap-3">
                          <div>
                            <p className="text-white font-semibold">{entry.hospital.name}</p>
                            <p className="text-slate-400 text-xs">{entry.hospital.address}</p>
                          </div>
                          <Badge className="bg-emerald-600">{entry.distanceKm.toFixed(2)} km</Badge>
                        </div>
                      ))}
                    </div>
                  )}

                  {ambulanceDispatchMessage && (
                    <Alert className="bg-emerald-600/20 border-emerald-500">
                      <AlertDescription className="text-emerald-200">{ambulanceDispatchMessage}</AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Need guidance?</CardTitle>
                  <CardDescription>Choose one starting point based on your situation.</CardDescription>
                </CardHeader>
                <CardContent className="grid sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => setView('photo')}
                    className="text-left bg-slate-700 hover:bg-slate-600 rounded-xl p-4 transition-colors"
                  >
                    <p className="text-white font-semibold">I have an injury photo</p>
                    <p className="text-slate-300 text-sm mt-1">Use AI scan and auto-fill details.</p>
                  </button>
                  <button
                    onClick={() => setView('form')}
                    className="text-left bg-slate-700 hover:bg-slate-600 rounded-xl p-4 transition-colors"
                  >
                    <p className="text-white font-semibold">I want to report manually</p>
                    <p className="text-slate-300 text-sm mt-1">Fill the emergency form directly.</p>
                  </button>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Heart className="w-5 h-5 text-pink-400" />
                    Quick Vitals Self Check
                  </CardTitle>
                  <CardDescription>Enter current vitals to get a rapid clinical risk hint.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-3 gap-3">
                    <div>
                      <Label className="text-slate-300">Temperature (F)</Label>
                      <Input
                        value={bodyTemperature}
                        onChange={(e) => setBodyTemperature(e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">SpO2 (%)</Label>
                      <Input
                        value={oxygenSaturation}
                        onChange={(e) => setOxygenSaturation(e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Pulse (bpm)</Label>
                      <Input
                        value={pulseRate}
                        onChange={(e) => setPulseRate(e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                  </div>
                  <Alert className={`${
                    getVitalsRisk().level === 'critical'
                      ? 'bg-red-600/20 border-red-500'
                      : getVitalsRisk().level === 'moderate'
                        ? 'bg-yellow-600/20 border-yellow-500'
                        : 'bg-emerald-600/20 border-emerald-500'
                  }`}>
                    <AlertDescription className="text-slate-200">
                      <span className="font-semibold mr-2">Risk:</span>
                      {getVitalsRisk().level.toUpperCase()} - {getVitalsRisk().advice}
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              {/* Emergency Quick Dial */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Phone className="w-5 h-5 text-red-500" />
                    Quick Emergency Dial
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4">
                    {[
                      { num: '108', label: 'Ambulance', color: 'bg-red-600' },
                      { num: '112', label: 'Emergency', color: 'bg-purple-600' },
                      { num: '102', label: 'Medical', color: 'bg-green-600' },
                      { num: '100', label: 'Police', color: 'bg-blue-600' },
                    ].map((item) => (
                      <a
                        key={item.num}
                        href={`tel:${item.num}`}
                        className={`${item.color} p-4 rounded-xl text-center hover:opacity-90 transition-opacity`}
                      >
                        <p className="text-2xl font-bold text-white">{item.num}</p>
                        <p className="text-xs text-white/80">{item.label}</p>
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {view === 'appointments' && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 mb-6">
                <Button variant="outline" onClick={() => setView('home')} className="text-white border-slate-500 bg-slate-800 hover:bg-slate-700">
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  {t.back}
                </Button>
                <h2 className="text-2xl font-bold text-white">Hospital Appointments</h2>
              </div>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Book Appointment</CardTitle>
                  <CardDescription>Bookings are pushed directly to the selected hospital dashboard.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-slate-300">Hospital</Label>
                      <Select value={appointmentHospitalId} onValueChange={setAppointmentHospitalId}>
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                          <SelectValue placeholder="Select hospital" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-700 border-slate-600">
                          {hospitals.map((hospital) => (
                            <SelectItem key={hospital.id} value={String(hospital.id)}>
                              {hospital.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-slate-300">Preferred Date & Time</Label>
                      <Input
                        type="datetime-local"
                        value={appointmentDateTime}
                        onChange={(e) => setAppointmentDateTime(e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-slate-300">Contact Number</Label>
                      <Input
                        value={appointmentContact}
                        onChange={(e) => setAppointmentContact(e.target.value)}
                        placeholder="10 digit mobile number"
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Reason</Label>
                      <Input
                        value={appointmentReason}
                        onChange={(e) => setAppointmentReason(e.target.value)}
                        placeholder="Injury review, fever, follow-up..."
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                  </div>
                  <Button onClick={handleBookAppointment} className="w-full bg-cyan-600 hover:bg-cyan-700">
                    Book and Send to Hospital Portal
                  </Button>
                  {appointmentStatusMessage && (
                    <Alert className="bg-blue-600/20 border-blue-500">
                      <AlertDescription className="text-blue-200">{appointmentStatusMessage}</AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">My Appointments</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {publicAppointments.length === 0 ? (
                    <p className="text-slate-400">No appointments yet.</p>
                  ) : publicAppointments.map((item) => (
                    <div key={item.id} className="bg-slate-700/60 border border-slate-600 rounded-lg p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-white font-semibold">{item.hospitalName}</p>
                        <Badge className={
                          item.status === 'accepted'
                            ? 'bg-emerald-600'
                            : item.status === 'rejected'
                              ? 'bg-red-600'
                              : item.status === 'completed'
                                ? 'bg-blue-600'
                                : 'bg-yellow-600 text-black'
                        }>
                          {item.status.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-slate-300 text-sm mt-1">{item.appointmentAt}</p>
                      <p className="text-slate-400 text-sm">{item.reason}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {view === 'safety' && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 mb-6">
                <Button variant="outline" onClick={() => setView('home')} className="text-white border-slate-500 bg-slate-800 hover:bg-slate-700">
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  {t.back}
                </Button>
                <h2 className="text-2xl font-bold text-white">Smart Crash Guard & Golden Hour</h2>
              </div>

              <Card className="bg-slate-800 border-indigo-500/40">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Shield className="w-5 h-5 text-indigo-300" />
                    Smartphone Crash Detection
                  </CardTitle>
                  <CardDescription>
                    Uses phone motion sensors + live location. On severe impact, starts 10-second emergency countdown and dispatches alerts.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={startCrashMonitoring} className="bg-indigo-600 hover:bg-indigo-700">
                      Start Crash Monitoring
                    </Button>
                    <Button variant="outline" onClick={stopCrashMonitoring} className="border-slate-500 text-slate-200">
                      Stop Monitoring
                    </Button>
                    <Button onClick={() => triggerCrashDetection('manual simulation', 26, crashAIPrediction ?? undefined)} className="bg-red-600 hover:bg-red-700">
                      Simulate Crash
                    </Button>
                    {crashDetected && (
                      <Button variant="outline" onClick={cancelCrashAlert} className="border-emerald-500 text-emerald-300">
                        I Am Safe
                      </Button>
                    )}
                  </div>

                  {crashMonitoring && (
                    <Badge className="bg-indigo-600">Crash Monitoring Active</Badge>
                  )}
                  {crashDetected && (
                    <Alert className="bg-red-600/20 border-red-500">
                      <AlertDescription className="text-red-200">
                        Crash countdown running: {crashCountdown}s. Cancel now if this is a false alert.
                      </AlertDescription>
                    </Alert>
                  )}
                  {crashStatusMessage && (
                    <Alert className="bg-cyan-600/20 border-cyan-500">
                      <AlertDescription className="text-cyan-100">{crashStatusMessage}</AlertDescription>
                    </Alert>
                  )}
                  {aiIncidentSummary && (
                    <Alert className="bg-indigo-600/20 border-indigo-500">
                      <AlertDescription className="text-indigo-100">{aiIncidentSummary}</AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">AI/ML Crash Intelligence</CardTitle>
                  <CardDescription>
                    Sensor fusion + temporal anomaly + contextual risk ensemble running on-device in real time.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-4 gap-3">
                    <div className="bg-slate-700/60 border border-slate-600 rounded-lg p-3">
                      <p className="text-slate-400 text-xs">Crash Risk</p>
                      <p className="text-white font-semibold">{(crashRiskScore * 100).toFixed(0)}%</p>
                    </div>
                    <div className="bg-slate-700/60 border border-slate-600 rounded-lg p-3">
                      <p className="text-slate-400 text-xs">Severity Class</p>
                      <p className="text-white font-semibold">{(crashAIPrediction?.severityClass ?? 'low').toUpperCase()}</p>
                    </div>
                    <div className="bg-slate-700/60 border border-slate-600 rounded-lg p-3">
                      <p className="text-slate-400 text-xs">Model Confidence</p>
                      <p className="text-white font-semibold">{((crashAIPrediction?.confidence ?? 0) * 100).toFixed(0)}%</p>
                    </div>
                    <div className="bg-slate-700/60 border border-slate-600 rounded-lg p-3">
                      <p className="text-slate-400 text-xs">False Positive Risk</p>
                      <p className="text-white font-semibold">{((crashAIPrediction?.falsePositiveRisk ?? 0) * 100).toFixed(0)}%</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="bg-slate-700/60 border border-slate-600 rounded-lg p-3 space-y-2">
                      <p className="text-slate-300 text-sm font-semibold">Feature Signals</p>
                      <p className="text-slate-200 text-xs">G-Force: {crashAIFeatures?.gForce.toFixed(2) ?? '0.00'}</p>
                      <p className="text-slate-200 text-xs">Jerk: {crashAIFeatures?.jerk.toFixed(2) ?? '0.00'}</p>
                      <p className="text-slate-200 text-xs">Orientation Shift: {crashAIFeatures?.orientationShift.toFixed(1) ?? '0.0'}</p>
                      <p className="text-slate-200 text-xs">Speed Context: {liveSpeedKmph.toFixed(1)} km/h</p>
                    </div>
                    <div className="bg-slate-700/60 border border-slate-600 rounded-lg p-3 space-y-2">
                      <p className="text-slate-300 text-sm font-semibold">Model Votes</p>
                      {(crashAIPrediction?.modelVotes ?? []).map((vote) => (
                        <p key={vote.model} className="text-slate-200 text-xs">
                          {vote.model}: {(vote.score * 100).toFixed(0)}%
                        </p>
                      ))}
                      {!crashAIPrediction && <p className="text-slate-500 text-xs">No inference yet.</p>}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="bg-slate-700/60 border border-slate-600 rounded-lg p-3 space-y-2">
                      <p className="text-slate-300 text-sm font-semibold">Explainable Reasons</p>
                      {(crashAIPrediction?.reasons ?? []).map((reason) => (
                        <p key={reason} className="text-slate-200 text-xs">{reason}</p>
                      ))}
                      {!crashAIPrediction && <p className="text-slate-500 text-xs">Waiting for sensor signals.</p>}
                    </div>
                    <div className="bg-slate-700/60 border border-slate-600 rounded-lg p-3 space-y-2">
                      <p className="text-slate-300 text-sm font-semibold">AI Recommended Actions</p>
                      {(crashAIPrediction?.recommendedActions ?? []).map((action) => (
                        <p key={action} className="text-slate-200 text-xs">{action}</p>
                      ))}
                      {!crashAIPrediction && <p className="text-slate-500 text-xs">Recommendations appear after motion inference.</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-2 gap-4">
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Emergency Contact Auto Alerts</CardTitle>
                    <CardDescription>Contacts receive alert context when crash dispatch triggers.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-slate-300">Emergency Contact 1</Label>
                      <Input
                        value={safetyContactOne}
                        onChange={(e) => setSafetyContactOne(e.target.value)}
                        placeholder="Name / Phone"
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Emergency Contact 2</Label>
                      <Input
                        value={safetyContactTwo}
                        onChange={(e) => setSafetyContactTwo(e.target.value)}
                        placeholder="Name / Phone"
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <p className="text-xs text-slate-500">
                      If no response in countdown, nearest hospital alert is sent and these contacts are included in dispatch note.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Medical ID Snapshot</CardTitle>
                    <CardDescription>Critical data to share in the Golden Hour for accurate treatment.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-700/60 border border-slate-600 rounded-lg p-3">
                        <p className="text-slate-400 text-xs">Blood Group</p>
                        <p className="text-white font-semibold">{bloodGroup || 'Not Set'}</p>
                      </div>
                      <div className="bg-slate-700/60 border border-slate-600 rounded-lg p-3">
                        <p className="text-slate-400 text-xs">Primary Contact</p>
                        <p className="text-white font-semibold">{publicPhoneNumber || 'Not Set'}</p>
                      </div>
                    </div>
                    <div className="bg-slate-700/60 border border-slate-600 rounded-lg p-3">
                      <p className="text-slate-400 text-xs">Known Conditions</p>
                      <p className="text-slate-200 text-sm">{knownConditions || 'Not provided'}</p>
                    </div>
                    <div className="bg-slate-700/60 border border-slate-600 rounded-lg p-3">
                      <p className="text-slate-400 text-xs">Drug Allergies</p>
                      <p className="text-slate-200 text-sm">{allergies || 'Not provided'}</p>
                    </div>
                    <div>
                      <Label className="text-slate-300">Additional Medical Notes</Label>
                      <Textarea
                        value={medicalIdNote}
                        onChange={(e) => setMedicalIdNote(e.target.value)}
                        placeholder="Any implant/device, chronic medication, recent surgery..."
                        className="bg-slate-700 border-slate-600 text-white min-h-[90px]"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Detection Stack</CardTitle>
                  <CardDescription>Layered post-accident response channels.</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-3">
                  {[
                    'Smartphone-based impact detection (accelerometer + motion patterns)',
                    'Automatic emergency countdown with non-response dispatch',
                    'Live GPS handoff to nearest hospital control flow',
                    'Vehicle telematics compatibility (OBD-II / dashboard systems)',
                    'Hybrid bystander flows (QR assisted emergency handoff)',
                    'Off-grid readiness concept (satellite fallback where available on device)',
                  ].map((item) => (
                    <div key={item} className="bg-slate-700/60 border border-slate-600 rounded-lg p-3 text-slate-200 text-sm">
                      {item}
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Crash Incident Log</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {crashIncidentLog.length === 0 ? (
                    <p className="text-slate-400">No crash events logged yet.</p>
                  ) : crashIncidentLog.map((item) => (
                    <div key={item.id} className="bg-slate-700/60 border border-slate-600 rounded-lg p-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <Badge className={item.status === 'dispatched' ? 'bg-emerald-600' : item.status === 'cancelled' ? 'bg-slate-600' : 'bg-red-600'}>
                          {item.status.toUpperCase()}
                        </Badge>
                        <p className="text-xs text-slate-500">{item.createdAt}</p>
                      </div>
                      <p className="text-slate-200 text-sm mt-2">{item.message}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {view === 'pharmacy' && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 mb-6">
                <Button variant="outline" onClick={() => setView('home')} className="text-white border-slate-500 bg-slate-800 hover:bg-slate-700">
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  {t.back}
                </Button>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Pill className="w-6 h-6 text-teal-300" />
                  Pharmacy Near Me
                </h2>
              </div>

              <Card className="bg-slate-800 border-teal-500/40">
                <CardHeader>
                  <CardTitle className="text-white">Live Pharmacy Locator</CardTitle>
                  <CardDescription>
                    Track your current location, view nearby pharmacies on Google Maps, and raise an emergency medicine order.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={startLiveLocationTracking} className="bg-cyan-600 hover:bg-cyan-700">
                      Start Live Tracking
                    </Button>
                    <Button variant="outline" onClick={stopLiveLocationTracking} className="border-slate-500 text-white bg-slate-800 hover:bg-slate-700">
                      Stop Tracking
                    </Button>
                    <Button onClick={loadNearbyPharmacies} className="bg-teal-600 hover:bg-teal-700" disabled={pharmacyLoading}>
                      {pharmacyLoading ? 'Finding Pharmacies...' : 'Find Nearby Pharmacies'}
                    </Button>
                    {liveLocation && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=pharmacy+near+${liveLocation.lat},${liveLocation.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm"
                      >
                        Open in Google Maps
                      </a>
                    )}
                  </div>

                  {liveLocation ? (
                    <div className="bg-slate-700/60 border border-slate-600 rounded-lg p-3 text-sm text-slate-200">
                      <p>Latitude: {liveLocation.lat.toFixed(6)}</p>
                      <p>Longitude: {liveLocation.lng.toFixed(6)}</p>
                      <p>Accuracy: {Math.round(liveLocation.accuracy)} m</p>
                      <p>Updated: {liveLocation.updatedAt}</p>
                    </div>
                  ) : (
                    <Alert className="bg-yellow-600/20 border-yellow-500">
                      <AlertDescription className="text-yellow-200">
                        Live location is required to fetch the nearest pharmacies.
                      </AlertDescription>
                    </Alert>
                  )}

                  {liveLocation && (
                    <div className="rounded-xl overflow-hidden border border-slate-600">
                      <iframe
                        title="Nearby pharmacies map"
                        src={`https://www.google.com/maps?q=pharmacy+near+${liveLocation.lat},${liveLocation.lng}&z=14&output=embed`}
                        className="w-full h-72"
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    </div>
                  )}

                  {pharmacyError && (
                    <Alert className="bg-red-600/20 border-red-500">
                      <AlertDescription className="text-red-200">{pharmacyError}</AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Nearest Pharmacies</CardTitle>
                  <CardDescription>Results are sorted by nearest distance from your tracked location.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {nearbyPharmacies.length === 0 ? (
                    <p className="text-slate-400">No pharmacy list yet. Start tracking and click "Find Nearby Pharmacies".</p>
                  ) : nearbyPharmacies.map((pharmacy) => (
                    <div key={pharmacy.id} className="bg-slate-700/60 border border-slate-600 rounded-lg p-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div>
                          <p className="text-white font-semibold">{pharmacy.name}</p>
                          <p className="text-slate-300 text-xs mt-1">{pharmacy.address}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className="bg-emerald-600">{pharmacy.distanceKm.toFixed(2)} km</Badge>
                          <a
                            href={getGoogleMapsDirectionsUrl(pharmacy.lat, pharmacy.lng)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center px-3 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs"
                          >
                            Directions
                          </a>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedPharmacyForOrder(pharmacy);
                              setEmergencyMedicineOrderStatus('');
                            }}
                            className="bg-teal-600 hover:bg-teal-700"
                          >
                            Order Emergency Medicine
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Emergency Medicine Order</CardTitle>
                  <CardDescription>
                    {selectedPharmacyForOrder
                      ? `Selected pharmacy: ${selectedPharmacyForOrder.name}`
                      : 'Select a pharmacy from the list to place an order.'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-slate-300">Medicine Name</Label>
                      <Input
                        value={emergencyMedicineName}
                        onChange={(e) => setEmergencyMedicineName(e.target.value)}
                        placeholder="Paracetamol 650, insulin, inhaler..."
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Quantity</Label>
                      <Input
                        type="number"
                        min={1}
                        value={emergencyMedicineQuantity}
                        onChange={(e) => setEmergencyMedicineQuantity(e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-slate-300">Notes (optional)</Label>
                    <Textarea
                      value={emergencyMedicineNotes}
                      onChange={(e) => setEmergencyMedicineNotes(e.target.value)}
                      placeholder="Urgency, prescription details, delivery landmark..."
                      className="bg-slate-700 border-slate-600 text-white min-h-[90px]"
                    />
                  </div>
                  <Button onClick={handlePlaceEmergencyMedicineOrder} className="bg-red-600 hover:bg-red-700">
                    Place Emergency Medicine Order
                  </Button>
                  {selectedPharmacyForOrder && (
                    <a
                      href={getGoogleMapsDirectionsUrl(selectedPharmacyForOrder.lat, selectedPharmacyForOrder.lng)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm"
                    >
                      Navigate to Selected Pharmacy
                    </a>
                  )}
                  {emergencyMedicineOrderStatus && (
                    <Alert className="bg-emerald-600/20 border-emerald-500">
                      <AlertDescription className="text-emerald-200">{emergencyMedicineOrderStatus}</AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Recent Emergency Orders</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {emergencyMedicineOrders.length === 0 ? (
                    <p className="text-slate-400">No emergency medicine orders placed yet.</p>
                  ) : emergencyMedicineOrders.map((order) => (
                    <div key={order.id} className="bg-slate-700/60 border border-slate-600 rounded-lg p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-white font-semibold">{order.pharmacyName}</p>
                        <p className="text-xs text-slate-400">{order.createdAt}</p>
                      </div>
                      <p className="text-slate-200 text-sm mt-2">
                        <span className="text-slate-400">Medicine:</span> {order.medicine} ({order.quantity})
                      </p>
                      {order.notes && (
                        <p className="text-slate-200 text-sm">
                          <span className="text-slate-400">Notes:</span> {order.notes}
                        </p>
                      )}
                      <p className="text-slate-500 text-xs mt-1">Location shared: {order.locationLabel}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {view === 'care' && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 mb-6">
                <Button variant="outline" onClick={() => setView('home')} className="text-white border-slate-500 bg-slate-800 hover:bg-slate-700">
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  {t.back}
                </Button>
                <h2 className="text-2xl font-bold text-white">Reports and Prescriptions</h2>
              </div>
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">AI Analysis Snapshot</CardTitle>
                  <CardDescription>Run photo or form analysis and keep reports available for hospital consultation.</CardDescription>
                </CardHeader>
                <CardContent>
                  {analysis ? (
                    <div className="space-y-2">
                      <Badge className={analysis.severity === 'critical' ? 'bg-red-600' : analysis.severity === 'moderate' ? 'bg-yellow-600 text-black' : 'bg-emerald-600'}>
                        {analysis.severity.toUpperCase()}
                      </Badge>
                      <p className="text-slate-200">{analysis.recommendedAction}</p>
                      <p className="text-slate-400 text-sm">Specialist suggested: {analysis.specialist}</p>
                    </div>
                  ) : (
                    <p className="text-slate-400">No AI analysis yet. Use Upload Photo or Accident Form first.</p>
                  )}
                </CardContent>
              </Card>
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Scan/Test Report AI Analyzer</CardTitle>
                  <CardDescription>Paste lab/scan report text. AI explains what happened and suggests next steps.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-slate-300">Report Text</Label>
                    <Textarea
                      value={scanReportText}
                      onChange={(e) => setScanReportText(e.target.value)}
                      placeholder="Paste CT/MRI/Lab report text here..."
                      className="bg-slate-700 border-slate-600 text-white min-h-[130px]"
                    />
                  </div>
                  <Button onClick={handleAnalyzeScanReport} className="bg-indigo-600 hover:bg-indigo-700">
                    Analyze Report with AI
                  </Button>

                  {scanReportAnalysis && (
                    <div className="bg-slate-700/60 border border-slate-600 rounded-lg p-4 space-y-2">
                      <Badge className={
                        scanReportAnalysis.severity === 'urgent'
                          ? 'bg-red-600'
                          : scanReportAnalysis.severity === 'attention'
                            ? 'bg-yellow-600 text-black'
                            : 'bg-emerald-600'
                      }>
                        {scanReportAnalysis.severity.toUpperCase()}
                      </Badge>
                      <p className="text-slate-100">{scanReportAnalysis.summary}</p>
                      <p className="text-slate-300 text-sm"><span className="text-slate-400">Likely cause:</span> {scanReportAnalysis.cause}</p>
                      <div>
                        <p className="text-slate-300 text-sm mb-1">Next Steps:</p>
                        <ul className="list-disc pl-5 text-slate-200 text-sm space-y-1">
                          {scanReportAnalysis.nextSteps.map((step) => (
                            <li key={step}>{step}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  <div className="grid md:grid-cols-[1fr_auto] gap-3 items-end">
                    <div>
                      <Label className="text-slate-300">Send Analysis To Hospital</Label>
                      <Select value={scanReportHospitalId} onValueChange={setScanReportHospitalId}>
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                          <SelectValue placeholder="Select concern hospital" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-700 border-slate-600">
                          {hospitals.map((hospital) => (
                            <SelectItem key={hospital.id} value={String(hospital.id)}>
                              {hospital.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleSendReportToHospital} className="bg-cyan-600 hover:bg-cyan-700 h-10">
                      Send Analysis
                    </Button>
                  </div>

                  {scanReportStatusMessage && (
                    <Alert className="bg-blue-600/20 border-blue-500">
                      <AlertDescription className="text-blue-200">{scanReportStatusMessage}</AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-cyan-300" />
                    Ask Concerned Doctor
                  </CardTitle>
                  <CardDescription>Ask general questions or request medicine prescriptions from the concerned doctor.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-3">
                    <div>
                      <Label className="text-slate-300">Concerned Hospital</Label>
                      <Select value={askDoctorHospitalId} onValueChange={(value) => {
                        setAskDoctorHospitalId(value);
                        setAskDoctorDepartment('');
                      }}>
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                          <SelectValue placeholder="Select hospital" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-700 border-slate-600">
                          {hospitals.map((hospital) => (
                            <SelectItem key={hospital.id} value={String(hospital.id)}>
                              {hospital.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-slate-300">Request Type</Label>
                      <Select value={askDoctorRequestType} onValueChange={(value: 'general' | 'prescription') => setAskDoctorRequestType(value)}>
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                          <SelectValue placeholder="Select request type" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-700 border-slate-600">
                          <SelectItem value="general">General Doctor Query</SelectItem>
                          <SelectItem value="prescription">Medicine Prescription Request</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-slate-300">Concerned Department</Label>
                      <Select value={askDoctorDepartment} onValueChange={setAskDoctorDepartment}>
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-700 border-slate-600 max-h-80">
                          {(hospitals.find((item) => item.id === Number(askDoctorHospitalId))?.specialties ?? []).map((spec) => (
                            <SelectItem key={spec} value={spec}>
                              {spec}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label className="text-slate-300">Related Disease/Condition</Label>
                    <Input
                      value={askDoctorDisease}
                      onChange={(e) => setAskDoctorDisease(e.target.value)}
                      placeholder="Diabetes, heart failure, asthma, arthritis..."
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  {askDoctorRequestType === 'prescription' && (
                    <div>
                      <Label className="text-slate-300">Current Medicines / History</Label>
                      <Textarea
                        value={askDoctorCurrentMedicines}
                        onChange={(e) => setAskDoctorCurrentMedicines(e.target.value)}
                        placeholder="Mention current medicines, dosage, allergies, and past prescriptions..."
                        className="bg-slate-700 border-slate-600 text-white min-h-[90px]"
                      />
                    </div>
                  )}
                  <div>
                    <Label className="text-slate-300">
                      {askDoctorRequestType === 'prescription' ? 'Prescription Request Details' : 'Your Question'}
                    </Label>
                    <Textarea
                      value={askDoctorQuestion}
                      onChange={(e) => setAskDoctorQuestion(e.target.value)}
                      placeholder={
                        askDoctorRequestType === 'prescription'
                          ? 'Explain symptoms and ask the concerned doctor to issue a medicine prescription...'
                          : 'Describe your symptoms and ask your question...'
                      }
                      className="bg-slate-700 border-slate-600 text-white min-h-[120px]"
                    />
                  </div>
                  <Button onClick={handleAskDoctorQuestion} className="bg-cyan-600 hover:bg-cyan-700">
                    {askDoctorRequestType === 'prescription'
                      ? 'Ask Concerned Doctor for Medicine Prescription'
                      : 'Send Question to Doctors'}
                  </Button>
                  {askDoctorStatusMessage && (
                    <Alert className="bg-cyan-600/20 border-cyan-500">
                      <AlertDescription className="text-cyan-100">{askDoctorStatusMessage}</AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">My Doctor Questions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {publicDoctorQueries.length === 0 ? (
                    <p className="text-slate-400">No doctor questions yet.</p>
                  ) : publicDoctorQueries.map((item) => (
                    <div key={item.id} className="bg-slate-700/60 border border-slate-600 rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <p className="text-white font-semibold">{item.hospitalName}</p>
                        <Badge className={item.status === 'answered' ? 'bg-emerald-600' : 'bg-yellow-600 text-black'}>
                          {item.status.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-slate-300 text-sm">{item.department} | {item.disease}</p>
                      <p className="text-slate-200 text-sm"><span className="text-slate-400">Q:</span> {item.question}</p>
                      {item.status === 'answered' && (
                        <div className="bg-slate-800 border border-slate-600 rounded-md p-3">
                          <p className="text-emerald-300 text-sm">Dr. {item.doctorName}</p>
                          <p className="text-slate-100 text-sm mt-1">{item.answer}</p>
                          {item.answeredAt && <p className="text-slate-500 text-xs mt-1">{item.answeredAt}</p>}
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Doctor Prescriptions</CardTitle>
                  <CardDescription>These are sent by hospitals directly to your portal.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {publicPrescriptions.length === 0 ? (
                    <p className="text-slate-400">No prescriptions available yet for this account.</p>
                  ) : publicPrescriptions.map((item) => (
                    <div key={item.id} className="bg-slate-700/60 border border-slate-600 rounded-lg p-4">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <p className="text-white font-semibold">{item.hospitalName}</p>
                        <p className="text-xs text-slate-400">{item.createdAt}</p>
                      </div>
                      <p className="text-slate-300 text-sm mt-1">Doctor: {item.doctorName}</p>
                      <p className="text-slate-200 mt-2"><span className="text-slate-400">Medicines:</span> {item.medicines || 'N/A'}</p>
                      <p className="text-slate-200"><span className="text-slate-400">Advice:</span> {item.advice || 'N/A'}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {view === 'photo' && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 mb-6">
                <Button variant="outline" onClick={() => setView('home')} className="text-white border-slate-500 bg-slate-800 hover:bg-slate-700">
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  {t.back}
                </Button>
                <h2 className="text-2xl font-bold text-white">{t.uploadPhoto}</h2>
              </div>

              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-8">
                  {!photoUploaded ? (
                    <div className="text-center">
                      <div className="border-4 border-dashed border-slate-600 rounded-2xl p-12 mb-6 hover:border-blue-500 transition-colors cursor-pointer" onClick={triggerFileInput}>
                        <Camera className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                        <p className="text-slate-400 mb-4">Click to upload or take a photo of the injury</p>
                        <div className="flex justify-center gap-4">
                          <Button onClick={(e) => { e.stopPropagation(); triggerFileInput(); }} className="bg-blue-600">
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Photo
                          </Button>
                          <Button
                            onClick={(e) => { e.stopPropagation(); triggerFileInput(); }}
                            variant="outline"
                            className="text-white border-slate-500 bg-slate-800 hover:bg-slate-700"
                          >
                            <Camera className="w-4 h-4 mr-2" />
                            Take Photo
                          </Button>
                        </div>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </div>
                  ) : analyzing ? (
                    <div className="space-y-6">
                      {uploadedImage && (
                        <div className="relative">
                          <img 
                            src={uploadedImage} 
                            alt="Uploaded injury" 
                            className="w-full max-h-64 object-contain rounded-xl"
                          />
                          <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                            <div className="text-center">
                              <div className="animate-spin w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
                              <p className="text-white text-xl flex items-center gap-2">
                                <Brain className="w-6 h-6 text-blue-400" />
                                {t.aiAnalyzing}
                              </p>
                              <p className="text-slate-400 mt-2">Scanning image for injuries...</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {uploadedImage && (
                        <div className="relative">
                          <img 
                            src={uploadedImage} 
                            alt="Uploaded injury" 
                            className="w-full max-h-64 object-contain rounded-xl border-2 border-green-500"
                          />
                          <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                            <Scan className="w-4 h-4" />
                            Analyzed
                          </div>
                        </div>
                      )}
                      
                      {detectedInjury && (
                        <Card className={`border-2 ${
                          detectedInjury.severity === 'critical' ? 'bg-red-900/30 border-red-500' :
                          detectedInjury.severity === 'moderate' ? 'bg-yellow-900/30 border-yellow-500' :
                          'bg-green-900/30 border-green-500'
                        }`}>
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3 mb-2">
                              <Scan className="w-6 h-6 text-blue-400" />
                              <span className="text-white font-bold">AI Detection Result</span>
                            </div>
                            <p className="text-slate-300">
                              Detected <span className="text-white font-semibold">{detectedInjury.type}</span> on{' '}
                              <span className="text-white font-semibold">{detectedInjury.bodyPart}</span>
                            </p>
                            <Badge className={`mt-2 ${
                              detectedInjury.severity === 'critical' ? 'bg-red-500' :
                              detectedInjury.severity === 'moderate' ? 'bg-yellow-500 text-black' :
                              'bg-green-500'
                            }`}>
                              {detectedInjury.severity.toUpperCase()} Severity
                            </Badge>
                          </CardContent>
                        </Card>
                      )}
                      
                      <Alert className="bg-green-600/20 border-green-500">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <AlertDescription className="text-green-400">
                          {t.injuryDetected}! Form has been auto-filled based on analysis.
                        </AlertDescription>
                      </Alert>
                      
                      <div className="flex gap-3">
                        <Button onClick={() => setView('form')} className="flex-1 bg-blue-600">
                          Continue to Form
                          <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                        <Button 
                          onClick={() => {
                            setPhotoUploaded(false);
                            setUploadedImage(null);
                            setDetectedInjury(null);
                            triggerFileInput();
                          }} 
                          variant="outline" 
                          className="text-white border-slate-500 bg-slate-800 hover:bg-slate-700"
                        >
                          <Camera className="w-4 h-4 mr-2" />
                          Retake
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {view === 'form' && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 mb-6">
                <Button variant="outline" onClick={() => setView('home')} className="text-white border-slate-500 bg-slate-800 hover:bg-slate-700">
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  {t.back}
                </Button>
                <h2 className="text-2xl font-bold text-white">{t.accidentForm}</h2>
              </div>

              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-6 space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-slate-300">{t.patientName}</Label>
                      <Input
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value)}
                        placeholder="Enter patient name"
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">{t.age}</Label>
                      <Input
                        value={patientAge}
                        onChange={(e) => setPatientAge(e.target.value)}
                        type="number"
                        placeholder="Enter age"
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-slate-300">{t.gender}</Label>
                      <Select value={patientGender} onValueChange={setPatientGender}>
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-700 border-slate-600">
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-slate-300">{t.bloodGroup}</Label>
                      <Select value={bloodGroup} onValueChange={setBloodGroup}>
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                          <SelectValue placeholder="Select blood group" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-700 border-slate-600">
                          {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                            <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label className="text-slate-300">{t.symptoms}</Label>
                    <Textarea
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                      placeholder="Describe symptoms (comma separated)"
                      className="bg-slate-700 border-slate-600 text-white min-h-[100px]"
                    />
                  </div>

                  <div>
                    <Label className="text-slate-300">{t.location}</Label>
                    <Input
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Enter accident location"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>

                  <div>
                    <Label className="text-slate-300">{t.contactNumber}</Label>
                    <Input
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                      placeholder="Enter contact number"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-slate-300">Known Conditions</Label>
                      <Input
                        value={knownConditions}
                        onChange={(e) => setKnownConditions(e.target.value)}
                        placeholder="Diabetes, hypertension, asthma..."
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Drug Allergies</Label>
                      <Input
                        value={allergies}
                        onChange={(e) => setAllergies(e.target.value)}
                        placeholder="Penicillin, Sulfa, none..."
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-slate-300">Pain Scale (0-10): {painScale}</Label>
                    <Input
                      type="range"
                      min={0}
                      max={10}
                      value={painScale}
                      onChange={(e) => setPainScale(Number(e.target.value))}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>

                  <Button onClick={handleSubmitForm} className="w-full bg-emerald-600 hover:bg-emerald-700 py-6 text-lg">
                    {t.submit}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {view === 'results' && analysis && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 mb-6">
                <Button variant="outline" onClick={() => setView('home')} className="text-white border-slate-500 bg-slate-800 hover:bg-slate-700">
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  {t.back}
                </Button>
                <h2 className="text-2xl font-bold text-white">{t.analysisResults}</h2>
              </div>

              {/* Severity Card */}
              <Card className={`border-2 ${
                analysis.severity === 'critical' ? 'bg-red-900/30 border-red-500' :
                analysis.severity === 'moderate' ? 'bg-yellow-900/30 border-yellow-500' :
                'bg-green-900/30 border-green-500'
              }`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 mb-1">{t.severity}</p>
                      <p className={`text-3xl font-bold ${
                        analysis.severity === 'critical' ? 'text-red-400' :
                        analysis.severity === 'moderate' ? 'text-yellow-400' :
                        'text-green-400'
                      }`}>
                        {analysis.severity.toUpperCase()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-400 mb-1">Confidence</p>
                      <p className="text-2xl font-bold text-white">{(analysis.confidence * 100).toFixed(0)}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Clinical Intake Summary</CardTitle>
                  <CardDescription>Key medical details to share with doctor/ambulance team.</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4 text-sm">
                  <div className="bg-slate-700/60 rounded-lg p-3">
                    <p className="text-slate-400">Pain Scale</p>
                    <p className="text-white font-semibold">{painScale} / 10</p>
                  </div>
                  <div className="bg-slate-700/60 rounded-lg p-3">
                    <p className="text-slate-400">Vitals Snapshot</p>
                    <p className="text-white font-semibold">
                      Temp {bodyTemperature}F, SpO2 {oxygenSaturation}%, Pulse {pulseRate} bpm
                    </p>
                  </div>
                  <div className="bg-slate-700/60 rounded-lg p-3">
                    <p className="text-slate-400">Known Conditions</p>
                    <p className="text-white font-semibold">{knownConditions || 'Not provided'}</p>
                  </div>
                  <div className="bg-slate-700/60 rounded-lg p-3">
                    <p className="text-slate-400">Drug Allergies</p>
                    <p className="text-white font-semibold">{allergies || 'Not provided'}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Specialist & Blood */}
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="bg-slate-800 border-slate-700">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <Stethoscope className="w-6 h-6 text-blue-400" />
                      <p className="text-slate-400">{t.specialist}</p>
                    </div>
                    <p className="text-xl font-bold text-white">{analysis.specialist}</p>
                  </CardContent>
                </Card>

                {analysis.bloodRequired && (
                  <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <Droplet className="w-6 h-6 text-red-400" />
                        <p className="text-slate-400">{t.bloodRequired}</p>
                      </div>
                      <p className="text-xl font-bold text-white">
                        {analysis.bloodType} - {analysis.units} {t.units}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Recommended Action */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">{t.recommendedAction}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-300">{analysis.recommendedAction}</p>
                </CardContent>
              </Card>

              {/* First Aid */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Heart className="w-5 h-5 text-red-500" />
                    {t.firstAid}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-2">
                    {analysis.firstAid.map((step, index) => (
                      <li key={index} className="flex items-start gap-3 text-slate-300">
                        <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm flex-shrink-0">
                          {index + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="grid md:grid-cols-2 gap-4">
                <Button onClick={() => setView('hospitals')} className="bg-purple-600 hover:bg-purple-700 py-6">
                  <MapPin className="w-5 h-5 mr-2" />
                  {t.findHospital}
                </Button>
                {analysis.bloodRequired && (
                  <Button onClick={() => setView('bloodbank')} className="bg-red-600 hover:bg-red-700 py-6">
                    <Droplet className="w-5 h-5 mr-2" />
                    {t.bloodBank}
                  </Button>
                )}
              </div>
            </div>
          )}

          {view === 'firstaid' && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 mb-6">
                <Button variant="outline" onClick={() => setView('home')} className="text-white border-slate-500 bg-slate-800 hover:bg-slate-700">
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  {t.back}
                </Button>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Brain className="w-6 h-6 text-cyan-300" />
                  AI First Aid Coach
                </h2>
              </div>

              <Card className="bg-slate-800 border-cyan-500/40 shadow-[0_0_20px_rgba(34,211,238,0.1)]">
                <CardHeader>
                  <CardTitle className="text-white">Smart First-Aid Guidance</CardTitle>
                  <CardDescription>Enter symptoms/concerns and get AI triage, first steps, and escalation guidance.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-slate-300">Symptoms (comma separated)</Label>
                    <Textarea
                      value={firstAidSymptomsDraft}
                      onChange={(e) => setFirstAidSymptomsDraft(e.target.value)}
                      placeholder="chest pain, heavy bleeding, dizziness..."
                      className="bg-slate-700 border-slate-600 text-white min-h-[90px]"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300">Additional Concern</Label>
                    <Input
                      value={firstAidConcern}
                      onChange={(e) => setFirstAidConcern(e.target.value)}
                      placeholder="Example: patient became very weak in last 10 minutes"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div className="grid md:grid-cols-3 gap-3">
                    <div className="bg-slate-700/60 rounded-lg p-3">
                      <p className="text-slate-400 text-xs">Pain Scale</p>
                      <p className="text-white font-semibold">{painScale}/10</p>
                    </div>
                    <div className="bg-slate-700/60 rounded-lg p-3">
                      <p className="text-slate-400 text-xs">Pulse</p>
                      <p className="text-white font-semibold">{pulseRate || 'N/A'} bpm</p>
                    </div>
                    <div className="bg-slate-700/60 rounded-lg p-3">
                      <p className="text-slate-400 text-xs">SpO2</p>
                      <p className="text-white font-semibold">{oxygenSaturation || 'N/A'}%</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {['Chest pain', 'Severe bleeding', 'Breathing trouble', 'Head injury', 'Fainting'].map((quickSymptom) => (
                      <Button
                        key={quickSymptom}
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setFirstAidSymptomsDraft((prev) => {
                            const current = prev.trim();
                            if (!current) return quickSymptom;
                            if (current.toLowerCase().includes(quickSymptom.toLowerCase())) return current;
                            return `${current}, ${quickSymptom}`;
                          });
                        }}
                        className="bg-slate-700 border-slate-600 text-slate-200 hover:bg-slate-600"
                      >
                        {quickSymptom}
                      </Button>
                    ))}
                  </div>
                  <Button onClick={runFirstAidCoach} className="w-full bg-cyan-600 hover:bg-cyan-700">
                    <Brain className="w-4 h-4 mr-2" />
                    Generate AI First-Aid Plan
                  </Button>
                  {firstAidCoachError && (
                    <Alert className="bg-red-600/20 border-red-500">
                      <AlertDescription className="text-red-200">{firstAidCoachError}</AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {firstAidCoachPlan && (
                <>
                  <Card
                    className={`border-2 ${
                      firstAidCoachPlan.analysis.severity === 'critical'
                        ? 'bg-red-900/30 border-red-500'
                        : firstAidCoachPlan.analysis.severity === 'moderate'
                        ? 'bg-yellow-900/30 border-yellow-500'
                        : 'bg-green-900/30 border-green-500'
                    }`}
                  >
                    <CardContent className="p-6 flex items-center justify-between">
                      <div>
                        <p className="text-slate-300">AI Triage Level</p>
                        <p className="text-2xl font-bold text-white">{firstAidCoachPlan.analysis.severity.toUpperCase()}</p>
                      </div>
                      <Badge className="bg-slate-900/70 text-cyan-200 border border-cyan-500/50">
                        Confidence {(firstAidCoachPlan.analysis.confidence * 100).toFixed(0)}%
                      </Badge>
                    </CardContent>
                  </Card>

                  <div className="grid md:grid-cols-2 gap-4">
                    <Card className="bg-slate-800 border-slate-700">
                      <CardHeader>
                        <CardTitle className="text-white text-lg">Immediate Actions</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ol className="space-y-2">
                          {firstAidCoachPlan.immediateActions.map((step, index) => (
                            <li key={step} className="text-slate-200 flex items-start gap-3">
                              <span className="w-6 h-6 rounded-full bg-cyan-600 text-white text-sm flex items-center justify-center flex-shrink-0">
                                {index + 1}
                              </span>
                              {step}
                            </li>
                          ))}
                        </ol>
                      </CardContent>
                    </Card>

                    <Card className="bg-slate-800 border-slate-700">
                      <CardHeader>
                        <CardTitle className="text-white text-lg">Avoid These Actions</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {firstAidCoachPlan.avoidActions.map((item) => (
                          <p key={item} className="text-slate-200">
                            • {item}
                          </p>
                        ))}
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="bg-slate-800 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-white text-lg">Monitoring + Escalation</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {firstAidCoachPlan.monitoringChecks.map((item) => (
                        <p key={item} className="text-slate-200">• {item}</p>
                      ))}
                      <Alert className="bg-amber-500/15 border-amber-500/45">
                        <AlertTriangle className="w-4 h-4 text-amber-300" />
                        <AlertDescription className="text-amber-100">{firstAidCoachPlan.escalationTrigger}</AlertDescription>
                      </Alert>
                    </CardContent>
                  </Card>

                  <div className="grid md:grid-cols-2 gap-4">
                    <Button onClick={() => setView('hospitals')} className="bg-purple-600 hover:bg-purple-700 py-6">
                      <MapPin className="w-5 h-5 mr-2" />
                      {t.findHospital}
                    </Button>
                    <Button onClick={() => setShowEmergencyContacts(true)} className="bg-red-600 hover:bg-red-700 py-6">
                      <Phone className="w-5 h-5 mr-2" />
                      Emergency Contacts
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {view === 'women-health' && (
            <div className="space-y-6 max-w-6xl mx-auto">
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <Button variant="outline" onClick={() => setView('home')} className="text-white border-slate-500 bg-slate-800 hover:bg-slate-700">
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  {t.back}
                </Button>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Heart className="w-6 h-6 text-pink-400" />
                  Women's Health AI Hub
                </h2>
              </div>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Section-Wise Quick Flow</CardTitle>
                  <CardDescription>Use this order to quickly analyze and get support for common women health problems.</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-2">
                  {(womenHealthPlan?.sectionOrder ?? [
                    'Step 1: Enter life stage, medicines, and symptoms.',
                    'Step 2: Generate AI risk and major problem tracks.',
                    'Step 3: Review care, screening, and medication guidance.',
                    'Step 4: Use safety and emergency support if needed.',
                    'Step 5: Ask women doctor from preferred hospital.',
                  ]).map((step) => (
                    <div key={step} className="bg-slate-700/60 border border-slate-600 rounded-md px-3 py-2 text-slate-200 text-sm">
                      {step}
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card
                className="bg-pink-950/25 border-pink-500/45"
                onMouseEnter={() => setWomenAwarenessPaused(true)}
                onMouseLeave={() => setWomenAwarenessPaused(false)}
                onTouchStart={() => setWomenAwarenessPaused(true)}
                onTouchEnd={() => setWomenAwarenessPaused(false)}
                onTouchCancel={() => setWomenAwarenessPaused(false)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <CardTitle className="text-white flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-pink-300" />
                      Women Awareness Live Frame
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-pink-700/70 border border-pink-400/40 text-pink-100">
                        Updated {womenAwarenessUpdatedAt}
                      </Badge>
                      {womenAwarenessPaused && <Badge className="bg-amber-500/20 text-amber-200 border border-amber-400/30">Paused</Badge>}
                    </div>
                  </div>
                  <CardDescription>
                    Live awareness feed for every woman: cancer screening, menstrual hygiene, infections, pregnancy care, hormonal health, mental wellbeing, and safety.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-slate-800/70 border border-slate-600 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <p className="text-pink-100 text-lg font-semibold">{liveWomenAwareness.title}</p>
                      <Badge className="bg-slate-700 border border-slate-500 text-slate-100">{liveWomenAwareness.category}</Badge>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="text-slate-200 font-medium text-sm">Key Risk Signals</p>
                        <ul className="space-y-1">
                          {liveWomenAwareness.riskSignals.map((item) => (
                            <li key={item} className="text-slate-300 text-sm">- {item}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="space-y-2">
                        <p className="text-slate-200 font-medium text-sm">Prevention and Daily Care</p>
                        <ul className="space-y-1">
                          {liveWomenAwareness.prevention.map((item) => (
                            <li key={item} className="text-slate-300 text-sm">- {item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <Alert className="bg-pink-600/15 border-pink-500/40">
                      <AlertDescription className="text-pink-100">
                        <span className="font-semibold">When to seek care:</span> {liveWomenAwareness.whenToSeekCare}
                      </AlertDescription>
                    </Alert>
                  </div>
                  <p className="text-xs text-slate-400">
                    Frame {womenAwarenessIndex + 1} of {WOMEN_AWARENESS_FEED.length}. Rotates automatically every 12 seconds.
                  </p>
                  <p className="text-xs text-slate-400">
                    Touch and hold to pause this live frame. Release to continue updates.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-pink-500/40">
                <CardHeader>
                  <CardTitle className="text-white">Section 1: Personalized Women's Health Planner</CardTitle>
                  <CardDescription>
                    Covers anemia, thyroid, diabetes, autoimmune risk, bone and heart health, pregnancy care, mental wellness, screening schedule, and medication guidance.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4 items-end">
                    <div>
                      <Label className="text-slate-300">Life Stage</Label>
                      <Select value={womenLifeStage} onValueChange={(value: WomenLifeStage) => setWomenLifeStage(value)}>
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                          <SelectValue placeholder="Select life stage" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-700 border-slate-600">
                          <SelectItem value="adolescent">Adolescent</SelectItem>
                          <SelectItem value="reproductive">Reproductive Age</SelectItem>
                          <SelectItem value="pregnancy">Pregnancy</SelectItem>
                          <SelectItem value="postpartum">Postpartum</SelectItem>
                          <SelectItem value="perimenopause">Perimenopause</SelectItem>
                          <SelectItem value="postmenopause">Postmenopause</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-slate-300">Current Medicines</Label>
                      <Input
                        value={womenCurrentMedicines}
                        onChange={(e) => setWomenCurrentMedicines(e.target.value)}
                        placeholder="Iron tablets, thyroid tablets, insulin..."
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                  </div>
                  {womenLifeStage === 'pregnancy' && (
                    <div className="bg-pink-950/30 border border-pink-500/40 rounded-lg p-4 space-y-4">
                      <div className="flex items-center gap-2">
                        <Baby className="w-5 h-5 text-pink-300" />
                        <p className="text-pink-100 font-medium">Pregnancy Feature Pack</p>
                      </div>
                      <div className="grid md:grid-cols-3 gap-4 items-end">
                        <div>
                          <Label className="text-slate-300">Trimester</Label>
                          <Select value={pregnancyTrimester} onValueChange={(value: PregnancyTrimester) => setPregnancyTrimester(value)}>
                            <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                              <SelectValue placeholder="Select trimester" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-700 border-slate-600">
                              <SelectItem value="first">First Trimester</SelectItem>
                              <SelectItem value="second">Second Trimester</SelectItem>
                              <SelectItem value="third">Third Trimester</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-slate-300">Expected Due Date</Label>
                          <Input
                            type="date"
                            value={pregnancyDueDate}
                            onChange={(e) => setPregnancyDueDate(e.target.value)}
                            className="bg-slate-700 border-slate-600 text-white"
                          />
                        </div>
                        <div>
                          <Label className="text-slate-300">Warning Signals</Label>
                          <Input
                            value={pregnancyWarningSignals}
                            onChange={(e) => setPregnancyWarningSignals(e.target.value)}
                            placeholder="Bleeding, severe headache, reduced fetal movement..."
                            className="bg-slate-700 border-slate-600 text-white"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  <div>
                    <Label className="text-slate-300">Symptoms & Concerns</Label>
                    <Textarea
                      value={womenSymptomsInput}
                      onChange={(e) => setWomenSymptomsInput(e.target.value)}
                      placeholder="fatigue, heavy periods, mood swings, weight change, anxiety..."
                      className="bg-slate-700 border-slate-600 text-white min-h-[110px]"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {['Irregular period', 'Heavy bleeding', 'Severe cramps', 'Pelvic pain', 'PCOS concern', 'Thyroid symptoms', 'Mood swings', 'Sleep problems', 'Hot flashes', 'Vaginal infection symptoms', 'Nausea in pregnancy', 'Reduced fetal movement', 'Swelling with headache'].map((tag) => (
                      <Button
                        key={tag}
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setWomenSymptomsInput((prev) => {
                            const current = prev.trim();
                            if (!current) return tag;
                            if (current.toLowerCase().includes(tag.toLowerCase())) return current;
                            return `${current}, ${tag}`;
                          });
                        }}
                        className="bg-slate-700 border-slate-600 text-slate-200 hover:bg-slate-600"
                      >
                        {tag}
                      </Button>
                    ))}
                  </div>
                  <Button onClick={generateWomenHealthPlan} className="w-full bg-pink-600 hover:bg-pink-700">
                    <Brain className="w-4 h-4 mr-2" />
                    Generate Women's AI Health Plan
                  </Button>
                </CardContent>
              </Card>

              {womenHealthPlan && (
                <>
                  <Card
                    className={`border-2 ${
                      womenHealthPlan.riskLevel === 'high'
                        ? 'bg-red-900/30 border-red-500'
                        : womenHealthPlan.riskLevel === 'moderate'
                        ? 'bg-yellow-900/30 border-yellow-500'
                        : 'bg-emerald-900/30 border-emerald-500'
                    }`}
                  >
                    <CardContent className="p-6">
                      <p className="text-slate-300 text-sm">Section 2: AI Risk Tier</p>
                      <p className="text-2xl font-bold text-white mt-1">{womenHealthPlan.riskLevel.toUpperCase()}</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-800 border-pink-500/40">
                    <CardHeader>
                      <CardTitle className="text-white">Major Women's Problem Analysis</CardTitle>
                      <CardDescription>
                        AI tracks common high-impact women health problem groups and gives targeted next steps.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {womenHealthPlan.majorProblemTracks.map((track) => (
                        <div key={track.title} className="bg-slate-700/60 border border-slate-600 rounded-lg p-4 space-y-2">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <p className="text-white font-semibold">{track.title}</p>
                            <Badge
                              className={
                                track.severity === 'high'
                                  ? 'bg-red-600'
                                  : track.severity === 'moderate'
                                  ? 'bg-yellow-600 text-black'
                                  : track.severity === 'watch'
                                  ? 'bg-blue-600'
                                  : 'bg-slate-600'
                              }
                            >
                              {track.severity.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-slate-300 text-sm">{track.summary}</p>
                          <ul className="space-y-1">
                            {track.actions.map((action) => (
                              <li key={action} className="text-slate-200 text-sm">- {action}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card className="bg-pink-900/20 border-pink-500/40">
                    <CardHeader>
                      <CardTitle className="text-white">Section 3: Need More Help From Women Doctor?</CardTitle>
                      <CardDescription>
                        Based on this AI analysis, choose your preferred hospital and continue with women doctor only for comfort and privacy.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-slate-300">Preferred Hospital</Label>
                        <Select value={womenDoctorHospitalId} onValueChange={setWomenDoctorHospitalId}>
                          <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                            <SelectValue placeholder="Select preferred hospital" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-700 border-slate-600">
                            {hospitals.map((hospital) => (
                              <SelectItem key={hospital.id} value={String(hospital.id)}>
                                {hospital.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button onClick={handlePrepareWomenDoctorAssist} className="w-full bg-pink-600 hover:bg-pink-700">
                        Use AI Analysis and Ask Women Doctor
                      </Button>
                    </CardContent>
                  </Card>

                  <div className="grid md:grid-cols-2 gap-4">
                    <Card className="bg-slate-800 border-slate-700">
                      <CardHeader>
                        <CardTitle className="text-white">Priority Focus Areas</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <ul className="space-y-2">
                        {womenHealthPlan.focusAreas.map((item) => (
                          <li key={item} className="text-slate-200">- {item}</li>
                        ))}
                      </ul>
                      </CardContent>
                    </Card>

                    <Card className="bg-slate-800 border-slate-700">
                      <CardHeader>
                        <CardTitle className="text-white">Preventive Screening Plan</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <ul className="space-y-2">
                        {womenHealthPlan.screeningPlan.map((item) => (
                          <li key={item} className="text-slate-200">- {item}</li>
                        ))}
                      </ul>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <Card className="bg-pink-950/30 border-pink-500/40">
                      <CardHeader>
                        <CardTitle className="text-white">Pregnancy Care Plan</CardTitle>
                        <CardDescription className="text-pink-100/80">
                          {womenHealthPlan.trimesterLabel}
                          {womenHealthPlan.estimatedWeek ? ` | Estimated week ${womenHealthPlan.estimatedWeek}` : ''}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {womenHealthPlan.pregnancyPlan.map((item) => (
                            <li key={item} className="text-slate-100">- {item}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="bg-pink-950/20 border-pink-500/30">
                      <CardHeader>
                        <CardTitle className="text-white">Pregnancy Checklist</CardTitle>
                        <CardDescription className="text-pink-100/80">
                          {womenHealthPlan.dueDate ? `Due date: ${womenHealthPlan.dueDate}` : 'Add due date in Section 1 for timeline-aware reminders.'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {womenHealthPlan.pregnancyChecklist.map((item) => (
                            <li key={item} className="text-slate-100">- {item}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="bg-slate-800 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-white">Medication Guidance (Doctor-Supervised)</CardTitle>
                      <CardDescription>Use these as discussion points with your clinician, not direct self-prescription.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <ul className="space-y-2">
                        {womenHealthPlan.medicationGuide.map((item) => (
                          <li key={item} className="text-slate-200">- {item}</li>
                        ))}
                      </ul>
                      {womenCurrentMedicines.trim() && (
                        <Alert className="bg-blue-600/15 border-blue-500/40">
                          <AlertDescription className="text-blue-100">
                            Current medicines noted: {womenCurrentMedicines}. Ask your doctor for interaction checks and dose review.
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-800 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-white">Emergency Red Flags</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <ul className="space-y-2">
                        {womenHealthPlan.redFlags.map((item) => (
                          <li key={item} className="text-red-300">- {item}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </>
              )}

              <Card className="bg-slate-800 border-pink-500/40">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Shield className="w-5 h-5 text-pink-300" />
                    Section 4: Women Safety Alert Guard
                  </CardTitle>
                  <CardDescription>
                    Similar to Crash Guard: starts emergency countdown and auto-dispatches safety alert if not cancelled.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={triggerWomenSafetyAlert} className="bg-pink-600 hover:bg-pink-700">
                      Trigger Women Safety Alert
                    </Button>
                    {womenSafetyDetected && (
                      <Button variant="outline" onClick={cancelWomenSafetyAlert} className="border-emerald-500 text-emerald-300">
                        I Am Safe
                      </Button>
                    )}
                    <Button variant="outline" onClick={() => setShowEmergencyContacts(true)} className="border-red-500 text-red-300">
                      Open Emergency Contacts
                    </Button>
                  </div>
                  {womenSafetyDetected && (
                    <Alert className="bg-red-600/20 border-red-500">
                      <AlertDescription className="text-red-200">
                        Women safety countdown running: {womenSafetyCountdown}s. Cancel if safe.
                      </AlertDescription>
                    </Alert>
                  )}
                  {womenSafetyStatusMessage && (
                    <Alert className="bg-pink-600/20 border-pink-500">
                      <AlertDescription className="text-pink-100">{womenSafetyStatusMessage}</AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-2 gap-4">
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Emergency Contact Auto Alerts</CardTitle>
                    <CardDescription>Contacts receive alert context when crash dispatch triggers.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-slate-300">Emergency Contact 1</Label>
                      <Input
                        value={safetyContactOne}
                        onChange={(e) => setSafetyContactOne(e.target.value)}
                        placeholder="Name / Phone"
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Emergency Contact 2</Label>
                      <Input
                        value={safetyContactTwo}
                        onChange={(e) => setSafetyContactTwo(e.target.value)}
                        placeholder="Name / Phone"
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <p className="text-xs text-slate-500">
                      If no response in countdown, nearest hospital alert is sent and these contacts are included in dispatch note.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Medical ID Snapshot</CardTitle>
                    <CardDescription>Critical data to share in the Golden Hour for accurate treatment.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-700/60 border border-slate-600 rounded-lg p-3">
                        <p className="text-slate-400 text-xs">Blood Group</p>
                        <p className="text-white font-semibold">{bloodGroup || 'Not Set'}</p>
                      </div>
                      <div className="bg-slate-700/60 border border-slate-600 rounded-lg p-3">
                        <p className="text-slate-400 text-xs">Primary Contact</p>
                        <p className="text-white font-semibold">{publicPhoneNumber || 'Not Set'}</p>
                      </div>
                    </div>
                    <div className="bg-slate-700/60 border border-slate-600 rounded-lg p-3">
                      <p className="text-slate-400 text-xs">Known Conditions</p>
                      <p className="text-slate-200 text-sm">{knownConditions || 'Not provided'}</p>
                    </div>
                    <div className="bg-slate-700/60 border border-slate-600 rounded-lg p-3">
                      <p className="text-slate-400 text-xs">Drug Allergies</p>
                      <p className="text-slate-200 text-sm">{allergies || 'Not provided'}</p>
                    </div>
                    <div>
                      <Label className="text-slate-300">Additional Medical Notes</Label>
                      <Textarea
                        value={medicalIdNote}
                        onChange={(e) => setMedicalIdNote(e.target.value)}
                        placeholder="Any implant/device, chronic medication, recent surgery..."
                        className="bg-slate-700 border-slate-600 text-white min-h-[90px]"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div ref={womenDoctorSectionRef}>
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-cyan-300" />
                    Section 5: Ask Women Doctor (Women Health)
                  </CardTitle>
                  <CardDescription>Your query is marked with women doctor preference for comfort and privacy.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-3">
                    <div>
                      <Label className="text-slate-300">Preferred Hospital</Label>
                      <Select value={womenDoctorHospitalId} onValueChange={setWomenDoctorHospitalId}>
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                          <SelectValue placeholder="Select hospital" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-700 border-slate-600">
                          {hospitals.map((hospital) => (
                            <SelectItem key={hospital.id} value={String(hospital.id)}>
                              {hospital.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-slate-300">Department</Label>
                      <Input
                        value={womenDoctorDepartment}
                        onChange={(e) => setWomenDoctorDepartment(e.target.value)}
                        placeholder="Gynecology / Endocrinology / Psychiatry..."
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Condition</Label>
                      <Input
                        value={womenDoctorCondition}
                        onChange={(e) => setWomenDoctorCondition(e.target.value)}
                        placeholder="Anemia, Thyroid, PCOS, Menopause..."
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-slate-300">Your Question</Label>
                    <Textarea
                      value={womenDoctorQuestion}
                      onChange={(e) => setWomenDoctorQuestion(e.target.value)}
                      placeholder="Ask your concern in detail..."
                      className="bg-slate-700 border-slate-600 text-white min-h-[110px]"
                    />
                  </div>
                  <Button onClick={handleWomenDoctorQuery} className="bg-cyan-600 hover:bg-cyan-700">
                    Send Women Health Query
                  </Button>
                  {womenDoctorStatusMessage && (
                    <Alert className="bg-cyan-600/20 border-cyan-500">
                      <AlertDescription className="text-cyan-100">{womenDoctorStatusMessage}</AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
              </div>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Women Health Doctor Query History</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {publicDoctorQueries.filter((item) => item.question.toLowerCase().includes('[women health]')).length === 0 ? (
                    <p className="text-slate-400">No women health queries yet.</p>
                  ) : publicDoctorQueries
                    .filter((item) => item.question.toLowerCase().includes('[women health]'))
                    .map((item) => (
                      <div key={item.id} className="bg-slate-700/60 border border-slate-600 rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <p className="text-white font-semibold">{item.hospitalName}</p>
                          <Badge className={item.status === 'answered' ? 'bg-emerald-600' : 'bg-yellow-600 text-black'}>
                            {item.status.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-slate-300 text-sm">{item.department} | {item.disease}</p>
                        <p className="text-slate-200 text-sm"><span className="text-slate-400">Q:</span> {item.question}</p>
                        {item.status === 'answered' && (
                          <div className="bg-slate-800 border border-slate-600 rounded-md p-3">
                            <p className="text-emerald-300 text-sm">Dr. {item.doctorName}</p>
                            <p className="text-slate-100 text-sm mt-1">{item.answer}</p>
                          </div>
                        )}
                      </div>
                    ))}
                </CardContent>
              </Card>
            </div>
          )}

          {view === 'hospitals' && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 mb-6">
                <Button variant="outline" onClick={() => setView('home')} className="text-white border-slate-500 bg-slate-800 hover:bg-slate-700">
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  {t.back}
                </Button>
                <h2 className="text-2xl font-bold text-white">{t.findHospital}</h2>
              </div>

              <div className="space-y-4">
                {hospitals.map((hospital) => (
                  <Card key={hospital.id} className="bg-slate-800 border-slate-700">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold text-white">{hospital.name}</h3>
                            <Badge className={
                              hospital.type === 'government' ? 'bg-blue-600' :
                              hospital.type === 'private' ? 'bg-purple-600' :
                              'bg-green-600'
                            }>
                              {hospital.type}
                            </Badge>
                          </div>
                          <p className="text-slate-400 flex items-center gap-2 mb-2">
                            <MapPin className="w-4 h-4" />
                            {hospital.address}
                          </p>
                          <p className="text-slate-400 flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            {hospital.phone}
                          </p>
                          
                          <div className="flex flex-wrap gap-2 mt-3">
                            {hospital.specialties.slice(0, 3).map((spec: string, i: number) => (
                              <span key={i} className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded">
                                {spec}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-center">
                          <div className="bg-slate-700 p-3 rounded-lg">
                            <Bed className="w-5 h-5 mx-auto mb-1 text-blue-400" />
                            <p className="text-2xl font-bold text-white">{hospital.beds.available}</p>
                            <p className="text-xs text-slate-400">Beds</p>
                          </div>
                          <div className="bg-slate-700 p-3 rounded-lg">
                            <Activity className="w-5 h-5 mx-auto mb-1 text-red-400" />
                            <p className="text-2xl font-bold text-white">{hospital.icuBeds.available}</p>
                            <p className="text-xs text-slate-400">ICU</p>
                          </div>
                          <div className="bg-slate-700 p-3 rounded-lg">
                            <Wind className="w-5 h-5 mx-auto mb-1 text-green-400" />
                            <p className="text-2xl font-bold text-white">{hospital.ventilators.available}</p>
                            <p className="text-xs text-slate-400">Vent</p>
                          </div>
                          <div className="bg-slate-700 p-3 rounded-lg">
                            <Ambulance className="w-5 h-5 mx-auto mb-1 text-yellow-400" />
                            <p className="text-2xl font-bold text-white">{hospital.ambulances.available}</p>
                            <p className="text-xs text-slate-400">Amb</p>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <Badge className="bg-emerald-600">{hospital.distance}</Badge>
                          <a
                            href={`tel:${hospital.phone}`}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-center text-sm"
                          >
                            {t.callNow}
                          </a>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {view === 'bloodbank' && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 mb-6">
                <Button variant="outline" onClick={() => setView('home')} className="text-white border-slate-500 bg-slate-800 hover:bg-slate-700">
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  {t.back}
                </Button>
                <h2 className="text-2xl font-bold text-white">{t.bloodBank}</h2>
              </div>

              <div className="space-y-4">
                {hospitals.filter(h => Object.values(h.bloodBank).some((v: number) => v > 0)).map((hospital) => (
                  <Card key={hospital.id} className="bg-slate-800 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-white">{hospital.name}</CardTitle>
                      <CardDescription>{hospital.address}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-4 gap-3">
                        {Object.entries(hospital.bloodBank).map(([type, units]) => {
                          const unitCount = units as number;
                          return (
                            <div
                              key={type}
                              className={`p-3 rounded-lg text-center ${
                                unitCount > 30 ? 'bg-green-900/30 border border-green-500' :
                                unitCount > 10 ? 'bg-yellow-900/30 border border-yellow-500' :
                                'bg-red-900/30 border border-red-500'
                              }`}
                            >
                              <p className="text-lg font-bold text-white">{type}</p>
                              <p className={`text-sm ${
                                unitCount > 30 ? 'text-green-400' :
                                unitCount > 10 ? 'text-yellow-400' :
                                'text-red-400'
                              }`}>
                                {unitCount} units
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </main>

        {/* Footer with Patent */}
        <footer className="bg-slate-800/50 border-t border-slate-700 py-6 mt-12">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <p className="text-slate-500 flex items-center justify-center gap-2">
              <Copyright className="w-4 h-4" />
              {t.patentRights}
            </p>
            <p className="gov-copyright-strip">
              Copyright Holder: <span className="gov-owner-name">NAGULA SRIYAN</span>
            </p>
          </div>
        </footer>

        {/* Emergency Contacts Dialog */}
        <Dialog open={showEmergencyContacts} onOpenChange={setShowEmergencyContacts}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-2xl text-white flex items-center gap-3">
                <Phone className="w-8 h-8 text-red-500" />
                {t.emergencyContacts}
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              {emergencyContacts.map((contact, index) => (
                <a
                  key={index}
                  href={`tel:${contact.number}`}
                  className="flex items-center gap-4 p-4 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors"
                >
                  <div className={`${contact.color} p-3 rounded-full`}>
                    {contact.icon}
                  </div>
                  <div>
                    <p className="text-white font-semibold">{contact.name}</p>
                    <p className="text-2xl font-bold text-red-400">{contact.number}</p>
                  </div>
                </a>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  if (role === 'admin') {
    const publicUsersActive = new Set(
      [
        ...publicAppointments.map((item) => item.patientName.trim().toLowerCase()),
        ...publicPrescriptions.map((item) => item.patientName.trim().toLowerCase()),
        ...publicDoctorQueries.map((item) => item.patientName.trim().toLowerCase()),
        ...emergencyMedicineOrders.map((item) => item.patientName.trim().toLowerCase()),
      ].filter((name) => Boolean(name))
    ).size;
    const pharmacyOrdersPending = emergencyMedicineOrders.filter((item) => item.status === 'pending').length;
    const pharmacyOrdersAccepted = emergencyMedicineOrders.filter((item) => item.status === 'accepted').length;
    const pharmacyOrdersCompleted = emergencyMedicineOrders.filter((item) => item.status === 'completed').length;
    const activePharmacyShops = new Set(emergencyMedicineOrders.map((item) => item.pharmacyName)).size;
    const hospitalBiometricAccounts = Object.values(hospitalBiometric).filter((v) => v.fingerprint || v.face).length;
    const pharmacyBiometricAccounts = Object.values(pharmacyBiometric).filter((v) => v.fingerprint || v.face).length;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
        <nav className="bg-slate-900/70 backdrop-blur-md border-b border-slate-700 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-amber-500 p-2 rounded-full">
                <Shield className="w-6 h-6 text-black" />
              </div>
              <span className="text-xl font-bold text-white">Admin Control Center</span>
            </div>
            <Button variant="outline" onClick={handleLogout} className="bg-slate-700 text-white hover:bg-slate-600">
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back to Login
            </Button>
          </div>
        </nav>
        <main className="max-w-6xl mx-auto p-6 space-y-6">
          <div className="grid md:grid-cols-4 gap-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-5">
                <p className="text-slate-400 text-sm">Hospitals Registered</p>
                <p className="text-3xl font-bold text-white">{adminStats?.hospitalsRegistered ?? hospitals.length}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-5">
                <p className="text-slate-400 text-sm">Pharmacies Registered</p>
                <p className="text-3xl font-bold text-white">{pharmacyPortalAccounts.length}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-5">
                <p className="text-slate-400 text-sm">Active Public Users</p>
                <p className="text-3xl font-bold text-white">{publicUsersActive}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-5">
                <p className="text-slate-400 text-sm">Active Pharmacy Ops</p>
                <p className="text-3xl font-bold text-white">{adminStats?.activePharmacyOps ?? activePharmacyShops}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-5">
                <p className="text-slate-400 text-sm">Pending Hospital Appointments</p>
                <p className="text-3xl font-bold text-white">{adminStats?.pendingAppointments ?? hospitalAppointments.filter((item) => item.status === 'pending').length}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-5">
                <p className="text-slate-400 text-sm">Hospital Prescriptions Issued</p>
                <p className="text-3xl font-bold text-white">{adminStats?.prescriptionsIssued ?? hospitalPrescriptions.length}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-5">
                <p className="text-slate-400 text-sm">Doctor Query Queue</p>
                <p className="text-3xl font-bold text-white">{adminStats?.pendingDoctorQueries ?? publicDoctorQueries.filter((item) => item.status === 'pending').length}</p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Portal Governance Controls</CardTitle>
              <CardDescription>Admin has centralized enable/disable control over all citizen-facing portals.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-3 gap-3">
                {(['public', 'hospital', 'pharmacy'] as ManagedPortal[]).map((portal) => (
                  <Button
                    key={portal}
                    onClick={() => {
                      const next: PortalSettings = {
                        maintenanceMode: adminMaintenanceMode,
                        publicEnabled: portal === 'public' ? !adminPortalAccess.public : adminPortalAccess.public,
                        hospitalEnabled: portal === 'hospital' ? !adminPortalAccess.hospital : adminPortalAccess.hospital,
                        pharmacyEnabled: portal === 'pharmacy' ? !adminPortalAccess.pharmacy : adminPortalAccess.pharmacy,
                      };
                      void savePortalSettings(next);
                    }}
                    className={adminPortalAccess[portal] ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}
                  >
                    {portal.toUpperCase()} Portal: {adminPortalAccess[portal] ? 'ENABLED' : 'DISABLED'}
                  </Button>
                ))}
              </div>
              <Button
                onClick={() => {
                  const next: PortalSettings = {
                    maintenanceMode: !adminMaintenanceMode,
                    publicEnabled: adminPortalAccess.public,
                    hospitalEnabled: adminPortalAccess.hospital,
                    pharmacyEnabled: adminPortalAccess.pharmacy,
                  };
                  void savePortalSettings(next);
                }}
                className={adminMaintenanceMode ? 'bg-red-700 hover:bg-red-800' : 'bg-amber-600 hover:bg-amber-700 text-black'}
              >
                {adminMaintenanceMode ? 'Disable Global Maintenance Mode' : 'Enable Global Maintenance Mode'}
              </Button>
              {adminMaintenanceMode && (
                <Alert className="bg-red-600/20 border-red-500">
                  <AlertDescription className="text-red-200">
                    Global maintenance mode is active. Public, Hospital, and Pharmacy logins are blocked.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Hospital Registry</CardTitle>
                <CardDescription>All registered hospitals with quick profile overview.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {hospitals.map((hospital) => (
                  <div key={hospital.id} className="bg-slate-700/60 border border-slate-600 rounded-lg p-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <p className="text-white font-semibold">{hospital.name}</p>
                      <Badge className={hospital.type === 'government' ? 'bg-blue-600' : hospital.type === 'private' ? 'bg-purple-600' : 'bg-emerald-600'}>
                        {hospital.type.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-slate-400 text-xs mt-1">{hospital.address}</p>
                    <p className="text-slate-500 text-xs">{hospital.phone}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Pharmacy Registry</CardTitle>
                <CardDescription>All registered pharmacies and medical shops with operating profile.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {pharmacyPortalAccounts.map((shop) => (
                  <div key={shop.id} className="bg-slate-700/60 border border-slate-600 rounded-lg p-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <p className="text-white font-semibold">{shop.name}</p>
                      <Badge className={shop.kind === 'pharmacy' ? 'bg-teal-600' : 'bg-slate-600'}>
                        {shop.kind === 'pharmacy' ? 'PHARMACY' : 'MEDICAL SHOP'}
                      </Badge>
                    </div>
                    <p className="text-slate-400 text-xs mt-1">{shop.area} | {shop.phone}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge className={shop.open24x7 ? 'bg-emerald-600' : 'bg-slate-600'}>{shop.open24x7 ? '24x7' : 'Limited Hours'}</Badge>
                      <Badge className={shop.homeDelivery ? 'bg-cyan-600' : 'bg-slate-600'}>{shop.homeDelivery ? 'Delivery' : 'Pickup'}</Badge>
                      <Badge className={shop.licenseStatus === 'verified' ? 'bg-blue-600' : 'bg-yellow-600 text-black'}>{shop.licenseStatus.toUpperCase()}</Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Cross-Portal Usage & Access</CardTitle>
              <CardDescription>Platform activity and biometric access readiness across all portals.</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-4 gap-3">
              <div className="bg-slate-700/60 border border-slate-600 rounded-lg p-4">
                <p className="text-slate-400 text-xs">Pharmacy Orders</p>
                <p className="text-white font-semibold">
                  Pending {adminStats?.pendingPharmacyOrders ?? pharmacyOrdersPending} | Accepted {adminStats?.acceptedPharmacyOrders ?? pharmacyOrdersAccepted} | Completed {adminStats?.completedPharmacyOrders ?? pharmacyOrdersCompleted}
                </p>
              </div>
              <div className="bg-slate-700/60 border border-slate-600 rounded-lg p-4">
                <p className="text-slate-400 text-xs">Hospital Biometric Accounts</p>
                <p className="text-white font-semibold">{hospitalBiometricAccounts} hospitals enrolled</p>
              </div>
              <div className="bg-slate-700/60 border border-slate-600 rounded-lg p-4">
                <p className="text-slate-400 text-xs">Pharmacy Biometric Accounts</p>
                <p className="text-white font-semibold">{pharmacyBiometricAccounts} pharmacies enrolled</p>
              </div>
              <div className="bg-slate-700/60 border border-slate-600 rounded-lg p-4">
                <p className="text-slate-400 text-xs">Crash Incidents Logged</p>
                <p className="text-white font-semibold">{adminStats?.crashIncidentCount ?? crashIncidentLog.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <div>
                <CardTitle className="text-white">Blockchain Audit Chain</CardTitle>
                <CardDescription>Tamper-evident hashes for major portal actions (no raw medical record data stored).</CardDescription>
              </div>
              <Button
                onClick={() => {
                  void loadBlockchainRecords();
                  void verifyBlockchain();
                }}
                variant="outline"
                className="border-slate-500 text-white bg-slate-800 hover:bg-slate-700"
              >
                Refresh Chain
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-4 gap-3">
                <div className="bg-slate-700/60 border border-slate-600 rounded-lg p-4">
                  <p className="text-slate-400 text-xs">Integrity Status</p>
                  <p className={`font-semibold ${blockchainVerification?.valid ? 'text-emerald-300' : 'text-red-300'}`}>
                    {blockchainVerification?.valid ? 'Verified' : 'Needs Review'}
                  </p>
                </div>
                <div className="bg-slate-700/60 border border-slate-600 rounded-lg p-4">
                  <p className="text-slate-400 text-xs">Blocks Checked</p>
                  <p className="text-white font-semibold">{blockchainVerification?.checkedBlocks ?? 0}</p>
                </div>
                <div className="bg-slate-700/60 border border-slate-600 rounded-lg p-4">
                  <p className="text-slate-400 text-xs">Latest Block</p>
                  <p className="text-white font-semibold">#{blockchainVerification?.latestBlockNumber ?? 0}</p>
                </div>
                <div className="bg-slate-700/60 border border-slate-600 rounded-lg p-4">
                  <p className="text-slate-400 text-xs">Latest Hash</p>
                  <p className="text-slate-300 text-xs break-all">{(blockchainVerification?.latestHash || '').slice(0, 20)}...</p>
                </div>
              </div>
              {!blockchainVerification?.valid && blockchainVerification?.reason && (
                <Alert className="bg-red-600/20 border-red-500">
                  <AlertDescription className="text-red-200">
                    Chain verification failed at block {blockchainVerification.invalidBlockNumber}: {blockchainVerification.reason}
                  </AlertDescription>
                </Alert>
              )}
              <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                {blockchainRecords.length === 0 ? (
                  <p className="text-slate-400 text-sm">No blockchain audit records yet.</p>
                ) : (
                  blockchainRecords.map((record) => (
                    <div key={record.id} className="bg-slate-700/60 border border-slate-600 rounded-lg p-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <p className="text-white font-semibold">#{record.blockNumber} {record.eventType} {record.entityType}</p>
                        <Badge className="bg-cyan-700 text-white">Hash {record.hash.slice(0, 10)}...</Badge>
                      </div>
                      <p className="text-slate-300 text-xs mt-1">{record.summary}</p>
                      <p className="text-slate-500 text-[11px] mt-1">
                        entity:{record.entityId} | actor:{record.actor} | hospital:{record.hospitalId || 'N/A'} | {new Date(record.timestamp).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Portal Controls</CardTitle>
              <CardDescription>Use these shortcuts for quick portal supervision and direct access testing.</CardDescription>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-4 gap-3">
              <Button onClick={() => { setView('home'); setRole('public'); }} className="bg-blue-600 hover:bg-blue-700">Open Public Portal</Button>
              <Button onClick={() => setRole('hospital')} className="bg-emerald-600 hover:bg-emerald-700">Open Hospital Portal</Button>
              <Button onClick={() => setRole('pharmacy')} className="bg-teal-600 hover:bg-teal-700">Open Pharmacy Portal</Button>
              <Button onClick={handleLogout} variant="outline" className="border-slate-500 text-white bg-slate-800 hover:bg-slate-700">Return to Login</Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Hospital Dashboard
  if (role === 'hospital') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Navigation */}
        <nav className="bg-slate-800/50 backdrop-blur-md border-b border-slate-700 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BrandMark compact />
                <span className="text-xl font-bold text-white">{t.dashboard}</span>
              </div>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="bg-slate-700 text-white hover:bg-slate-600"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back to Login
              </Button>
            </div>
          </div>
        </nav>

        {/* Hospital Selection */}
        {!selectedHospital ? (
          <main className="max-w-4xl mx-auto px-4 py-12">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">Select Your Hospital</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {hospitals.map((hospital) => (
                <button
                  key={hospital.id}
                  onClick={() => setSelectedHospital(hospital)}
                  className="bg-slate-800 hover:bg-slate-700 border border-slate-700 p-6 rounded-xl text-left transition-colors"
                >
                  <h3 className="text-xl font-bold text-white mb-2">{hospital.name}</h3>
                  <p className="text-slate-400">{hospital.address}</p>
                  <Badge className="mt-3">
                    {hospital.type}
                  </Badge>
                </button>
              ))}
            </div>
          </main>
        ) : (
          <main className="max-w-6xl mx-auto px-4 py-8">
            {/* Hospital Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-8">
              <div>
                <h2 className="text-2xl font-bold text-white">{selectedHospital.name}</h2>
                <p className="text-slate-400">{selectedHospital.address}</p>
              </div>
              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                <Button
                  variant="outline"
                  onClick={() => setSelectedHospital(null)}
                  className="w-full md:w-auto text-white border-slate-500 bg-slate-700 hover:bg-slate-600"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Change Hospital
                </Button>
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="w-full md:w-auto text-white border-slate-500 bg-slate-700 hover:bg-slate-600"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back to Login
                </Button>
              </div>
            </div>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="bg-slate-800 border-slate-700 mb-6">
                <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600">{t.overview}</TabsTrigger>
                <TabsTrigger value="alerts" className="data-[state=active]:bg-red-600">
                  {t.emergencyAlerts}
                  {emergencyAlerts.filter(a => a.status === 'pending').length > 0 && (
                    <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {emergencyAlerts.filter(a => a.status === 'pending').length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="ambulance-requests" className="data-[state=active]:bg-orange-600">
                  Ambulance Requests
                </TabsTrigger>
                <TabsTrigger value="appointments" className="data-[state=active]:bg-cyan-600">
                  Appointments
                </TabsTrigger>
                <TabsTrigger value="prescriptions" className="data-[state=active]:bg-amber-600">
                  Prescriptions
                </TabsTrigger>
                <TabsTrigger value="reports" className="data-[state=active]:bg-indigo-600">
                  Report Referrals
                </TabsTrigger>
                <TabsTrigger value="doctor-queries" className="data-[state=active]:bg-cyan-600">
                  Doctor Queries
                </TabsTrigger>
                <TabsTrigger value="resources" className="data-[state=active]:bg-emerald-600">{t.resources}</TabsTrigger>
                <TabsTrigger value="clinical" className="data-[state=active]:bg-purple-600">Clinical</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Resource Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-6 text-center">
                      <Bed className="w-8 h-8 mx-auto mb-2 text-blue-400" />
                      <p className="text-3xl font-bold text-white">{selectedHospital.beds.available}</p>
                      <p className="text-slate-400">{t.bedsAvailable}</p>
                      <p className="text-sm text-slate-500">of {selectedHospital.beds.total}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-6 text-center">
                      <Activity className="w-8 h-8 mx-auto mb-2 text-red-400" />
                      <p className="text-3xl font-bold text-white">{selectedHospital.icuBeds.available}</p>
                      <p className="text-slate-400">{t.icuBeds}</p>
                      <p className="text-sm text-slate-500">of {selectedHospital.icuBeds.total}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-6 text-center">
                      <Wind className="w-8 h-8 mx-auto mb-2 text-green-400" />
                      <p className="text-3xl font-bold text-white">{selectedHospital.ventilators.available}</p>
                      <p className="text-slate-400">{t.ventilators}</p>
                      <p className="text-sm text-slate-500">of {selectedHospital.ventilators.total}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-6 text-center">
                      <Ambulance className="w-8 h-8 mx-auto mb-2 text-yellow-400" />
                      <p className="text-3xl font-bold text-white">{selectedHospital.ambulances.available}</p>
                      <p className="text-slate-400">{t.ambulances}</p>
                      <p className="text-sm text-slate-500">of {selectedHospital.ambulances.total}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Specialists */}
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Stethoscope className="w-5 h-5 text-blue-400" />
                      Available Specialists
                    </CardTitle>
                    <CardDescription>All specialties, doctors, shifts, and live availability for this hospital.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-[460px] overflow-y-auto space-y-3 pr-1">
                      {(selectedHospital.specialistTeam ?? []).map((entry, i) => (
                        <div key={`${entry.specialty}-${i}`} className="bg-slate-700/60 border border-slate-600 rounded-lg p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                            <p className="text-white font-semibold">{entry.specialty}</p>
                            <Badge className="bg-blue-600/30 text-blue-300 border border-blue-500">
                              {entry.doctors.length} Doctors
                            </Badge>
                          </div>
                          <p className="text-slate-400 text-xs mb-3">
                            Subspecialties: {entry.subSpecialties.join(', ')}
                          </p>
                          <div className="grid md:grid-cols-2 gap-2">
                            {entry.doctors.map((doctor, idx) => (
                              <div key={`${doctor.name}-${idx}`} className="bg-slate-800 border border-slate-600 rounded-md p-3">
                                <p className="text-slate-100 font-medium">{doctor.name}</p>
                                <p className="text-slate-400 text-xs">Shift: {doctor.shift}</p>
                                <Badge className={
                                  doctor.availability === 'Available'
                                    ? 'bg-emerald-600 mt-2'
                                    : doctor.availability === 'On Call'
                                      ? 'bg-yellow-600 text-black mt-2'
                                      : 'bg-red-600 mt-2'
                                }>
                                  {doctor.availability}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Blood Bank Status */}
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Droplet className="w-5 h-5 text-red-400" />
                      Blood Bank Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-3">
                      {Object.entries(selectedHospital.bloodBank).map(([type, units]) => {
                        const unitCount = units as number;
                        return (
                          <div
                            key={type}
                            className={`p-3 rounded-lg text-center ${
                              unitCount > 30 ? 'bg-green-900/30 border border-green-500' :
                              unitCount > 10 ? 'bg-yellow-900/30 border border-yellow-500' :
                              'bg-red-900/30 border border-red-500'
                            }`}
                          >
                            <p className="text-lg font-bold text-white">{type}</p>
                            <p className={`text-sm ${
                              unitCount > 30 ? 'text-green-400' :
                              unitCount > 10 ? 'text-yellow-400' :
                              'text-red-400'
                            }`}>
                              {unitCount} units
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Activity className="w-5 h-5 text-purple-400" />
                      Live Triage Queue
                    </CardTitle>
                    <CardDescription>Real-time board synced with emergency alerts and treatment actions.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-slate-700/60 border border-slate-600 rounded-lg p-3 text-center">
                        <p className="text-slate-400 text-xs">Waiting</p>
                        <p className="text-xl font-bold text-yellow-300">{triageBuckets.waiting.length}</p>
                      </div>
                      <div className="bg-slate-700/60 border border-slate-600 rounded-lg p-3 text-center">
                        <p className="text-slate-400 text-xs">In Treatment</p>
                        <p className="text-xl font-bold text-blue-300">{triageBuckets['in-treatment'].length}</p>
                      </div>
                      <div className="bg-slate-700/60 border border-slate-600 rounded-lg p-3 text-center">
                        <p className="text-slate-400 text-xs">Admitted</p>
                        <p className="text-xl font-bold text-emerald-300">{triageBuckets.admitted.length}</p>
                      </div>
                      <div className="bg-slate-700/60 border border-slate-600 rounded-lg p-3 text-center">
                        <p className="text-slate-400 text-xs">Discharged</p>
                        <p className="text-xl font-bold text-slate-300">{triageBuckets.discharged.length}</p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-4 gap-3">
                      {[
                        { key: 'waiting', label: 'Waiting', badgeClass: 'bg-yellow-500 text-black' },
                        { key: 'in-treatment', label: 'In Treatment', badgeClass: 'bg-blue-600' },
                        { key: 'admitted', label: 'Admitted', badgeClass: 'bg-emerald-600' },
                        { key: 'discharged', label: 'Discharged', badgeClass: 'bg-slate-600' },
                      ].map((column) => (
                        <div key={column.key} className="bg-slate-900/50 border border-slate-700 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-semibold text-white">{column.label}</p>
                            <Badge className={column.badgeClass}>
                              {triageBuckets[column.key as TriageWorkflowStatus].length}
                            </Badge>
                          </div>
                          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                            {triageBuckets[column.key as TriageWorkflowStatus].map((patient) => (
                              <div key={patient.id} className="bg-slate-700/60 border border-slate-600 rounded-md p-3">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <p className="text-white font-semibold">{patient.name}</p>
                                    <p className="text-slate-300 text-xs">{patient.condition}</p>
                                    <p className="text-slate-400 text-xs">{patient.vitals}</p>
                                  </div>
                                  <Badge className={getPriorityBadgeClass(patient.priority)}>
                                    {patient.priority.toUpperCase()}
                                  </Badge>
                                </div>
                                {patient.status === 'waiting' && (
                                  <p className="text-red-300 text-xs mt-2">Decision timer: {patient.remainingSeconds}s</p>
                                )}
                                <div className="flex gap-2 mt-3 flex-wrap">
                                  {patient.status === 'waiting' && (
                                    <>
                                      <Button size="sm" onClick={() => updateTriageStatus(patient.id, 'in-treatment')} className="bg-blue-600 hover:bg-blue-700">
                                        Start
                                      </Button>
                                      <Button size="sm" onClick={() => updateTriageStatus(patient.id, 'admitted')} className="bg-emerald-600 hover:bg-emerald-700">
                                        Admit
                                      </Button>
                                      <Button size="sm" variant="outline" onClick={() => updateTriageStatus(patient.id, 'discharged')} className="border-red-400 text-red-200">
                                        Reject
                                      </Button>
                                    </>
                                  )}
                                  {patient.status === 'in-treatment' && (
                                    <>
                                      <Button size="sm" onClick={() => updateTriageStatus(patient.id, 'admitted')} className="bg-emerald-600 hover:bg-emerald-700">
                                        Admit
                                      </Button>
                                      <Button size="sm" onClick={() => updateTriageStatus(patient.id, 'discharged')} className="bg-slate-600 hover:bg-slate-500 text-white">
                                        Discharge
                                      </Button>
                                    </>
                                  )}
                                  {patient.status === 'admitted' && (
                                    <Button size="sm" onClick={() => updateTriageStatus(patient.id, 'discharged')} className="bg-slate-600 hover:bg-slate-500 text-white">
                                      Discharge
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                            {triageBuckets[column.key as TriageWorkflowStatus].length === 0 && (
                              <p className="text-slate-500 text-xs">No patients in this stage.</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="alerts" className="space-y-4">
                {emergencyAlerts.map((alert) => (
                  <Card key={alert.id} className={`border-l-4 ${
                    alert.severity === 'critical' ? 'border-l-red-500 bg-red-900/10' :
                    alert.severity === 'moderate' ? 'border-l-yellow-500 bg-yellow-900/10' :
                    'border-l-green-500 bg-green-900/10'
                  } bg-slate-800 border-slate-700`}>
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold text-white">{alert.patient}</h3>
                            <Badge className={getSeverityColor(alert.severity)}>
                              {alert.severity.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-slate-400 flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {getAlertAgeLabel(alert.createdAtMs)}
                          </p>
                          <p className={`text-sm mt-1 ${alert.status === 'pending' ? 'text-red-300' : 'text-slate-400'}`}>
                            {alert.status === 'pending'
                              ? `Decision timer: ${alert.remainingSeconds}s (auto-repeats every 60s)`
                              : 'Decision completed'}
                          </p>
                        </div>
                        
                        {alert.status === 'pending' ? (
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleAcceptAlert(alert.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              {t.accept}
                            </Button>
                            <Button
                              onClick={() => handleRejectAlert(alert.id)}
                              variant="outline"
                              className="border-red-500 text-red-400 hover:bg-red-600 hover:text-white"
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              {t.reject}
                            </Button>
                          </div>
                        ) : (
                          <Badge className={alert.status === 'accepted' ? 'bg-green-600' : 'bg-red-600'}>
                            {alert.status.toUpperCase()}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="ambulance-requests" className="space-y-4">
                {emergencyAlerts.filter((alert) => alert.severity === 'critical').length === 0 ? (
                  <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-6 text-slate-400">
                      No ambulance requests for this hospital yet.
                    </CardContent>
                  </Card>
                ) : emergencyAlerts.filter((alert) => alert.severity === 'critical').map((alert) => (
                  <Card key={alert.id} className="border-l-4 border-l-orange-500 bg-slate-800 border-slate-700">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold text-white">{alert.patient}</h3>
                            <Badge className="bg-orange-600">AMBULANCE</Badge>
                          </div>
                          <p className="text-slate-400 flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {getAlertAgeLabel(alert.createdAtMs)}
                          </p>
                          <p className={`text-sm mt-1 ${alert.status === 'pending' ? 'text-orange-300' : 'text-slate-400'}`}>
                            {alert.status === 'pending'
                              ? `Dispatch pending: ${alert.remainingSeconds}s`
                              : `Dispatch ${alert.status}`}
                          </p>
                        </div>
                        {alert.status === 'pending' ? (
                          <div className="flex gap-2">
                            <Button onClick={() => handleAcceptAlert(alert.id)} className="bg-emerald-600 hover:bg-emerald-700">
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Dispatch
                            </Button>
                            <Button
                              onClick={() => handleRejectAlert(alert.id)}
                              variant="outline"
                              className="border-red-500 text-red-300 hover:bg-red-600 hover:text-white"
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Decline
                            </Button>
                          </div>
                        ) : (
                          <Badge className={alert.status === 'accepted' ? 'bg-emerald-600' : 'bg-slate-600'}>
                            {alert.status.toUpperCase()}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="appointments" className="space-y-4">
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Incoming Public Appointments</CardTitle>
                    <CardDescription>Bookings from Public Portal appear here automatically.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {hospitalAppointments.length === 0 ? (
                      <p className="text-slate-400">No appointments queued for this hospital.</p>
                    ) : hospitalAppointments.map((item) => (
                      <div key={item.id} className="bg-slate-700/60 border border-slate-600 rounded-lg p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-white font-semibold">{item.patientName}</p>
                            <p className="text-slate-300 text-sm">{item.appointmentAt}</p>
                            <p className="text-slate-400 text-sm">{item.reason}</p>
                            <p className="text-slate-500 text-xs">{item.contactNumber}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={
                              item.status === 'accepted'
                                ? 'bg-emerald-600'
                                : item.status === 'rejected'
                                  ? 'bg-red-600'
                                  : item.status === 'completed'
                                    ? 'bg-blue-600'
                                    : 'bg-yellow-600 text-black'
                            }>
                              {item.status.toUpperCase()}
                            </Badge>
                            <Button size="sm" onClick={() => updateAppointmentStatus(item.id, 'accepted')} className="bg-emerald-600 hover:bg-emerald-700">
                              Accept
                            </Button>
                            <Button size="sm" onClick={() => updateAppointmentStatus(item.id, 'completed')} className="bg-blue-600 hover:bg-blue-700">
                              Complete
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => updateAppointmentStatus(item.id, 'rejected')} className="border-red-400 text-red-200">
                              Reject
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="prescriptions" className="space-y-6">
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Create Prescription</CardTitle>
                    <CardDescription>Send medicines and advice directly to patient Public Portal.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid md:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-slate-300">Patient Username</Label>
                        <Input
                          value={prescriptionPatientName}
                          onChange={(e) => setPrescriptionPatientName(e.target.value)}
                          placeholder="patient username"
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-slate-300">Doctor Name</Label>
                        <Input
                          value={prescriptionDoctorName}
                          onChange={(e) => setPrescriptionDoctorName(e.target.value)}
                          placeholder="Dr. Name"
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-slate-300">Medicines</Label>
                      <Textarea
                        value={prescriptionMedicines}
                        onChange={(e) => setPrescriptionMedicines(e.target.value)}
                        placeholder="Paracetamol 500mg twice daily..."
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Advice</Label>
                      <Textarea
                        value={prescriptionAdvice}
                        onChange={(e) => setPrescriptionAdvice(e.target.value)}
                        placeholder="Hydration, rest, follow-up after 3 days..."
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <Button onClick={handleCreatePrescription} className="bg-amber-600 hover:bg-amber-700 text-black font-semibold">
                      Send Prescription to Public Portal
                    </Button>
                    {prescriptionStatusMessage && (
                      <Alert className="bg-amber-600/20 border-amber-500">
                        <AlertDescription className="text-amber-100">{prescriptionStatusMessage}</AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Recent Prescriptions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {hospitalPrescriptions.length === 0 ? (
                      <p className="text-slate-400">No prescriptions issued yet.</p>
                    ) : hospitalPrescriptions.map((item) => (
                      <div key={item.id} className="bg-slate-700/60 border border-slate-600 rounded-lg p-4">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <p className="text-white font-semibold">{item.patientName}</p>
                          <p className="text-xs text-slate-400">{item.createdAt}</p>
                        </div>
                        <p className="text-slate-300 text-sm">Doctor: {item.doctorName}</p>
                        <p className="text-slate-200 text-sm mt-1"><span className="text-slate-400">Medicines:</span> {item.medicines || 'N/A'}</p>
                        <p className="text-slate-200 text-sm"><span className="text-slate-400">Advice:</span> {item.advice || 'N/A'}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reports" className="space-y-4">
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Incoming Report Analysis Referrals</CardTitle>
                    <CardDescription>AI-analyzed scan/test summaries sent from Public Portal.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {hospitalReportReferrals.length === 0 ? (
                      <p className="text-slate-400">No report referrals received yet.</p>
                    ) : hospitalReportReferrals.map((item) => (
                      <div key={item.id} className="bg-slate-700/60 border border-slate-600 rounded-lg p-4 space-y-3">
                        {(() => {
                          const preview = getReportPreviewImage(item);
                          return (
                            <div className="grid lg:grid-cols-[240px_1fr] gap-4">
                              <div className="bg-slate-900 border border-slate-600 rounded-lg p-2">
                                <img
                                  src={preview.image}
                                  alt={`${preview.label} report preview`}
                                  className="w-full h-36 object-cover rounded-md"
                                />
                                <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
                                  <span>Live Report Preview</span>
                                  <span>{preview.label}</span>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                  <p className="text-white font-semibold">{item.patientName}</p>
                                  <div className="flex items-center gap-2">
                                    <Badge className="bg-slate-600">{preview.label}</Badge>
                                    <Badge className={
                                      item.severity === 'urgent'
                                        ? 'bg-red-600'
                                        : item.severity === 'attention'
                                          ? 'bg-yellow-600 text-black'
                                          : 'bg-emerald-600'
                                    }>
                                      {item.severity.toUpperCase()}
                                    </Badge>
                                  </div>
                                </div>
                                <p className="text-slate-200 text-sm">{item.summary}</p>
                                <p className="text-slate-300 text-sm"><span className="text-slate-400">Likely cause:</span> {item.cause}</p>
                                <p className="text-slate-400 text-xs">Specialty: {item.doctorSpecialty} | Received: {item.createdAt}</p>
                                <p className="text-slate-500 text-xs">Excerpt: {item.reportExcerpt}</p>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="doctor-queries" className="space-y-4">
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Disease Questions from Public Portal</CardTitle>
                    <CardDescription>Answer queries from patients by department and condition.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {hospitalDoctorQueries.length === 0 ? (
                      <p className="text-slate-400">No doctor queries received yet.</p>
                    ) : hospitalDoctorQueries.map((item) => (
                      <div key={item.id} className="bg-slate-700/60 border border-slate-600 rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <p className="text-white font-semibold">{item.patientName}</p>
                          <Badge className={item.status === 'answered' ? 'bg-emerald-600' : 'bg-yellow-600 text-black'}>
                            {item.status.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-slate-300 text-sm">{item.department} | {item.disease}</p>
                        <p className="text-slate-100 text-sm">{item.question}</p>
                        {item.status === 'answered' ? (
                          <div className="bg-slate-800 border border-slate-600 rounded-md p-3">
                            <p className="text-emerald-300 text-sm">Dr. {item.doctorName}</p>
                            <p className="text-slate-100 text-sm mt-1">{item.answer}</p>
                            {item.answeredAt && <p className="text-slate-500 text-xs mt-1">{item.answeredAt}</p>}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Input
                              value={doctorResponseByQuery[item.id]?.doctorName ?? ''}
                              onChange={(e) =>
                                setDoctorResponseByQuery((prev) => ({
                                  ...prev,
                                  [item.id]: {
                                    doctorName: e.target.value,
                                    answer: prev[item.id]?.answer ?? '',
                                  },
                                }))
                              }
                              placeholder="Doctor name"
                              className="bg-slate-800 border-slate-600 text-white"
                            />
                            <Textarea
                              value={doctorResponseByQuery[item.id]?.answer ?? ''}
                              onChange={(e) =>
                                setDoctorResponseByQuery((prev) => ({
                                  ...prev,
                                  [item.id]: {
                                    doctorName: prev[item.id]?.doctorName ?? '',
                                    answer: e.target.value,
                                  },
                                }))
                              }
                              placeholder="Write clinical response for patient..."
                              className="bg-slate-800 border-slate-600 text-white min-h-[90px]"
                            />
                            <Button onClick={() => handleAnswerDoctorQuery(item.id)} className="bg-cyan-600 hover:bg-cyan-700">
                              Send Doctor Response
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="resources" className="space-y-6">
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">{t.updateStatus}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { label: 'General Beds', key: 'beds', max: selectedHospital.beds.total },
                      { label: 'ICU Beds', key: 'icuBeds', max: selectedHospital.icuBeds.total },
                      { label: 'Ventilators', key: 'ventilators', max: selectedHospital.ventilators.total },
                      { label: 'Ambulances', key: 'ambulances', max: selectedHospital.ambulances.total },
                    ].map((resource) => (
                      <div key={resource.key} className="flex items-center justify-between">
                        <Label className="text-slate-300">{resource.label}</Label>
                        <div className="flex items-center gap-4">
                          <Input
                            type="number"
                            defaultValue={
                              resource.key === 'beds' ? selectedHospital.beds.available :
                              resource.key === 'icuBeds' ? selectedHospital.icuBeds.available :
                              resource.key === 'ventilators' ? selectedHospital.ventilators.available :
                              selectedHospital.ambulances.available
                            }
                            className="w-24 bg-slate-700 border-slate-600 text-white"
                            min={0}
                            max={resource.max}
                          />
                          <span className="text-slate-400">/ {resource.max}</span>
                        </div>
                      </div>
                    ))}
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                      {t.save}
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Shield className="w-5 h-5 text-cyan-400" />
                      Medication & Critical Supply Monitor
                    </CardTitle>
                    <CardDescription>Track essential inventory and prevent stock-outs during emergencies.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {medicationStock.map((item) => (
                      <div key={item.id} className="bg-slate-700/60 border border-slate-600 rounded-lg p-4 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-white font-semibold">{item.name}</p>
                          <p className={`text-sm ${item.available <= item.reorderLevel ? 'text-red-400' : 'text-emerald-400'}`}>
                            {item.available} {item.unit} available
                          </p>
                          <p className="text-xs text-slate-400">Reorder below {item.reorderLevel} {item.unit}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => adjustMedication(item.id, -1)} className="border-slate-500 text-white bg-slate-800 hover:bg-slate-700">
                            Use 1
                          </Button>
                          <Button size="sm" onClick={() => adjustMedication(item.id, 5)} className="bg-blue-600 hover:bg-blue-700">
                            Restock +5
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="clinical" className="space-y-6">
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Clinical Protocol Assistant</CardTitle>
                    <CardDescription>Standard emergency care checklist for rapid coordination.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      'Airway, breathing, circulation stabilization',
                      'Immediate bleeding control and trauma survey',
                      'Critical labs and imaging requisition',
                      'Allergy and chronic condition review before medication',
                      'Consult specialist based on triage severity',
                    ].map((step) => (
                      <div key={step} className="bg-slate-700/60 border border-slate-600 rounded-lg p-3 text-slate-200">
                        {step}
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Discharge / Handover Notes</CardTitle>
                    <CardDescription>Capture concise clinical notes for the next care team.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Textarea
                      value={dischargeNote}
                      onChange={(e) => {
                        setDischargeNote(e.target.value);
                        setClinicalSaved(false);
                      }}
                      placeholder="Add treatment summary, medications given, follow-up instructions..."
                      className="bg-slate-700 border-slate-600 text-white min-h-[130px]"
                    />
                    <Button onClick={() => setClinicalSaved(true)} className="bg-emerald-600 hover:bg-emerald-700">
                      Save Clinical Notes
                    </Button>
                    {clinicalSaved && (
                      <Alert className="bg-emerald-600/20 border-emerald-500">
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        <AlertDescription className="text-emerald-300">Clinical notes saved successfully.</AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </main>
        )}

        {/* Footer with Patent */}
        <footer className="bg-slate-800/50 border-t border-slate-700 py-6 mt-12">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <p className="text-slate-500 flex items-center justify-center gap-2">
              <Copyright className="w-4 h-4" />
              {t.patentRights}
            </p>
            <p className="gov-copyright-strip">
              Copyright Holder: <span className="gov-owner-name">NAGULA SRIYAN</span>
            </p>
          </div>
        </footer>
      </div>
    );
  }

  if (role === 'pharmacy') {
    const pharmacyOrders = selectedPharmacyPortal
      ? emergencyMedicineOrders.filter((item) => item.pharmacyName === selectedPharmacyPortal.name)
      : [];
    const pendingOrders = pharmacyOrders.filter((item) => item.status === 'pending');
    const acceptedOrders = pharmacyOrders.filter((item) => item.status === 'accepted');
    const completedOrders = pharmacyOrders.filter((item) => item.status === 'completed');
    const rejectedOrders = pharmacyOrders.filter((item) => item.status === 'rejected');
    const openOrders = pendingOrders.length + acceptedOrders.length;
    const criticalTimerOrders = pharmacyOrders.filter(
      (item) => (item.status === 'pending' || item.status === 'accepted') && item.remainingSeconds <= 300
    ).length;
    const lowStockItems = pharmacyInventory.filter((item) => item.stock <= item.minStock).length;
    const watchStockItems = pharmacyInventory.filter((item) => item.stock > item.minStock && item.stock <= item.minStock + 10).length;
    const totalProcessedOrders = completedOrders.length + rejectedOrders.length;
    const fulfillmentRate = totalProcessedOrders > 0
      ? Math.round((completedOrders.length / totalProcessedOrders) * 100)
      : 0;
    const filteredCatalog = MEDICINE_CATALOG
      .filter((item) =>
        item.name.toLowerCase().includes(medicineSearchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(medicineSearchTerm.toLowerCase())
      )
      .sort((a, b) => a.name.localeCompare(b.name));
    const hyderabadNetwork = pharmacyPortalAccounts
      .filter((item) =>
        item.name.toLowerCase().includes(pharmacySearchTerm.toLowerCase()) ||
        item.area.toLowerCase().includes(pharmacySearchTerm.toLowerCase())
      )
      .sort((a, b) => a.area.localeCompare(b.area));
    const activeRecalls = recallItems.filter((item) => item.status === 'active');
    const resolvedRecalls = recallItems.filter((item) => item.status === 'resolved');
    const highPriorityIssues = publicIssues.filter((item) => item.priority === 'high' && item.status !== 'resolved').length;
    const topDemandMedicines = MEDICINE_DEMAND_TRENDS
      .map((item) => ({
        ...item,
        weeklyTotal: item.weeklyDemand.reduce((sum, value) => sum + value, 0),
      }))
      .sort((a, b) => b.weeklyTotal - a.weeklyTotal);

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900">
        <nav className="bg-slate-800/50 backdrop-blur-md border-b border-slate-700 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BrandMark compact />
                <span className="text-xl font-bold text-white">Pharmacy Dashboard</span>
              </div>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="bg-slate-700 text-white hover:bg-slate-600"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back to Login
              </Button>
            </div>
          </div>
        </nav>

        {!selectedPharmacyPortal ? (
          <main className="max-w-4xl mx-auto px-4 py-12">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">Select Your Pharmacy</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {pharmacyPortalAccounts.map((pharmacy) => (
                <button
                  key={pharmacy.id}
                  onClick={() => setSelectedPharmacyPortal(pharmacy)}
                  className="bg-slate-800 hover:bg-slate-700 border border-slate-700 p-6 rounded-xl text-left transition-colors"
                >
                  <h3 className="text-xl font-bold text-white mb-2">{pharmacy.name}</h3>
                  <p className="text-slate-400">{pharmacy.area}</p>
                  <p className="text-slate-500 text-xs mt-1">{pharmacy.phone}</p>
                  <Badge className="mt-3 bg-teal-600">Emergency Medicine Desk</Badge>
                </button>
              ))}
            </div>
          </main>
        ) : (
          <main className="max-w-6xl mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-8">
              <div>
                <h2 className="text-2xl font-bold text-white">{selectedPharmacyPortal.name}</h2>
                <p className="text-slate-400">{selectedPharmacyPortal.area} | {selectedPharmacyPortal.phone}</p>
              </div>
              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                <Button
                  variant="outline"
                  onClick={() => setSelectedPharmacyPortal(null)}
                  className="w-full md:w-auto text-white border-slate-500 bg-slate-700 hover:bg-slate-600"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Change Pharmacy
                </Button>
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="w-full md:w-auto text-white border-slate-500 bg-slate-700 hover:bg-slate-600"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back to Login
                </Button>
              </div>
            </div>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="bg-slate-800 border-slate-700 mb-6">
                <TabsTrigger value="overview" className="data-[state=active]:bg-teal-600">Overview</TabsTrigger>
                <TabsTrigger value="orders" className="data-[state=active]:bg-red-600">
                  Emergency Orders
                  {pendingOrders.length > 0 && (
                    <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {pendingOrders.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="inventory" className="data-[state=active]:bg-emerald-600">Inventory</TabsTrigger>
                <TabsTrigger value="network" className="data-[state=active]:bg-cyan-600">Pharmacy Network</TabsTrigger>
                <TabsTrigger value="analytics" className="data-[state=active]:bg-violet-600">Analytics</TabsTrigger>
                <TabsTrigger value="compliance" className="data-[state=active]:bg-rose-600">Compliance</TabsTrigger>
                <TabsTrigger value="issues" className="data-[state=active]:bg-amber-600">Public Issues</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-6 text-center">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-400" />
                      <p className="text-3xl font-bold text-white">{pendingOrders.length}</p>
                      <p className="text-slate-400">Pending</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-6 text-center">
                      <Clock className="w-8 h-8 mx-auto mb-2 text-yellow-300" />
                      <p className="text-3xl font-bold text-white">{acceptedOrders.length}</p>
                      <p className="text-slate-400">Accepted</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-6 text-center">
                      <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
                      <p className="text-3xl font-bold text-white">{completedOrders.length}</p>
                      <p className="text-slate-400">Completed</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-6 text-center">
                      <Pill className="w-8 h-8 mx-auto mb-2 text-cyan-300" />
                      <p className="text-3xl font-bold text-white">{pharmacyInventory.reduce((sum, item) => sum + item.stock, 0)}</p>
                      <p className="text-slate-400">Total Stock Units</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <Card className="bg-slate-800 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-white">Operational Snapshot</CardTitle>
                      <CardDescription>Live workload and service pressure for this pharmacy.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-700/60 border border-slate-600 rounded-lg p-3">
                          <p className="text-xs text-slate-400">Open Orders</p>
                          <p className="text-xl font-bold text-cyan-300">{openOrders}</p>
                        </div>
                        <div className="bg-slate-700/60 border border-slate-600 rounded-lg p-3">
                          <p className="text-xs text-slate-400">Critical Timers (&lt;5m)</p>
                          <p className="text-xl font-bold text-red-300">{criticalTimerOrders}</p>
                        </div>
                        <div className="bg-slate-700/60 border border-slate-600 rounded-lg p-3">
                          <p className="text-xs text-slate-400">Rejected Orders</p>
                          <p className="text-xl font-bold text-rose-300">{rejectedOrders.length}</p>
                        </div>
                        <div className="bg-slate-700/60 border border-slate-600 rounded-lg p-3">
                          <p className="text-xs text-slate-400">Fulfillment Rate</p>
                          <p className="text-xl font-bold text-emerald-300">{fulfillmentRate}%</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge className={selectedPharmacyPortal.open24x7 ? 'bg-emerald-600' : 'bg-slate-600'}>
                          {selectedPharmacyPortal.open24x7 ? '24x7 Active' : 'Limited Hours'}
                        </Badge>
                        <Badge className={selectedPharmacyPortal.homeDelivery ? 'bg-cyan-600' : 'bg-slate-600'}>
                          {selectedPharmacyPortal.homeDelivery ? 'Home Delivery Enabled' : 'Pickup Only'}
                        </Badge>
                        <Badge className="bg-blue-600">
                          Avg Delivery {selectedPharmacyPortal.avgDeliveryMins} min
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-800 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-white">Stock & Compliance Health</CardTitle>
                      <CardDescription>Risk indicators and network support availability.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-700/60 border border-slate-600 rounded-lg p-3">
                          <p className="text-xs text-slate-400">Low Stock Items</p>
                          <p className="text-xl font-bold text-red-300">{lowStockItems}</p>
                        </div>
                        <div className="bg-slate-700/60 border border-slate-600 rounded-lg p-3">
                          <p className="text-xs text-slate-400">Watch List Items</p>
                          <p className="text-xl font-bold text-yellow-300">{watchStockItems}</p>
                        </div>
                        <div className="bg-slate-700/60 border border-slate-600 rounded-lg p-3">
                          <p className="text-xs text-slate-400">Active Recall Alerts</p>
                          <p className="text-xl font-bold text-rose-300">{activeRecalls.length}</p>
                        </div>
                        <div className="bg-slate-700/60 border border-slate-600 rounded-lg p-3">
                          <p className="text-xs text-slate-400">High Priority Public Issues</p>
                          <p className="text-xl font-bold text-amber-300">{highPriorityIssues}</p>
                        </div>
                      </div>
                      <p className="text-slate-300 text-sm">
                        Backup network available in {hyderabadNetwork.length} nearby shops across Hyderabad.
                        Resolved recall notices: <span className="text-emerald-300 font-semibold">{resolvedRecalls.length}</span>.
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Latest Emergency Orders</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {pharmacyOrders.length === 0 ? (
                      <p className="text-slate-400">No orders assigned to this pharmacy yet.</p>
                    ) : pharmacyOrders.slice(0, 5).map((order) => (
                      <div key={order.id} className="bg-slate-700/60 border border-slate-600 rounded-lg p-4">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <p className="text-white font-semibold">{order.medicine} ({order.quantity})</p>
                          <Badge className={
                            order.status === 'completed'
                              ? 'bg-emerald-600'
                              : order.status === 'accepted'
                                ? 'bg-yellow-500 text-black'
                                : order.status === 'rejected'
                                  ? 'bg-red-600'
                                  : 'bg-cyan-600'
                          }>
                            {order.status.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-slate-300 text-sm mt-1">{order.patientName} {order.patientPhone ? `| ${order.patientPhone}` : ''}</p>
                        <p className="text-slate-500 text-xs mt-1">{order.createdAt}</p>
                        {(order.status === 'pending' || order.status === 'accepted') && (
                          <p className={`text-xs mt-1 ${order.remainingSeconds <= 300 ? 'text-red-300' : 'text-cyan-300'}`}>
                            Timer: {formatOrderTimer(order.remainingSeconds)}
                          </p>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Common Public Pharmacy Problems - Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="grid md:grid-cols-2 gap-3">
                    {[
                      'Stock-out escalation to nearest verified shop',
                      'Substitute medicine guidance when unavailable',
                      '24x7 pharmacy route for night emergencies',
                      'Critical medicine low-stock alerting',
                    ].map((item) => (
                      <div key={item} className="bg-slate-700/60 border border-slate-600 rounded-lg p-3 text-slate-200 text-sm">
                        {item}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="orders" className="space-y-4">
                {pharmacyOrders.length === 0 ? (
                  <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-6 text-slate-400">
                      No emergency medicine orders for this pharmacy.
                    </CardContent>
                  </Card>
                ) : pharmacyOrders.map((order) => (
                  <Card key={order.id} className="bg-slate-800 border-slate-700">
                    <CardContent className="p-6 space-y-3">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div>
                          <p className="text-white font-semibold text-lg">{order.medicine} ({order.quantity})</p>
                          <p className="text-slate-300 text-sm">
                            Patient: {order.patientName} {order.patientPhone ? `| ${order.patientPhone}` : ''}
                          </p>
                          <p className="text-slate-500 text-xs">{order.createdAt}</p>
                        </div>
                        <Badge className={
                          order.status === 'completed'
                            ? 'bg-emerald-600'
                            : order.status === 'accepted'
                              ? 'bg-yellow-500 text-black'
                              : order.status === 'rejected'
                                ? 'bg-red-600'
                                : 'bg-cyan-600'
                        }>
                          {order.status.toUpperCase()}
                        </Badge>
                      </div>
                      {order.notes && (
                        <p className="text-slate-200 text-sm">
                          <span className="text-slate-400">Notes:</span> {order.notes}
                        </p>
                      )}
                      <p className="text-slate-400 text-xs">Delivery location: {order.locationLabel}</p>
                      {(order.status === 'pending' || order.status === 'accepted') && (
                        <p className={`text-xs ${order.remainingSeconds <= 300 ? 'text-red-300' : 'text-cyan-300'}`}>
                          Remaining Timer: {formatOrderTimer(order.remainingSeconds)}
                        </p>
                      )}
                      <div className="flex gap-2 flex-wrap">
                        <Button size="sm" onClick={() => updateEmergencyMedicineOrderStatus(order.id, 'accepted')} className="bg-emerald-600 hover:bg-emerald-700">
                          Accept
                        </Button>
                        <Button size="sm" onClick={() => updateEmergencyMedicineOrderStatus(order.id, 'completed')} className="bg-blue-600 hover:bg-blue-700">
                          Mark Completed
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => updateEmergencyMedicineOrderStatus(order.id, 'rejected')} className="border-red-400 text-red-200">
                          Reject
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="inventory" className="space-y-4">
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Critical Medicine Inventory</CardTitle>
                    <CardDescription>Track stock and quickly adjust consumption/restock actions.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-slate-300">Search Medicines</Label>
                      <Input
                        value={medicineSearchTerm}
                        onChange={(e) => setMedicineSearchTerm(e.target.value)}
                        placeholder="Search by medicine or category..."
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    {pharmacyInventory.map((item) => (
                      <div key={item.id} className="bg-slate-700/60 border border-slate-600 rounded-lg p-4 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-white font-semibold">{item.name}</p>
                          <p className={`text-sm ${item.stock <= item.minStock ? 'text-red-400' : 'text-emerald-400'}`}>
                            {item.stock} {item.unit} in stock
                          </p>
                          <p className="text-xs text-slate-400">Minimum level {item.minStock} {item.unit}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => adjustPharmacyInventory(item.id, -1)} className="border-slate-500 text-white bg-slate-800 hover:bg-slate-700">
                            Use 1
                          </Button>
                          <Button size="sm" onClick={() => adjustPharmacyInventory(item.id, 10)} className="bg-blue-600 hover:bg-blue-700">
                            Restock +10
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Ordered Medicine Master List</CardTitle>
                    <CardDescription>All medicines listed in alphabetical order with OTC and substitute hints.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {filteredCatalog.map((medicine) => {
                      const selectedAvailability = selectedPharmacyPortal
                        ? getNetworkAvailability(selectedPharmacyPortal.id, medicine.id)
                        : 'In Stock';
                      const substitutes = getSubstituteMedicines(medicine.name);
                      return (
                        <div key={medicine.id} className="bg-slate-700/60 border border-slate-600 rounded-lg p-4 space-y-2">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <p className="text-white font-semibold">{medicine.name}</p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className="bg-slate-600">{medicine.category}</Badge>
                              <Badge className={medicine.otc ? 'bg-emerald-600' : 'bg-yellow-600 text-black'}>
                                {medicine.otc ? 'OTC' : 'Prescription'}
                              </Badge>
                              <Badge className={
                                selectedAvailability === 'In Stock'
                                  ? 'bg-emerald-600'
                                  : selectedAvailability === 'Limited'
                                    ? 'bg-yellow-600 text-black'
                                    : 'bg-red-600'
                              }>
                                {selectedAvailability}
                              </Badge>
                            </div>
                          </div>
                          {selectedAvailability === 'Out of Stock' && substitutes.length > 0 && (
                            <p className="text-cyan-200 text-xs">
                              Suggested alternatives: {substitutes.join(', ')}
                            </p>
                          )}
                        </div>
                      );
                    })}
                    {filteredCatalog.length === 0 && (
                      <p className="text-slate-400">No medicine matched the search query.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="network" className="space-y-4">
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Hyderabad Pharmacy & Medical Shop Network</CardTitle>
                    <CardDescription>Find alternate shops quickly when public-facing issues occur.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-slate-300">Search Shops / Area</Label>
                      <Input
                        value={pharmacySearchTerm}
                        onChange={(e) => setPharmacySearchTerm(e.target.value)}
                        placeholder="Search Hyderabad area or shop name..."
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    {hyderabadNetwork.map((shop) => (
                      <div key={shop.id} className="bg-slate-700/60 border border-slate-600 rounded-lg p-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                          <div>
                            <p className="text-white font-semibold">{shop.name}</p>
                            <p className="text-slate-300 text-sm">{shop.area} | {shop.phone}</p>
                            <p className="text-slate-400 text-xs">
                              {shop.kind === 'pharmacy' ? 'Pharmacy Chain' : 'Medical Shop'} | Avg Delivery {shop.avgDeliveryMins} min
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={shop.open24x7 ? 'bg-emerald-600' : 'bg-slate-600'}>
                              {shop.open24x7 ? '24x7 Open' : 'Limited Hours'}
                            </Badge>
                            <Badge className={shop.homeDelivery ? 'bg-cyan-600' : 'bg-slate-600'}>
                              {shop.homeDelivery ? 'Home Delivery' : 'Pickup Only'}
                            </Badge>
                            <Badge className={shop.licenseStatus === 'verified' ? 'bg-blue-600' : 'bg-yellow-600 text-black'}>
                              {shop.licenseStatus === 'verified' ? 'License Verified' : 'License Pending'}
                            </Badge>
                            <Badge className="bg-amber-600 text-black">{shop.rating.toFixed(1)}★</Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                    {hyderabadNetwork.length === 0 && (
                      <p className="text-slate-400">No pharmacy or medical shop found for this search.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-4">
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Demand Intelligence Dataset</CardTitle>
                    <CardDescription>7-day trend dataset to predict public medicine demand and prevent stock-outs.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {topDemandMedicines.map((item) => (
                      <div key={item.medicine} className="bg-slate-700/60 border border-slate-600 rounded-lg p-4">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <p className="text-white font-semibold">{item.medicine}</p>
                          <Badge className="bg-violet-600">{item.weeklyTotal} units / week</Badge>
                        </div>
                        <p className="text-slate-400 text-xs mt-1">
                          Daily: {item.weeklyDemand.join(' | ')}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Hyderabad Zone Delivery SLA</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {HYDERABAD_ZONE_SLA.map((zone) => (
                      <div key={zone.zone} className="bg-slate-700/60 border border-slate-600 rounded-lg p-4 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-white font-semibold">{zone.zone}</p>
                          <p className="text-slate-400 text-xs">Delayed orders this week: {zone.delayedCount}</p>
                        </div>
                        <Badge className={zone.avgMinutes <= 25 ? 'bg-emerald-600' : zone.avgMinutes <= 32 ? 'bg-yellow-600 text-black' : 'bg-red-600'}>
                          {zone.avgMinutes} min avg
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="compliance" className="space-y-4">
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Drug Recall & Compliance Dataset</CardTitle>
                    <CardDescription>Centralized recall alerts to protect public from unsafe batches.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {recallItems.map((recall) => (
                      <div key={recall.id} className="bg-slate-700/60 border border-slate-600 rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <p className="text-white font-semibold">{recall.medicine} | Batch {recall.batch}</p>
                          <div className="flex items-center gap-2">
                            <Badge className={recall.severity === 'critical' ? 'bg-red-600' : 'bg-yellow-600 text-black'}>
                              {recall.severity.toUpperCase()}
                            </Badge>
                            <Badge className={recall.status === 'active' ? 'bg-cyan-600' : 'bg-emerald-600'}>
                              {recall.status.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-slate-300 text-sm">{recall.reason}</p>
                        {recall.status === 'active' && (
                          <Button size="sm" onClick={() => resolveRecall(recall.id)} className="bg-emerald-600 hover:bg-emerald-700">
                            Mark Recall Resolved
                          </Button>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Inter-Pharmacy Stock Transfer</CardTitle>
                    <CardDescription>Route medicines from surplus stores to shortage zones quickly.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid md:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-slate-300">From Pharmacy</Label>
                        <Select value={transferFromPharmacyId} onValueChange={setTransferFromPharmacyId}>
                          <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                            <SelectValue placeholder="Select source pharmacy" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-700 border-slate-600">
                            {pharmacyPortalAccounts.map((item) => (
                              <SelectItem key={item.id} value={String(item.id)}>{item.name} - {item.area}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-slate-300">To Pharmacy</Label>
                        <Select value={transferToPharmacyId} onValueChange={setTransferToPharmacyId}>
                          <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                            <SelectValue placeholder="Select destination pharmacy" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-700 border-slate-600">
                            {pharmacyPortalAccounts.map((item) => (
                              <SelectItem key={item.id} value={String(item.id)}>{item.name} - {item.area}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-slate-300">Medicine</Label>
                        <Input
                          value={transferMedicine}
                          onChange={(e) => setTransferMedicine(e.target.value)}
                          placeholder="Enter medicine name"
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-slate-300">Quantity</Label>
                        <Input
                          type="number"
                          min={1}
                          value={transferQuantity}
                          onChange={(e) => setTransferQuantity(e.target.value)}
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                      </div>
                    </div>
                    <Button onClick={handleStockTransfer} className="bg-rose-600 hover:bg-rose-700">
                      Initiate Transfer
                    </Button>
                    {transferStatusMessage && (
                      <Alert className="bg-rose-600/20 border-rose-500">
                        <AlertDescription className="text-rose-100">{transferStatusMessage}</AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="issues" className="space-y-4">
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Public Problem Intake</CardTitle>
                    <CardDescription>Track common pharmacy-related problems and resolve them from one dashboard.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid md:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-slate-300">Issue Title</Label>
                        <Input
                          value={issueTitle}
                          onChange={(e) => setIssueTitle(e.target.value)}
                          placeholder="Stock-out, delayed delivery, prescription mismatch..."
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-slate-300">Issue Detail</Label>
                        <Input
                          value={issueDetail}
                          onChange={(e) => setIssueDetail(e.target.value)}
                          placeholder="Add area and problem summary..."
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                      </div>
                    </div>
                    <Button onClick={createPublicIssue} className="bg-amber-600 hover:bg-amber-700 text-black">
                      Log Public Issue
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Issue Tracker</CardTitle>
                    <CardDescription>
                      Active recalls: {activeRecalls.length} | Resolved recalls: {resolvedRecalls.length} | High priority open issues: {highPriorityIssues}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {publicIssues.map((issue) => (
                      <div key={issue.id} className="bg-slate-700/60 border border-slate-600 rounded-lg p-4 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-white font-semibold">{issue.title}</p>
                          <div className="flex items-center gap-2">
                            <Badge className={
                              issue.priority === 'high'
                                ? 'bg-red-600'
                                : issue.priority === 'medium'
                                  ? 'bg-yellow-600 text-black'
                                  : 'bg-emerald-600'
                            }>
                              {issue.priority.toUpperCase()}
                            </Badge>
                            <Badge className={
                              issue.status === 'resolved'
                                ? 'bg-emerald-600'
                                : issue.status === 'in-progress'
                                  ? 'bg-blue-600'
                                  : 'bg-slate-600'
                            }>
                              {issue.status.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-slate-300 text-sm">{issue.detail}</p>
                        <p className="text-slate-500 text-xs">{issue.createdAt}</p>
                        <div className="flex gap-2 flex-wrap">
                          <Button size="sm" onClick={() => updatePublicIssueStatus(issue.id, 'in-progress')} className="bg-blue-600 hover:bg-blue-700">
                            Mark In Progress
                          </Button>
                          <Button size="sm" onClick={() => updatePublicIssueStatus(issue.id, 'resolved')} className="bg-emerald-600 hover:bg-emerald-700">
                            Resolve
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </main>
        )}

        <footer className="bg-slate-800/50 border-t border-slate-700 py-6 mt-12">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <p className="text-slate-500 flex items-center justify-center gap-2">
              <Copyright className="w-4 h-4" />
              {t.patentRights}
            </p>
            <p className="gov-copyright-strip">
              Copyright Holder: <span className="gov-owner-name">NAGULA SRIYAN</span>
            </p>
          </div>
        </footer>
      </div>
    );
  }

  return null;
}

export default App;



