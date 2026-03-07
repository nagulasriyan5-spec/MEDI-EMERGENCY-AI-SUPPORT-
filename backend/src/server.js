import 'dotenv/config';
import http from 'node:http';
import { URL } from 'node:url';
import { createDataStore } from './dataStore.js';
import { loadConfig } from './config.js';

const config = loadConfig();
const PORT = config.server.port;

const hospitals = [
  { id: 1, key: 'citygeneral', name: 'Government General Hospital' },
  { id: 2, key: 'osmania', name: 'Osmania General Hospital' },
  { id: 3, key: 'nims', name: 'NIMS Hospital' },
  { id: 4, key: 'gandhi', name: 'Gandhi Hospital' },
  { id: 5, key: 'apollo', name: 'Apollo Health City' },
  { id: 6, key: 'lifecare', name: 'Care Hospitals' },
  { id: 7, key: 'yashoda', name: 'Yashoda Hospitals' },
  { id: 8, key: 'kims', name: 'KIMS Hospitals' },
  { id: 9, key: 'continental', name: 'Continental Hospitals' },
  { id: 10, key: 'srisai', name: 'Sri Sai Hospital' },
  { id: 11, key: 'gleneagles', name: 'Gleneagles Global Hospitals' },
  { id: 12, key: 'aig', name: 'AIG Hospitals' },
];

const hospitalCredentials = Object.fromEntries(
  hospitals.map((hospital) => [hospital.key, 'hospital123'])
);
hospitalCredentials.citygeneral = 'hospital123';
hospitalCredentials.lifecare = 'lifecare123';
hospitalCredentials.apollo = 'apollo123';

const publicUsers = {
  public: 'public1234',
  user: 'user1234',
};

const responseWindowSeconds = 60;
const minAlertsPerHospital = 6;

const seededEmergencyPatientNames = [
  'Ramesh K', 'Sita Devi', 'Mohammed Ali', 'Anil R', 'Kavitha M', 'Rajesh T',
  'Nazia K', 'Meena P', 'Farhan S', 'Pooja N', 'Vikram S', 'Lakshmi G',
];
const severities = ['critical', 'moderate', 'normal'];
const store = createDataStore({
  hospitals,
  responseWindowSeconds,
  minAlertsPerHospital,
  seededEmergencyPatientNames,
  severities,
  mysqlConfig: config.mysql,
});

const sendJson = (res, statusCode, payload) => {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(payload));
};

const readJsonBody = (req) =>
  new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) {
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });

const inferCause = (normalizedText) => {
  if (normalizedText.includes('stroke') || normalizedText.includes('ischemia')) {
    return 'Likely cause: reduced blood supply to brain tissue.';
  }
  if (normalizedText.includes('hemorrhage') || normalizedText.includes('bleed')) {
    return 'Likely cause: active internal bleeding requiring urgent specialist review.';
  }
  if (normalizedText.includes('fracture')) {
    return 'Likely cause: trauma-related bone injury.';
  }
  if (normalizedText.includes('infection') || normalizedText.includes('abscess')) {
    return 'Likely cause: infectious process with inflammation.';
  }
  if (normalizedText.includes('edema')) {
    return 'Likely cause: tissue swelling due to inflammation or injury.';
  }
  if (normalizedText.includes('lesion') || normalizedText.includes('mass')) {
    return 'Likely cause: localized tissue abnormality that needs specialist diagnosis.';
  }
  return 'Likely cause: non-specific mild abnormality; correlate with symptoms and doctor assessment.';
};

const analyzeReportText = (inputText) => {
  const normalizedText = String(inputText || '').toLowerCase();
  const urgentSignals = ['hemorrhage', 'stroke', 'fracture', 'pneumothorax', 'critical'];
  const attentionSignals = ['inflammation', 'infection', 'edema', 'lesion', 'abnormal'];

  if (urgentSignals.some((term) => normalizedText.includes(term))) {
    return {
      severity: 'urgent',
      summary: 'High-risk findings detected in the report. Immediate specialist review is recommended.',
      nextSteps: [
        'Share the report with emergency/radiology immediately.',
        'Book the nearest hospital consultation in the next 60 minutes.',
        'Keep prior scan reports ready for comparison.',
      ],
      cause: inferCause(normalizedText),
    };
  }

  if (attentionSignals.some((term) => normalizedText.includes(term))) {
    return {
      severity: 'attention',
      summary: 'Report indicates moderate abnormalities that need a scheduled medical review.',
      nextSteps: [
        'Book an appointment with a specialist within 24 hours.',
        'Schedule a follow-up scan/test if advised.',
        'Track symptoms and carry this report to consultation.',
      ],
      cause: inferCause(normalizedText),
    };
  }

  return {
    severity: 'stable',
    summary: 'No high-risk keywords detected. Findings look stable based on provided text.',
    nextSteps: [
      'Continue routine follow-up with your doctor.',
      'Keep this report saved for future comparison.',
      'Use test appointments if additional diagnostics are needed.',
    ],
    cause: inferCause(normalizedText),
  };
};

const writeBlockchainAudit = async ({
  eventType,
  entityType,
  entityId,
  actor = 'system',
  hospitalId = 0,
  summary = '',
  payload = {},
}) => {
  try {
    await store.createBlockchainRecord({
      eventType,
      entityType,
      entityId,
      actor,
      hospitalId,
      summary,
      payload,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to persist blockchain audit record:', error instanceof Error ? error.message : error);
  }
};

const server = http.createServer(async (req, res) => {
  if (!req.url) {
    return sendJson(res, 400, { error: 'Missing URL' });
  }
  if (req.method === 'OPTIONS') {
    return sendJson(res, 200, { ok: true });
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  try {
    if (req.method === 'GET' && pathname === '/health') {
      return sendJson(res, 200, {
        ok: true,
        service: 'backend',
        mode: store.getMode(),
        timestamp: new Date().toISOString(),
      });
    }

    if (req.method === 'GET' && pathname === '/api/hospitals') {
      return sendJson(res, 200, { data: hospitals });
    }

    if (req.method === 'GET' && pathname === '/api/blockchain/records') {
      const limit = Number(url.searchParams.get('limit') || 50);
      const list = await store.getBlockchainRecords(limit);
      return sendJson(res, 200, { data: list });
    }

    if (req.method === 'GET' && pathname === '/api/blockchain/verify') {
      const verification = await store.verifyBlockchainIntegrity();
      return sendJson(res, 200, { data: verification });
    }

    if (req.method === 'POST' && pathname === '/api/blockchain/records') {
      const body = await readJsonBody(req);
      const record = await store.createBlockchainRecord({
        eventType: String(body.eventType || ''),
        entityType: String(body.entityType || ''),
        entityId: String(body.entityId || ''),
        actor: String(body.actor || 'system'),
        hospitalId: Number(body.hospitalId || 0),
        summary: String(body.summary || ''),
        payload: body.payload && typeof body.payload === 'object' ? body.payload : {},
      });
      return sendJson(res, 201, { data: record });
    }

    if (req.method === 'POST' && pathname === '/api/auth/hospital-login') {
      const body = await readJsonBody(req);
      const hospitalId = String(body.hospitalId || '').trim().toLowerCase();
      const password = String(body.password || '');

      if (!hospitalCredentials[hospitalId] || hospitalCredentials[hospitalId] !== password) {
        return sendJson(res, 401, { error: 'Invalid hospital credentials' });
      }

      const hospital = hospitals.find((item) => item.key === hospitalId) || null;
      return sendJson(res, 200, { ok: true, hospital });
    }

    if (req.method === 'POST' && pathname === '/api/auth/fingerprint-enroll') {
      const body = await readJsonBody(req);
      const hospitalId = String(body.hospitalId || '').trim().toLowerCase();
      if (!hospitalCredentials[hospitalId]) {
        return sendJson(res, 400, { error: 'Invalid hospital ID' });
      }
      await store.enrollFingerprint(hospitalId);
      return sendJson(res, 200, { ok: true, enrolled: true });
    }

    if (req.method === 'POST' && pathname === '/api/auth/fingerprint-verify') {
      const body = await readJsonBody(req);
      const hospitalId = String(body.hospitalId || '').trim().toLowerCase();
      const enrolled = await store.hasFingerprintEnrollment(hospitalId);
      if (!enrolled) {
        return sendJson(res, 400, { error: 'Fingerprint not enrolled for this hospital ID' });
      }
      const hospital = hospitals.find((item) => item.key === hospitalId) || null;
      return sendJson(res, 200, { ok: true, hospital });
    }

    if (req.method === 'POST' && pathname === '/api/auth/face-enroll') {
      const body = await readJsonBody(req);
      const hospitalId = String(body.hospitalId || '').trim().toLowerCase();
      if (!hospitalCredentials[hospitalId]) {
        return sendJson(res, 400, { error: 'Invalid hospital ID' });
      }
      return sendJson(res, 200, { ok: true, enrolled: true, mode: 'face' });
    }

    if (req.method === 'POST' && pathname === '/api/auth/face-verify') {
      const body = await readJsonBody(req);
      const hospitalId = String(body.hospitalId || '').trim().toLowerCase();
      if (!hospitalCredentials[hospitalId]) {
        return sendJson(res, 400, { error: 'Invalid hospital ID' });
      }
      const hospital = hospitals.find((item) => item.key === hospitalId) || null;
      return sendJson(res, 200, { ok: true, hospital, mode: 'face' });
    }

    if (req.method === 'POST' && pathname === '/api/auth/public-login') {
      const body = await readJsonBody(req);
      const username = String(body.username || '').trim().toLowerCase();
      const password = String(body.password || '');
      if (!username || password.length < 4) {
        return sendJson(res, 400, { error: 'Username and a 4+ character password are required' });
      }

      const knownPassword = publicUsers[username];
      if (knownPassword && knownPassword !== password) {
        return sendJson(res, 401, { error: 'Invalid public credentials' });
      }

      return sendJson(res, 200, { ok: true, user: { username } });
    }

    if (req.method === 'POST' && pathname === '/api/auth/public-biometric-enroll') {
      const body = await readJsonBody(req);
      const mode = String(body.mode || '').trim().toLowerCase();
      const username = String(body.username || '').trim().toLowerCase();
      if (!['fingerprint', 'face'].includes(mode)) {
        return sendJson(res, 400, { error: 'Invalid biometric mode' });
      }
      if (!username) {
        return sendJson(res, 400, { error: 'Username is required for biometric enrollment' });
      }
      return sendJson(res, 200, { ok: true, enrolled: true, mode, user: { username } });
    }

    if (req.method === 'POST' && pathname === '/api/auth/public-biometric-verify') {
      const body = await readJsonBody(req);
      const mode = String(body.mode || '').trim().toLowerCase();
      const username = String(body.username || '').trim().toLowerCase();
      if (!['fingerprint', 'face'].includes(mode)) {
        return sendJson(res, 400, { error: 'Invalid biometric mode' });
      }
      if (!username) {
        return sendJson(res, 400, { error: 'Username is required for biometric verify' });
      }
      return sendJson(res, 200, { ok: true, user: { username }, mode });
    }

    if (req.method === 'GET' && pathname === '/api/alerts') {
      const hospitalIdParam = Number(url.searchParams.get('hospitalId') || 0);
      const list = await store.getAlerts(hospitalIdParam);
      return sendJson(res, 200, { data: list });
    }

    if (req.method === 'POST' && pathname === '/api/alerts') {
      const body = await readJsonBody(req);
      const hospitalId = Number(body.hospitalId || 0);
      if (!hospitalId) {
        return sendJson(res, 400, { error: 'hospitalId is required' });
      }
      const alert = await store.createAlert({
        hospitalId,
        patient: String(body.patient || 'Unknown Patient'),
        severity: String(body.severity || 'moderate'),
      });
      await writeBlockchainAudit({
        eventType: 'create',
        entityType: 'emergency_alert',
        entityId: String(alert.id),
        actor: 'hospital',
        hospitalId,
        summary: `Emergency alert created with ${alert.severity} severity.`,
        payload: { status: alert.status },
      });
      return sendJson(res, 201, { data: alert });
    }

    if (req.method === 'PATCH' && pathname.startsWith('/api/alerts/')) {
      const id = Number(pathname.split('/').pop() || 0);
      const body = await readJsonBody(req);
      const status = String(body.status || '').toLowerCase();
      if (!['accepted', 'rejected', 'pending'].includes(status)) {
        return sendJson(res, 400, { error: 'Invalid status' });
      }
      const updated = await store.updateAlertStatus(id, status);
      if (!updated) {
        return sendJson(res, 404, { error: 'Alert not found' });
      }
      await writeBlockchainAudit({
        eventType: 'update_status',
        entityType: 'emergency_alert',
        entityId: String(updated.id),
        actor: 'hospital',
        hospitalId: updated.hospitalId,
        summary: `Emergency alert status set to ${status}.`,
        payload: { status },
      });
      return sendJson(res, 200, { data: updated });
    }

    if (req.method === 'POST' && pathname === '/api/report-analysis') {
      const body = await readJsonBody(req);
      const reportText = String(body.reportText || '');
      return sendJson(res, 200, { data: analyzeReportText(reportText) });
    }

    if (req.method === 'GET' && pathname === '/api/report-referrals') {
      const hospitalIdParam = Number(url.searchParams.get('hospitalId') || 0);
      const list = await store.getReportReferrals(hospitalIdParam);
      return sendJson(res, 200, { data: list });
    }

    if (req.method === 'POST' && pathname === '/api/report-referrals') {
      const body = await readJsonBody(req);
      const referral = await store.createReportReferral({
        hospitalId: Number(body.hospitalId || 0),
        hospitalName: String(body.hospitalName || ''),
        patientName: String(body.patientName || 'Public User'),
        doctorSpecialty: String(body.doctorSpecialty || 'General Medicine'),
        severity: String(body.severity || 'attention'),
        cause: String(body.cause || ''),
        summary: String(body.summary || ''),
        source: String(body.source || 'text'),
        reportExcerpt: String(body.reportExcerpt || ''),
      });
      await writeBlockchainAudit({
        eventType: 'create',
        entityType: 'report_referral',
        entityId: String(referral.id),
        actor: 'public',
        hospitalId: referral.hospitalId,
        summary: `Report referral created for ${referral.doctorSpecialty}.`,
        payload: { severity: referral.severity, source: referral.source },
      });
      return sendJson(res, 201, { data: referral });
    }

    if (req.method === 'GET' && pathname === '/api/appointments') {
      const hospitalIdParam = Number(url.searchParams.get('hospitalId') || 0);
      const list = await store.getAppointments(hospitalIdParam);
      return sendJson(res, 200, { data: list });
    }

    if (req.method === 'POST' && pathname === '/api/appointments') {
      const body = await readJsonBody(req);
      const hospitalId = Number(body.hospitalId || 0);
      const patientName = String(body.patientName || '').trim();
      const appointmentAt = String(body.appointmentAt || '').trim();
      if (!hospitalId || !patientName || !appointmentAt) {
        return sendJson(res, 400, { error: 'hospitalId, patientName and appointmentAt are required' });
      }
      const selectedHospital = hospitals.find((item) => item.id === hospitalId);
      const appointment = await store.createAppointment({
        hospitalId,
        hospitalName: selectedHospital?.name || String(body.hospitalName || 'Unknown Hospital'),
        patientName,
        contactNumber: String(body.contactNumber || ''),
        reason: String(body.reason || ''),
        appointmentAt,
      });
      await writeBlockchainAudit({
        eventType: 'create',
        entityType: 'appointment',
        entityId: String(appointment.id),
        actor: 'public',
        hospitalId,
        summary: 'Appointment request created.',
        payload: { status: appointment.status, appointmentAt },
      });
      return sendJson(res, 201, { data: appointment });
    }

    if (req.method === 'PATCH' && pathname.startsWith('/api/appointments/')) {
      const id = Number(pathname.split('/').pop() || 0);
      const body = await readJsonBody(req);
      const status = String(body.status || '').trim().toLowerCase();
      if (!['pending', 'accepted', 'rejected', 'completed'].includes(status)) {
        return sendJson(res, 400, { error: 'Invalid status' });
      }
      const updated = await store.updateAppointmentStatus(id, status);
      if (!updated) {
        return sendJson(res, 404, { error: 'Appointment not found' });
      }
      await writeBlockchainAudit({
        eventType: 'update_status',
        entityType: 'appointment',
        entityId: String(updated.id),
        actor: 'hospital',
        hospitalId: updated.hospitalId,
        summary: `Appointment status changed to ${status}.`,
        payload: { status },
      });
      return sendJson(res, 200, { data: updated });
    }

    if (req.method === 'GET' && pathname === '/api/prescriptions') {
      const hospitalIdParam = Number(url.searchParams.get('hospitalId') || 0);
      const patientNameParam = String(url.searchParams.get('patientName') || '').trim().toLowerCase();
      const list = await store.getPrescriptions({
        hospitalId: hospitalIdParam || 0,
        patientName: patientNameParam,
      });
      return sendJson(res, 200, { data: list });
    }

    if (req.method === 'POST' && pathname === '/api/prescriptions') {
      const body = await readJsonBody(req);
      const hospitalId = Number(body.hospitalId || 0);
      const patientName = String(body.patientName || '').trim();
      if (!hospitalId || !patientName) {
        return sendJson(res, 400, { error: 'hospitalId and patientName are required' });
      }
      const selectedHospital = hospitals.find((item) => item.id === hospitalId);
      const prescription = await store.createPrescription({
        hospitalId,
        hospitalName: selectedHospital?.name || String(body.hospitalName || 'Unknown Hospital'),
        patientName,
        doctorName: String(body.doctorName || 'Duty Doctor'),
        medicines: String(body.medicines || ''),
        advice: String(body.advice || ''),
      });
      await writeBlockchainAudit({
        eventType: 'create',
        entityType: 'prescription',
        entityId: String(prescription.id),
        actor: 'hospital',
        hospitalId,
        summary: 'Prescription issued.',
        payload: { doctorName: prescription.doctorName },
      });
      return sendJson(res, 201, { data: prescription });
    }

    if (req.method === 'GET' && pathname === '/api/doctor-queries') {
      const hospitalIdParam = Number(url.searchParams.get('hospitalId') || 0);
      const patientNameParam = String(url.searchParams.get('patientName') || '').trim().toLowerCase();
      const list = await store.getDoctorQueries({
        hospitalId: hospitalIdParam || 0,
        patientName: patientNameParam,
      });
      return sendJson(res, 200, { data: list });
    }

    if (req.method === 'POST' && pathname === '/api/doctor-queries') {
      const body = await readJsonBody(req);
      const hospitalId = Number(body.hospitalId || 0);
      const patientName = String(body.patientName || '').trim();
      const department = String(body.department || '').trim();
      const disease = String(body.disease || '').trim();
      const question = String(body.question || '').trim();
      if (!hospitalId || !patientName || !department || !disease || !question) {
        return sendJson(res, 400, { error: 'hospitalId, patientName, department, disease and question are required' });
      }
      const selectedHospital = hospitals.find((item) => item.id === hospitalId);
      const doctorQuery = await store.createDoctorQuery({
        hospitalId,
        hospitalName: selectedHospital?.name || String(body.hospitalName || 'Unknown Hospital'),
        patientName,
        department,
        disease,
        question,
      });
      await writeBlockchainAudit({
        eventType: 'create',
        entityType: 'doctor_query',
        entityId: String(doctorQuery.id),
        actor: 'public',
        hospitalId,
        summary: `Doctor query opened for ${department}.`,
        payload: { status: doctorQuery.status },
      });
      return sendJson(res, 201, { data: doctorQuery });
    }

    if (req.method === 'PATCH' && pathname.startsWith('/api/doctor-queries/')) {
      const id = Number(pathname.split('/').pop() || 0);
      const body = await readJsonBody(req);
      const doctorName = String(body.doctorName || '').trim();
      const answer = String(body.answer || '').trim();
      if (!doctorName || !answer) {
        return sendJson(res, 400, { error: 'doctorName and answer are required' });
      }
      const updated = await store.answerDoctorQuery(id, { doctorName, answer });
      if (!updated) {
        return sendJson(res, 404, { error: 'Doctor query not found' });
      }
      await writeBlockchainAudit({
        eventType: 'answer',
        entityType: 'doctor_query',
        entityId: String(updated.id),
        actor: doctorName,
        hospitalId: updated.hospitalId,
        summary: 'Doctor query answered.',
        payload: { status: updated.status },
      });
      return sendJson(res, 200, { data: updated });
    }

    if (req.method === 'GET' && pathname === '/api/pharmacy-orders') {
      const pharmacyName = String(url.searchParams.get('pharmacyName') || '').trim();
      const status = String(url.searchParams.get('status') || '').trim().toLowerCase();
      const list = await store.getPharmacyOrders({
        pharmacyName: pharmacyName || '',
        status: status || '',
      });
      return sendJson(res, 200, { data: list });
    }

    if (req.method === 'POST' && pathname === '/api/pharmacy-orders') {
      const body = await readJsonBody(req);
      const pharmacyName = String(body.pharmacyName || '').trim();
      const patientName = String(body.patientName || '').trim();
      const medicine = String(body.medicine || '').trim();
      const quantity = Number(body.quantity || 0);
      if (!pharmacyName || !patientName || !medicine || quantity <= 0) {
        return sendJson(res, 400, { error: 'pharmacyName, patientName, medicine and quantity are required' });
      }
      const item = await store.createPharmacyOrder({
        pharmacyName,
        patientName,
        patientPhone: String(body.patientPhone || '').trim(),
        medicine,
        quantity,
        notes: String(body.notes || ''),
        locationLabel: String(body.locationLabel || ''),
        status: String(body.status || 'pending'),
        remainingSeconds: Number(body.remainingSeconds || 2400),
      });
      await writeBlockchainAudit({
        eventType: 'create',
        entityType: 'pharmacy_order',
        entityId: String(item.id),
        actor: 'public',
        summary: `Emergency medicine order created for ${item.pharmacyName}.`,
        payload: { status: item.status, quantity: item.quantity },
      });
      return sendJson(res, 201, { data: item });
    }

    if (req.method === 'PATCH' && pathname.startsWith('/api/pharmacy-orders/')) {
      const id = Number(pathname.split('/').pop() || 0);
      const body = await readJsonBody(req);
      const status = String(body.status || '').trim().toLowerCase();
      if (!['pending', 'accepted', 'completed', 'rejected'].includes(status)) {
        return sendJson(res, 400, { error: 'Invalid status' });
      }
      const updated = await store.updatePharmacyOrderStatus(id, status);
      if (!updated) {
        return sendJson(res, 404, { error: 'Pharmacy order not found' });
      }
      await writeBlockchainAudit({
        eventType: 'update_status',
        entityType: 'pharmacy_order',
        entityId: String(updated.id),
        actor: 'pharmacy',
        summary: `Pharmacy order status changed to ${status}.`,
        payload: { status },
      });
      return sendJson(res, 200, { data: updated });
    }

    if (req.method === 'GET' && pathname === '/api/crash-incidents') {
      const limit = Number(url.searchParams.get('limit') || 50);
      const list = await store.getCrashIncidents(limit);
      return sendJson(res, 200, { data: list });
    }

    if (req.method === 'POST' && pathname === '/api/crash-incidents') {
      const body = await readJsonBody(req);
      const status = String(body.status || '').trim().toLowerCase();
      const message = String(body.message || '').trim();
      if (!['detected', 'dispatched', 'cancelled'].includes(status) || !message) {
        return sendJson(res, 400, { error: 'Valid status and message are required' });
      }
      const created = await store.createCrashIncident({ status, message });
      await writeBlockchainAudit({
        eventType: 'create',
        entityType: 'crash_incident',
        entityId: String(created.id),
        actor: 'public',
        summary: `Crash incident logged as ${status}.`,
        payload: { status },
      });
      return sendJson(res, 201, { data: created });
    }

    if (req.method === 'GET' && pathname === '/api/portal-settings') {
      const settings = await store.getPortalSettings();
      return sendJson(res, 200, { data: settings });
    }

    if (req.method === 'PATCH' && pathname === '/api/portal-settings') {
      const body = await readJsonBody(req);
      const updated = await store.updatePortalSettings({
        maintenanceMode: Boolean(body.maintenanceMode),
        publicEnabled: Boolean(body.publicEnabled),
        hospitalEnabled: Boolean(body.hospitalEnabled),
        pharmacyEnabled: Boolean(body.pharmacyEnabled),
      });
      await writeBlockchainAudit({
        eventType: 'update',
        entityType: 'portal_settings',
        entityId: 'global',
        actor: 'admin',
        summary: 'Portal governance settings updated.',
        payload: updated,
      });
      return sendJson(res, 200, { data: updated });
    }

    if (req.method === 'GET' && pathname === '/api/admin/stats') {
      const stats = await store.getAdminStats();
      return sendJson(res, 200, { data: stats });
    }

    return sendJson(res, 404, { error: 'Not found' });
  } catch (error) {
    return sendJson(res, 500, { error: error instanceof Error ? error.message : 'Server error' });
  }
});

const startServer = async () => {
  await store.init();

  const tickInterval = setInterval(() => {
    store.tickAlerts().catch((error) => {
      // eslint-disable-next-line no-console
      console.error('Failed to update alert timers:', error instanceof Error ? error.message : error);
    });
    store.tickPharmacyOrders().catch((error) => {
      // eslint-disable-next-line no-console
      console.error('Failed to update pharmacy order timers:', error instanceof Error ? error.message : error);
    });
  }, config.jobs.alertTickMs);

  const minuteInterval = setInterval(() => {
    store.addMinuteAlert().catch((error) => {
      // eslint-disable-next-line no-console
      console.error('Failed to generate minute alert:', error instanceof Error ? error.message : error);
    });
  }, config.jobs.alertGenerateMs);

  const shutdown = async (signal) => {
    // eslint-disable-next-line no-console
    console.log(`Received ${signal}. Shutting down gracefully...`);
    clearInterval(tickInterval);
    clearInterval(minuteInterval);
    server.close(async () => {
      try {
        await store.close();
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error during datastore shutdown:', error instanceof Error ? error.message : error);
      }
      process.exit(0);
    });
  };

  process.on('SIGINT', () => {
    shutdown('SIGINT').catch((error) => {
      // eslint-disable-next-line no-console
      console.error('Shutdown failed:', error instanceof Error ? error.message : error);
      process.exit(1);
    });
  });
  process.on('SIGTERM', () => {
    shutdown('SIGTERM').catch((error) => {
      // eslint-disable-next-line no-console
      console.error('Shutdown failed:', error instanceof Error ? error.message : error);
      process.exit(1);
    });
  });

  server.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Backend running at http://localhost:${PORT}`);
    // eslint-disable-next-line no-console
    console.log(`Backend mode: ${store.getMode()}`);
  });
};

startServer().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start backend:', error instanceof Error ? error.message : error);
  process.exit(1);
});
