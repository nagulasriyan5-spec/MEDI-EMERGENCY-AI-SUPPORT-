export type Language = 'en' | 'hi' | 'te';

export interface Translations {
  appName: string;
  tagline: string;
  selectLanguage: string;
  publicPortal: string;
  hospitalDashboard: string;
  emergencyContacts: string;
  callNow: string;
  submit: string;
  cancel: string;
  back: string;
  next: string;
  save: string;
  close: string;
  loading: string;
  error: string;
  success: string;
  choosePortal: string;
  publicDesc: string;
  hospitalDesc: string;
  uploadPhoto: string;
  takePhoto: string;
  aiAnalyzing: string;
  injuryDetected: string;
  severity: string;
  accidentForm: string;
  patientForm: string;
  patientName: string;
  age: string;
  gender: string;
  bloodGroup: string;
  symptoms: string;
  injuries: string;
  location: string;
  contactNumber: string;
  emergencyType: string;
  analysisResults: string;
  recommendedAction: string;
  specialist: string;
  bloodRequired: string;
  units: string;
  firstAid: string;
  findHospital: string;
  distance: string;
  bedsAvailable: string;
  icuBeds: string;
  ventilators: string;
  ambulances: string;
  direction: string;
  bloodBank: string;
  bloodType: string;
  availability: string;
  dashboard: string;
  overview: string;
  emergencyAlerts: string;
  resources: string;
  updateStatus: string;
  accept: string;
  reject: string;
  ambulance: string;
  police: string;
  fire: string;
  womenHelpline: string;
  childHelpline: string;
  seniorHelpline: string;
  disaster: string;
  patentRights: string;
  critical: string;
  moderate: string;
  normal: string;
  formSubmitted: string;
  alertSent: string;
  hospitalNotified: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    appName: "Medi - EMERGENCY AI SUPPORT",
    tagline: "AI-Powered Emergency Medical Decision Support",
    selectLanguage: "Select Language",
    publicPortal: "Public Portal",
    hospitalDashboard: "Hospital Dashboard",
    emergencyContacts: "Emergency Contacts",
    callNow: "Call Now",
    submit: "Submit",
    cancel: "Cancel",
    back: "Back",
    next: "Next",
    save: "Save",
    close: "Close",
    loading: "Loading...",
    error: "Error",
    success: "Success",
    choosePortal: "Choose Your Portal",
    publicDesc: "For accident victims and bystanders",
    hospitalDesc: "For hospital staff and administrators",
    uploadPhoto: "Upload Injury Photo",
    takePhoto: "Take Photo",
    aiAnalyzing: "AI Analyzing...",
    injuryDetected: "Injury Detected",
    severity: "Severity",
    accidentForm: "Accident Report Form",
    patientForm: "Patient Information",
    patientName: "Patient Name",
    age: "Age",
    gender: "Gender",
    bloodGroup: "Blood Group",
    symptoms: "Symptoms",
    injuries: "Injuries",
    location: "Location",
    contactNumber: "Contact Number",
    emergencyType: "Emergency Type",
    analysisResults: "AI Analysis Results",
    recommendedAction: "Recommended Action",
    specialist: "Specialist",
    bloodRequired: "Blood Required",
    units: "Units",
    firstAid: "First Aid Instructions",
    findHospital: "Find Nearby Hospitals",
    distance: "Distance",
    bedsAvailable: "Beds Available",
    icuBeds: "ICU Beds",
    ventilators: "Ventilators",
    ambulances: "Ambulances",
    direction: "Get Directions",
    bloodBank: "Blood Bank Finder",
    bloodType: "Blood Type",
    availability: "Availability",
    dashboard: "Hospital Dashboard",
    overview: "Overview",
    emergencyAlerts: "Emergency Alerts",
    resources: "Resources",
    updateStatus: "Update Status",
    accept: "Accept",
    reject: "Reject",
    ambulance: "Ambulance",
    police: "Police",
    fire: "Fire Brigade",
    womenHelpline: "Women Helpline",
    childHelpline: "Child Helpline",
    seniorHelpline: "Senior Citizen Helpline",
    disaster: "Disaster Management",
    patentRights: "Patent Rights: NAGULA SRIYAN",
    critical: "Critical",
    moderate: "Moderate",
    normal: "Normal",
    formSubmitted: "Form submitted successfully!",
    alertSent: "Emergency alert sent!",
    hospitalNotified: "Hospitals have been notified!"
  },
  hi: {
    appName: "Medi - EMERGENCY AI SUPPORT",
    tagline: "AI-संचालित आपातकालीन चिकित्सा निर्णय समर्थन",
    selectLanguage: "भाषा चुनें",
    publicPortal: "सार्वजनिक पोर्टल",
    hospitalDashboard: "अस्पताल डैशबोर्ड",
    emergencyContacts: "आपातकालीन संपर्क",
    callNow: "अभी कॉल करें",
    submit: "जमा करें",
    cancel: "रद्द करें",
    back: "वापस",
    next: "आगे",
    save: "सहेजें",
    close: "बंद करें",
    loading: "लोड हो रहा है...",
    error: "त्रुटि",
    success: "सफल",
    choosePortal: "अपना पोर्टल चुनें",
    publicDesc: "दुर्घटना पीड़ितों और passerby के लिए",
    hospitalDesc: "अस्पताल कर्मचारियों और प्रशासकों के लिए",
    uploadPhoto: "चोट की फोटो अपलोड करें",
    takePhoto: "फोटो लें",
    aiAnalyzing: "AI विश्लेषण कर रहा है...",
    injuryDetected: "चोट का पता चला",
    severity: "गंभीरता",
    accidentForm: "दुर्घटना रिपोर्ट फॉर्म",
    patientForm: "रोगी की जानकारी",
    patientName: "रोगी का नाम",
    age: "उम्र",
    gender: "लिंग",
    bloodGroup: "ब्लड ग्रुप",
    symptoms: "लक्षण",
    injuries: "चोटें",
    location: "स्थान",
    contactNumber: "संपर्क नंबर",
    emergencyType: "आपातकालीन प्रकार",
    analysisResults: "AI विश्लेषण परिणाम",
    recommendedAction: "अनुशंसित कार्रवाई",
    specialist: "विशेषज्ञ",
    bloodRequired: "रक्त आवश्यक",
    units: "यूनिट",
    firstAid: "प्राथमिक चिकित्सा निर्देश",
    findHospital: "नजदीकी अस्पताल खोजें",
    distance: "दूरी",
    bedsAvailable: "बिस्तर उपलब्ध",
    icuBeds: "आईसीयू बिस्तर",
    ventilators: "वेंटिलेटर",
    ambulances: "एम्बुलेंस",
    direction: "दिशाएं प्राप्त करें",
    bloodBank: "ब्लड बैंक खोजक",
    bloodType: "ब्लड प्रकार",
    availability: "उपलब्धता",
    dashboard: "अस्पताल डैशबोर्ड",
    overview: "अवलोकन",
    emergencyAlerts: "आपातकालीन अलर्ट",
    resources: "संसाधन",
    updateStatus: "स्थिति अपडेट करें",
    accept: "स्वीकार करें",
    reject: "अस्वीकार करें",
    ambulance: "एम्बुलेंस",
    police: "पुलिस",
    fire: "फायर ब्रिगेड",
    womenHelpline: "महिला हेल्पलाइन",
    childHelpline: "बाल हेल्पलाइन",
    seniorHelpline: "वरिष्ठ नागरिक हेल्पलाइन",
    disaster: "आपदा प्रबंधन",
    patentRights: "पेटेंट अधिकार: NAGULA SRIYAN",
    critical: "गंभीर",
    moderate: "मध्यम",
    normal: "सामान्य",
    formSubmitted: "फॉर्म सफलतापूर्वक जमा किया गया!",
    alertSent: "आपातकालीन अलर्ट भेजा गया!",
    hospitalNotified: "अस्पतालों को सूचित कर दिया गया है!"
  },
  te: {
    appName: "Medi - EMERGENCY AI SUPPORT",
    tagline: "AI-ఆధారిత అత్యవసర వైద్య నిర్ణయ మద్దతు",
    selectLanguage: "భాష ఎంచుకోండి",
    publicPortal: "పబ్లిక్ పోర్టల్",
    hospitalDashboard: "ఆసుపత్రి డాష్‌బోర్డ్",
    emergencyContacts: "అత్యవసర సంప్రదింపులు",
    callNow: "ఇప్పుడే కాల్ చేయండి",
    submit: "సమర్పించండి",
    cancel: "రద్దు చేయండి",
    back: "వెనుకకు",
    next: "ముందుకు",
    save: "సేవ్ చేయండి",
    close: "మూసివేయండి",
    loading: "లోడ్ అవుతోంది...",
    error: "లోపం",
    success: "విజయం",
    choosePortal: "మీ పోర్టల్ ఎంచుకోండి",
    publicDesc: "ప్రమాద బాధితులు మరియు దారిపోయేవారి కోసం",
    hospitalDesc: "ఆసుపత్రి సిబ్బంది మరియు నిర్వాహకుల కోసం",
    uploadPhoto: "గాయం ఫోటో అప్‌లోడ్ చేయండి",
    takePhoto: "ఫోటో తీయండి",
    aiAnalyzing: "AI విశ్లేషిస్తోంది...",
    injuryDetected: "గాయం కనుగొనబడింది",
    severity: "తీవ్రత",
    accidentForm: "ప్రమాద నివేదిక ఫారమ్",
    patientForm: "రోగి సమాచారం",
    patientName: "రోగి పేరు",
    age: "వయస్సు",
    gender: "లింగం",
    bloodGroup: "బ్లడ్ గ్రూప్",
    symptoms: "లక్షణాలు",
    injuries: "గాయాలు",
    location: "స్థానం",
    contactNumber: "సంప్రదింపు నంబర్",
    emergencyType: "అత్యవసర రకం",
    analysisResults: "AI విశ్లేషణ ఫలితాలు",
    recommendedAction: "సిఫార్సు చేసిన చర్య",
    specialist: "నిపుణుడు",
    bloodRequired: "రక్తం అవసరం",
    units: "యూనిట్లు",
    firstAid: "ప్రాథమిక చికిత్స సూచనలు",
    findHospital: "సమీప ఆసుపత్రులను కనుగొనండి",
    distance: "దూరం",
    bedsAvailable: "బెడ్లు అందుబాటులో ఉన్నాయి",
    icuBeds: "ఐసీయూ బెడ్లు",
    ventilators: "వెంటిలేటర్లు",
    ambulances: "ఆంబులెన్సులు",
    direction: "దిశలను పొందండి",
    bloodBank: "బ్లడ్ బ్యాంక్ ఫైండర్",
    bloodType: "బ్లడ్ టైప్",
    availability: "అందుబాటు",
    dashboard: "ఆసుపత్రి డాష్‌బోర్డ్",
    overview: "అవలోకనం",
    emergencyAlerts: "అత్యవసర హెచ్చరికలు",
    resources: "వనరులు",
    updateStatus: "స్థితిని నవీకరించండి",
    accept: "ఆమోదించు",
    reject: "తిరస్కరించు",
    ambulance: "ఆంబులెన్స్",
    police: "పోలీసు",
    fire: "ఫైర్ బ్రిగేడ్",
    womenHelpline: "మహిళా హెల్ప్‌లైన్",
    childHelpline: "బాలల హెల్ప్‌లైన్",
    seniorHelpline: "జ్యేష్ఠ పౌరుల హెల్ప్‌లైన్",
    disaster: "అపద నిర్వహణ",
    patentRights: "పేటెంట్ హక్కులు: NAGULA SRIYAN",
    critical: "తీవ్రమైన",
    moderate: "మధ్యస్థం",
    normal: "సాధారణ",
    formSubmitted: "ఫారమ్ విజయవంతంగా సమర్పించబడింది!",
    alertSent: "అత్యవసర హెచ్చరిక పంపబడింది!",
    hospitalNotified: "ఆసుపత్రులకు తెలియజేయబడింది!"
  }
};
