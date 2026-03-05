import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity,
  Modal, TextInput, Dimensions, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SHADOWS } from '../utils/styles';
import {
  getProspectusUrl,
  getReminderForDay,
  getBlackBoxWarning,
} from '../utils/treatmentDataService';

const { width } = Dimensions.get('window');
const CELL_SIZE = Math.floor((width - 40 - 12) / 7);

// ─── Takvim yardımcı ────────────────────────────────────────────────────────
const daysInMonth = (month: number, year: number): (number | null)[] => {
  const firstDay = new Date(year, month, 1).getDay();
  const count = new Date(year, month + 1, 0).getDate();
  const days: (number | null)[] = Array(firstDay === 0 ? 6 : firstDay - 1).fill(null);
  for (let d = 1; d <= count; d++) days.push(d);
  const rem = 42 - days.length;
  if (rem > 0) days.push(...Array(rem).fill(null));
  return days;
};

// ─── Gün türleri ────────────────────────────────────────────────────────────
const DAY_TYPES = {
  DOSE: {
    label: 'Doz Günü',
    shortDesc: 'İlacınızı bugün alın.',
    color: COLORS.primary,
    bgColor: COLORS.primaryPale,
    borderColor: '#A5D6A7',
    icon: 'medical' as const,
    image: require('../assets/images/reminder_dose.png'),
  },
  PREDOSE: {
    label: 'Doz Öncesi Uyarı',
    shortDesc: 'Yarın doz gününüz. Hazırlıklı olun.',
    color: COLORS.amber,
    bgColor: COLORS.amberLight,
    borderColor: COLORS.amberBorder,
    icon: 'notifications' as const,
    image: require('../assets/images/reminder_predose.png'),
  },
  SHOWER: {
    label: 'Duş / Su Teması',
    shortDesc: 'Enjeksiyon bölgesini 24 saat ıslatmayın.',
    color: '#0277BD',
    bgColor: COLORS.blueLight,
    borderColor: '#81D4FA',
    icon: 'water' as const,
    image: require('../assets/images/reminder_shower.png'),
  },
  SMOKE: {
    label: 'Sigara Uyarısı',
    shortDesc: 'Sigara tedavinin etkinliğini düşürür.',
    color: '#37474F',
    bgColor: '#ECEFF1',
    borderColor: '#B0BEC5',
    icon: 'close-circle' as const,
    image: require('../assets/images/reminder_smoke.png'),
  },
  ALCOHOL: {
    label: 'Alkol Uyarısı',
    shortDesc: 'Alkol bağışıklık sistemini zayıflatır.',
    color: '#6A1B9A',
    bgColor: '#F3E5F5',
    borderColor: '#CE93D8',
    icon: 'wine' as const,
    image: require('../assets/images/reminder_alcohol.png'),
  },
  FOOD: {
    label: 'Sağlıklı Beslenme',
    shortDesc: 'Anti-inflamatuvar beslenme önerileri.',
    color: COLORS.teal,
    bgColor: COLORS.tealLight,
    borderColor: '#80CBC4',
    icon: 'leaf' as const,
    image: require('../assets/images/reminder_food.png'),
  },
  CROWD: {
    label: 'Kalabalıktan Uzak Dur',
    shortDesc: 'Kapalı kalabalık ortamlar enfeksiyon riskini artırır.',
    color: '#5D4037',
    bgColor: '#EFEBE9',
    borderColor: '#BCAAA4',
    icon: 'people' as const,
    image: require('../assets/images/reminder_crowd.png'),
  },
  NORMAL: {
    label: '',
    shortDesc: '',
    color: 'transparent',
    bgColor: 'transparent',
    borderColor: 'transparent',
    icon: 'ellipse' as const,
    image: null,
  },
};

type DayTypeKey = keyof typeof DAY_TYPES;

// Kısa özet metinleri (JSON'dan gelen uzun metinlerin hastalara yönelik sade özeti)
const SHORT_SUMMARIES: Record<DayTypeKey, string> = {
  DOSE:    'İlacınızı bugün uygulayın. Enjeksiyondan sonra 24 saat enjeksiyon bölgesine su değdirmeyin.',
  PREDOSE: 'Yarın doz gününüz. Ateş, öksürük veya ağrı varsa ilacı uygulamadan önce doktorunuzu arayın.',
  SHOWER:  'Doz sonrası 24 saat enjeksiyon bölgesine su değdirmeyin (banyo, havuz, deniz dahil).',
  SMOKE:   'Sigara, bağışıklık sisteminizi zayıflatır ve ilacın etkinliğini düşürebilir. Bugün sigara içmemeniz önerilir.',
  ALCOHOL: 'Alkol bağışıklığı baskılayabilir ve karaciğer üzerindeki yükü artırır. Tedavi süresince mümkün olduğunca kaçının.',
  FOOD:    'Bol sebze-meyve, tam tahıl ve omega-3 içeren gıdalar tüketin. İşlenmiş ve kızartılmış gıdalardan kaçının.',
  CROWD:   'Kapalı, kalabalık ortamlarda bağışıklık baskılanması nedeniyle enfeksiyon kapma riskiniz artmıştır. Mümkünse bu tür ortamlardan kaçının veya maske kullanın.',
  NORMAL:  '',
};

// ─── Bileşen ────────────────────────────────────────────────────────────────
const Calendar = () => {
  const params = useLocalSearchParams();
  const router = useRouter();
  const startDate        = params.startDate as string;
  const frequency        = parseInt(params.frequency as string, 10);
  const selectedDrug     = params.selectedDrug as string;
  const selectedDosage   = params.selectedDosage as string;
  const selectedForm     = params.selectedForm as string;
  const selectedAntibody = params.selectedAntibody as string;
  const selectedDisease  = params.selectedDisease as string;

  const [selectedDay, setSelectedDay]         = useState<number | null>(null);
  const [isModalVisible, setIsModalVisible]   = useState(false);
  const [isDetailOpen, setIsDetailOpen]       = useState(false);  // detay popup
  const [note, setNote]                       = useState('');
  const [savedNotes, setSavedNotes]           = useState<Record<string, string>>({});
  const [currentMonth, setCurrentMonth]       = useState(() => new Date(startDate).getMonth());
  const [currentYear, setCurrentYear]         = useState(() => new Date(startDate).getFullYear());

  const monthNames = [
    'Ocak','Şubat','Mart','Nisan','Mayıs','Haziran',
    'Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık',
  ];
  const dayNames = ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'];

  useEffect(() => { loadNotes(); }, []);

  const loadNotes = async () => {
    try {
      const n = await AsyncStorage.getItem('calendar_notes');
      if (n) setSavedNotes(JSON.parse(n));
    } catch {}
  };

  const saveNote = async () => {
    if (selectedDay !== null) {
      try {
        const key = `${currentYear}-${currentMonth + 1}-${selectedDay}`;
        const updated = { ...savedNotes, [key]: note };
        await AsyncStorage.setItem('calendar_notes', JSON.stringify(updated));
        setSavedNotes(updated);
        setIsModalVisible(false);
        setNote('');
      } catch {}
    }
  };

  const deleteNote = async () => {
    if (selectedDay !== null) {
      try {
        const key = `${currentYear}-${currentMonth + 1}-${selectedDay}`;
        const updated = { ...savedNotes };
        delete updated[key];
        await AsyncStorage.setItem('calendar_notes', JSON.stringify(updated));
        setSavedNotes(updated);
        setNote('');
      } catch {}
    }
  };

  // ─── Doz günü hesabı ──────────────────────────────────────────────────────
  const calculateDoseDays = (day: number, month: number): number => {
    if (!startDate || !frequency) return -1;
    const cur = new Date(currentYear, month, day);
    cur.setHours(0, 0, 0, 0);
    const [sy, sm, sd] = startDate.split('-').map(Number);
    const start = new Date(sy, sm - 1, sd);
    start.setHours(0, 0, 0, 0);
    const diff = Math.floor((cur.getTime() - start.getTime()) / 86400000);
    if (diff < 0) return -1;
    return diff % frequency;
  };

  const getDayTypeKey = (day: number, month: number): DayTypeKey => {
    const d = calculateDoseDays(day, month);
    if (d === -1) return 'NORMAL';
    if (d === 0) return 'DOSE';
    if (d === frequency - 1) return 'PREDOSE';
    if (d === 1) return 'SHOWER';
    if (d === 2) return 'SMOKE';
    if (d === 3) return 'ALCOHOL';
    if (d === 4) return 'FOOD';
    if (d === 5) return 'CROWD';
    if (d === 6) return 'SHOWER';
    return 'NORMAL';
  };

  // Reminder offset (JSON'dan gelen kişisel metin için)
  const getReminderOffset = (doseDay: number): number | null => {
    if (doseDay < 0) return null;
    if (doseDay === 0) return 0;
    if (doseDay === frequency - 1) return -1;
    if (doseDay >= 1 && doseDay <= 6) return doseDay;
    return null;
  };

  const handleDayPress = (day: number) => {
    setSelectedDay(day);
    const key = `${currentYear}-${currentMonth + 1}-${day}`;
    setNote(savedNotes[key] || '');
    setIsDetailOpen(false);
    setIsModalVisible(true);
  };

  const navigateMonth = (dir: number) => {
    setCurrentMonth(prev => {
      let m = prev + dir;
      if (m < 0) { m = 11; setCurrentYear(y => y - 1); }
      else if (m > 11) { m = 0; setCurrentYear(y => y + 1); }
      return m;
    });
  };

  const openProspectus = () => {
    const url = getProspectusUrl(selectedDrug, selectedDosage, selectedForm || undefined);
    if (url) Linking.openURL(url);
  };

  // Sonraki doz sayacı
  const getNextDoseDays = (): number | null => {
    if (!startDate || !frequency) return null;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const [sy, sm, sd] = startDate.split('-').map(Number);
    const start = new Date(sy, sm - 1, sd); start.setHours(0, 0, 0, 0);
    const diff = Math.floor((today.getTime() - start.getTime()) / 86400000);
    if (diff < 0) return -diff;
    const rem = frequency - (diff % frequency);
    return rem === frequency ? 0 : rem;
  };

  const nextDoseDays  = getNextDoseDays();
  const blackBox      = getBlackBoxWarning(selectedAntibody);
  const days          = daysInMonth(currentMonth, currentYear);

  // Modal için seçili günün hesaplamaları
  const selectedDoseDay      = selectedDay !== null ? calculateDoseDays(selectedDay, currentMonth) : -1;
  const selectedDayTypeKey   = selectedDay !== null ? getDayTypeKey(selectedDay, currentMonth) : 'NORMAL';
  const selectedDayType      = DAY_TYPES[selectedDayTypeKey];
  const reminderOffset       = selectedDoseDay >= 0 ? getReminderOffset(selectedDoseDay) : null;
  const personalizedReminder = (selectedAntibody && reminderOffset !== null)
    ? getReminderForDay(selectedAntibody, reminderOffset)
    : null;

  const today = new Date();
  const isToday = (day: number) =>
    day === today.getDate() &&
    currentMonth === today.getMonth() &&
    currentYear === today.getFullYear();

  return (
    <LinearGradient colors={['#F5F7F5', '#FFFFFF']} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── İlaç Başlık Kartı ── */}
        <View style={styles.drugHeader}>
          <View style={styles.drugHeaderLeft}>
            <Text style={styles.drugName} numberOfLines={1}>{selectedDrug}</Text>
            <Text style={styles.drugDetail} numberOfLines={1}>
              {selectedAntibody} · {selectedDosage}
            </Text>
            <Text style={styles.drugDisease} numberOfLines={2}>{selectedDisease}</Text>
          </View>

          {/* Veri Yönetimi butonu */}
          <TouchableOpacity
            style={styles.dataManagerBtn}
            onPress={() => router.push({ pathname: '/data-manager', params: {} })}
            activeOpacity={0.75}
          >
            <Ionicons name="settings-outline" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
          {nextDoseDays !== null && (
            <View style={[
              styles.nextDoseBadge,
              nextDoseDays === 0 && styles.nextDoseBadgeToday,
              nextDoseDays === 1 && styles.nextDoseBadgeTomorrow,
            ]}>
              <Ionicons
                name={nextDoseDays === 0 ? 'medical' : 'time-outline'}
                size={14}
                color={nextDoseDays === 0 ? COLORS.primary : nextDoseDays === 1 ? COLORS.amber : COLORS.textSecondary}
              />
              <Text style={[
                styles.nextDoseText,
                nextDoseDays === 0 && { color: COLORS.primary },
                nextDoseDays === 1 && { color: COLORS.amber },
              ]}>
                {nextDoseDays === 0 ? 'Bugün doz!' :
                 nextDoseDays === 1 ? 'Yarın doz' :
                 `${nextDoseDays} gün`}
              </Text>
            </View>
          )}
        </View>

        {/* ── Kara Kutu Banner ── */}
        {blackBox && (
          <View style={styles.blackBoxBanner}>
            <Ionicons name="warning" size={16} color={COLORS.danger} style={{ flexShrink: 0 }} />
            <Text style={styles.blackBoxText} numberOfLines={3}>{blackBox}</Text>
          </View>
        )}

        {/* ── Takvim ── */}
        <View style={styles.calendarCard}>
          <View style={styles.monthHeader}>
            <TouchableOpacity style={styles.navBtn} onPress={() => navigateMonth(-1)}>
              <Ionicons name="chevron-back" size={20} color={COLORS.primary} />
            </TouchableOpacity>
            <Text style={styles.monthText}>{monthNames[currentMonth]} {currentYear}</Text>
            <TouchableOpacity style={styles.navBtn} onPress={() => navigateMonth(1)}>
              <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.dayNamesRow}>
            {dayNames.map(d => <Text key={d} style={styles.dayName}>{d}</Text>)}
          </View>

          <View style={styles.daysGrid}>
            {days.map((day, idx) => {
              if (!day) return <View key={idx} style={styles.emptyCell} />;
              const typeKey  = getDayTypeKey(day, currentMonth);
              const type     = DAY_TYPES[typeKey];
              const isSpec   = typeKey !== 'NORMAL';
              const todayFlag = isToday(day);
              const noteKey  = `${currentYear}-${currentMonth + 1}-${day}`;
              const hasNote  = !!savedNotes[noteKey];

              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.dayCell,
                    isSpec && { backgroundColor: type.bgColor, borderColor: type.borderColor, borderWidth: 1 },
                    todayFlag && styles.dayCellToday,
                  ]}
                  onPress={() => handleDayPress(day)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.dayNumber,
                    isSpec && { color: type.color, fontWeight: '700' },
                    todayFlag && styles.dayNumberToday,
                  ]}>
                    {day}
                  </Text>
                  {isSpec && (
                    <View style={[styles.dayIconBg, { backgroundColor: type.color + '25' }]}>
                      <Ionicons name={type.icon} size={11} color={type.color} />
                    </View>
                  )}
                  {hasNote && <View style={styles.noteDot} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Lejant ── */}
        <View style={styles.legendCard}>
          <Text style={styles.legendTitle}>Renk Rehberi</Text>
          {(Object.entries(DAY_TYPES) as [DayTypeKey, typeof DAY_TYPES.DOSE][])
            .filter(([k]) => k !== 'NORMAL')
            .map(([key, type]) => (
              <View key={key} style={[styles.legendRow, { borderLeftColor: type.color }]}>
                <Image source={type.image!} style={styles.legendImg} />
                <View style={styles.legendTexts}>
                  <Text style={[styles.legendLabel, { color: type.color }]}>{type.label}</Text>
                  <Text style={styles.legendDesc} numberOfLines={2}>{SHORT_SUMMARIES[key]}</Text>
                </View>
              </View>
            ))}
        </View>

        {/* ── Prospektüs Butonu ── */}
        <TouchableOpacity style={styles.prospBtn} onPress={openProspectus} activeOpacity={0.8}>
          <Ionicons name="document-text-outline" size={20} color={COLORS.teal} />
          <Text style={styles.prospBtnText} numberOfLines={1}>{selectedDrug} Prospektüsü</Text>
          <Ionicons name="open-outline" size={16} color={COLORS.teal} />
        </TouchableOpacity>
      </ScrollView>

      {/* ═══════════════ Gün Detay Modal ═══════════════ */}
      <Modal
        animationType="slide"
        transparent
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.dragHandle} />

            {/* Modal başlık */}
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalDate}>
                  {selectedDay} {monthNames[currentMonth]} {currentYear}
                </Text>
                {selectedDayTypeKey !== 'NORMAL' && (
                  <View style={[styles.modalTypeBadge, {
                    backgroundColor: selectedDayType.bgColor,
                    borderColor: selectedDayType.borderColor,
                  }]}>
                    <Ionicons name={selectedDayType.icon} size={12} color={selectedDayType.color} />
                    <Text style={[styles.modalTypeBadgeText, { color: selectedDayType.color }]}>
                      {selectedDayType.label}
                    </Text>
                  </View>
                )}
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setIsModalVisible(false)}>
                <Ionicons name="close" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>

              {/* ── Hatırlatma Kartı (Görsel + Kısa Metin + Detay Butonu) ── */}
              {selectedDayTypeKey !== 'NORMAL' && selectedDayType.image && (
                <View style={[styles.reminderCard, {
                  backgroundColor: selectedDayType.bgColor,
                  borderColor: selectedDayType.borderColor,
                }]}>
                  {/* Sol: görsel */}
                  <Image
                    source={selectedDayType.image}
                    style={styles.reminderImage}
                    resizeMode="contain"
                  />

                  {/* Sağ: metin */}
                  <View style={styles.reminderRight}>
                    <Text style={[styles.reminderLabel, { color: selectedDayType.color }]}>
                      {selectedDayType.label}
                    </Text>

                    {/* Kısa özet (hasta dostu dil) */}
                    <Text style={styles.reminderShort}>
                      {SHORT_SUMMARIES[selectedDayTypeKey]}
                    </Text>

                    {/* Detay butonu → uzun kişiselleştirilmiş metin popup */}
                    {personalizedReminder && (
                      <TouchableOpacity
                        style={[styles.detailBtn, { borderColor: selectedDayType.color }]}
                        onPress={() => setIsDetailOpen(true)}
                      >
                        <Ionicons name="information-circle-outline" size={14} color={selectedDayType.color} />
                        <Text style={[styles.detailBtnText, { color: selectedDayType.color }]}>
                          Doktor tavsiyeleri
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}

              {/* İlaç bağlamı */}
              <View style={styles.drugContextRow}>
                <Ionicons name="medical-outline" size={13} color={COLORS.textMuted} />
                <Text style={styles.drugContextText} numberOfLines={2}>
                  {selectedDrug} · {selectedAntibody} · {selectedDisease}
                </Text>
              </View>

              {/* Not girişi */}
              <View style={styles.noteLabelRow}>
                <Text style={styles.noteLabel}>Kişisel Not</Text>
                {(note.trim().length > 0 || !!savedNotes[`${currentYear}-${currentMonth + 1}-${selectedDay}`]) && (
                  <TouchableOpacity style={styles.noteDeleteBtn} onPress={deleteNote}>
                    <Ionicons name="trash-outline" size={15} color={COLORS.danger} />
                    <Text style={styles.noteDeleteText}>Notu Sil</Text>
                  </TouchableOpacity>
                )}
              </View>
              <TextInput
                style={styles.noteInput}
                multiline
                numberOfLines={4}
                value={note}
                onChangeText={setNote}
                placeholder="Bugüne ait notunuzu yazın (semptomlar, yan etkiler, genel durum...)"
                placeholderTextColor={COLORS.textMuted}
                textAlignVertical="top"
              />

              {/* Semptom Kaydı Butonu */}
              <TouchableOpacity
                style={styles.symptomLogBtn}
                onPress={() => {
                  setIsModalVisible(false);
                  router.push({
                    pathname: '/symptom-log',
                    params: {
                      date: `${currentYear}-${currentMonth + 1 < 10 ? '0' : ''}${currentMonth + 1}-${selectedDay && selectedDay < 10 ? '0' : ''}${selectedDay}`,
                      selectedDrug,
                      selectedDosage,
                      selectedAntibody,
                      selectedDisease,
                    },
                  });
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="pulse" size={18} color={COLORS.danger} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.symptomLogBtnTitle}>Semptom / Ağrı Kaydı</Text>
                  <Text style={styles.symptomLogBtnSub}>Vücut haritasında bölge seç, şiddet belirle</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={COLORS.danger} />
              </TouchableOpacity>

              {/* Butonlar */}
              <View style={styles.modalBtnRow}>
                <TouchableOpacity style={styles.prospModalBtn} onPress={openProspectus}>
                  <Ionicons name="document-text-outline" size={17} color={COLORS.teal} />
                  <Text style={styles.prospModalBtnText}>Prospektüs</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={saveNote}>
                  <Ionicons name="save-outline" size={17} color="#FFF" />
                  <Text style={styles.saveBtnText}>Kaydet</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ═══════════════ Doktor Tavsiyeleri Detay Popup ═══════════════ */}
      <Modal
        animationType="fade"
        transparent
        visible={isDetailOpen}
        onRequestClose={() => setIsDetailOpen(false)}
      >
        <View style={styles.detailOverlay}>
          <View style={styles.detailBox}>
            {/* Başlık */}
            <View style={styles.detailHeader}>
              <View style={[styles.detailHeaderIcon,
                { backgroundColor: selectedDayType.bgColor }]}>
                <Ionicons name={selectedDayType.icon} size={20} color={selectedDayType.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.detailTitle}>{selectedDayType.label}</Text>
                <Text style={styles.detailSubtitle}>{selectedDrug} · {selectedAntibody}</Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setIsDetailOpen(false)}>
                <Ionicons name="close" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Hasta dostu kısa açıklama */}
            <View style={[styles.shortSummaryBox, { backgroundColor: selectedDayType.bgColor, borderColor: selectedDayType.borderColor }]}>
              <Ionicons name="person-outline" size={15} color={selectedDayType.color} style={{ marginRight: 8 }} />
              <Text style={[styles.shortSummaryText, { color: selectedDayType.color }]}>
                {SHORT_SUMMARIES[selectedDayTypeKey]}
              </Text>
            </View>

            <View style={styles.detailDivider}>
              <View style={styles.detailDividerLine} />
              <Text style={styles.detailDividerText}>Klinik Tavsiye</Text>
              <View style={styles.detailDividerLine} />
            </View>

            {/* Kişiselleştirilmiş uzun metin (JSON'dan, tıbbi dil) */}
            <ScrollView style={styles.detailScroll} showsVerticalScrollIndicator={false}>
              {personalizedReminder ? (
                <Text style={styles.detailFullText}>{personalizedReminder}</Text>
              ) : (
                <Text style={styles.detailFullText}>{SHORT_SUMMARIES[selectedDayTypeKey]}</Text>
              )}
            </ScrollView>

            <TouchableOpacity
              style={[styles.detailCloseBtn, { backgroundColor: selectedDayType.color }]}
              onPress={() => setIsDetailOpen(false)}
            >
              <Text style={styles.detailCloseBtnText}>Tamam, Anladım</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

// ─── Stiller ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 48 },

  // İlaç başlığı
  drugHeader: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.small,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  drugHeaderLeft: { flex: 1, marginRight: 8 },
  dataManagerBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: COLORS.background,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.borderLight,
  },
  drugName:   { fontSize: 19, fontWeight: '800', color: COLORS.primary, letterSpacing: -0.4 },
  drugDetail: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2, fontWeight: '500' },
  drugDisease:{ fontSize: 12, color: COLORS.textMuted, marginTop: 3, lineHeight: 16 },
  nextDoseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 5,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexShrink: 0,
  },
  nextDoseBadgeToday:    { backgroundColor: COLORS.primaryPale,  borderColor: '#A5D6A7' },
  nextDoseBadgeTomorrow: { backgroundColor: COLORS.amberLight,   borderColor: COLORS.amberBorder },
  nextDoseText: { fontSize: 11, fontWeight: '700', color: COLORS.textSecondary },

  // Kara kutu
  blackBoxBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.dangerLight,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.danger,
    gap: 8,
  },
  blackBoxText: { fontSize: 12, color: COLORS.danger, flex: 1, fontWeight: '500', lineHeight: 17 },

  // Takvim kartı
  calendarCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
    ...SHADOWS.small,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  navBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.primaryPale,
    alignItems: 'center', justifyContent: 'center',
  },
  monthText: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
  dayNamesRow: { flexDirection: 'row', marginBottom: 6 },
  dayName: {
    width: CELL_SIZE, textAlign: 'center',
    fontSize: 10, fontWeight: '700',
    color: COLORS.textMuted, textTransform: 'uppercase',
  },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  emptyCell: { width: CELL_SIZE, height: CELL_SIZE + 8 },
  dayCell: {
    width: CELL_SIZE, height: CELL_SIZE + 8,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 8, marginBottom: 3, position: 'relative',
    borderWidth: 0,
  },
  dayCellToday: { borderWidth: 2, borderColor: COLORS.primary },
  dayNumber:      { fontSize: 13, fontWeight: '500', color: COLORS.textPrimary },
  dayNumberToday: { color: COLORS.primary, fontWeight: '800' },
  dayIconBg: {
    width: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center', marginTop: 2,
  },
  noteDot: {
    position: 'absolute', top: 2, right: 3,
    width: 5, height: 5, borderRadius: 2.5,
    backgroundColor: COLORS.blue,
  },

  // Lejant
  legendCard: {
    backgroundColor: COLORS.surface, borderRadius: 16,
    padding: 16, marginBottom: 12,
    ...SHADOWS.small, borderWidth: 1, borderColor: COLORS.borderLight,
  },
  legendTitle: {
    fontSize: 13, fontWeight: '700', color: COLORS.textPrimary,
    marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  legendRow: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 10, paddingLeft: 10,
    borderLeftWidth: 3, paddingVertical: 4,
  },
  legendImg: { width: 40, height: 40, borderRadius: 8, marginRight: 12, flexShrink: 0 },
  legendTexts: { flex: 1 },
  legendLabel: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  legendDesc:  { fontSize: 12, color: COLORS.textSecondary, lineHeight: 16 },

  // Prospektüs
  prospBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.tealLight, borderRadius: 14,
    padding: 14, gap: 10, borderWidth: 1, borderColor: '#B2DFDB',
  },
  prospBtnText: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.teal },

  // ── Modal ──────────────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 20, paddingBottom: 36, maxHeight: '88%',
  },
  dragHandle: {
    width: 40, height: 4, backgroundColor: COLORS.border,
    borderRadius: 2, alignSelf: 'center', marginBottom: 14,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 14,
  },
  modalDate: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
  modalTypeBadge: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
    marginTop: 5, gap: 5, alignSelf: 'flex-start',
    borderWidth: 1,
  },
  modalTypeBadgeText: { fontSize: 12, fontWeight: '700' },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.background,
    alignItems: 'center', justifyContent: 'center',
  },

  // Hatırlatma kartı (modal içinde)
  reminderCard: {
    borderRadius: 16, marginBottom: 12,
    borderWidth: 1.5, flexDirection: 'row',
    overflow: 'hidden', alignItems: 'stretch',
  },
  reminderImage: {
    width: 88, height: 88, flexShrink: 0,
  },
  reminderRight: {
    flex: 1, padding: 12, justifyContent: 'center',
  },
  reminderLabel: { fontSize: 13, fontWeight: '800', marginBottom: 4 },
  reminderShort: {
    fontSize: 13, color: COLORS.textPrimary,
    lineHeight: 18, fontWeight: '500',
  },
  detailBtn: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: 8, paddingVertical: 4, paddingHorizontal: 8,
    borderRadius: 8, borderWidth: 1, alignSelf: 'flex-start',
    gap: 4,
  },
  detailBtnText: { fontSize: 11, fontWeight: '700' },

  // İlaç bağlamı
  drugContextRow: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 14, gap: 6,
  },
  drugContextText: { fontSize: 12, color: COLORS.textMuted, fontWeight: '500', flex: 1 },

  // Not
  noteLabelRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 8,
  },
  noteLabel: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary },
  noteDeleteBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4,
    backgroundColor: COLORS.dangerLight, borderRadius: 8,
  },
  noteDeleteText: { fontSize: 12, fontWeight: '700', color: COLORS.danger },
  noteInput: {
    backgroundColor: COLORS.background, borderRadius: 12,
    padding: 12, fontSize: 14, color: COLORS.textPrimary,
    minHeight: 85, borderWidth: 1.5, borderColor: COLORS.border,
    marginBottom: 14,
  },

  // Semptom kayıt butonu
  symptomLogBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.dangerLight, borderRadius: 14,
    padding: 13, marginBottom: 10, gap: 10,
    borderWidth: 1, borderColor: COLORS.dangerBorder,
  },
  symptomLogBtnTitle: { fontSize: 14, fontWeight: '700', color: COLORS.danger },
  symptomLogBtnSub:   { fontSize: 11, color: '#7F1D1D', marginTop: 1, fontWeight: '500' },

  // Modal butonları
  modalBtnRow: { flexDirection: 'row', gap: 10 },
  prospModalBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', backgroundColor: COLORS.tealLight,
    borderRadius: 14, padding: 13, borderWidth: 1,
    borderColor: '#B2DFDB', gap: 6,
  },
  prospModalBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.teal },
  saveBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', backgroundColor: COLORS.primary,
    borderRadius: 14, padding: 13, gap: 6,
  },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: '#FFF' },

  // ── Detay Popup (Doktor Tavsiyeleri) ─────────────────────────────────────
  detailOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  detailBox: {
    backgroundColor: COLORS.surface, borderRadius: 24,
    padding: 22, width: '100%', maxHeight: '80%',
    ...SHADOWS.large,
  },
  detailHeader: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 14, gap: 12,
  },
  detailHeaderIcon: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  detailTitle:    { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary },
  detailSubtitle: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2, fontWeight: '500' },
  shortSummaryBox: {
    flexDirection: 'row', alignItems: 'flex-start',
    borderRadius: 12, padding: 12, borderWidth: 1,
    marginBottom: 14,
  },
  shortSummaryText: { fontSize: 14, fontWeight: '600', lineHeight: 20, flex: 1 },
  detailDivider: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 14, gap: 8,
  },
  detailDividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  detailDividerText: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase' },
  detailScroll: { maxHeight: 200, marginBottom: 16 },
  detailFullText: {
    fontSize: 14, color: COLORS.textPrimary,
    lineHeight: 22, fontWeight: '400',
  },
  detailCloseBtn: {
    borderRadius: 14, paddingVertical: 14,
    alignItems: 'center',
  },
  detailCloseBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
});

export default Calendar;
