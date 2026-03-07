import { createHash } from 'node:crypto';

const mapAlertRow = (row) => ({
  id: Number(row.id),
  hospitalId: Number(row.hospital_id),
  patient: String(row.patient),
  severity: String(row.severity),
  status: String(row.status),
  remainingSeconds: Number(row.remaining_seconds),
  createdAtMs: Number(row.created_at_ms),
});

const mapReferralRow = (row) => ({
  id: Number(row.id),
  hospitalId: Number(row.hospital_id),
  hospitalName: String(row.hospital_name),
  patientName: String(row.patient_name),
  doctorSpecialty: String(row.doctor_specialty),
  severity: String(row.severity),
  cause: String(row.cause),
  summary: String(row.summary),
  source: String(row.source),
  reportExcerpt: String(row.report_excerpt),
  createdAt: new Date(row.created_at).toLocaleString(),
});

const mapAppointmentRow = (row) => ({
  id: Number(row.id),
  hospitalId: Number(row.hospital_id),
  hospitalName: String(row.hospital_name),
  patientName: String(row.patient_name),
  contactNumber: String(row.contact_number),
  reason: String(row.reason),
  appointmentAt: String(row.appointment_at),
  status: String(row.status),
  createdAt: new Date(row.created_at).toLocaleString(),
});

const mapPrescriptionRow = (row) => ({
  id: Number(row.id),
  hospitalId: Number(row.hospital_id),
  hospitalName: String(row.hospital_name),
  patientName: String(row.patient_name),
  doctorName: String(row.doctor_name),
  medicines: String(row.medicines),
  advice: String(row.advice),
  createdAt: new Date(row.created_at).toLocaleString(),
});

const mapDoctorQueryRow = (row) => ({
  id: Number(row.id),
  hospitalId: Number(row.hospital_id),
  hospitalName: String(row.hospital_name),
  patientName: String(row.patient_name),
  department: String(row.department),
  disease: String(row.disease),
  question: String(row.question),
  status: String(row.status),
  doctorName: String(row.doctor_name || ''),
  answer: String(row.answer || ''),
  createdAt: new Date(row.created_at).toLocaleString(),
  answeredAt: row.answered_at ? new Date(row.answered_at).toLocaleString() : '',
});

const mapPharmacyOrderRow = (row) => ({
  id: Number(row.id),
  pharmacyName: String(row.pharmacy_name),
  patientName: String(row.patient_name),
  patientPhone: String(row.patient_phone),
  medicine: String(row.medicine),
  quantity: Number(row.quantity),
  notes: String(row.notes || ''),
  locationLabel: String(row.location_label || ''),
  status: String(row.status),
  remainingSeconds: Number(row.remaining_seconds),
  createdAt: new Date(row.created_at).toLocaleString(),
});

const mapCrashIncidentRow = (row) => ({
  id: Number(row.id),
  status: String(row.status),
  message: String(row.message),
  createdAt: new Date(row.created_at).toLocaleString(),
});

const mapBlockchainRow = (row) => ({
  id: Number(row.id),
  blockNumber: Number(row.block_number),
  previousHash: String(row.previous_hash),
  payloadHash: String(row.payload_hash),
  hash: String(row.block_hash),
  eventType: String(row.event_type),
  entityType: String(row.entity_type),
  entityId: String(row.entity_id),
  actor: String(row.actor),
  hospitalId: Number(row.hospital_id),
  summary: String(row.summary),
  timestamp: new Date(row.created_at).toISOString(),
});

const BLOCKCHAIN_GENESIS_HASH = '0'.repeat(64);

const hashText = (input) => createHash('sha256').update(input).digest('hex');

const normalizeAuditText = (value, fallback, maxLength) => {
  const normalized = String(value || '').trim();
  if (!normalized) {
    return fallback;
  }
  return normalized.slice(0, maxLength);
};

const normalizeBlockchainPayload = (payload = {}) => {
  const summary = normalizeAuditText(payload.summary, 'No summary provided', 500);
  const eventType = normalizeAuditText(payload.eventType, 'event', 80).toLowerCase();
  const entityType = normalizeAuditText(payload.entityType, 'resource', 80).toLowerCase();
  const entityId = normalizeAuditText(payload.entityId, String(Date.now()), 120);
  const actor = normalizeAuditText(payload.actor, 'system', 120);
  const hospitalId = Number(payload.hospitalId || 0);
  const body = payload.payload && typeof payload.payload === 'object' ? payload.payload : {};
  const payloadHash = hashText(JSON.stringify(body));
  const safeHospitalId = Number.isFinite(hospitalId) ? hospitalId : 0;
  return {
    summary,
    eventType,
    entityType,
    entityId,
    actor,
    hospitalId: safeHospitalId,
    payloadHash,
  };
};

const buildBlockHash = ({
  blockNumber,
  previousHash,
  payloadHash,
  eventType,
  entityType,
  entityId,
  actor,
  hospitalId,
  summary,
}) => {
  return hashText(
    JSON.stringify({
      blockNumber,
      previousHash,
      payloadHash,
      eventType,
      entityType,
      entityId,
      actor,
      hospitalId,
      summary,
    })
  );
};

export const createDataStore = ({
  hospitals,
  responseWindowSeconds,
  minAlertsPerHospital,
  seededEmergencyPatientNames,
  severities,
  mysqlConfig,
}) => {
  let mysqlEnabled = Boolean(mysqlConfig?.enabled);
  let mysqlPool = null;
  let backendMode = 'memory';

  let alertIdCounter = 1;
  let referralIdCounter = 1;
  let appointmentIdCounter = 1;
  let prescriptionIdCounter = 1;
  let doctorQueryIdCounter = 1;
  let pharmacyOrderIdCounter = 1;
  let crashIncidentIdCounter = 1;
  let blockchainIdCounter = 1;
  let emergencyAlerts = [];
  let reportReferrals = [];
  let appointments = [];
  let prescriptions = [];
  let doctorQueries = [];
  let pharmacyOrders = [];
  let crashIncidents = [];
  let blockchainRecords = [];
  let portalSettings = {
    maintenanceMode: false,
    publicEnabled: true,
    hospitalEnabled: true,
    pharmacyEnabled: true,
  };
  const fingerprintEnrollment = new Set();
  const hospitalPortalSeedTarget = 18;
  const appointmentStatuses = ['pending', 'accepted', 'completed'];
  const departments = ['Cardiology', 'Neurology', 'Orthopedics', 'Pulmonology', 'General Medicine', 'Dermatology'];
  const diseases = ['Hypertension', 'Migraine', 'Fracture follow-up', 'Asthma', 'Diabetes review', 'Skin infection'];
  const appointmentReasons = [
    'Routine follow-up consultation',
    'Post-discharge review',
    'Persistent symptom assessment',
    'Medication adjustment request',
    'Specialist second opinion',
    'Lab report review',
  ];
  const medicines = [
    'Paracetamol 650mg, Vitamin D3 weekly',
    'Telmisartan 40mg once daily',
    'Metformin 500mg twice daily',
    'Montelukast 10mg at bedtime',
    'Pantoprazole 40mg before breakfast',
    'Calcium + B12 supplements',
  ];
  const prescriptionAdvice = [
    'Take medicines after food and monitor symptoms daily.',
    'Maintain hydration, avoid high-salt diet, and sleep at least 7 hours.',
    'Follow up in 7 days with latest blood pressure and sugar readings.',
    'Avoid heavy physical activity for 5 days and continue home rest.',
    'Return immediately if fever, chest pain, or breathing discomfort worsens.',
    'Continue current course for 5 days and schedule reassessment.',
  ];
  const doctorNames = ['Dr. Sharma', 'Dr. Reddy', 'Dr. Khan', 'Dr. Priya', 'Dr. Mehta', 'Dr. Suresh'];
  const initialAlertStatusCycle = ['pending', 'pending', 'accepted', 'accepted', 'rejected'];
  const getAlertSeedTarget = (hospitalIndex) => 20 + (hospitalIndex % 6);
  const reportReferralSeedTarget = 22;
  const reportReferralTemplates = [
    {
      testType: 'X-Ray Chest PA View',
      doctorSpecialty: 'Pulmonology',
      severity: 'attention',
      source: 'xray',
      cause: 'Mild bilateral perihilar infiltrates suggest lower respiratory infection.',
      summary: 'Chest X-ray shows patchy opacities; specialist review advised.',
    },
    {
      testType: 'CT Brain Plain',
      doctorSpecialty: 'Neurology',
      severity: 'urgent',
      source: 'scan',
      cause: 'Small hyperdense focus in right basal ganglia, suspicious for acute bleed.',
      summary: 'CT brain indicates possible acute hemorrhagic event; urgent evaluation required.',
    },
    {
      testType: 'MRI Spine Lumbosacral',
      doctorSpecialty: 'Orthopedics',
      severity: 'attention',
      source: 'mri',
      cause: 'Posterior disc bulge at L4-L5 with mild foraminal narrowing.',
      summary: 'MRI spine suggests degenerative disc disease with nerve compression risk.',
    },
    {
      testType: 'Ultrasound Abdomen',
      doctorSpecialty: 'Gastroenterology',
      severity: 'stable',
      source: 'scan',
      cause: 'Mild fatty liver changes; no focal lesion identified.',
      summary: 'USG abdomen reveals grade I fatty liver; lifestyle follow-up recommended.',
    },
    {
      testType: '2D Echo',
      doctorSpecialty: 'Cardiology',
      severity: 'attention',
      source: 'scan',
      cause: 'Mild LV dysfunction with EF around 48%.',
      summary: 'Echo shows reduced ejection fraction; cardiology medication review needed.',
    },
    {
      testType: 'ECG 12 Lead',
      doctorSpecialty: 'Cardiology',
      severity: 'attention',
      source: 'test',
      cause: 'ST-T changes in inferior leads suggest ischemic strain pattern.',
      summary: 'ECG abnormalities detected; correlate with symptoms and troponin profile.',
    },
    {
      testType: 'CBC',
      doctorSpecialty: 'General Medicine',
      severity: 'attention',
      source: 'lab',
      cause: 'Neutrophilic leukocytosis with elevated total WBC count.',
      summary: 'CBC indicates active inflammatory/infective process needing clinical review.',
    },
    {
      testType: 'LFT',
      doctorSpecialty: 'Gastroenterology',
      severity: 'attention',
      source: 'lab',
      cause: 'ALT and AST mildly elevated above reference range.',
      summary: 'Liver profile altered; medication and alcohol history assessment advised.',
    },
    {
      testType: 'RFT',
      doctorSpecialty: 'Nephrology',
      severity: 'attention',
      source: 'lab',
      cause: 'Serum creatinine elevated with reduced estimated GFR.',
      summary: 'Renal function trend worsening; nephrology referral suggested.',
    },
    {
      testType: 'Urine Routine & Microscopy',
      doctorSpecialty: 'Urology',
      severity: 'attention',
      source: 'lab',
      cause: 'Pus cells and bacteria present, consistent with UTI.',
      summary: 'Urine report suggests urinary infection; culture-based therapy recommended.',
    },
    {
      testType: 'Urine Culture',
      doctorSpecialty: 'Urology',
      severity: 'attention',
      source: 'lab',
      cause: 'Significant E. coli growth with antibiotic sensitivity profile available.',
      summary: 'Urine culture positive; start targeted antibiotic per sensitivity.',
    },
    {
      testType: 'HbA1c',
      doctorSpecialty: 'Endocrinology',
      severity: 'attention',
      source: 'lab',
      cause: 'HbA1c elevated at 8.4%, indicating poor glycemic control.',
      summary: 'Diabetes control inadequate; treatment intensification required.',
    },
    {
      testType: 'Lipid Profile',
      doctorSpecialty: 'Cardiology',
      severity: 'stable',
      source: 'lab',
      cause: 'LDL elevated with low HDL, suggestive of dyslipidemia.',
      summary: 'Lipid profile abnormal; preventive cardiology counseling advised.',
    },
    {
      testType: 'Thyroid Profile (TSH, T3, T4)',
      doctorSpecialty: 'Endocrinology',
      severity: 'stable',
      source: 'lab',
      cause: 'TSH above normal range consistent with hypothyroid pattern.',
      summary: 'Thyroid profile indicates probable hypothyroidism; endocrine follow-up needed.',
    },
    {
      testType: 'Dengue NS1/IgM',
      doctorSpecialty: 'Infectious Disease',
      severity: 'urgent',
      source: 'lab',
      cause: 'Dengue antigen positive with falling platelet trend.',
      summary: 'Dengue positivity with warning labs; close monitoring advised.',
    },
    {
      testType: 'CRP & ESR',
      doctorSpecialty: 'General Medicine',
      severity: 'attention',
      source: 'lab',
      cause: 'Both inflammatory markers elevated above baseline.',
      summary: 'Inflammatory markers raised; evaluate for active systemic inflammation.',
    },
    {
      testType: 'Arterial Blood Gas (ABG)',
      doctorSpecialty: 'Critical Care',
      severity: 'urgent',
      source: 'lab',
      cause: 'Metabolic acidosis with respiratory compensation pattern.',
      summary: 'ABG demonstrates acid-base disturbance; urgent corrective management required.',
    },
    {
      testType: 'Troponin I',
      doctorSpecialty: 'Cardiology',
      severity: 'urgent',
      source: 'lab',
      cause: 'Troponin level elevated suggestive of myocardial injury.',
      summary: 'Cardiac enzyme positive; ACS protocol evaluation recommended.',
    },
    {
      testType: 'D-Dimer',
      doctorSpecialty: 'Pulmonology',
      severity: 'attention',
      source: 'lab',
      cause: 'D-Dimer elevated, thromboembolic disease cannot be excluded.',
      summary: 'Raised coagulation marker; imaging correlation advised.',
    },
    {
      testType: 'CT Chest HRCT',
      doctorSpecialty: 'Pulmonology',
      severity: 'attention',
      source: 'scan',
      cause: 'Ground-glass opacities in bilateral lower lobes.',
      summary: 'HRCT chest indicates diffuse inflammatory changes requiring follow-up.',
    },
    {
      testType: 'X-Ray Knee AP/Lateral',
      doctorSpecialty: 'Orthopedics',
      severity: 'stable',
      source: 'xray',
      cause: 'No acute fracture; mild osteoarthritic joint space narrowing.',
      summary: 'Knee X-ray shows chronic degenerative changes without acute injury.',
    },
    {
      testType: 'MRI Brain with Contrast',
      doctorSpecialty: 'Neurology',
      severity: 'attention',
      source: 'mri',
      cause: 'Small demyelinating focus in periventricular region.',
      summary: 'MRI brain shows focal white matter lesion; neurology correlation advised.',
    },
  ];
  const pharmacyOrderStatuses = ['pending', 'accepted', 'completed', 'rejected'];
  const pharmacyOrderMedicines = [
    'Paracetamol 650mg',
    'Amoxicillin 500mg',
    'ORS Sachets',
    'Salbutamol Inhaler',
    'Insulin Pen',
    'Cefixime 200mg',
    'Ondansetron 4mg',
    'Diclofenac Gel',
    'Azithromycin 500mg',
    'Pantoprazole 40mg',
  ];
  const pharmacySeedNames = [
    'Apollo Pharmacy',
    'MedPlus',
    'Wellness Forever',
    'CarePlus Pharmacy',
    'Srinivasa Medical & General',
    'LifeLine Pharmacy',
    'Metro Medical Shop',
    'HealthFirst Pharmacy',
    'GreenCross Medical',
    'SunCare Pharmacy',
    'Navodaya Medicals',
    'Prime Pharma',
    'CityMed Medical Shop',
    'RapidCare Pharmacy',
  ];
  const getPharmacySeedTarget = (pharmacyIndex) => 15 + (pharmacyIndex % 6);

  const buildInitialAlerts = () =>
    hospitals.flatMap((hospital, hospitalIndex) =>
      Array.from({ length: getAlertSeedTarget(hospitalIndex) }, (_, idx) => {
        const minuteOffset = ((hospitalIndex + idx) % 9) + 1;
        const status = initialAlertStatusCycle[(hospitalIndex + idx) % initialAlertStatusCycle.length];
        return {
          id: alertIdCounter++,
          hospitalId: hospital.id,
          patient: seededEmergencyPatientNames[(hospitalIndex * 17 + idx) % seededEmergencyPatientNames.length],
          severity: severities[(hospitalIndex + idx) % severities.length],
          status,
          remainingSeconds: status === 'pending' ? responseWindowSeconds - (idx % 30) : 0,
          createdAtMs: Date.now() - minuteOffset * 60 * 1000,
        };
      })
    );

  const createSeedBatchForHospital = ({ hospital, hospitalIndex, count, offset = 0 }) => {
    const appointmentsBatch = [];
    const prescriptionsBatch = [];
    const doctorQueriesBatch = [];

    for (let idx = 0; idx < count; idx += 1) {
      const seedIndex = offset + idx;
      const patientBase = seededEmergencyPatientNames[(hospitalIndex * 13 + seedIndex) % seededEmergencyPatientNames.length];
      const patientName = `${patientBase} ${hospital.id}-${seedIndex + 1}`;
      const contactNumber = `9${String((hospital.id * 10000000) + ((seedIndex + 1) * 137)).slice(-9)}`;
      const appointmentDate = new Date(Date.now() + ((seedIndex % 14) + 1) * 24 * 60 * 60 * 1000 + (seedIndex % 8) * 60 * 60 * 1000);
      const appointmentAt = appointmentDate.toISOString().slice(0, 16).replace('T', ' ');
      const department = departments[(hospitalIndex + seedIndex) % departments.length];
      const disease = diseases[(hospitalIndex * 2 + seedIndex) % diseases.length];
      const doctorName = doctorNames[(hospitalIndex + seedIndex) % doctorNames.length];
      const queryStatus = seedIndex % 3 === 0 ? 'pending' : 'answered';

      appointmentsBatch.push({
        hospitalId: hospital.id,
        hospitalName: hospital.name,
        patientName,
        contactNumber,
        reason: appointmentReasons[(hospitalIndex + seedIndex) % appointmentReasons.length],
        appointmentAt,
        status: appointmentStatuses[(hospitalIndex + seedIndex) % appointmentStatuses.length],
      });

      prescriptionsBatch.push({
        hospitalId: hospital.id,
        hospitalName: hospital.name,
        patientName,
        doctorName,
        medicines: medicines[(hospitalIndex + seedIndex) % medicines.length],
        advice: prescriptionAdvice[(hospitalIndex + seedIndex) % prescriptionAdvice.length],
      });

      doctorQueriesBatch.push({
        hospitalId: hospital.id,
        hospitalName: hospital.name,
        patientName,
        department,
        disease,
        question: `Need guidance for ${disease.toLowerCase()} symptoms and medicine timing.`,
        status: queryStatus,
        doctorName: queryStatus === 'answered' ? doctorName : '',
        answer: queryStatus === 'answered' ? 'Continue current medicine plan, monitor symptoms, and review after 3 days.' : '',
      });
    }

    return {
      appointmentsBatch,
      prescriptionsBatch,
      doctorQueriesBatch,
    };
  };

  const createReportReferralSeedBatch = ({ hospital, hospitalIndex, count, offset = 0 }) => {
    const batch = [];
    for (let idx = 0; idx < count; idx += 1) {
      const seedIndex = offset + idx;
      const patientBase = seededEmergencyPatientNames[(hospitalIndex * 11 + seedIndex) % seededEmergencyPatientNames.length];
      const patientName = `${patientBase} R${hospital.id}-${seedIndex + 1}`;
      const tpl = reportReferralTemplates[(hospitalIndex + seedIndex) % reportReferralTemplates.length];
      batch.push({
        hospitalId: hospital.id,
        hospitalName: hospital.name,
        patientName,
        doctorSpecialty: tpl.doctorSpecialty,
        severity: tpl.severity,
        cause: tpl.cause,
        summary: tpl.summary,
        source: tpl.source,
        reportExcerpt: `${tpl.testType}: ${tpl.summary}`,
      });
    }
    return batch;
  };

  const createPharmacySeedBatch = ({ pharmacyName, pharmacyIndex, count, offset = 0 }) => {
    const batch = [];

    for (let idx = 0; idx < count; idx += 1) {
      const seedIndex = offset + idx;
      const patientBase = seededEmergencyPatientNames[(pharmacyIndex * 7 + seedIndex) % seededEmergencyPatientNames.length];
      const status = pharmacyOrderStatuses[(pharmacyIndex + seedIndex) % pharmacyOrderStatuses.length];
      const quantity = ((pharmacyIndex + seedIndex) % 4) + 1;

      batch.push({
        pharmacyName,
        patientName: `${patientBase} P${pharmacyIndex + 1}-${seedIndex + 1}`,
        patientPhone: `9${String((pharmacyIndex * 10000000) + ((seedIndex + 1) * 177)).slice(-9)}`,
        medicine: pharmacyOrderMedicines[(pharmacyIndex + seedIndex) % pharmacyOrderMedicines.length],
        quantity,
        notes: seedIndex % 3 === 0
          ? 'Urgent refill request from ER.'
          : seedIndex % 3 === 1
            ? 'Doctor advised immediate start.'
            : 'Patient requested home delivery.',
        locationLabel: `Hyderabad Zone ${((pharmacyIndex + seedIndex) % 8) + 1}`,
        status,
        remainingSeconds: status === 'pending' || status === 'accepted' ? 600 + ((seedIndex % 10) * 60) : 0,
      });
    }

    return batch;
  };

  const seedMemory = () => {
    if (emergencyAlerts.length === 0) {
      emergencyAlerts = buildInitialAlerts();
    }
    if (appointments.length === 0 && prescriptions.length === 0 && doctorQueries.length === 0) {
      hospitals.forEach((hospital, hospitalIndex) => {
        const { appointmentsBatch, prescriptionsBatch, doctorQueriesBatch } = createSeedBatchForHospital({
          hospital,
          hospitalIndex,
          count: hospitalPortalSeedTarget,
        });

        appointmentsBatch.forEach((item) => {
          appointments.push({
            id: appointmentIdCounter++,
            ...item,
            createdAt: new Date().toLocaleString(),
          });
        });

        prescriptionsBatch.forEach((item) => {
          prescriptions.push({
            id: prescriptionIdCounter++,
            ...item,
            createdAt: new Date().toLocaleString(),
          });
        });

        doctorQueriesBatch.forEach((item) => {
          doctorQueries.push({
            id: doctorQueryIdCounter++,
            ...item,
            createdAt: new Date().toLocaleString(),
            answeredAt: item.status === 'answered' ? new Date().toLocaleString() : '',
          });
        });
      });
    }
    if (reportReferrals.length === 0) {
      hospitals.forEach((hospital, hospitalIndex) => {
        const batch = createReportReferralSeedBatch({
          hospital,
          hospitalIndex,
          count: reportReferralSeedTarget,
        });
        batch.forEach((item) => {
          reportReferrals.push({
            id: referralIdCounter++,
            ...item,
            createdAt: new Date().toLocaleString(),
          });
        });
      });
    }
    if (pharmacyOrders.length === 0) {
      pharmacySeedNames.forEach((pharmacyName, pharmacyIndex) => {
        const batch = createPharmacySeedBatch({
          pharmacyName,
          pharmacyIndex,
          count: getPharmacySeedTarget(pharmacyIndex),
        });
        batch.forEach((item) => {
          pharmacyOrders.push({
            id: pharmacyOrderIdCounter++,
            ...item,
            createdAt: new Date().toLocaleString(),
          });
        });
      });
    }
  };

  const initMysql = async () => {
    if (!mysqlEnabled) {
      return false;
    }

    try {
      const mysql = await import('mysql2/promise');
      mysqlPool = mysql.createPool({
        host: mysqlConfig.host,
        port: mysqlConfig.port,
        user: mysqlConfig.user,
        password: mysqlConfig.password,
        database: mysqlConfig.database,
        waitForConnections: true,
        connectionLimit: mysqlConfig.poolSize,
        queueLimit: 0,
      });

      await mysqlPool.query(`
        CREATE TABLE IF NOT EXISTS fingerprint_enrollments (
          hospital_id VARCHAR(64) PRIMARY KEY,
          enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await mysqlPool.query(`
        CREATE TABLE IF NOT EXISTS emergency_alerts (
          id BIGINT PRIMARY KEY AUTO_INCREMENT,
          hospital_id INT NOT NULL,
          patient VARCHAR(120) NOT NULL,
          severity VARCHAR(20) NOT NULL,
          status VARCHAR(20) NOT NULL,
          remaining_seconds INT NOT NULL,
          created_at_ms BIGINT NOT NULL,
          INDEX idx_emergency_hospital (hospital_id),
          INDEX idx_emergency_status (status),
          INDEX idx_emergency_created (created_at_ms)
        )
      `);

      await mysqlPool.query(`
        CREATE TABLE IF NOT EXISTS report_referrals (
          id BIGINT PRIMARY KEY AUTO_INCREMENT,
          hospital_id INT NOT NULL,
          hospital_name VARCHAR(160) NOT NULL,
          patient_name VARCHAR(120) NOT NULL,
          doctor_specialty VARCHAR(120) NOT NULL,
          severity VARCHAR(20) NOT NULL,
          cause TEXT NOT NULL,
          summary TEXT NOT NULL,
          source VARCHAR(20) NOT NULL,
          report_excerpt TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_referral_hospital (hospital_id),
          INDEX idx_referral_created (created_at)
        )
      `);

      await mysqlPool.query(`
        CREATE TABLE IF NOT EXISTS appointments (
          id BIGINT PRIMARY KEY AUTO_INCREMENT,
          hospital_id INT NOT NULL,
          hospital_name VARCHAR(160) NOT NULL,
          patient_name VARCHAR(120) NOT NULL,
          contact_number VARCHAR(40) NOT NULL,
          reason TEXT NOT NULL,
          appointment_at VARCHAR(80) NOT NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_appointment_hospital (hospital_id),
          INDEX idx_appointment_status (status),
          INDEX idx_appointment_created (created_at)
        )
      `);

      await mysqlPool.query(`
        CREATE TABLE IF NOT EXISTS prescriptions (
          id BIGINT PRIMARY KEY AUTO_INCREMENT,
          hospital_id INT NOT NULL,
          hospital_name VARCHAR(160) NOT NULL,
          patient_name VARCHAR(120) NOT NULL,
          doctor_name VARCHAR(120) NOT NULL,
          medicines TEXT NOT NULL,
          advice TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_prescription_hospital (hospital_id),
          INDEX idx_prescription_patient (patient_name),
          INDEX idx_prescription_created (created_at)
        )
      `);

      await mysqlPool.query(`
        CREATE TABLE IF NOT EXISTS doctor_queries (
          id BIGINT PRIMARY KEY AUTO_INCREMENT,
          hospital_id INT NOT NULL,
          hospital_name VARCHAR(160) NOT NULL,
          patient_name VARCHAR(120) NOT NULL,
          department VARCHAR(180) NOT NULL,
          disease VARCHAR(180) NOT NULL,
          question TEXT NOT NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'pending',
          doctor_name VARCHAR(120) NULL,
          answer TEXT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          answered_at TIMESTAMP NULL,
          INDEX idx_query_hospital (hospital_id),
          INDEX idx_query_patient (patient_name),
          INDEX idx_query_status (status),
          INDEX idx_query_created (created_at)
        )
      `);

      await mysqlPool.query(`
        CREATE TABLE IF NOT EXISTS pharmacy_orders (
          id BIGINT PRIMARY KEY AUTO_INCREMENT,
          pharmacy_name VARCHAR(180) NOT NULL,
          patient_name VARCHAR(120) NOT NULL,
          patient_phone VARCHAR(40) NOT NULL,
          medicine VARCHAR(180) NOT NULL,
          quantity INT NOT NULL,
          notes TEXT NULL,
          location_label VARCHAR(220) NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'pending',
          remaining_seconds INT NOT NULL DEFAULT 2400,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_pharmacy_order_pharmacy (pharmacy_name),
          INDEX idx_pharmacy_order_status (status),
          INDEX idx_pharmacy_order_created (created_at)
        )
      `);

      await mysqlPool.query(`
        CREATE TABLE IF NOT EXISTS crash_incidents (
          id BIGINT PRIMARY KEY AUTO_INCREMENT,
          status VARCHAR(20) NOT NULL,
          message TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_crash_incidents_status (status),
          INDEX idx_crash_incidents_created (created_at)
        )
      `);

      await mysqlPool.query(`
        CREATE TABLE IF NOT EXISTS blockchain_audit (
          id BIGINT PRIMARY KEY AUTO_INCREMENT,
          block_number BIGINT NOT NULL,
          previous_hash CHAR(64) NOT NULL,
          payload_hash CHAR(64) NOT NULL,
          block_hash CHAR(64) NOT NULL,
          event_type VARCHAR(80) NOT NULL,
          entity_type VARCHAR(80) NOT NULL,
          entity_id VARCHAR(120) NOT NULL,
          actor VARCHAR(120) NOT NULL,
          hospital_id INT NOT NULL DEFAULT 0,
          summary TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY uniq_blockchain_block (block_number),
          INDEX idx_blockchain_created (created_at)
        )
      `);

      await mysqlPool.query(`
        CREATE TABLE IF NOT EXISTS portal_settings (
          id TINYINT PRIMARY KEY,
          maintenance_mode TINYINT(1) NOT NULL DEFAULT 0,
          public_enabled TINYINT(1) NOT NULL DEFAULT 1,
          hospital_enabled TINYINT(1) NOT NULL DEFAULT 1,
          pharmacy_enabled TINYINT(1) NOT NULL DEFAULT 1,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      await mysqlPool.query(
        `INSERT INTO portal_settings (id, maintenance_mode, public_enabled, hospital_enabled, pharmacy_enabled)
         VALUES (1, 0, 1, 1, 1)
         ON DUPLICATE KEY UPDATE id = id`
      );

      const [[{ count: alertCount }]] = await mysqlPool.query('SELECT COUNT(*) AS count FROM emergency_alerts');
      if (Number(alertCount) === 0) {
        const initialAlerts = buildInitialAlerts();
        const values = initialAlerts.map((alert) => [
          alert.hospitalId,
          alert.patient,
          alert.severity,
          alert.status,
          alert.remainingSeconds,
          alert.createdAtMs,
        ]);
        await mysqlPool.query(
          `INSERT INTO emergency_alerts
          (hospital_id, patient, severity, status, remaining_seconds, created_at_ms)
          VALUES ?`,
          [values]
        );
      }

      // Keep seeded emergency queue in the 20-25 range per hospital for dashboard behavior.
      for (let hospitalIndex = 0; hospitalIndex < hospitals.length; hospitalIndex += 1) {
        const hospital = hospitals[hospitalIndex];
        const targetCount = getAlertSeedTarget(hospitalIndex);
        const [rows] = await mysqlPool.query(
          'SELECT id, status FROM emergency_alerts WHERE hospital_id = ? ORDER BY created_at_ms DESC',
          [hospital.id]
        );
        const currentCount = rows.length;

        if (currentCount < targetCount) {
          const missing = targetCount - currentCount;
          const values = Array.from({ length: missing }, (_, idx) => {
            const minuteOffset = ((hospitalIndex + idx) % 9) + 1;
            const status = initialAlertStatusCycle[(hospitalIndex + idx) % initialAlertStatusCycle.length];
            return [
              hospital.id,
              seededEmergencyPatientNames[(hospitalIndex * 19 + idx) % seededEmergencyPatientNames.length],
              severities[(hospitalIndex + idx) % severities.length],
              status,
              status === 'pending' ? responseWindowSeconds - (idx % 30) : 0,
              Date.now() - minuteOffset * 60 * 1000,
            ];
          });
          await mysqlPool.query(
            `INSERT INTO emergency_alerts
            (hospital_id, patient, severity, status, remaining_seconds, created_at_ms)
            VALUES ?`,
            [values]
          );
        } else if (currentCount > 25) {
          const extraIds = rows.slice(25).map((row) => row.id);
          if (extraIds.length > 0) {
            await mysqlPool.query('DELETE FROM emergency_alerts WHERE id IN (?)', [extraIds]);
          }
        }

        const [seedRows] = await mysqlPool.query(
          'SELECT id FROM emergency_alerts WHERE hospital_id = ? ORDER BY created_at_ms DESC LIMIT ?',
          [hospital.id, targetCount]
        );
        for (let idx = 0; idx < seedRows.length; idx += 1) {
          const status = initialAlertStatusCycle[(hospitalIndex + idx) % initialAlertStatusCycle.length];
          await mysqlPool.query(
            'UPDATE emergency_alerts SET status = ?, remaining_seconds = ? WHERE id = ?',
            [status, status === 'pending' ? responseWindowSeconds - (idx % 30) : 0, seedRows[idx].id]
          );
        }
      }

      // Ensure each hospital has enough seeded records for hospital portal workflows.
      for (let hospitalIndex = 0; hospitalIndex < hospitals.length; hospitalIndex += 1) {
        const hospital = hospitals[hospitalIndex];

        const [[{ count: appointmentsCount }]] = await mysqlPool.query(
          'SELECT COUNT(*) AS count FROM appointments WHERE hospital_id = ?',
          [hospital.id]
        );
        const [[{ count: reportReferralsCount }]] = await mysqlPool.query(
          'SELECT COUNT(*) AS count FROM report_referrals WHERE hospital_id = ?',
          [hospital.id]
        );
        const [[{ count: prescriptionsCount }]] = await mysqlPool.query(
          'SELECT COUNT(*) AS count FROM prescriptions WHERE hospital_id = ?',
          [hospital.id]
        );
        const [[{ count: doctorQueriesCount }]] = await mysqlPool.query(
          'SELECT COUNT(*) AS count FROM doctor_queries WHERE hospital_id = ?',
          [hospital.id]
        );

        if (Number(appointmentsCount) < hospitalPortalSeedTarget) {
          const missing = hospitalPortalSeedTarget - Number(appointmentsCount);
          const { appointmentsBatch } = createSeedBatchForHospital({
            hospital,
            hospitalIndex,
            count: missing,
            offset: Number(appointmentsCount),
          });
          const values = appointmentsBatch.map((item) => [
            item.hospitalId,
            item.hospitalName,
            item.patientName,
            item.contactNumber,
            item.reason,
            item.appointmentAt,
            item.status,
          ]);
          await mysqlPool.query(
            `INSERT INTO appointments
             (hospital_id, hospital_name, patient_name, contact_number, reason, appointment_at, status)
             VALUES ?`,
            [values]
          );
        }

        if (Number(reportReferralsCount) < reportReferralSeedTarget) {
          const missing = reportReferralSeedTarget - Number(reportReferralsCount);
          const batch = createReportReferralSeedBatch({
            hospital,
            hospitalIndex,
            count: missing,
            offset: Number(reportReferralsCount),
          });
          const values = batch.map((item) => [
            item.hospitalId,
            item.hospitalName,
            item.patientName,
            item.doctorSpecialty,
            item.severity,
            item.cause,
            item.summary,
            item.source,
            item.reportExcerpt,
          ]);
          await mysqlPool.query(
            `INSERT INTO report_referrals
             (hospital_id, hospital_name, patient_name, doctor_specialty, severity, cause, summary, source, report_excerpt)
             VALUES ?`,
            [values]
          );
        }

        if (Number(prescriptionsCount) < hospitalPortalSeedTarget) {
          const missing = hospitalPortalSeedTarget - Number(prescriptionsCount);
          const { prescriptionsBatch } = createSeedBatchForHospital({
            hospital,
            hospitalIndex,
            count: missing,
            offset: Number(prescriptionsCount),
          });
          const values = prescriptionsBatch.map((item) => [
            item.hospitalId,
            item.hospitalName,
            item.patientName,
            item.doctorName,
            item.medicines,
            item.advice,
          ]);
          await mysqlPool.query(
            `INSERT INTO prescriptions
             (hospital_id, hospital_name, patient_name, doctor_name, medicines, advice)
             VALUES ?`,
            [values]
          );
        }

        if (Number(doctorQueriesCount) < hospitalPortalSeedTarget) {
          const missing = hospitalPortalSeedTarget - Number(doctorQueriesCount);
          const { doctorQueriesBatch } = createSeedBatchForHospital({
            hospital,
            hospitalIndex,
            count: missing,
            offset: Number(doctorQueriesCount),
          });
          const values = doctorQueriesBatch.map((item) => [
            item.hospitalId,
            item.hospitalName,
            item.patientName,
            item.department,
            item.disease,
            item.question,
            item.status,
            item.doctorName || null,
            item.answer || null,
            item.status === 'answered' ? new Date() : null,
          ]);
          await mysqlPool.query(
            `INSERT INTO doctor_queries
             (hospital_id, hospital_name, patient_name, department, disease, question, status, doctor_name, answer, answered_at)
             VALUES ?`,
            [values]
          );
        }
      }

      // Ensure each pharmacy has enough seeded emergency orders for pharmacy dashboard workflows.
      for (let pharmacyIndex = 0; pharmacyIndex < pharmacySeedNames.length; pharmacyIndex += 1) {
        const pharmacyName = pharmacySeedNames[pharmacyIndex];
        const targetCount = getPharmacySeedTarget(pharmacyIndex);
        const [[{ count: orderCount }]] = await mysqlPool.query(
          'SELECT COUNT(*) AS count FROM pharmacy_orders WHERE pharmacy_name = ?',
          [pharmacyName]
        );
        if (Number(orderCount) < targetCount) {
          const missing = targetCount - Number(orderCount);
          const batch = createPharmacySeedBatch({
            pharmacyName,
            pharmacyIndex,
            count: missing,
            offset: Number(orderCount),
          });
          const values = batch.map((item) => [
            item.pharmacyName,
            item.patientName,
            item.patientPhone,
            item.medicine,
            item.quantity,
            item.notes,
            item.locationLabel,
            item.status,
            item.remainingSeconds,
          ]);
          await mysqlPool.query(
            `INSERT INTO pharmacy_orders
             (pharmacy_name, patient_name, patient_phone, medicine, quantity, notes, location_label, status, remaining_seconds)
             VALUES ?`,
            [values]
          );
        }
      }

      backendMode = 'mysql';
      return true;
    } catch (error) {
      mysqlEnabled = false;
      mysqlPool = null;
      // eslint-disable-next-line no-console
      console.warn('MySQL init failed. Falling back to in-memory store.', error instanceof Error ? error.message : error);
      return false;
    }
  };

  const init = async () => {
    const mysqlReady = await initMysql();
    if (!mysqlReady) {
      seedMemory();
    }
  };

  const getMode = () => backendMode;

  const createBlockchainRecord = async (payload) => {
    const normalized = normalizeBlockchainPayload(payload);
    const timestamp = new Date().toISOString();

    if (backendMode === 'mysql') {
      const [latestRows] = await mysqlPool.query(
        'SELECT block_number, block_hash FROM blockchain_audit ORDER BY block_number DESC LIMIT 1'
      );
      const latest = latestRows[0];
      const previousHash = latest ? String(latest.block_hash) : BLOCKCHAIN_GENESIS_HASH;
      const blockNumber = latest ? Number(latest.block_number) + 1 : 1;
      const hash = buildBlockHash({
        blockNumber,
        previousHash,
        payloadHash: normalized.payloadHash,
        eventType: normalized.eventType,
        entityType: normalized.entityType,
        entityId: normalized.entityId,
        actor: normalized.actor,
        hospitalId: normalized.hospitalId,
        summary: normalized.summary,
      });

      const [result] = await mysqlPool.query(
        `INSERT INTO blockchain_audit
        (block_number, previous_hash, payload_hash, block_hash, event_type, entity_type, entity_id, actor, hospital_id, summary)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          blockNumber,
          previousHash,
          normalized.payloadHash,
          hash,
          normalized.eventType,
          normalized.entityType,
          normalized.entityId,
          normalized.actor,
          normalized.hospitalId,
          normalized.summary,
        ]
      );
      const [rows] = await mysqlPool.query('SELECT * FROM blockchain_audit WHERE id = ? LIMIT 1', [result.insertId]);
      return mapBlockchainRow(rows[0]);
    }

    const latest = blockchainRecords[0];
    const previousHash = latest ? latest.hash : BLOCKCHAIN_GENESIS_HASH;
    const blockNumber = latest ? latest.blockNumber + 1 : 1;
    const hash = buildBlockHash({
      blockNumber,
      previousHash,
      payloadHash: normalized.payloadHash,
      eventType: normalized.eventType,
      entityType: normalized.entityType,
      entityId: normalized.entityId,
      actor: normalized.actor,
      hospitalId: normalized.hospitalId,
      summary: normalized.summary,
    });
    const block = {
      id: blockchainIdCounter++,
      blockNumber,
      previousHash,
      payloadHash: normalized.payloadHash,
      hash,
      eventType: normalized.eventType,
      entityType: normalized.entityType,
      entityId: normalized.entityId,
      actor: normalized.actor,
      hospitalId: normalized.hospitalId,
      summary: normalized.summary,
      timestamp,
    };
    blockchainRecords.unshift(block);
    return block;
  };

  const getBlockchainRecords = async (limit = 50) => {
    const safeLimit = Math.max(1, Math.min(200, Number(limit) || 50));
    if (backendMode === 'mysql') {
      const [rows] = await mysqlPool.query(
        'SELECT * FROM blockchain_audit ORDER BY block_number DESC LIMIT ?',
        [safeLimit]
      );
      return rows.map(mapBlockchainRow);
    }
    return blockchainRecords.slice(0, safeLimit);
  };

  const verifyBlockchainIntegrity = async () => {
    const rows = backendMode === 'mysql'
      ? (await mysqlPool.query('SELECT * FROM blockchain_audit ORDER BY block_number ASC'))[0].map(mapBlockchainRow)
      : [...blockchainRecords].sort((a, b) => a.blockNumber - b.blockNumber);

    let previousHash = BLOCKCHAIN_GENESIS_HASH;
    let checkedBlocks = 0;

    for (let idx = 0; idx < rows.length; idx += 1) {
      const block = rows[idx];
      const expectedHash = buildBlockHash({
        blockNumber: block.blockNumber,
        previousHash: block.previousHash,
        payloadHash: block.payloadHash,
        eventType: block.eventType,
        entityType: block.entityType,
        entityId: block.entityId,
        actor: block.actor,
        hospitalId: block.hospitalId,
        summary: block.summary,
      });

      checkedBlocks += 1;
      if (block.blockNumber !== idx + 1) {
        return {
          valid: false,
          checkedBlocks,
          latestBlockNumber: rows.length > 0 ? rows[rows.length - 1].blockNumber : 0,
          latestHash: rows.length > 0 ? rows[rows.length - 1].hash : BLOCKCHAIN_GENESIS_HASH,
          invalidBlockNumber: block.blockNumber,
          reason: 'Unexpected block number sequence',
          verifiedAt: new Date().toISOString(),
        };
      }
      if (block.previousHash !== previousHash) {
        return {
          valid: false,
          checkedBlocks,
          latestBlockNumber: rows.length > 0 ? rows[rows.length - 1].blockNumber : 0,
          latestHash: rows.length > 0 ? rows[rows.length - 1].hash : BLOCKCHAIN_GENESIS_HASH,
          invalidBlockNumber: block.blockNumber,
          reason: 'Previous hash mismatch',
          verifiedAt: new Date().toISOString(),
        };
      }
      if (block.hash !== expectedHash) {
        return {
          valid: false,
          checkedBlocks,
          latestBlockNumber: rows.length > 0 ? rows[rows.length - 1].blockNumber : 0,
          latestHash: rows.length > 0 ? rows[rows.length - 1].hash : BLOCKCHAIN_GENESIS_HASH,
          invalidBlockNumber: block.blockNumber,
          reason: 'Block hash mismatch',
          verifiedAt: new Date().toISOString(),
        };
      }
      previousHash = block.hash;
    }

    return {
      valid: true,
      checkedBlocks,
      latestBlockNumber: rows.length > 0 ? rows[rows.length - 1].blockNumber : 0,
      latestHash: rows.length > 0 ? rows[rows.length - 1].hash : BLOCKCHAIN_GENESIS_HASH,
      invalidBlockNumber: null,
      reason: '',
      verifiedAt: new Date().toISOString(),
    };
  };

  const enrollFingerprint = async (hospitalId) => {
    if (backendMode === 'mysql') {
      await mysqlPool.query(
        `INSERT INTO fingerprint_enrollments (hospital_id)
         VALUES (?)
         ON DUPLICATE KEY UPDATE enrolled_at = CURRENT_TIMESTAMP`,
        [hospitalId]
      );
      return;
    }
    fingerprintEnrollment.add(hospitalId);
  };

  const hasFingerprintEnrollment = async (hospitalId) => {
    if (backendMode === 'mysql') {
      const [rows] = await mysqlPool.query(
        'SELECT hospital_id FROM fingerprint_enrollments WHERE hospital_id = ? LIMIT 1',
        [hospitalId]
      );
      return rows.length > 0;
    }
    return fingerprintEnrollment.has(hospitalId);
  };

  const getAlerts = async (hospitalId) => {
    if (backendMode === 'mysql') {
      if (hospitalId) {
        const [rows] = await mysqlPool.query(
          'SELECT * FROM emergency_alerts WHERE hospital_id = ? ORDER BY created_at_ms DESC',
          [hospitalId]
        );
        return rows.map(mapAlertRow);
      }
      const [rows] = await mysqlPool.query('SELECT * FROM emergency_alerts ORDER BY created_at_ms DESC');
      return rows.map(mapAlertRow);
    }

    return hospitalId
      ? emergencyAlerts.filter((item) => item.hospitalId === hospitalId)
      : emergencyAlerts;
  };

  const createAlert = async ({ hospitalId, patient, severity }) => {
    const createdAtMs = Date.now();
    if (backendMode === 'mysql') {
      const [result] = await mysqlPool.query(
        `INSERT INTO emergency_alerts
        (hospital_id, patient, severity, status, remaining_seconds, created_at_ms)
        VALUES (?, ?, ?, 'pending', ?, ?)`,
        [hospitalId, patient, severity, responseWindowSeconds, createdAtMs]
      );

      const [rows] = await mysqlPool.query('SELECT * FROM emergency_alerts WHERE id = ? LIMIT 1', [result.insertId]);
      return mapAlertRow(rows[0]);
    }

    const alert = {
      id: alertIdCounter++,
      hospitalId,
      patient,
      severity,
      status: 'pending',
      remainingSeconds: responseWindowSeconds,
      createdAtMs,
    };
    emergencyAlerts.unshift(alert);
    return alert;
  };

  const updateAlertStatus = async (id, status) => {
    if (backendMode === 'mysql') {
      const [rows] = await mysqlPool.query('SELECT * FROM emergency_alerts WHERE id = ? LIMIT 1', [id]);
      if (rows.length === 0) {
        return null;
      }
      const current = mapAlertRow(rows[0]);
      const remainingSeconds = status === 'pending' ? current.remainingSeconds : 0;
      await mysqlPool.query(
        'UPDATE emergency_alerts SET status = ?, remaining_seconds = ? WHERE id = ?',
        [status, remainingSeconds, id]
      );
      const [updatedRows] = await mysqlPool.query('SELECT * FROM emergency_alerts WHERE id = ? LIMIT 1', [id]);
      return mapAlertRow(updatedRows[0]);
    }

    const idx = emergencyAlerts.findIndex((item) => item.id === id);
    if (idx < 0) {
      return null;
    }
    emergencyAlerts[idx] = {
      ...emergencyAlerts[idx],
      status,
      remainingSeconds: status === 'pending' ? emergencyAlerts[idx].remainingSeconds : 0,
    };
    return emergencyAlerts[idx];
  };

  const tickAlerts = async () => {
    if (backendMode === 'mysql') {
      await mysqlPool.query(
        `UPDATE emergency_alerts
         SET remaining_seconds = CASE
           WHEN remaining_seconds <= 1 THEN ?
           ELSE remaining_seconds - 1
         END
         WHERE status = 'pending'`,
        [responseWindowSeconds]
      );
      return;
    }

    emergencyAlerts = emergencyAlerts.map((alert) => {
      if (alert.status !== 'pending') {
        return alert;
      }
      const next = alert.remainingSeconds - 1;
      return {
        ...alert,
        remainingSeconds: next <= 0 ? responseWindowSeconds : next,
      };
    });
  };

  const addMinuteAlert = async () => {
    const randomHospital = hospitals[Math.floor(Math.random() * hospitals.length)];
    const existingForHospital = await getAlerts(randomHospital.id);
    if (existingForHospital.length >= 25) {
      return;
    }
    const patient = seededEmergencyPatientNames[Math.floor(Math.random() * seededEmergencyPatientNames.length)];
    const severity = severities[Math.floor(Math.random() * severities.length)];
    await createAlert({
      hospitalId: randomHospital.id,
      patient,
      severity,
    });
  };

  const getReportReferrals = async (hospitalId) => {
    if (backendMode === 'mysql') {
      if (hospitalId) {
        const [rows] = await mysqlPool.query(
          'SELECT * FROM report_referrals WHERE hospital_id = ? ORDER BY created_at DESC',
          [hospitalId]
        );
        return rows.map(mapReferralRow);
      }
      const [rows] = await mysqlPool.query('SELECT * FROM report_referrals ORDER BY created_at DESC');
      return rows.map(mapReferralRow);
    }

    return hospitalId
      ? reportReferrals.filter((item) => item.hospitalId === hospitalId)
      : reportReferrals;
  };

  const createReportReferral = async (payload) => {
    if (backendMode === 'mysql') {
      const [result] = await mysqlPool.query(
        `INSERT INTO report_referrals
        (hospital_id, hospital_name, patient_name, doctor_specialty, severity, cause, summary, source, report_excerpt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          payload.hospitalId,
          payload.hospitalName,
          payload.patientName,
          payload.doctorSpecialty,
          payload.severity,
          payload.cause,
          payload.summary,
          payload.source,
          payload.reportExcerpt,
        ]
      );
      const [rows] = await mysqlPool.query('SELECT * FROM report_referrals WHERE id = ? LIMIT 1', [result.insertId]);
      return mapReferralRow(rows[0]);
    }

    const referral = {
      id: referralIdCounter++,
      ...payload,
      createdAt: new Date().toLocaleString(),
    };
    reportReferrals.unshift(referral);
    return referral;
  };

  const getAppointments = async (hospitalId) => {
    if (backendMode === 'mysql') {
      if (hospitalId) {
        const [rows] = await mysqlPool.query(
          'SELECT * FROM appointments WHERE hospital_id = ? ORDER BY created_at DESC',
          [hospitalId]
        );
        return rows.map(mapAppointmentRow);
      }
      const [rows] = await mysqlPool.query('SELECT * FROM appointments ORDER BY created_at DESC');
      return rows.map(mapAppointmentRow);
    }
    return hospitalId ? appointments.filter((item) => item.hospitalId === hospitalId) : appointments;
  };

  const createAppointment = async (payload) => {
    if (backendMode === 'mysql') {
      const [result] = await mysqlPool.query(
        `INSERT INTO appointments
        (hospital_id, hospital_name, patient_name, contact_number, reason, appointment_at, status)
        VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
        [
          payload.hospitalId,
          payload.hospitalName,
          payload.patientName,
          payload.contactNumber,
          payload.reason,
          payload.appointmentAt,
        ]
      );
      const [rows] = await mysqlPool.query('SELECT * FROM appointments WHERE id = ? LIMIT 1', [result.insertId]);
      return mapAppointmentRow(rows[0]);
    }

    const appointment = {
      id: appointmentIdCounter++,
      ...payload,
      status: 'pending',
      createdAt: new Date().toLocaleString(),
    };
    appointments.unshift(appointment);
    return appointment;
  };

  const updateAppointmentStatus = async (id, status) => {
    if (backendMode === 'mysql') {
      const [rows] = await mysqlPool.query('SELECT * FROM appointments WHERE id = ? LIMIT 1', [id]);
      if (rows.length === 0) {
        return null;
      }
      await mysqlPool.query('UPDATE appointments SET status = ? WHERE id = ?', [status, id]);
      const [updatedRows] = await mysqlPool.query('SELECT * FROM appointments WHERE id = ? LIMIT 1', [id]);
      return mapAppointmentRow(updatedRows[0]);
    }

    const idx = appointments.findIndex((item) => item.id === id);
    if (idx < 0) {
      return null;
    }
    appointments[idx] = { ...appointments[idx], status };
    return appointments[idx];
  };

  const getPrescriptions = async ({ hospitalId, patientName }) => {
    if (backendMode === 'mysql') {
      if (hospitalId) {
        const [rows] = await mysqlPool.query(
          'SELECT * FROM prescriptions WHERE hospital_id = ? ORDER BY created_at DESC',
          [hospitalId]
        );
        return rows.map(mapPrescriptionRow);
      }
      if (patientName) {
        const [rows] = await mysqlPool.query(
          'SELECT * FROM prescriptions WHERE LOWER(patient_name) = ? ORDER BY created_at DESC',
          [String(patientName).toLowerCase()]
        );
        return rows.map(mapPrescriptionRow);
      }
      const [rows] = await mysqlPool.query('SELECT * FROM prescriptions ORDER BY created_at DESC');
      return rows.map(mapPrescriptionRow);
    }

    if (hospitalId) {
      return prescriptions.filter((item) => item.hospitalId === hospitalId);
    }
    if (patientName) {
      return prescriptions.filter((item) => item.patientName.toLowerCase() === String(patientName).toLowerCase());
    }
    return prescriptions;
  };

  const createPrescription = async (payload) => {
    if (backendMode === 'mysql') {
      const [result] = await mysqlPool.query(
        `INSERT INTO prescriptions
        (hospital_id, hospital_name, patient_name, doctor_name, medicines, advice)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [
          payload.hospitalId,
          payload.hospitalName,
          payload.patientName,
          payload.doctorName,
          payload.medicines,
          payload.advice,
        ]
      );
      const [rows] = await mysqlPool.query('SELECT * FROM prescriptions WHERE id = ? LIMIT 1', [result.insertId]);
      return mapPrescriptionRow(rows[0]);
    }

    const prescription = {
      id: prescriptionIdCounter++,
      ...payload,
      createdAt: new Date().toLocaleString(),
    };
    prescriptions.unshift(prescription);
    return prescription;
  };

  const getDoctorQueries = async ({ hospitalId, patientName }) => {
    if (backendMode === 'mysql') {
      if (hospitalId) {
        const [rows] = await mysqlPool.query(
          'SELECT * FROM doctor_queries WHERE hospital_id = ? ORDER BY created_at DESC',
          [hospitalId]
        );
        return rows.map(mapDoctorQueryRow);
      }
      if (patientName) {
        const [rows] = await mysqlPool.query(
          'SELECT * FROM doctor_queries WHERE LOWER(patient_name) = ? ORDER BY created_at DESC',
          [String(patientName).toLowerCase()]
        );
        return rows.map(mapDoctorQueryRow);
      }
      const [rows] = await mysqlPool.query('SELECT * FROM doctor_queries ORDER BY created_at DESC');
      return rows.map(mapDoctorQueryRow);
    }

    if (hospitalId) {
      return doctorQueries.filter((item) => item.hospitalId === hospitalId);
    }
    if (patientName) {
      return doctorQueries.filter((item) => item.patientName.toLowerCase() === String(patientName).toLowerCase());
    }
    return doctorQueries;
  };

  const createDoctorQuery = async (payload) => {
    if (backendMode === 'mysql') {
      const [result] = await mysqlPool.query(
        `INSERT INTO doctor_queries
        (hospital_id, hospital_name, patient_name, department, disease, question, status)
        VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
        [
          payload.hospitalId,
          payload.hospitalName,
          payload.patientName,
          payload.department,
          payload.disease,
          payload.question,
        ]
      );
      const [rows] = await mysqlPool.query('SELECT * FROM doctor_queries WHERE id = ? LIMIT 1', [result.insertId]);
      return mapDoctorQueryRow(rows[0]);
    }

    const query = {
      id: doctorQueryIdCounter++,
      ...payload,
      status: 'pending',
      doctorName: '',
      answer: '',
      createdAt: new Date().toLocaleString(),
      answeredAt: '',
    };
    doctorQueries.unshift(query);
    return query;
  };

  const answerDoctorQuery = async (id, { doctorName, answer }) => {
    if (backendMode === 'mysql') {
      const [rows] = await mysqlPool.query('SELECT * FROM doctor_queries WHERE id = ? LIMIT 1', [id]);
      if (rows.length === 0) {
        return null;
      }
      await mysqlPool.query(
        `UPDATE doctor_queries
         SET status = 'answered', doctor_name = ?, answer = ?, answered_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [doctorName, answer, id]
      );
      const [updatedRows] = await mysqlPool.query('SELECT * FROM doctor_queries WHERE id = ? LIMIT 1', [id]);
      return mapDoctorQueryRow(updatedRows[0]);
    }

    const idx = doctorQueries.findIndex((item) => item.id === id);
    if (idx < 0) {
      return null;
    }
    doctorQueries[idx] = {
      ...doctorQueries[idx],
      status: 'answered',
      doctorName,
      answer,
      answeredAt: new Date().toLocaleString(),
    };
    return doctorQueries[idx];
  };

  const getPharmacyOrders = async ({ pharmacyName, status }) => {
    if (backendMode === 'mysql') {
      const clauses = [];
      const args = [];
      if (pharmacyName) {
        clauses.push('pharmacy_name = ?');
        args.push(pharmacyName);
      }
      if (status) {
        clauses.push('status = ?');
        args.push(status);
      }
      const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
      const [rows] = await mysqlPool.query(
        `SELECT * FROM pharmacy_orders ${where} ORDER BY created_at DESC`,
        args
      );
      return rows.map(mapPharmacyOrderRow);
    }
    return pharmacyOrders
      .filter((item) => (pharmacyName ? item.pharmacyName === pharmacyName : true))
      .filter((item) => (status ? item.status === status : true));
  };

  const createPharmacyOrder = async (payload) => {
    if (backendMode === 'mysql') {
      const [result] = await mysqlPool.query(
        `INSERT INTO pharmacy_orders
        (pharmacy_name, patient_name, patient_phone, medicine, quantity, notes, location_label, status, remaining_seconds)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          payload.pharmacyName,
          payload.patientName,
          payload.patientPhone,
          payload.medicine,
          payload.quantity,
          payload.notes || '',
          payload.locationLabel || '',
          payload.status || 'pending',
          payload.remainingSeconds ?? 2400,
        ]
      );
      const [rows] = await mysqlPool.query('SELECT * FROM pharmacy_orders WHERE id = ? LIMIT 1', [result.insertId]);
      return mapPharmacyOrderRow(rows[0]);
    }
    const item = {
      id: pharmacyOrderIdCounter++,
      pharmacyName: payload.pharmacyName,
      patientName: payload.patientName,
      patientPhone: payload.patientPhone || '',
      medicine: payload.medicine,
      quantity: payload.quantity,
      notes: payload.notes || '',
      locationLabel: payload.locationLabel || '',
      status: payload.status || 'pending',
      remainingSeconds: payload.remainingSeconds ?? 2400,
      createdAt: new Date().toLocaleString(),
    };
    pharmacyOrders.unshift(item);
    return item;
  };

  const updatePharmacyOrderStatus = async (id, status) => {
    if (backendMode === 'mysql') {
      const [rows] = await mysqlPool.query('SELECT * FROM pharmacy_orders WHERE id = ? LIMIT 1', [id]);
      if (rows.length === 0) {
        return null;
      }
      await mysqlPool.query(
        'UPDATE pharmacy_orders SET status = ?, remaining_seconds = CASE WHEN ? IN (\'completed\', \'rejected\') THEN 0 ELSE remaining_seconds END WHERE id = ?',
        [status, status, id]
      );
      const [updatedRows] = await mysqlPool.query('SELECT * FROM pharmacy_orders WHERE id = ? LIMIT 1', [id]);
      return mapPharmacyOrderRow(updatedRows[0]);
    }
    const idx = pharmacyOrders.findIndex((item) => item.id === id);
    if (idx < 0) {
      return null;
    }
    pharmacyOrders[idx] = {
      ...pharmacyOrders[idx],
      status,
      remainingSeconds: status === 'completed' || status === 'rejected' ? 0 : pharmacyOrders[idx].remainingSeconds,
    };
    return pharmacyOrders[idx];
  };

  const tickPharmacyOrders = async () => {
    if (backendMode === 'mysql') {
      await mysqlPool.query(
        `UPDATE pharmacy_orders
         SET remaining_seconds = GREATEST(0, remaining_seconds - 1)
         WHERE status IN ('pending', 'accepted') AND remaining_seconds > 0`
      );
      return;
    }
    pharmacyOrders = pharmacyOrders.map((item) => {
      if ((item.status === 'pending' || item.status === 'accepted') && item.remainingSeconds > 0) {
        return { ...item, remainingSeconds: item.remainingSeconds - 1 };
      }
      return item;
    });
  };

  const getCrashIncidents = async (limit = 50) => {
    const safeLimit = Math.max(1, Math.min(200, Number(limit) || 50));
    if (backendMode === 'mysql') {
      const [rows] = await mysqlPool.query(
        'SELECT * FROM crash_incidents ORDER BY created_at DESC LIMIT ?',
        [safeLimit]
      );
      return rows.map(mapCrashIncidentRow);
    }
    return crashIncidents.slice(0, safeLimit);
  };

  const createCrashIncident = async (payload) => {
    if (backendMode === 'mysql') {
      const [result] = await mysqlPool.query(
        `INSERT INTO crash_incidents (status, message) VALUES (?, ?)`,
        [payload.status, payload.message]
      );
      const [rows] = await mysqlPool.query('SELECT * FROM crash_incidents WHERE id = ? LIMIT 1', [result.insertId]);
      return mapCrashIncidentRow(rows[0]);
    }
    const item = {
      id: crashIncidentIdCounter++,
      status: payload.status,
      message: payload.message,
      createdAt: new Date().toLocaleString(),
    };
    crashIncidents.unshift(item);
    return item;
  };

  const getPortalSettings = async () => {
    if (backendMode === 'mysql') {
      const [rows] = await mysqlPool.query('SELECT * FROM portal_settings WHERE id = 1 LIMIT 1');
      if (rows.length === 0) {
        return {
          maintenanceMode: false,
          publicEnabled: true,
          hospitalEnabled: true,
          pharmacyEnabled: true,
        };
      }
      const row = rows[0];
      return {
        maintenanceMode: Boolean(row.maintenance_mode),
        publicEnabled: Boolean(row.public_enabled),
        hospitalEnabled: Boolean(row.hospital_enabled),
        pharmacyEnabled: Boolean(row.pharmacy_enabled),
      };
    }
    return { ...portalSettings };
  };

  const updatePortalSettings = async (payload) => {
    const next = {
      maintenanceMode: Boolean(payload.maintenanceMode),
      publicEnabled: Boolean(payload.publicEnabled),
      hospitalEnabled: Boolean(payload.hospitalEnabled),
      pharmacyEnabled: Boolean(payload.pharmacyEnabled),
    };
    if (backendMode === 'mysql') {
      await mysqlPool.query(
        `UPDATE portal_settings
         SET maintenance_mode = ?, public_enabled = ?, hospital_enabled = ?, pharmacy_enabled = ?
         WHERE id = 1`,
        [next.maintenanceMode ? 1 : 0, next.publicEnabled ? 1 : 0, next.hospitalEnabled ? 1 : 0, next.pharmacyEnabled ? 1 : 0]
      );
      return next;
    }
    portalSettings = next;
    return next;
  };

  const getAdminStats = async () => {
    if (backendMode === 'mysql') {
      const [[appointmentsPending]] = await mysqlPool.query("SELECT COUNT(*) AS count FROM appointments WHERE status = 'pending'");
      const [[prescriptionsCount]] = await mysqlPool.query('SELECT COUNT(*) AS count FROM prescriptions');
      const [[doctorQueriesPending]] = await mysqlPool.query("SELECT COUNT(*) AS count FROM doctor_queries WHERE status = 'pending'");
      const [[pharmacyPending]] = await mysqlPool.query("SELECT COUNT(*) AS count FROM pharmacy_orders WHERE status = 'pending'");
      const [[pharmacyAccepted]] = await mysqlPool.query("SELECT COUNT(*) AS count FROM pharmacy_orders WHERE status = 'accepted'");
      const [[pharmacyCompleted]] = await mysqlPool.query("SELECT COUNT(*) AS count FROM pharmacy_orders WHERE status = 'completed'");
      const [[crashCount]] = await mysqlPool.query('SELECT COUNT(*) AS count FROM crash_incidents');
      const [[activePharmacies]] = await mysqlPool.query('SELECT COUNT(DISTINCT pharmacy_name) AS count FROM pharmacy_orders');
      return {
        hospitalsRegistered: hospitals.length,
        pendingAppointments: Number(appointmentsPending.count),
        prescriptionsIssued: Number(prescriptionsCount.count),
        pendingDoctorQueries: Number(doctorQueriesPending.count),
        pendingPharmacyOrders: Number(pharmacyPending.count),
        acceptedPharmacyOrders: Number(pharmacyAccepted.count),
        completedPharmacyOrders: Number(pharmacyCompleted.count),
        crashIncidentCount: Number(crashCount.count),
        activePharmacyOps: Number(activePharmacies.count),
      };
    }
    return {
      hospitalsRegistered: hospitals.length,
      pendingAppointments: appointments.filter((item) => item.status === 'pending').length,
      prescriptionsIssued: prescriptions.length,
      pendingDoctorQueries: doctorQueries.filter((item) => item.status === 'pending').length,
      pendingPharmacyOrders: pharmacyOrders.filter((item) => item.status === 'pending').length,
      acceptedPharmacyOrders: pharmacyOrders.filter((item) => item.status === 'accepted').length,
      completedPharmacyOrders: pharmacyOrders.filter((item) => item.status === 'completed').length,
      crashIncidentCount: crashIncidents.length,
      activePharmacyOps: new Set(pharmacyOrders.map((item) => item.pharmacyName)).size,
    };
  };

  return {
    init,
    getMode,
    close: async () => {
      if (mysqlPool) {
        await mysqlPool.end();
      }
    },
    enrollFingerprint,
    hasFingerprintEnrollment,
    getAlerts,
    createAlert,
    updateAlertStatus,
    tickAlerts,
    addMinuteAlert,
    getReportReferrals,
    createReportReferral,
    getAppointments,
    createAppointment,
    updateAppointmentStatus,
    getPrescriptions,
    createPrescription,
    getDoctorQueries,
    createDoctorQuery,
    answerDoctorQuery,
    getPharmacyOrders,
    createPharmacyOrder,
    updatePharmacyOrderStatus,
    tickPharmacyOrders,
    getCrashIncidents,
    createCrashIncident,
    getPortalSettings,
    updatePortalSettings,
    getAdminStats,
    createBlockchainRecord,
    getBlockchainRecords,
    verifyBlockchainIntegrity,
  };
};
