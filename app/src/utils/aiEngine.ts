export interface AIAnalysis {
  severity: 'critical' | 'moderate' | 'normal';
  confidence: number;
  bloodRequired: boolean;
  bloodType?: string;
  units?: number;
  specialist: string;
  recommendedAction: string;
  firstAid: string[];
  riskFactors: string[];
  priority: number;
}

export interface PatientData {
  age?: number;
  gender?: string;
  symptoms: string[];
  injuries?: string[];
  bloodPressure?: string;
  heartRate?: number;
  consciousness?: string;
  breathing?: string;
}

export const analyzeEmergency = (data: PatientData): AIAnalysis => {
  let severity: 'critical' | 'moderate' | 'normal' = 'normal';
  let confidence = 0.85;
  let bloodRequired = false;
  let bloodType: string | undefined;
  let units: number | undefined;
  let specialist = "General Physician";
  let priority = 3;
  const riskFactors: string[] = [];
  
  // Critical symptoms check
  const criticalSymptoms = [
    'chest pain', 'difficulty breathing', 'unconscious', 'severe bleeding',
    'head injury', 'seizure', 'stroke', 'heart attack', 'trauma'
  ];
  
  // Check for critical conditions
  const hasCriticalSymptom = data.symptoms.some(s => 
    criticalSymptoms.some(cs => s.toLowerCase().includes(cs))
  );
  
  if (hasCriticalSymptom || data.consciousness === 'unconscious') {
    severity = 'critical';
    confidence = 0.95;
    priority = 1;
    specialist = "Emergency Medicine Specialist";
    
    if (data.symptoms.some(s => s.toLowerCase().includes('bleeding'))) {
      bloodRequired = true;
      bloodType = data.injuries?.find(i => i.includes('blood')) || 'O+';
      units = Math.floor(Math.random() * 3) + 2;
      riskFactors.push('Severe blood loss');
    }
    
    if (data.symptoms.some(s => s.toLowerCase().includes('chest'))) {
      specialist = "Cardiologist";
      riskFactors.push('Possible cardiac event');
    }
    
    if (data.symptoms.some(s => s.toLowerCase().includes('head'))) {
      specialist = "Neurosurgeon";
      riskFactors.push('Head trauma');
    }
  } else if (data.symptoms.length >= 3 || data.heartRate && (data.heartRate > 100 || data.heartRate < 60)) {
    severity = 'moderate';
    confidence = 0.80;
    priority = 2;
    specialist = "General Surgeon";
  }
  
  // First aid based on severity
  const firstAid = getFirstAidInstructions(severity);
  
  return {
    severity,
    confidence,
    bloodRequired,
    bloodType,
    units,
    specialist,
    recommendedAction: getRecommendedAction(severity),
    firstAid,
    riskFactors,
    priority
  };
};

const getFirstAidInstructions = (severity: string): string[] => {
  if (severity === 'critical') {
    return [
      "Call 108 immediately for emergency ambulance",
      "Do not move the patient unless in immediate danger",
      "Check breathing and pulse",
      "If unconscious, place in recovery position",
      "Control any visible bleeding with direct pressure",
      "Stay with the patient until help arrives"
    ];
  } else if (severity === 'moderate') {
    return [
      "Call 102 for medical ambulance",
      "Keep patient lying down or in comfortable position",
      "Monitor vital signs if possible",
      "Do not give food or water",
      "Apply ice packs for swelling",
      "Keep patient warm"
    ];
  }
  
  return [
    "Clean any wounds with clean water",
    "Apply antiseptic if available",
    "Use bandages for cuts and scrapes",
    "Apply ice for bruises and swelling",
    "Monitor for any changes in condition",
    "Seek medical attention if symptoms worsen"
  ];
};

const getRecommendedAction = (severity: string): string => {
  switch (severity) {
    case 'critical':
      return "Immediate hospitalization required. Transport to nearest trauma center.";
    case 'moderate':
      return "Urgent medical attention needed. Visit emergency department within 1 hour.";
    default:
      return "Schedule appointment with primary care physician. Monitor symptoms.";
  }
};

export const analyzePhoto = (): Promise<{
  injuryType: string;
  severity: 'critical' | 'moderate' | 'normal';
  confidence: number;
  bodyPart: string;
  description: string;
}> => {
  // Mock AI photo analysis
  return new Promise((resolve) => {
    setTimeout(() => {
      const injuries = [
        { type: 'Cut/Laceration', part: 'Arm', severity: 'moderate' as const },
        { type: 'Bruise/Contusion', part: 'Leg', severity: 'normal' as const },
        { type: 'Burn', part: 'Hand', severity: 'moderate' as const },
        { type: 'Fracture', part: 'Leg', severity: 'critical' as const },
        { type: 'Sprain', part: 'Ankle', severity: 'normal' as const }
      ];
      
      const randomInjury = injuries[Math.floor(Math.random() * injuries.length)];
      
      resolve({
        injuryType: randomInjury.type,
        severity: randomInjury.severity,
        confidence: 0.75 + Math.random() * 0.2,
        bodyPart: randomInjury.part,
        description: `Detected ${randomInjury.type} on ${randomInjury.part} with ${randomInjury.severity} severity.`
      });
    }, 2000);
  });
};
