export interface Hospital {
  id: number;
  name: string;
  type: 'government' | 'private' | 'charitable';
  address: string;
  phone: string;
  primaryNumber?: string;
  emergencyNumber?: string;
  distance: string;
  beds: { total: number; available: number; };
  icuBeds: { total: number; available: number; };
  ventilators: { total: number; available: number; };
  ambulances: { total: number; available: number; };
  bloodBank: {
    'A+': number; 'A-': number; 'B+': number; 'B-': number;
    'AB+': number; 'AB-': number; 'O+': number; 'O-': number;
  };
  specialties: string[];
  specialistTeam?: SpecialistTeamEntry[];
  traumaLevel: number;
  coordinates: { lat: number; lng: number; };
}

export interface SpecialistDoctor {
  name: string;
  shift: string;
  availability: 'Available' | 'On Call' | 'Busy';
}

export interface SpecialistTeamEntry {
  specialty: string;
  subSpecialties: string[];
  doctors: SpecialistDoctor[];
}

export const hospitals: Hospital[] = [
  {
    id: 1,
    name: "Government General Hospital",
    type: "government",
    address: "Koti, Hyderabad",
    phone: "040-24600140",
    distance: "2.5 km",
    beds: { total: 1000, available: 150 },
    icuBeds: { total: 100, available: 25 },
    ventilators: { total: 50, available: 15 },
    ambulances: { total: 20, available: 8 },
    bloodBank: { 'A+': 50, 'A-': 20, 'B+': 45, 'B-': 18, 'AB+': 15, 'AB-': 8, 'O+': 60, 'O-': 25 },
    specialties: ["Emergency Medicine", "Trauma Surgery", "Cardiology", "Neurology"],
    traumaLevel: 1,
    coordinates: { lat: 17.385, lng: 78.4867 }
  },
  {
    id: 2,
    name: "Osmania General Hospital",
    type: "government",
    address: "Afzal Gunj, Hyderabad",
    phone: "040-24600141",
    distance: "3.2 km",
    beds: { total: 1200, available: 200 },
    icuBeds: { total: 120, available: 30 },
    ventilators: { total: 60, available: 20 },
    ambulances: { total: 25, available: 10 },
    bloodBank: { 'A+': 60, 'A-': 25, 'B+': 55, 'B-': 22, 'AB+': 20, 'AB-': 10, 'O+': 70, 'O-': 30 },
    specialties: ["Emergency Medicine", "General Surgery", "Orthopedics", "Pediatrics"],
    traumaLevel: 1,
    coordinates: { lat: 17.375, lng: 78.4767 }
  },
  {
    id: 3,
    name: "NIMS Hospital",
    type: "government",
    address: "Punjagutta, Hyderabad",
    phone: "040-23489000",
    distance: "4.1 km",
    beds: { total: 800, available: 120 },
    icuBeds: { total: 80, available: 20 },
    ventilators: { total: 40, available: 12 },
    ambulances: { total: 15, available: 6 },
    bloodBank: { 'A+': 40, 'A-': 15, 'B+': 35, 'B-': 14, 'AB+': 12, 'AB-': 6, 'O+': 50, 'O-': 20 },
    specialties: ["Neurology", "Neurosurgery", "Emergency Medicine", "Radiology"],
    traumaLevel: 1,
    coordinates: { lat: 17.415, lng: 78.4567 }
  },
  {
    id: 4,
    name: "Gandhi Hospital",
    type: "government",
    address: "Secunderabad",
    phone: "040-27505566",
    distance: "5.8 km",
    beds: { total: 900, available: 180 },
    icuBeds: { total: 90, available: 22 },
    ventilators: { total: 45, available: 14 },
    ambulances: { total: 18, available: 7 },
    bloodBank: { 'A+': 45, 'A-': 18, 'B+': 40, 'B-': 16, 'AB+': 14, 'AB-': 7, 'O+': 55, 'O-': 22 },
    specialties: ["Cardiology", "Cardiac Surgery", "Emergency Medicine", "Pulmonology"],
    traumaLevel: 2,
    coordinates: { lat: 17.445, lng: 78.5067 }
  },
  {
    id: 5,
    name: "Apollo Health City",
    type: "private",
    address: "Jubilee Hills, Hyderabad",
    phone: "040-23607777",
    primaryNumber: "040-23607777",
    emergencyNumber: "1066",
    distance: "6.2 km",
    beds: { total: 600, available: 80 },
    icuBeds: { total: 100, available: 30 },
    ventilators: { total: 50, available: 18 },
    ambulances: { total: 30, available: 15 },
    bloodBank: { 'A+': 80, 'A-': 30, 'B+': 75, 'B-': 28, 'AB+': 25, 'AB-': 12, 'O+': 90, 'O-': 35 },
    specialties: ["Multi-Specialty", "Cardiology", "Oncology", "Organ Transplant"],
    traumaLevel: 1,
    coordinates: { lat: 17.425, lng: 78.4167 }
  },
  {
    id: 6,
    name: "Care Hospitals",
    type: "private",
    address: "Banjara Hills / HITEC City, Hyderabad",
    phone: "040-61656565",
    primaryNumber: "040-61656565",
    emergencyNumber: "040-61656566",
    distance: "4.5 km",
    beds: { total: 450, available: 60 },
    icuBeds: { total: 70, available: 20 },
    ventilators: { total: 35, available: 12 },
    ambulances: { total: 20, available: 10 },
    bloodBank: { 'A+': 60, 'A-': 22, 'B+': 55, 'B-': 20, 'AB+': 18, 'AB-': 9, 'O+': 70, 'O-': 28 },
    specialties: ["Cardiology", "Neurology", "Orthopedics", "Gastroenterology"],
    traumaLevel: 2,
    coordinates: { lat: 17.405, lng: 78.4367 }
  },
  {
    id: 7,
    name: "Yashoda Hospitals",
    type: "private",
    address: "Secunderabad / Somajiguda / Malakpet, Hyderabad",
    phone: "+91 40 4567 4567",
    primaryNumber: "+91 40 4567 4567",
    emergencyNumber: "040-45674567",
    distance: "3.8 km",
    beds: { total: 500, available: 90 },
    icuBeds: { total: 75, available: 25 },
    ventilators: { total: 40, available: 15 },
    ambulances: { total: 22, available: 12 },
    bloodBank: { 'A+': 55, 'A-': 20, 'B+': 50, 'B-': 18, 'AB+': 16, 'AB-': 8, 'O+': 65, 'O-': 25 },
    specialties: ["Oncology", "Cardiology", "Nephrology", "Urology"],
    traumaLevel: 2,
    coordinates: { lat: 17.395, lng: 78.4667 }
  },
  {
    id: 8,
    name: "KIMS Hospitals",
    type: "private",
    address: "Secunderabad / Kondapur, Hyderabad",
    phone: "+91 40 4488 5000",
    primaryNumber: "+91 40 4488 5000",
    emergencyNumber: "040-44123456",
    distance: "5.5 km",
    beds: { total: 400, available: 70 },
    icuBeds: { total: 60, available: 18 },
    ventilators: { total: 30, available: 10 },
    ambulances: { total: 16, available: 8 },
    bloodBank: { 'A+': 45, 'A-': 18, 'B+': 42, 'B-': 16, 'AB+': 14, 'AB-': 7, 'O+': 55, 'O-': 22 },
    specialties: ["Multi-Specialty", "Orthopedics", "Gynecology", "Pediatrics"],
    traumaLevel: 2,
    coordinates: { lat: 17.435, lng: 78.4967 }
  },
  {
    id: 9,
    name: "Continental Hospitals",
    type: "private",
    address: "Gachibowli, Hyderabad",
    phone: "040-67000000",
    primaryNumber: "040-67000000",
    emergencyNumber: "040-67000100",
    distance: "12.5 km",
    beds: { total: 350, available: 50 },
    icuBeds: { total: 50, available: 15 },
    ventilators: { total: 25, available: 8 },
    ambulances: { total: 14, available: 6 },
    bloodBank: { 'A+': 40, 'A-': 15, 'B+': 38, 'B-': 14, 'AB+': 12, 'AB-': 6, 'O+': 48, 'O-': 20 },
    specialties: ["Cardiology", "Neurology", "Pulmonology", "Critical Care"],
    traumaLevel: 2,
    coordinates: { lat: 17.445, lng: 78.3567 }
  },
  {
    id: 10,
    name: "Sri Sai Hospital",
    type: "charitable",
    address: "Dilsukhnagar, Hyderabad",
    phone: "040-24060011",
    distance: "7.8 km",
    beds: { total: 200, available: 45 },
    icuBeds: { total: 30, available: 10 },
    ventilators: { total: 15, available: 5 },
    ambulances: { total: 8, available: 4 },
    bloodBank: { 'A+': 25, 'A-': 10, 'B+': 22, 'B-': 9, 'AB+': 8, 'AB-': 4, 'O+': 30, 'O-': 12 },
    specialties: ["General Medicine", "Emergency Care", "Maternity", "Pediatrics"],
    traumaLevel: 3,
    coordinates: { lat: 17.365, lng: 78.5267 }
  },
  {
    id: 11,
    name: "Gleneagles Global Hospitals",
    type: "private",
    address: "Lakdikapul / LB Nagar, Hyderabad",
    phone: "040-23491000",
    primaryNumber: "040-23491000",
    emergencyNumber: "040-23491066",
    distance: "4.9 km",
    beds: { total: 650, available: 92 },
    icuBeds: { total: 95, available: 24 },
    ventilators: { total: 48, available: 15 },
    ambulances: { total: 22, available: 9 },
    bloodBank: { 'A+': 62, 'A-': 24, 'B+': 56, 'B-': 21, 'AB+': 18, 'AB-': 9, 'O+': 74, 'O-': 30 },
    specialties: ["Liver Transplant", "Organ Transplant", "Critical Care", "Oncology"],
    traumaLevel: 1,
    coordinates: { lat: 17.401, lng: 78.4578 }
  },
  {
    id: 12,
    name: "AIG Hospitals",
    type: "private",
    address: "Gachibowli, Hyderabad",
    phone: "040-42444222",
    primaryNumber: "040-42444222",
    emergencyNumber: "040-42444444",
    distance: "11.8 km",
    beds: { total: 500, available: 76 },
    icuBeds: { total: 80, available: 22 },
    ventilators: { total: 40, available: 13 },
    ambulances: { total: 18, available: 7 },
    bloodBank: { 'A+': 54, 'A-': 20, 'B+': 49, 'B-': 18, 'AB+': 15, 'AB-': 8, 'O+': 65, 'O-': 26 },
    specialties: ["Gastroenterology", "Hepatology", "GI Surgery", "Advanced Endoscopy"],
    traumaLevel: 2,
    coordinates: { lat: 17.4237, lng: 78.3388 }
  },
  {
    id: 13,
    name: "Aster Prime Hospital",
    type: "private",
    address: "Ameerpet, Hyderabad",
    phone: "040-49594959",
    primaryNumber: "040-49594959",
    emergencyNumber: "040-49594911",
    distance: "5.2 km",
    beds: { total: 300, available: 58 },
    icuBeds: { total: 45, available: 12 },
    ventilators: { total: 22, available: 8 },
    ambulances: { total: 12, available: 5 },
    bloodBank: { 'A+': 38, 'A-': 14, 'B+': 35, 'B-': 13, 'AB+': 11, 'AB-': 5, 'O+': 46, 'O-': 18 },
    specialties: ["Cardiology", "Orthopedics", "Nephrology", "General Surgery"],
    traumaLevel: 2,
    coordinates: { lat: 17.4375, lng: 78.4484 }
  },
  {
    id: 14,
    name: "Sunshine Hospitals",
    type: "private",
    address: "Secunderabad / Gachibowli, Hyderabad",
    phone: "040-44550000",
    primaryNumber: "040-44550000",
    emergencyNumber: "040-44550055",
    distance: "6.1 km",
    beds: { total: 420, available: 68 },
    icuBeds: { total: 65, available: 18 },
    ventilators: { total: 30, available: 10 },
    ambulances: { total: 15, available: 6 },
    bloodBank: { 'A+': 44, 'A-': 16, 'B+': 40, 'B-': 15, 'AB+': 13, 'AB-': 6, 'O+': 54, 'O-': 21 },
    specialties: ["Orthopedics", "Joint Replacement", "Trauma Care", "Rehabilitation"],
    traumaLevel: 2,
    coordinates: { lat: 17.459, lng: 78.5035 }
  },
  {
    id: 15,
    name: "Star Hospitals",
    type: "private",
    address: "Banjara Hills / Nanakramguda, Hyderabad",
    phone: "040-44777777",
    primaryNumber: "040-44777777",
    emergencyNumber: "040-44777700",
    distance: "5.4 km",
    beds: { total: 320, available: 52 },
    icuBeds: { total: 48, available: 14 },
    ventilators: { total: 24, available: 8 },
    ambulances: { total: 11, available: 4 },
    bloodBank: { 'A+': 36, 'A-': 13, 'B+': 33, 'B-': 12, 'AB+': 10, 'AB-': 5, 'O+': 42, 'O-': 17 },
    specialties: ["Cardiology", "Pediatrics", "Emergency Medicine", "Internal Medicine"],
    traumaLevel: 2,
    coordinates: { lat: 17.4161, lng: 78.4364 }
  },
  {
    id: 16,
    name: "Medicover Hospitals",
    type: "private",
    address: "Hitech City / Secunderabad, Hyderabad",
    phone: "040-68334455",
    primaryNumber: "040-68334455",
    emergencyNumber: "040-68334488",
    distance: "10.4 km",
    beds: { total: 500, available: 84 },
    icuBeds: { total: 72, available: 19 },
    ventilators: { total: 36, available: 12 },
    ambulances: { total: 17, available: 7 },
    bloodBank: { 'A+': 50, 'A-': 19, 'B+': 46, 'B-': 17, 'AB+': 14, 'AB-': 7, 'O+': 62, 'O-': 24 },
    specialties: ["Cardiac Sciences", "Neurology", "Oncology", "Critical Care"],
    traumaLevel: 2,
    coordinates: { lat: 17.4505, lng: 78.3818 }
  },
  {
    id: 17,
    name: "Virinchi Hospitals",
    type: "private",
    address: "Banjara Hills, Hyderabad",
    phone: "040-46999999",
    primaryNumber: "040-46999999",
    emergencyNumber: "040-46999911",
    distance: "5.7 km",
    beds: { total: 360, available: 59 },
    icuBeds: { total: 52, available: 15 },
    ventilators: { total: 26, available: 9 },
    ambulances: { total: 12, available: 5 },
    bloodBank: { 'A+': 39, 'A-': 14, 'B+': 36, 'B-': 13, 'AB+': 11, 'AB-': 5, 'O+': 48, 'O-': 19 },
    specialties: ["Multi-Specialty", "Neurosciences", "Cardiology", "Pulmonology"],
    traumaLevel: 2,
    coordinates: { lat: 17.4207, lng: 78.4382 }
  },
  {
    id: 18,
    name: "Citizens Hospital",
    type: "private",
    address: "Nallagandla, Hyderabad",
    phone: "040-67191919",
    primaryNumber: "040-67191919",
    emergencyNumber: "040-67191900",
    distance: "13.2 km",
    beds: { total: 350, available: 63 },
    icuBeds: { total: 50, available: 16 },
    ventilators: { total: 25, available: 8 },
    ambulances: { total: 12, available: 5 },
    bloodBank: { 'A+': 37, 'A-': 14, 'B+': 34, 'B-': 12, 'AB+': 10, 'AB-': 5, 'O+': 45, 'O-': 18 },
    specialties: ["Internal Medicine", "Cardiology", "Nephrology", "General Surgery"],
    traumaLevel: 2,
    coordinates: { lat: 17.4727, lng: 78.3227 }
  },
  {
    id: 19,
    name: "Kamineni Hospitals",
    type: "private",
    address: "LB Nagar / King Koti, Hyderabad",
    phone: "040-24022222",
    primaryNumber: "040-24022222",
    emergencyNumber: "040-39879999",
    distance: "9.1 km",
    beds: { total: 450, available: 72 },
    icuBeds: { total: 65, available: 18 },
    ventilators: { total: 32, available: 10 },
    ambulances: { total: 16, available: 7 },
    bloodBank: { 'A+': 46, 'A-': 17, 'B+': 42, 'B-': 16, 'AB+': 13, 'AB-': 6, 'O+': 57, 'O-': 22 },
    specialties: ["Cardiology", "Cardiac Surgery", "Orthopedics", "Emergency Care"],
    traumaLevel: 2,
    coordinates: { lat: 17.3457, lng: 78.5562 }
  },
  {
    id: 20,
    name: "Olive Hospitals",
    type: "private",
    address: "Mehdipatnam, Hyderabad",
    phone: "040-44447777",
    primaryNumber: "040-44447777",
    emergencyNumber: "040-44447788",
    distance: "6.8 km",
    beds: { total: 280, available: 49 },
    icuBeds: { total: 40, available: 11 },
    ventilators: { total: 20, available: 7 },
    ambulances: { total: 10, available: 4 },
    bloodBank: { 'A+': 30, 'A-': 11, 'B+': 28, 'B-': 10, 'AB+': 9, 'AB-': 4, 'O+': 38, 'O-': 15 },
    specialties: ["Trauma Care", "General Medicine", "General Surgery", "Critical Care"],
    traumaLevel: 2,
    coordinates: { lat: 17.3956, lng: 78.4312 }
  },
  {
    id: 21,
    name: "Fernandez Hospital",
    type: "private",
    address: "Hyderguda / Bogulkunta, Hyderabad",
    phone: "040-40222397",
    primaryNumber: "040-40222397",
    emergencyNumber: "040-40632499",
    distance: "3.9 km",
    beds: { total: 250, available: 44 },
    icuBeds: { total: 35, available: 10 },
    ventilators: { total: 16, available: 5 },
    ambulances: { total: 8, available: 3 },
    bloodBank: { 'A+': 22, 'A-': 8, 'B+': 20, 'B-': 7, 'AB+': 6, 'AB-': 3, 'O+': 28, 'O-': 10 },
    specialties: ["Mother & Child Care", "Obstetrics", "Neonatology", "Pediatrics"],
    traumaLevel: 3,
    coordinates: { lat: 17.4029, lng: 78.4858 }
  },
  {
    id: 22,
    name: "Srikara Hospitals",
    type: "private",
    address: "Madinaguda / Secunderabad, Hyderabad",
    phone: "040-46464646",
    primaryNumber: "040-46464646",
    emergencyNumber: "040-46464611",
    distance: "14.1 km",
    beds: { total: 260, available: 47 },
    icuBeds: { total: 34, available: 9 },
    ventilators: { total: 18, available: 6 },
    ambulances: { total: 9, available: 4 },
    bloodBank: { 'A+': 27, 'A-': 10, 'B+': 24, 'B-': 9, 'AB+': 7, 'AB-': 3, 'O+': 34, 'O-': 13 },
    specialties: ["Orthopedics", "Spine Surgery", "Joint Replacement", "Sports Medicine"],
    traumaLevel: 2,
    coordinates: { lat: 17.493, lng: 78.3523 }
  },
  {
    id: 23,
    name: "Usha Mullapudi Cardiac Centre",
    type: "private",
    address: "Jeedimetla, Hyderabad",
    phone: "040-23090609",
    primaryNumber: "040-23090609",
    emergencyNumber: "040-23090609",
    distance: "15.7 km",
    beds: { total: 220, available: 38 },
    icuBeds: { total: 40, available: 12 },
    ventilators: { total: 20, available: 7 },
    ambulances: { total: 8, available: 3 },
    bloodBank: { 'A+': 24, 'A-': 9, 'B+': 21, 'B-': 8, 'AB+': 7, 'AB-': 3, 'O+': 31, 'O-': 12 },
    specialties: ["Cardiology", "Cardiac Surgery", "Interventional Cardiology", "Critical Care"],
    traumaLevel: 2,
    coordinates: { lat: 17.5152, lng: 78.4758 }
  },
  {
    id: 24,
    name: "Ozone Hospitals",
    type: "private",
    address: "Kothapet, Hyderabad",
    phone: "040-44556677",
    primaryNumber: "040-44556677",
    emergencyNumber: "040-44556688",
    distance: "8.4 km",
    beds: { total: 300, available: 53 },
    icuBeds: { total: 44, available: 12 },
    ventilators: { total: 22, available: 7 },
    ambulances: { total: 11, available: 4 },
    bloodBank: { 'A+': 32, 'A-': 12, 'B+': 29, 'B-': 11, 'AB+': 9, 'AB-': 4, 'O+': 40, 'O-': 16 },
    specialties: ["Multi-Specialty", "Emergency Medicine", "Orthopedics", "Cardiology"],
    traumaLevel: 2,
    coordinates: { lat: 17.3686, lng: 78.5467 }
  },
  {
    id: 25,
    name: "Malla Reddy Narayana Multispeciality Hospital",
    type: "private",
    address: "Suraram, Hyderabad",
    phone: "040-22152215",
    primaryNumber: "040-22152215",
    emergencyNumber: "040-22152211",
    distance: "17.3 km",
    beds: { total: 380, available: 66 },
    icuBeds: { total: 56, available: 16 },
    ventilators: { total: 27, available: 9 },
    ambulances: { total: 13, available: 5 },
    bloodBank: { 'A+': 41, 'A-': 15, 'B+': 37, 'B-': 14, 'AB+': 12, 'AB-': 6, 'O+': 51, 'O-': 20 },
    specialties: ["Tertiary Care", "General Medicine", "Cardiology", "Neurology"],
    traumaLevel: 2,
    coordinates: { lat: 17.5422, lng: 78.4386 }
  }
];

const SPECIALIST_CATALOG: Array<{ specialty: string; subSpecialties: string[] }> = [
  { specialty: 'General Internal Medicine (Internist)', subSpecialties: ['Complex diagnostics', 'Chronic care management'] },
  { specialty: 'Cardiology', subSpecialties: ['Interventional Cardiology', 'Heart Failure & Transplant', 'Electrophysiology', 'Adult Congenital Heart Disease'] },
  { specialty: 'Gastroenterology', subSpecialties: ['Hepatology (Liver)', 'Transplant Hepatology'] },
  { specialty: 'Endocrinology', subSpecialties: ['Diabetes & Metabolism', 'Reproductive Endocrinology'] },
  { specialty: 'Pulmonology', subSpecialties: ['Critical Care Medicine', 'Sleep Medicine', 'Interventional Pulmonology'] },
  { specialty: 'Oncology', subSpecialties: ['Medical Oncology', 'Hematology-Oncology', 'Gynecologic Oncology'] },
  { specialty: 'Nephrology', subSpecialties: ['Dialysis', 'Hypertension', 'Kidney Transplant'] },
  { specialty: 'Infectious Disease', subSpecialties: ['HIV/AIDS', 'Travel Medicine', 'Transplant Infectious Disease'] },
  { specialty: 'Rheumatology', subSpecialties: ['Autoimmune Diseases', 'Metabolic Bone Disease'] },
  { specialty: 'Geriatric Medicine', subSpecialties: ['Hospice and Palliative Medicine'] },
  { specialty: 'General Surgery', subSpecialties: ['Surgical Critical Care', 'Trauma Surgery', 'Breast Surgery', 'Bariatric Surgery'] },
  { specialty: 'Orthopedic Surgery', subSpecialties: ['Hand Surgery', 'Sports Medicine', 'Spine Surgery', 'Joint Replacement', 'Pediatric Orthopedics'] },
  { specialty: 'Neurological Surgery', subSpecialties: ['Neurocritical Care', 'Endovascular Surgical Neuroradiology', 'Skull-base Surgery'] },
  { specialty: 'Cardiothoracic Surgery', subSpecialties: ['Cardiac Surgery', 'Thoracic Surgery', 'Congenital Heart Surgery'] },
  { specialty: 'Plastic Surgery', subSpecialties: ['Craniofacial Surgery', 'Microsurgery', 'Burn Surgery', 'Aesthetic Surgery'] },
  { specialty: 'Urology', subSpecialties: ['Pediatric Urology', 'Urologic Oncology', 'Female Pelvic Medicine'] },
  { specialty: 'Ophthalmology', subSpecialties: ['Glaucoma', 'Cornea', 'Vitreoretinal Surgery', 'Ocular Oncology'] },
  { specialty: 'Otolaryngology (ENT)', subSpecialties: ['Head & Neck Oncology', 'Otology/Neurotology', 'Rhinology', 'Laryngology'] },
  { specialty: 'General Pediatrics', subSpecialties: ['Adolescent Medicine', 'Preventive Child Care'] },
  { specialty: 'Neonatal-Perinatal Medicine', subSpecialties: ['Premature newborn care', 'NICU critical support'] },
  { specialty: 'Pediatric Subspecialties', subSpecialties: ['Pediatric Cardiology', 'Pediatric Nephrology', 'Pediatric Pulmonology'] },
  { specialty: 'Pediatric Emergency & Critical Care', subSpecialties: ['Pediatric Emergency Medicine', 'Pediatric Critical Care'] },
  { specialty: 'Developmental-Behavioral Pediatrics', subSpecialties: ['Autism', 'ADHD', 'Learning disabilities'] },
  { specialty: 'Radiology & Diagnostics', subSpecialties: ['Diagnostic Radiology', 'Interventional Radiology', 'Nuclear Medicine'] },
  { specialty: 'Pathology', subSpecialties: ['Anatomical Pathology', 'Clinical Pathology', 'Forensic Pathology', 'Dermatopathology', 'Neuropathology'] },
  { specialty: 'Anesthesiology', subSpecialties: ['Pain Medicine', 'Pediatric Anesthesia', 'Obstetric Anesthesia'] },
  { specialty: 'Dermatology', subSpecialties: ['Mohs Surgery', 'Pediatric Dermatology'] },
  { specialty: 'Emergency Medicine', subSpecialties: ['Medical Toxicology', 'Sports Medicine', 'EMS/Disaster Medicine'] },
  { specialty: 'Psychiatry', subSpecialties: ['Child & Adolescent Psychiatry', 'Addiction Psychiatry', 'Forensic Psychiatry', 'Geriatric Psychiatry'] },
  { specialty: 'Physical Medicine & Rehabilitation', subSpecialties: ['Spinal Cord Injury', 'Brain Injury', 'Sports Rehabilitation'] },
  { specialty: 'Obstetrics & Gynecology (OB/GYN)', subSpecialties: ['Maternal-Fetal Medicine', 'Urogynecology'] },
  { specialty: 'Preventive Medicine', subSpecialties: ['Aerospace Medicine', 'Occupational Medicine', 'Public Health'] },
];

const DOCTOR_FIRST_NAMES = [
  'Aarav', 'Ishaan', 'Vihaan', 'Aditya', 'Rohan', 'Kiran', 'Meera', 'Aanya', 'Sana', 'Nisha',
  'Ritika', 'Priya', 'Siddharth', 'Harsha', 'Ananya', 'Rahul', 'Neha', 'Arjun', 'Pooja', 'Kavya',
];

const DOCTOR_LAST_NAMES = [
  'Reddy', 'Sharma', 'Iyer', 'Kapoor', 'Menon', 'Patel', 'Varma', 'Nair', 'Khanna', 'Rao',
  'Gupta', 'Malhotra', 'Krishnan', 'Desai', 'Chowdhury', 'Joshi', 'Saxena', 'Bhat', 'Agarwal', 'Mishra',
];

const SHIFT_WINDOWS = ['06:00-14:00', '14:00-22:00', '22:00-06:00'];
const AVAILABILITY_STATES: Array<'Available' | 'On Call' | 'Busy'> = ['Available', 'On Call', 'Busy'];

const createDoctor = (hospitalId: number, departmentIdx: number, doctorIdx: number): SpecialistDoctor => {
  const firstName = DOCTOR_FIRST_NAMES[(hospitalId + departmentIdx + doctorIdx * 3) % DOCTOR_FIRST_NAMES.length];
  const lastName = DOCTOR_LAST_NAMES[(hospitalId * 2 + departmentIdx + doctorIdx * 5) % DOCTOR_LAST_NAMES.length];
  return {
    name: `Dr. ${firstName} ${lastName}`,
    shift: SHIFT_WINDOWS[(hospitalId + departmentIdx + doctorIdx) % SHIFT_WINDOWS.length],
    availability: AVAILABILITY_STATES[(hospitalId + departmentIdx + doctorIdx * 2) % AVAILABILITY_STATES.length],
  };
};

const createSpecialistTeam = (hospitalId: number): SpecialistTeamEntry[] => {
  return SPECIALIST_CATALOG.map((entry, idx) => ({
    specialty: entry.specialty,
    subSpecialties: entry.subSpecialties,
    doctors: [
      createDoctor(hospitalId, idx, 0),
      createDoctor(hospitalId, idx, 1),
    ],
  }));
};

hospitals.forEach((hospital) => {
  hospital.specialties = SPECIALIST_CATALOG.map((entry) => entry.specialty);
  hospital.specialistTeam = createSpecialistTeam(hospital.id);
});

export const getHospitalById = (id: number): Hospital | undefined => {
  return hospitals.find(h => h.id === id);
};

export const getHospitalsByType = (type: Hospital['type']): Hospital[] => {
  return hospitals.filter(h => h.type === type);
};

export const getAvailableBeds = (): number => {
  return hospitals.reduce((acc, h) => acc + h.beds.available, 0);
};
