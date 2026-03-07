import { spawn } from 'node:child_process';
import process from 'node:process';

const PORT = 5176;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const STARTUP_TIMEOUT_MS = 15000;
const POLL_INTERVAL_MS = 300;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const assertStatus = (response, expected, label, bodyText = '') => {
  if (response.status !== expected) {
    throw new Error(
      `${label} failed: expected ${expected}, received ${response.status}. Response: ${bodyText}`
    );
  }
};

const requestJson = async ({ method = 'GET', path, body }) => {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  return { response, data, text };
};

const waitForServer = async () => {
  const start = Date.now();
  while (Date.now() - start < STARTUP_TIMEOUT_MS) {
    try {
      const { response } = await requestJson({ path: '/health' });
      if (response.status === 200) {
        return;
      }
    } catch {
      // Ignore until timeout.
    }
    await sleep(POLL_INTERVAL_MS);
  }
  throw new Error(`Server did not become healthy at ${BASE_URL}/health within ${STARTUP_TIMEOUT_MS}ms`);
};

const runSmokeChecks = async () => {
  const checks = [];

  const health = await requestJson({ path: '/health' });
  assertStatus(health.response, 200, 'Health check', health.text);
  checks.push('health');

  const hospitals = await requestJson({ path: '/api/hospitals' });
  assertStatus(hospitals.response, 200, 'Get hospitals', hospitals.text);
  if (!Array.isArray(hospitals.data?.data) || hospitals.data.data.length === 0) {
    throw new Error('Hospitals payload is empty.');
  }
  checks.push('hospitals');

  const hospitalLogin = await requestJson({
    method: 'POST',
    path: '/api/auth/hospital-login',
    body: { hospitalId: 'citygeneral', password: 'hospital123' },
  });
  assertStatus(hospitalLogin.response, 200, 'Hospital login', hospitalLogin.text);
  checks.push('hospital-auth');

  const enrollFp = await requestJson({
    method: 'POST',
    path: '/api/auth/fingerprint-enroll',
    body: { hospitalId: 'citygeneral' },
  });
  assertStatus(enrollFp.response, 200, 'Fingerprint enroll', enrollFp.text);

  const verifyFp = await requestJson({
    method: 'POST',
    path: '/api/auth/fingerprint-verify',
    body: { hospitalId: 'citygeneral' },
  });
  assertStatus(verifyFp.response, 200, 'Fingerprint verify', verifyFp.text);

  const enrollFace = await requestJson({
    method: 'POST',
    path: '/api/auth/face-enroll',
    body: { hospitalId: 'citygeneral' },
  });
  assertStatus(enrollFace.response, 200, 'Face enroll', enrollFace.text);

  const verifyFace = await requestJson({
    method: 'POST',
    path: '/api/auth/face-verify',
    body: { hospitalId: 'citygeneral' },
  });
  assertStatus(verifyFace.response, 200, 'Face verify', verifyFace.text);

  const publicLogin = await requestJson({
    method: 'POST',
    path: '/api/auth/public-login',
    body: { username: 'public', password: 'public1234' },
  });
  assertStatus(publicLogin.response, 200, 'Public login', publicLogin.text);

  const publicBiometricEnroll = await requestJson({
    method: 'POST',
    path: '/api/auth/public-biometric-enroll',
    body: { mode: 'fingerprint', username: 'public' },
  });
  assertStatus(publicBiometricEnroll.response, 200, 'Public biometric enroll', publicBiometricEnroll.text);

  const publicBiometricVerify = await requestJson({
    method: 'POST',
    path: '/api/auth/public-biometric-verify',
    body: { mode: 'fingerprint', username: 'public' },
  });
  assertStatus(publicBiometricVerify.response, 200, 'Public biometric verify', publicBiometricVerify.text);
  checks.push('public-auth');

  const alerts = await requestJson({ path: '/api/alerts?hospitalId=1' });
  assertStatus(alerts.response, 200, 'Get alerts', alerts.text);

  const createAlert = await requestJson({
    method: 'POST',
    path: '/api/alerts',
    body: { hospitalId: 1, patient: 'Smoke Patient', severity: 'critical' },
  });
  assertStatus(createAlert.response, 201, 'Create alert', createAlert.text);
  const createdAlertId = createAlert.data?.data?.id;

  const patchAlert = await requestJson({
    method: 'PATCH',
    path: `/api/alerts/${createdAlertId}`,
    body: { status: 'accepted' },
  });
  assertStatus(patchAlert.response, 200, 'Update alert status', patchAlert.text);
  checks.push('hospital-alerts');

  const analysis = await requestJson({
    method: 'POST',
    path: '/api/report-analysis',
    body: { reportText: 'Acute hemorrhage with edema and critical risk' },
  });
  assertStatus(analysis.response, 200, 'Analyze report', analysis.text);

  const referrals = await requestJson({ path: '/api/report-referrals?hospitalId=1' });
  assertStatus(referrals.response, 200, 'Get report referrals', referrals.text);

  const createReferral = await requestJson({
    method: 'POST',
    path: '/api/report-referrals',
    body: {
      hospitalId: 1,
      hospitalName: 'Government General Hospital',
      patientName: 'Public Smoke',
      doctorSpecialty: 'Neurology',
      severity: 'urgent',
      cause: 'Possible hemorrhage',
      summary: 'Urgent specialist review required',
      source: 'scan',
      reportExcerpt: 'CT Brain: Possible acute hemorrhage',
    },
  });
  assertStatus(createReferral.response, 201, 'Create report referral', createReferral.text);
  checks.push('report-referrals');

  const appointments = await requestJson({ path: '/api/appointments?hospitalId=1' });
  assertStatus(appointments.response, 200, 'Get appointments', appointments.text);

  const createAppointment = await requestJson({
    method: 'POST',
    path: '/api/appointments',
    body: {
      hospitalId: 1,
      patientName: 'Public Smoke',
      contactNumber: '9876543210',
      reason: 'General review',
      appointmentAt: '2026-03-20 10:30',
    },
  });
  assertStatus(createAppointment.response, 201, 'Create appointment', createAppointment.text);
  const appointmentId = createAppointment.data?.data?.id;

  const patchAppointment = await requestJson({
    method: 'PATCH',
    path: `/api/appointments/${appointmentId}`,
    body: { status: 'accepted' },
  });
  assertStatus(patchAppointment.response, 200, 'Update appointment status', patchAppointment.text);
  checks.push('appointments');

  const prescriptions = await requestJson({ path: '/api/prescriptions?hospitalId=1' });
  assertStatus(prescriptions.response, 200, 'Get prescriptions', prescriptions.text);

  const createPrescription = await requestJson({
    method: 'POST',
    path: '/api/prescriptions',
    body: {
      hospitalId: 1,
      patientName: 'Public Smoke',
      doctorName: 'Dr. Smoke',
      medicines: 'Paracetamol',
      advice: 'Hydration and rest',
    },
  });
  assertStatus(createPrescription.response, 201, 'Create prescription', createPrescription.text);
  checks.push('prescriptions');

  const doctorQueries = await requestJson({ path: '/api/doctor-queries?hospitalId=1' });
  assertStatus(doctorQueries.response, 200, 'Get doctor queries', doctorQueries.text);

  const createDoctorQuery = await requestJson({
    method: 'POST',
    path: '/api/doctor-queries',
    body: {
      hospitalId: 1,
      patientName: 'Public Smoke',
      department: 'Cardiology',
      disease: 'Hypertension',
      question: 'How to manage recurring spikes?',
    },
  });
  assertStatus(createDoctorQuery.response, 201, 'Create doctor query', createDoctorQuery.text);
  const doctorQueryId = createDoctorQuery.data?.data?.id;

  const patchDoctorQuery = await requestJson({
    method: 'PATCH',
    path: `/api/doctor-queries/${doctorQueryId}`,
    body: { doctorName: 'Dr. Smoke', answer: 'Monitor BP and continue medication.' },
  });
  assertStatus(patchDoctorQuery.response, 200, 'Answer doctor query', patchDoctorQuery.text);
  checks.push('doctor-queries');

  const pharmacyOrders = await requestJson({ path: '/api/pharmacy-orders' });
  assertStatus(pharmacyOrders.response, 200, 'Get pharmacy orders', pharmacyOrders.text);

  const createPharmacyOrder = await requestJson({
    method: 'POST',
    path: '/api/pharmacy-orders',
    body: {
      pharmacyName: 'Apollo Pharmacy',
      patientName: 'Public Smoke',
      medicine: 'Paracetamol 650mg',
      quantity: 2,
      patientPhone: '9999999999',
      notes: 'Urgent order',
      locationLabel: 'Hyderabad',
      status: 'pending',
      remainingSeconds: 2400,
    },
  });
  assertStatus(createPharmacyOrder.response, 201, 'Create pharmacy order', createPharmacyOrder.text);
  const pharmacyOrderId = createPharmacyOrder.data?.data?.id;

  const patchPharmacyOrder = await requestJson({
    method: 'PATCH',
    path: `/api/pharmacy-orders/${pharmacyOrderId}`,
    body: { status: 'accepted' },
  });
  assertStatus(patchPharmacyOrder.response, 200, 'Update pharmacy order', patchPharmacyOrder.text);
  checks.push('pharmacy-orders');

  const crashIncidents = await requestJson({ path: '/api/crash-incidents?limit=5' });
  assertStatus(crashIncidents.response, 200, 'Get crash incidents', crashIncidents.text);

  const createCrashIncident = await requestJson({
    method: 'POST',
    path: '/api/crash-incidents',
    body: { status: 'detected', message: 'Smoke crash test incident' },
  });
  assertStatus(createCrashIncident.response, 201, 'Create crash incident', createCrashIncident.text);
  checks.push('crash-incidents');

  const portalSettings = await requestJson({ path: '/api/portal-settings' });
  assertStatus(portalSettings.response, 200, 'Get portal settings', portalSettings.text);

  const patchPortalSettings = await requestJson({
    method: 'PATCH',
    path: '/api/portal-settings',
    body: {
      maintenanceMode: false,
      publicEnabled: true,
      hospitalEnabled: true,
      pharmacyEnabled: true,
    },
  });
  assertStatus(patchPortalSettings.response, 200, 'Update portal settings', patchPortalSettings.text);
  checks.push('portal-settings');

  const adminStats = await requestJson({ path: '/api/admin/stats' });
  assertStatus(adminStats.response, 200, 'Admin stats', adminStats.text);
  checks.push('admin-stats');

  const blockchainRecords = await requestJson({ path: '/api/blockchain/records?limit=5' });
  assertStatus(blockchainRecords.response, 200, 'Get blockchain records', blockchainRecords.text);

  const createBlockchainRecord = await requestJson({
    method: 'POST',
    path: '/api/blockchain/records',
    body: {
      eventType: 'smoke_test',
      entityType: 'system',
      entityId: `smoke-${Date.now()}`,
      actor: 'smoke-runner',
      hospitalId: 1,
      summary: 'Smoke test blockchain append',
      payload: { source: 'backend-smoke-test' },
    },
  });
  assertStatus(createBlockchainRecord.response, 201, 'Create blockchain record', createBlockchainRecord.text);

  const verifyBlockchain = await requestJson({ path: '/api/blockchain/verify' });
  assertStatus(verifyBlockchain.response, 200, 'Verify blockchain', verifyBlockchain.text);
  checks.push('blockchain');

  return checks;
};

const main = async () => {
  const serverProcess = spawn(process.execPath, ['src/server.js'], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: String(PORT), MYSQL_ENABLED: 'false' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let stdout = '';
  let stderr = '';

  serverProcess.stdout.on('data', (chunk) => {
    stdout += chunk.toString();
  });
  serverProcess.stderr.on('data', (chunk) => {
    stderr += chunk.toString();
  });

  try {
    await waitForServer();
    const checks = await runSmokeChecks();
    console.log('Smoke checks passed:', checks.join(', '));
  } finally {
    if (!serverProcess.killed) {
      serverProcess.kill('SIGTERM');
    }
    await sleep(700);
    if (!serverProcess.killed && serverProcess.exitCode === null) {
      serverProcess.kill('SIGKILL');
    }
    if (stderr.trim()) {
      console.error('Server stderr output:\n', stderr.trim());
    }
    if (stdout.trim()) {
      console.log('Server stdout output:\n', stdout.trim());
    }
  }
};

main().catch((error) => {
  console.error('Smoke test failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
