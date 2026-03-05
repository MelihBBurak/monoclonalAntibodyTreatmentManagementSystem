import treatmentData from '../data/treatmentData.json';

export type DosageEntry = {
  value: string;
  frequency: number;
  forms: string[];
  prospectus: Record<string, string>;
};

export type DrugEntry = {
  dosages: DosageEntry[];
};

export type DrugInteraction = {
  drug: string;
  severity: 'Major' | 'Moderate' | 'Minor' | 'Informative';
  note: string;
};

export type CalendarReminders = {
  preDose: string;
  doseDay: string;
  day1: string;
  day2: string;
  day3: string;
  day4: string;
  day5: string;
  day6: string;
  generalMonitoring: string[];
};

export type AntibodyEntry = {
  label: string;
  mechanism: string;
  mechanismDetail: string;
  blackBoxWarning: string | null;
  diseases: string[];
  majorWarnings: string[];
  drugInteractions: DrugInteraction[];
  calendarReminders: CalendarReminders;
  monitoring: string[];
};

// Tüm antikor adlarını döndürür
export function getAntibodies(): string[] {
  return treatmentData.antibodies.map(a => a.label);
}

// Seçilen antikora göre hastalık listesini döndürür
export function getDiseasesForAntibody(antibody: string): string[] {
  const found = treatmentData.antibodies.find(a => a.label === antibody);
  return found ? found.diseases : [];
}

// Seçilen hastalığa göre ilaç listesini döndürür
export function getDrugsForDisease(disease: string): string[] {
  return (treatmentData.diseases as Record<string, string[]>)[disease] ?? [];
}

// Seçilen ilaca göre dozaj listesini döndürür
export function getDosagesForDrug(drug: string): string[] {
  const entry = (treatmentData.drugs as Record<string, DrugEntry>)[drug];
  return entry ? entry.dosages.map(d => d.value) : [];
}

// Seçilen ilaç + dozaja göre tam DosageEntry'yi döndürür
export function getDosageEntry(drug: string, dosageValue: string): DosageEntry | null {
  const entry = (treatmentData.drugs as Record<string, DrugEntry>)[drug];
  if (!entry) return null;
  return entry.dosages.find(d => d.value === dosageValue) ?? null;
}

// Seçilen ilaç + dozaja göre doz sıklığını döndürür
export function getFrequency(drug: string, dosageValue: string): number {
  return getDosageEntry(drug, dosageValue)?.frequency ?? 14;
}

// Seçilen ilaç + dozaja göre form listesini döndürür (boşsa form seçimi yok)
export function getFormsForDosage(drug: string, dosageValue: string): string[] {
  return getDosageEntry(drug, dosageValue)?.forms ?? [];
}

// Prospektüs URL'ini döndürür
// Form varsa forma göre, yoksa "default" anahtarını kullanır
export function getProspectusUrl(drug: string, dosageValue: string, form?: string): string {
  const entry = getDosageEntry(drug, dosageValue);
  if (!entry) return '';
  const p = entry.prospectus;
  if (form && p[form]) return p[form];
  return p['default'] ?? '';
}

// Seçilen antikora ait tam AntibodyEntry'yi döndürür
export function getAntibodyEntry(antibody: string): AntibodyEntry | null {
  const found = treatmentData.antibodies.find(a => a.label === antibody) as AntibodyEntry | undefined;
  return found ?? null;
}

// Seçilen antikora göre takvim hatırlatıcılarını döndürür
export function getCalendarReminders(antibody: string): CalendarReminders | null {
  const entry = getAntibodyEntry(antibody);
  return entry?.calendarReminders ?? null;
}

// Belirli bir gün offseti için hatırlatıcı metnini döndürür
// dayOffset: 0 = doz günü, -1 = doz öncesi, 1-6 = sonraki günler
export function getReminderForDay(antibody: string, dayOffset: number): string | null {
  const reminders = getCalendarReminders(antibody);
  if (!reminders) return null;

  switch (dayOffset) {
    case -1: return reminders.preDose;
    case 0:  return reminders.doseDay;
    case 1:  return reminders.day1;
    case 2:  return reminders.day2;
    case 3:  return reminders.day3;
    case 4:  return reminders.day4;
    case 5:  return reminders.day5;
    case 6:  return reminders.day6;
    default: return null;
  }
}

// Seçilen antikora göre ilaç etkileşimlerini döndürür
export function getDrugInteractions(antibody: string): DrugInteraction[] {
  const entry = getAntibodyEntry(antibody);
  return (entry?.drugInteractions ?? []) as DrugInteraction[];
}

// Seçilen antikora göre major uyarıları döndürür
export function getMajorWarnings(antibody: string): string[] {
  const entry = getAntibodyEntry(antibody);
  return entry?.majorWarnings ?? [];
}

// Seçilen antikora göre genel izlem önerilerini döndürür
export function getMonitoringRecommendations(antibody: string): string[] {
  const entry = getAntibodyEntry(antibody);
  return entry?.monitoring ?? [];
}

// Seçilen antikora göre kara kutu uyarısını döndürür
export function getBlackBoxWarning(antibody: string): string | null {
  const entry = getAntibodyEntry(antibody);
  return entry?.blackBoxWarning ?? null;
}

// Seçilen antikora göre mekanizma açıklamasını döndürür
export function getMechanismDetail(antibody: string): string {
  const entry = getAntibodyEntry(antibody);
  return entry?.mechanismDetail ?? '';
}
