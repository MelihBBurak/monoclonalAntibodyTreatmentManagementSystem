import { useState } from 'react';
import {
  Text, View, TextInput, TouchableOpacity, ScrollView,
  Modal, Alert, StyleSheet, Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Calendar, DateData } from 'react-native-calendars';
import { COLORS, SHADOWS } from '../utils/styles';
import {
  getAntibodies,
  getDiseasesForAntibody,
  getDrugsForDisease,
  getDosagesForDrug,
  getFrequency,
  getFormsForDosage,
  getAntibodyEntry,
} from '../utils/treatmentDataService';

const { width } = Dimensions.get('window');

const STEPS = [
  { id: 1, label: 'Kişisel', icon: 'person' as const },
  { id: 2, label: 'Tedavi', icon: 'medical' as const },
  { id: 3, label: 'Takvim', icon: 'calendar' as const },
];

const FORM_LABELS: Record<string, string> = {
  enjektor: 'Enjektör',
  kalem: 'Kalem',
  toz: 'Toz',
};

const AboutScreen = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);

  const [antibodies] = useState<string[]>(getAntibodies());
  const [diseases, setDiseases] = useState<string[]>([]);
  const [drugs, setDrugs] = useState<string[]>([]);
  const [dosages, setDosages] = useState<string[]>([]);
  const [availableForms, setAvailableForms] = useState<string[]>([]);

  const [selectedAntibody, setSelectedAntibody] = useState('');
  const [selectedDisease, setSelectedDisease] = useState('');
  const [selectedDrug, setSelectedDrug] = useState('');
  const [selectedDosage, setSelectedDosage] = useState('');
  const [selectedFrequency, setSelectedFrequency] = useState(0);
  const [selectedForm, setSelectedForm] = useState('');

  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [age, setAge] = useState('');

  const [diseaseDuration, setDiseaseDuration] = useState('');
  const [diseaseDurationType, setDiseaseDurationType] = useState<'year' | 'month' | 'week'>('year');
  const [drugDuration, setDrugDuration] = useState('');
  const [drugDurationType, setDrugDurationType] = useState<'year' | 'month' | 'week'>('month');

  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  const [selectedStartDate, setSelectedStartDate] = useState('');

  // Step validation
  const step1Valid = name.trim().length > 0 && surname.trim().length > 0 && age.length > 0;
  const step2Valid =
    selectedAntibody !== '' &&
    selectedDisease !== '' &&
    selectedDrug !== '' &&
    selectedDosage !== '' &&
    (availableForms.length === 0 || selectedForm !== '');
  const step3Valid = diseaseDuration !== '' && drugDuration !== '' && selectedStartDate !== '';

  const handleAgeChange = (text: string) => {
    const num = parseInt(text);
    if (text === '' || (num >= 1 && num <= 120)) setAge(text);
  };

  const handleDurationChange = (text: string, type: 'year' | 'month' | 'week', setter: (v: string) => void) => {
    const num = parseInt(text);
    if (text === '') { setter(''); return; }
    let valid = false;
    if (type === 'year') valid = num >= 1 && num <= 99;
    else if (type === 'month') valid = num >= 1 && num <= 120;
    else valid = num >= 0 && num <= 520;
    if (valid) setter(text);
  };

  const handleAntibodyChange = (value: string) => {
    setSelectedAntibody(value);
    setSelectedDisease(''); setSelectedDrug(''); setSelectedDosage('');
    setSelectedFrequency(0); setAvailableForms([]); setSelectedForm('');
    setDiseases(value ? getDiseasesForAntibody(value) : []);
    setDrugs([]); setDosages([]);
  };

  const handleDiseaseChange = (value: string) => {
    setSelectedDisease(value);
    setSelectedDrug(''); setSelectedDosage('');
    setSelectedFrequency(0); setAvailableForms([]); setSelectedForm('');
    setDrugs(value ? getDrugsForDisease(value) : []);
    setDosages([]);
  };

  const handleDrugChange = (value: string) => {
    setSelectedDrug(value);
    setSelectedDosage(''); setSelectedFrequency(0);
    setAvailableForms([]); setSelectedForm('');
    setDosages(value ? getDosagesForDrug(value) : []);
  };

  const handleDosageChange = (value: string) => {
    setSelectedDosage(value);
    setSelectedForm('');
    if (value) {
      setSelectedFrequency(getFrequency(selectedDrug, value));
      setAvailableForms(getFormsForDosage(selectedDrug, value));
    } else {
      setSelectedFrequency(0); setAvailableForms([]);
    }
  };

  const handleNext = () => {
    if (currentStep === 1 && !step1Valid) {
      Alert.alert('Eksik Bilgi', 'Ad, soyad ve yaş alanlarını doldurun.');
      return;
    }
    if (currentStep === 2 && !step2Valid) {
      Alert.alert('Eksik Bilgi', 'Antikor, hastalık, ilaç ve dozaj seçimlerini tamamlayın.');
      return;
    }
    if (currentStep < 3) setCurrentStep(s => s + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(s => s - 1);
  };

  const handleSubmit = async () => {
    if (!step3Valid) {
      Alert.alert('Eksik Bilgi', 'Hastalık süresi, ilaç kullanım süresi ve başlangıç tarihini girin.');
      return;
    }
    try {
      const profileData = {
        name, surname, age,
        selectedAntibody, selectedDisease, selectedDrug, selectedDosage,
        diseaseDuration, diseaseDurationType, drugDuration, drugDurationType,
        startDate: selectedStartDate,
        frequency: String(selectedFrequency),
        selectedForm,
      };
      await AsyncStorage.setItem('@mabcare_profile', JSON.stringify(profileData));
      await router.replace({
        pathname: '/profile',
        params: profileData,
      });
    } catch {
      Alert.alert('Hata', 'Yönlendirme sırasında bir hata oluştu.');
    }
  };

  const formatDate = (d: string) => {
    if (!d) return '';
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
  };

  const getMinDate = () => {
    const d = new Date(); d.setMonth(d.getMonth() - 6);
    return d.toISOString().split('T')[0];
  };
  const getMaxDate = () => {
    const d = new Date(); d.setFullYear(d.getFullYear() + 2);
    return d.toISOString().split('T')[0];
  };

  // Antibody info chip
  const antibodyEntry = selectedAntibody ? getAntibodyEntry(selectedAntibody) : null;

  return (
    <LinearGradient colors={['#F5F7F5', '#FFFFFF']} style={styles.outer}>
      {/* Step Indicator */}
      <View style={styles.stepIndicatorWrapper}>
        {STEPS.map((step, idx) => {
          const done = currentStep > step.id;
          const active = currentStep === step.id;
          return (
            <View key={step.id} style={styles.stepRow}>
              <View style={styles.stepItemCol}>
                <View style={[
                  styles.stepCircle,
                  active && styles.stepCircleActive,
                  done && styles.stepCircleDone,
                ]}>
                  {done
                    ? <Ionicons name="checkmark" size={16} color="#FFF" />
                    : <Ionicons name={step.icon} size={16} color={active ? '#FFF' : COLORS.textMuted} />
                  }
                </View>
                <Text style={[styles.stepLabel, active && styles.stepLabelActive]}>{step.label}</Text>
              </View>
              {idx < STEPS.length - 1 && (
                <View style={[styles.stepLine, done && styles.stepLineDone]} />
              )}
            </View>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* STEP 1: Personal Info */}
        {currentStep === 1 && (
          <View style={styles.stepCard}>
            <View style={styles.stepCardHeader}>
              <View style={[styles.stepHeaderIcon, { backgroundColor: COLORS.primaryPale }]}>
                <Ionicons name="person" size={22} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.stepCardTitle}>Kişisel Bilgiler</Text>
                <Text style={styles.stepCardSubtitle}>Adınızı ve yaşınızı girin</Text>
              </View>
            </View>

            <View style={styles.inputRow}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.inputLabel}>Ad</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Adınız"
                  value={name}
                  onChangeText={setName}
                  placeholderTextColor={COLORS.textMuted}
                  autoCapitalize="words"
                  autoCorrect={false}
                  spellCheck={false}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Soyad</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Soyadınız"
                  value={surname}
                  onChangeText={setSurname}
                  placeholderTextColor={COLORS.textMuted}
                  autoCapitalize="words"
                  autoCorrect={false}
                  spellCheck={false}
                />
              </View>
            </View>

            <Text style={styles.inputLabel}>Yaş</Text>
            <TextInput
              style={styles.input}
              placeholder="Yaşınız (1–120)"
              value={age}
              onChangeText={handleAgeChange}
              keyboardType="numeric"
              placeholderTextColor={COLORS.textMuted}
              maxLength={3}
            />
          </View>
        )}

        {/* STEP 2: Treatment Selection */}
        {currentStep === 2 && (
          <View style={styles.stepCard}>
            <View style={styles.stepCardHeader}>
              <View style={[styles.stepHeaderIcon, { backgroundColor: COLORS.blueLight }]}>
                <Ionicons name="medical" size={22} color={COLORS.blue} />
              </View>
              <View>
                <Text style={styles.stepCardTitle}>Tedavi Bilgileri</Text>
                <Text style={styles.stepCardSubtitle}>İlacınızı ve dozajınızı seçin</Text>
              </View>
            </View>

            <Text style={styles.inputLabel}>Monoklonal Antikor</Text>
            <View style={styles.pickerWrap}>
              <Picker
                selectedValue={selectedAntibody}
                style={styles.picker}
                onValueChange={handleAntibodyChange}
                dropdownIconColor={COLORS.primary}
              >
                <Picker.Item label="Antikor Seçin..." value="" />
                {antibodies.map(a => <Picker.Item key={a} label={a} value={a} />)}
              </Picker>
            </View>

            {antibodyEntry && (
              <View style={styles.mechanismChip}>
                <Ionicons name="flask" size={14} color={COLORS.teal} />
                <Text style={styles.mechanismChipText} numberOfLines={2}>
                  {antibodyEntry.mechanism}
                </Text>
              </View>
            )}

            <Text style={[styles.inputLabel, { marginTop: 4 }]}>Hastalık</Text>
            <View style={[styles.pickerWrap, !selectedAntibody && styles.pickerDisabled]}>
              <Picker
                selectedValue={selectedDisease}
                style={styles.picker}
                onValueChange={handleDiseaseChange}
                dropdownIconColor={COLORS.primary}
                enabled={!!selectedAntibody}
              >
                <Picker.Item label={selectedAntibody ? "Hastalık Seçin..." : "Önce antikor seçin"} value="" />
                {diseases.map(d => <Picker.Item key={d} label={d} value={d} />)}
              </Picker>
            </View>

            <Text style={[styles.inputLabel, { marginTop: 4 }]}>İlaç (Marka Adı)</Text>
            <View style={[styles.pickerWrap, !selectedDisease && styles.pickerDisabled]}>
              <Picker
                selectedValue={selectedDrug}
                style={styles.picker}
                onValueChange={handleDrugChange}
                dropdownIconColor={COLORS.primary}
                enabled={!!selectedDisease}
              >
                <Picker.Item label={selectedDisease ? "İlaç Seçin..." : "Önce hastalık seçin"} value="" />
                {drugs.map(d => <Picker.Item key={d} label={d} value={d} />)}
              </Picker>
            </View>

            <Text style={[styles.inputLabel, { marginTop: 4 }]}>Dozaj</Text>
            <View style={[styles.pickerWrap, !selectedDrug && styles.pickerDisabled]}>
              <Picker
                selectedValue={selectedDosage}
                style={styles.picker}
                onValueChange={handleDosageChange}
                dropdownIconColor={COLORS.primary}
                enabled={!!selectedDrug}
              >
                <Picker.Item label={selectedDrug ? "Dozaj Seçin..." : "Önce ilaç seçin"} value="" />
                {dosages.map(d => <Picker.Item key={d} label={d} value={d} />)}
              </Picker>
            </View>

            {availableForms.length > 0 && (
              <>
                <Text style={[styles.inputLabel, { marginTop: 4 }]}>Uygulama Formu</Text>
                <View style={styles.formButtonsRow}>
                  {availableForms.map(f => (
                    <TouchableOpacity
                      key={f}
                      style={[styles.formButton, selectedForm === f && styles.formButtonActive]}
                      onPress={() => setSelectedForm(f)}
                    >
                      <Ionicons
                        name={f === 'kalem' ? 'pencil' : f === 'toz' ? 'beaker' : 'water'}
                        size={18}
                        color={selectedForm === f ? '#FFF' : COLORS.primary}
                      />
                      <Text style={[styles.formButtonText, selectedForm === f && styles.formButtonTextActive]}>
                        {FORM_LABELS[f] || f}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {selectedFrequency > 0 && (
              <View style={styles.freqBadge}>
                <Ionicons name="repeat" size={18} color={COLORS.primary} />
                <Text style={styles.freqBadgeText}>
                  Her {selectedFrequency} günde bir doz
                </Text>
              </View>
            )}

            {antibodyEntry?.blackBoxWarning && (
              <View style={styles.blackBoxBanner}>
                <Ionicons name="warning" size={18} color={COLORS.danger} />
                <Text style={styles.blackBoxText} numberOfLines={3}>
                  ⬛ KARA KUTU UYARISI: {antibodyEntry.blackBoxWarning}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* STEP 3: Duration & Schedule */}
        {currentStep === 3 && (
          <View style={styles.stepCard}>
            <View style={styles.stepCardHeader}>
              <View style={[styles.stepHeaderIcon, { backgroundColor: '#F3E5F5' }]}>
                <Ionicons name="calendar" size={22} color="#7B1FA2" />
              </View>
              <View>
                <Text style={styles.stepCardTitle}>Süre & Takvim</Text>
                <Text style={styles.stepCardSubtitle}>Tedavi sürenizi ve başlangıç gününüzü belirleyin</Text>
              </View>
            </View>

            <Text style={styles.inputLabel}>Hastalık Süresi</Text>
            <View style={styles.durationRow}>
              <View style={[styles.pickerWrap, { flex: 1, marginRight: 10 }]}>
                <Picker
                  selectedValue={diseaseDurationType}
                  style={styles.picker}
                  onValueChange={(v: 'year' | 'month' | 'week') => { setDiseaseDurationType(v); setDiseaseDuration(''); }}
                  dropdownIconColor={COLORS.primary}
                >
                  <Picker.Item label="Yıl" value="year" />
                  <Picker.Item label="Ay" value="month" />
                  <Picker.Item label="Hafta" value="week" />
                </Picker>
              </View>
              <TextInput
                style={[styles.input, { flex: 1.5 }]}
                placeholder={
                  diseaseDurationType === 'year' ? '1–99 yıl' :
                  diseaseDurationType === 'month' ? '1–120 ay' : '0–520 hafta'
                }
                value={diseaseDuration}
                onChangeText={t => handleDurationChange(t, diseaseDurationType, setDiseaseDuration)}
                keyboardType="numeric"
                placeholderTextColor={COLORS.textMuted}
                maxLength={3}
              />
            </View>

            <Text style={[styles.inputLabel, { marginTop: 4 }]}>İlaç Kullanım Süresi</Text>
            <View style={styles.durationRow}>
              <View style={[styles.pickerWrap, { flex: 1, marginRight: 10 }]}>
                <Picker
                  selectedValue={drugDurationType}
                  style={styles.picker}
                  onValueChange={(v: 'year' | 'month' | 'week') => { setDrugDurationType(v); setDrugDuration(''); }}
                  dropdownIconColor={COLORS.primary}
                >
                  <Picker.Item label="Yıl" value="year" />
                  <Picker.Item label="Ay" value="month" />
                  <Picker.Item label="Hafta" value="week" />
                </Picker>
              </View>
              <TextInput
                style={[styles.input, { flex: 1.5 }]}
                placeholder={
                  drugDurationType === 'year' ? '1–99 yıl' :
                  drugDurationType === 'month' ? '1–120 ay' : '0–520 hafta'
                }
                value={drugDuration}
                onChangeText={t => handleDurationChange(t, drugDurationType, setDrugDuration)}
                keyboardType="numeric"
                placeholderTextColor={COLORS.textMuted}
                maxLength={3}
              />
            </View>

            <Text style={[styles.inputLabel, { marginTop: 4 }]}>İlk Doz Tarihi</Text>
            <TouchableOpacity style={styles.dateBtn} onPress={() => setIsCalendarVisible(true)}>
              <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
              <Text style={[styles.dateBtnText, !selectedStartDate && { color: COLORS.textMuted }]}>
                {selectedStartDate ? formatDate(selectedStartDate) : 'Tarih seçin'}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>

            {/* Summary box */}
            {selectedStartDate && (
              <View style={styles.summaryBox}>
                <Text style={styles.summaryTitle}>Özet</Text>
                {[
                  { label: 'Antikor', value: selectedAntibody },
                  { label: 'Hastalık', value: selectedDisease },
                  { label: 'İlaç', value: selectedDrug },
                  { label: 'Dozaj', value: selectedDosage },
                  { label: 'Sıklık', value: `${selectedFrequency} günde bir` },
                  { label: 'Başlangıç', value: formatDate(selectedStartDate) },
                ].map((row, i, arr) => (
                  <View key={row.label} style={[styles.summaryRow, i === arr.length - 1 && { borderBottomWidth: 0 }]}>
                    <Text style={styles.summaryLabel}>{row.label}</Text>
                    <Text style={styles.summaryValue}>{row.value}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Navigation Buttons */}
        <View style={styles.navButtons}>
          {currentStep > 1 && (
            <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
              <Ionicons name="arrow-back" size={18} color={COLORS.primary} />
              <Text style={styles.backBtnText}>Geri</Text>
            </TouchableOpacity>
          )}
          <View style={{ flex: 1 }} />
          {currentStep < 3 ? (
            <TouchableOpacity
              style={[styles.nextBtn, !((currentStep === 1 ? step1Valid : step2Valid)) && styles.nextBtnDisabled]}
              onPress={handleNext}
            >
              <Text style={styles.nextBtnText}>Devam</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFF" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.nextBtn, !step3Valid && styles.nextBtnDisabled]}
              onPress={handleSubmit}
            >
              <Text style={styles.nextBtnText}>Profili Oluştur</Text>
              <Ionicons name="checkmark" size={18} color="#FFF" />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Calendar Modal */}
      <Modal visible={isCalendarVisible} transparent animationType="slide">
        <View style={styles.calModalOverlay}>
          <View style={styles.calModalBox}>
            <View style={styles.calModalHeader}>
              <Text style={styles.calModalTitle}>İlk Doz Tarihi</Text>
              <TouchableOpacity onPress={() => setIsCalendarVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <Calendar
              onDayPress={(day: DateData) => {
                setSelectedStartDate(day.dateString);
                setIsCalendarVisible(false);
              }}
              markedDates={{ [selectedStartDate]: { selected: true, selectedColor: COLORS.primary } }}
              minDate={getMinDate()}
              maxDate={getMaxDate()}
              theme={{
                todayTextColor: COLORS.primary,
                selectedDayBackgroundColor: COLORS.primary,
                arrowColor: COLORS.primary,
                dotColor: COLORS.primary,
                textDayFontWeight: '500',
                textMonthFontWeight: '700',
              }}
            />
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  outer: { flex: 1 },

  // Step indicator
  stepIndicatorWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  stepItemCol: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  stepCircleDone: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primaryLight,
  },
  stepLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
    fontWeight: '500',
  },
  stepLabelActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: COLORS.border,
    marginBottom: 18,
  },
  stepLineDone: {
    backgroundColor: COLORS.primaryLight,
  },

  // Card
  scrollContent: { padding: 16, paddingBottom: 40 },
  stepCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    ...{
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
  },
  stepCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  stepHeaderIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  stepCardSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  // Inputs
  inputRow: { flexDirection: 'row', marginBottom: 14 },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    color: COLORS.textPrimary,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginBottom: 14,
  },
  pickerWrap: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginBottom: 14,
  },
  pickerDisabled: { opacity: 0.5 },
  picker: { height: 52 },

  // Mechanism chip
  mechanismChip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.tealLight,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#B2DFDB',
  },
  mechanismChipText: {
    fontSize: 12,
    color: COLORS.teal,
    marginLeft: 6,
    fontWeight: '600',
    flex: 1,
    lineHeight: 18,
  },

  // Form buttons (enjektör / kalem / toz)
  formButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
    flexWrap: 'wrap',
  },
  formButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surface,
  },
  formButtonActive: {
    backgroundColor: COLORS.primary,
  },
  formButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: 6,
  },
  formButtonTextActive: { color: '#FFF' },

  // Frequency badge
  freqBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryPale,
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: '#C8E6C9',
    marginBottom: 14,
  },
  freqBadgeText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
    marginLeft: 8,
  },

  // Black box warning
  blackBoxBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.dangerLight,
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.danger,
    marginTop: 4,
  },
  blackBoxText: {
    fontSize: 12,
    color: COLORS.danger,
    flex: 1,
    marginLeft: 8,
    lineHeight: 18,
    fontWeight: '500',
  },

  // Duration row
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },

  // Date button
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginBottom: 16,
    gap: 10,
  },
  dateBtnText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },

  // Summary box
  summaryBox: {
    backgroundColor: COLORS.primaryPale,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#C8E6C9',
  },
  summaryLabel: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  summaryValue: { fontSize: 13, color: COLORS.textPrimary, fontWeight: '700' },

  // Nav buttons
  navButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    gap: 6,
  },
  backBtnText: { fontSize: 16, fontWeight: '600', color: COLORS.primary },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 8,
    ...{
      shadowColor: COLORS.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
  },
  nextBtnDisabled: { opacity: 0.5 },
  nextBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },

  // Calendar modal
  calModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  calModalBox: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
  },
  calModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calModalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AboutScreen;
