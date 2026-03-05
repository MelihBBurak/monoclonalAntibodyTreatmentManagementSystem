import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, Linking, ActivityIndicator, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { COLORS, SHADOWS } from '../utils/styles';

const PROFILE_KEY  = '@mabcare_profile';
const NOTES_KEY    = 'calendar_notes';
const LOGS_KEY     = 'symptom_logs_v1';
const EMAIL_KEY    = '@mabcare_email';
const EXPORT_VER   = '1.0';

type Profile = Record<string, string>;
type Notes   = Record<string, string>;
interface SymptomLog {
  id: string; date: string; time: string;
  drug: string; antibody: string; disease: string;
  symptoms: string[]; painLevel: number;
  regions: string[]; bodySide: string; note: string;
}

const MONTH_TR = [
  'Ocak','Şubat','Mart','Nisan','Mayıs','Haziran',
  'Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık',
];

const pad = (n: number) => String(n).padStart(2, '0');

// ─── Yardımcılar ─────────────────────────────────────────────────────────────

function buildMonthlySummary(
  profile: Profile | null,
  notes: Notes,
  logs: SymptomLog[],
  year: number,
  month: number,
): string {
  const monthStr  = `${year}-${pad(month)}`;
  const monthName = `${MONTH_TR[month - 1]} ${year}`;

  const lines: string[] = [];
  lines.push('══════════════════════════════════════');
  lines.push('   MAbCare — Aylık Sağlık Özeti');
  lines.push('══════════════════════════════════════');
  lines.push('');

  if (profile) {
    lines.push(`👤 Hasta  : ${profile.name} ${profile.surname}`);
    if (profile.age) lines.push(`📅 Yaş    : ${profile.age}`);
    lines.push('');
    lines.push(`💊 İlaç   : ${profile.selectedDrug}`);
    lines.push(`🧬 Antikor: ${profile.selectedAntibody}`);
    lines.push(`🏥 Tanı   : ${profile.selectedDisease}`);
    lines.push(`📆 Döz    : Her ${profile.frequency} günde bir`);
    lines.push('');
  }

  lines.push(`📋 AY: ${monthName}`);
  lines.push('──────────────────────────────────────');
  lines.push('');

  // Takvim notları
  const monthNotes = Object.entries(notes)
    .filter(([k]) => k.startsWith(monthStr))
    .sort(([a], [b]) => a.localeCompare(b));

  if (monthNotes.length > 0) {
    lines.push('📓 TAKVİM NOTLARI');
    lines.push('──────────────');
    for (const [key, val] of monthNotes) {
      const [y, m, d] = key.split('-');
      lines.push(`  • ${d}/${m}/${y}: ${val}`);
    }
    lines.push('');
  } else {
    lines.push('📓 Bu ay için takvim notu yok.');
    lines.push('');
  }

  // Semptom logları
  const monthLogs = logs.filter(l => l.date.startsWith(monthStr));

  if (monthLogs.length > 0) {
    // Özet istatistik
    const avgPain = monthLogs
      .filter(l => l.painLevel > 0)
      .reduce((s, l, _, a) => s + l.painLevel / a.length, 0);
    const symptomCount: Record<string, number> = {};
    for (const l of monthLogs)
      for (const s of l.symptoms)
        symptomCount[s] = (symptomCount[s] ?? 0) + 1;
    const topSymptom = Object.entries(symptomCount)
      .sort((a, b) => b[1] - a[1])[0];

    lines.push('📊 SEMPTOM ÖZETİ');
    lines.push('──────────────');
    lines.push(`  • Toplam kayıt: ${monthLogs.length}`);
    if (avgPain > 0)
      lines.push(`  • Ortalama ağrı: ${avgPain.toFixed(1)} / 10`);
    if (topSymptom)
      lines.push(`  • En sık semptom: ${topSymptom[0]} (${topSymptom[1]}x)`);
    lines.push('');

    lines.push('🩺 DETAYLI SEMPTOM KAYITLARI');
    lines.push('──────────────────────────');
    for (const l of monthLogs.sort((a, b) => a.date.localeCompare(b.date))) {
      const [y, m, d] = l.date.split('-');
      lines.push(`\n  ${d}/${m}/${y} ${l.time}`);
      if (l.symptoms.length > 0)
        lines.push(`  Semptomlar  : ${l.symptoms.join(', ')}`);
      if (l.painLevel > 0)
        lines.push(`  Ağrı şiddeti: ${l.painLevel}/10`);
      if (l.regions.length > 0)
        lines.push(`  Bölge       : ${l.regions.join(', ')} (${l.bodySide === 'front' ? 'ön' : 'arka'})`);
      if (l.note)
        lines.push(`  Not         : ${l.note}`);
    }
    lines.push('');
  } else {
    lines.push('🩺 Bu ay semptom kaydı yok.');
    lines.push('');
  }

  lines.push('──────────────────────────────────────');
  lines.push('Oluşturulma: MAbCare Uygulaması');
  lines.push(`Tarih: ${new Date().toLocaleString('tr-TR')}`);
  lines.push('══════════════════════════════════════');

  return lines.join('\n');
}

// ─── Ana Ekran ────────────────────────────────────────────────────────────────

export default function DataManagerScreen() {
  const router = useRouter();

  const [profile, setProfile]   = useState<Profile | null>(null);
  const [notes, setNotes]       = useState<Notes>({});
  const [logs, setLogs]         = useState<SymptomLog[]>([]);
  const [email, setEmail]       = useState('');

  const now = new Date();
  const [summaryYear,  setSummaryYear]  = useState(now.getFullYear());
  const [summaryMonth, setSummaryMonth] = useState(now.getMonth() + 1);

  const [exporting,  setExporting]  = useState(false);
  const [importing,  setImporting]  = useState(false);
  const [lastExport, setLastExport] = useState<string | null>(null);

  // Önizleme
  const [showPreview, setShowPreview] = useState(false);
  const [previewText, setPreviewText] = useState('');

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      const [rawProfile, rawNotes, rawLogs, rawEmail] = await Promise.all([
        AsyncStorage.getItem(PROFILE_KEY),
        AsyncStorage.getItem(NOTES_KEY),
        AsyncStorage.getItem(LOGS_KEY),
        AsyncStorage.getItem(EMAIL_KEY),
      ]);
      if (rawProfile) setProfile(JSON.parse(rawProfile));
      if (rawNotes)   setNotes(JSON.parse(rawNotes));
      if (rawLogs)    setLogs(JSON.parse(rawLogs));
      if (rawEmail)   setEmail(rawEmail);
    } catch {}
  };

  const saveEmail = async (v: string) => {
    setEmail(v);
    try { await AsyncStorage.setItem(EMAIL_KEY, v); } catch {}
  };

  // ── Aylık özet ──────────────────────────────────────────────────────────────
  const handlePreview = () => {
    const text = buildMonthlySummary(profile, notes, logs, summaryYear, summaryMonth);
    setPreviewText(text);
    setShowPreview(true);
  };

  const handleSendEmail = () => {
    const text = buildMonthlySummary(profile, notes, logs, summaryYear, summaryMonth);
    const subject = encodeURIComponent(
      `MAbCare – ${MONTH_TR[summaryMonth - 1]} ${summaryYear} Aylık Sağlık Özeti`
    );
    const body    = encodeURIComponent(text);
    const to      = email.trim();
    const uri     = to
      ? `mailto:${to}?subject=${subject}&body=${body}`
      : `mailto:?subject=${subject}&body=${body}`;

    Linking.canOpenURL('mailto:').then(can => {
      if (can) Linking.openURL(uri);
      else Alert.alert('Mail Uygulaması Bulunamadı', 'Lütfen cihazınızda bir mail uygulaması yapılandırın.');
    });
  };

  // ── Dışarı Aktar ────────────────────────────────────────────────────────────
  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const [rawProfile, rawNotes, rawLogs] = await Promise.all([
        AsyncStorage.getItem(PROFILE_KEY),
        AsyncStorage.getItem(NOTES_KEY),
        AsyncStorage.getItem(LOGS_KEY),
      ]);
      const exportData = {
        version:    EXPORT_VER,
        exportDate: new Date().toISOString(),
        appName:    'MAbCare',
        [PROFILE_KEY]: rawProfile ? JSON.parse(rawProfile) : null,
        [NOTES_KEY]:   rawNotes   ? JSON.parse(rawNotes)   : {},
        [LOGS_KEY]:    rawLogs    ? JSON.parse(rawLogs)     : [],
      };

      const fileName = `mabcare_yedek_${new Date().toISOString().slice(0, 10)}.json`;
      const filePath = `${FileSystem.cacheDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(filePath, JSON.stringify(exportData, null, 2), {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'application/json',
          dialogTitle: 'MAbCare Verisini Kaydet',
          UTI: 'public.json',
        });
        const exportTime = new Date().toLocaleString('tr-TR');
        setLastExport(exportTime);
        await AsyncStorage.setItem('@mabcare_last_export', exportTime);
      } else {
        Alert.alert('Paylaşım Desteklenmiyor', 'Bu cihazda paylaşım özelliği kullanılamıyor.');
      }
    } catch (e) {
      Alert.alert('Hata', 'Dışarı aktarım sırasında bir hata oluştu.');
    }
    setExporting(false);
  }, []);

  // ── Yükle (İçe Aktar) ───────────────────────────────────────────────────────
  const handleImport = useCallback(async () => {
    Alert.alert(
      'Veriyi İçe Aktar',
      'Mevcut tüm profil, takvim notları ve semptom kayıtlarınız seçtiğiniz dosyadaki verilerle değiştirilecek. Devam etmek istiyor musunuz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Devam Et',
          style: 'destructive',
          onPress: async () => {
            setImporting(true);
            try {
              const result = await DocumentPicker.getDocumentAsync({
                type: ['application/json', 'text/plain', '*/*'],
                copyToCacheDirectory: true,
              });

              if (result.canceled) { setImporting(false); return; }

              const file = result.assets[0];
              const raw  = await FileSystem.readAsStringAsync(file.uri, {
                encoding: FileSystem.EncodingType.UTF8,
              });
              const data = JSON.parse(raw);

              if (data.appName !== 'MAbCare') {
                Alert.alert('Geçersiz Dosya', 'Bu dosya MAbCare formatında değil.');
                setImporting(false); return;
              }

              const ops: Promise<void>[] = [];
              if (data[PROFILE_KEY])
                ops.push(AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(data[PROFILE_KEY])));
              if (data[NOTES_KEY])
                ops.push(AsyncStorage.setItem(NOTES_KEY, JSON.stringify(data[NOTES_KEY])));
              if (data[LOGS_KEY])
                ops.push(AsyncStorage.setItem(LOGS_KEY, JSON.stringify(data[LOGS_KEY])));
              await Promise.all(ops);

              await loadAll();
              Alert.alert(
                'Yükleme Tamamlandı ✓',
                'Verileriniz başarıyla yüklendi. Uygulama profil bilgilerinizle devam edecek.',
                [{
                  text: 'Takvime Git',
                  onPress: () => {
                    if (data[PROFILE_KEY]) {
                      router.replace({ pathname: '/calendar', params: data[PROFILE_KEY] });
                    }
                  },
                }]
              );
            } catch {
              Alert.alert('Hata', 'Dosya okunamadı veya format hatalı. Lütfen geçerli bir MAbCare yedek dosyası seçin.');
            }
            setImporting(false);
          },
        },
      ]
    );
  }, [router]);

  // ── Profili Sıfırla ─────────────────────────────────────────────────────────
  const handleReset = () => {
    Alert.alert(
      'Profili Sıfırla',
      'Tüm profil bilgileriniz, takvim notlarınız ve semptom kayıtlarınız silinecek. Bu işlem geri alınamaz.',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sıfırla',
          style: 'destructive',
          onPress: async () => {
            await Promise.all([
              AsyncStorage.removeItem(PROFILE_KEY),
              AsyncStorage.removeItem(NOTES_KEY),
              AsyncStorage.removeItem(LOGS_KEY),
              AsyncStorage.removeItem(EMAIL_KEY),
              AsyncStorage.removeItem('@mabcare_last_export'),
            ]);
            router.replace('/');
          },
        },
      ]
    );
  };

  // ── Ay değiştir ─────────────────────────────────────────────────────────────
  const prevMonth = () => {
    if (summaryMonth === 1) { setSummaryYear(y => y - 1); setSummaryMonth(12); }
    else setSummaryMonth(m => m - 1);
  };
  const nextMonth = () => {
    const n = new Date();
    if (summaryYear >= n.getFullYear() && summaryMonth >= n.getMonth() + 1) return;
    if (summaryMonth === 12) { setSummaryYear(y => y + 1); setSummaryMonth(1); }
    else setSummaryMonth(m => m + 1);
  };

  const monthNoteCount = Object.keys(notes)
    .filter(k => k.startsWith(`${summaryYear}-${pad(summaryMonth)}`)).length;
  const monthLogCount  = logs
    .filter(l => l.date.startsWith(`${summaryYear}-${pad(summaryMonth)}`)).length;

  return (
    <LinearGradient colors={['#F5F7F5', '#FFFFFF']} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Profil özet kartı */}
        {profile && (
          <View style={s.profileCard}>
            <View style={[s.profileIcon, { backgroundColor: COLORS.primaryPale }]}>
              <Ionicons name="person" size={22} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.profileName}>{profile.name} {profile.surname}</Text>
              <Text style={s.profileSub} numberOfLines={1}>
                {profile.selectedDrug} · {profile.selectedAntibody}
              </Text>
            </View>
          </View>
        )}

        {/* ══ Aylık E-posta Özeti ══════════════════════════════════════════════ */}
        <SectionCard
          title="Aylık Özet Raporu"
          icon="mail"
          iconBg={COLORS.blueLight}
          iconColor={COLORS.blue}
        >
          <Text style={s.hint}>
            Seçili aya ait takvim notları ve semptom kayıtlarını mail olarak paylaşın.
          </Text>

          {/* Ay Seçici */}
          <View style={s.monthRow}>
            <TouchableOpacity style={s.monthArrow} onPress={prevMonth}>
              <Ionicons name="chevron-back" size={20} color={COLORS.primary} />
            </TouchableOpacity>
            <View style={s.monthCenter}>
              <Text style={s.monthText}>
                {MONTH_TR[summaryMonth - 1]} {summaryYear}
              </Text>
              <View style={s.monthStats}>
                <View style={s.monthStat}>
                  <Ionicons name="document-text" size={11} color={COLORS.textMuted} />
                  <Text style={s.monthStatText}>{monthNoteCount} not</Text>
                </View>
                <View style={s.monthStat}>
                  <Ionicons name="pulse" size={11} color={COLORS.textMuted} />
                  <Text style={s.monthStatText}>{monthLogCount} kayıt</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity style={s.monthArrow} onPress={nextMonth}>
              <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          {/* E-posta adresi */}
          <Text style={s.fieldLabel}>E-posta Adresi</Text>
          <TextInput
            style={s.input}
            value={email}
            onChangeText={saveEmail}
            placeholder="ornek@email.com"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          {/* Butonlar */}
          <View style={s.btnRow}>
            <TouchableOpacity style={[s.outlineBtn, { flex: 1 }]} onPress={handlePreview}>
              <Ionicons name="eye" size={15} color={COLORS.blue} />
              <Text style={[s.outlineBtnText, { color: COLORS.blue }]}>Önizle</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.solidBtn, { flex: 1, backgroundColor: COLORS.blue }]}
              onPress={handleSendEmail}
            >
              <Ionicons name="send" size={15} color="#FFF" />
              <Text style={s.solidBtnText}>Mail Gönder</Text>
            </TouchableOpacity>
          </View>
        </SectionCard>

        {/* ══ Dışarı Aktar ════════════════════════════════════════════════════ */}
        <SectionCard
          title="Dışarı Aktar"
          icon="download"
          iconBg="#E8F5E9"
          iconColor={COLORS.primary}
        >
          <Text style={s.hint}>
            Profil bilgileriniz, takvim notlarınız ve semptom kayıtlarınız tek bir{' '}
            <Text style={{ fontWeight: '700' }}>.json</Text> dosyasına aktarılır.
            Cihaz değişikliğinde bu dosyayı yükleyerek kaldığınız yerden devam edebilirsiniz.
          </Text>

          {lastExport && (
            <View style={s.infoRow}>
              <Ionicons name="checkmark-circle" size={14} color={COLORS.primary} />
              <Text style={s.infoText}>Son aktarım: {lastExport}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[s.solidBtn, { backgroundColor: COLORS.primary }]}
            onPress={handleExport}
            disabled={exporting}
          >
            {exporting
              ? <ActivityIndicator color="#FFF" size="small" />
              : <Ionicons name="share-outline" size={18} color="#FFF" />
            }
            <Text style={s.solidBtnText}>
              {exporting ? 'Hazırlanıyor…' : 'Verileri Dışarı Aktar'}
            </Text>
          </TouchableOpacity>
        </SectionCard>

        {/* ══ Yükle (İçe Aktar) ═══════════════════════════════════════════════ */}
        <SectionCard
          title="Yükle (İçe Aktar)"
          icon="cloud-upload"
          iconBg="#FFF3E0"
          iconColor="#E65100"
        >
          <Text style={s.hint}>
            Daha önce dışarı aktardığınız{' '}
            <Text style={{ fontWeight: '700' }}>.json</Text> dosyasını seçin.
            Mevcut verilerinizin üzerine yazılacaktır.
          </Text>

          <View style={s.warningBox}>
            <Ionicons name="warning" size={16} color="#E65100" />
            <Text style={s.warningText}>
              Bu işlem mevcut tüm verilerin üzerine yazar. Önce dışarı aktarmanız önerilir.
            </Text>
          </View>

          <TouchableOpacity
            style={[s.solidBtn, { backgroundColor: '#E65100' }]}
            onPress={handleImport}
            disabled={importing}
          >
            {importing
              ? <ActivityIndicator color="#FFF" size="small" />
              : <Ionicons name="folder-open" size={18} color="#FFF" />
            }
            <Text style={s.solidBtnText}>
              {importing ? 'Yükleniyor…' : 'Dosyadan Yükle'}
            </Text>
          </TouchableOpacity>
        </SectionCard>

        {/* ══ Profili Sıfırla ════════════════════════════════════════════════ */}
        <SectionCard
          title="Profili Sıfırla"
          icon="trash"
          iconBg={COLORS.dangerLight}
          iconColor={COLORS.danger}
        >
          <Text style={s.hint}>
            Tüm uygulama verilerini silerek ilk kurulum ekranına dönün. Bu işlem geri alınamaz.
          </Text>
          <TouchableOpacity
            style={[s.outlineBtn, { borderColor: COLORS.danger }]}
            onPress={handleReset}
          >
            <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
            <Text style={[s.outlineBtnText, { color: COLORS.danger }]}>Tüm Verileri Sil</Text>
          </TouchableOpacity>
        </SectionCard>

      </ScrollView>

      {/* ── Önizleme Modal ────────────────────────────────────────────────────── */}
      {showPreview && (
        <View style={s.previewOverlay}>
          <View style={s.previewBox}>
            <View style={s.previewHeader}>
              <Text style={s.previewTitle}>Rapor Önizleme</Text>
              <TouchableOpacity onPress={() => setShowPreview(false)}>
                <Ionicons name="close-circle" size={26} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={s.previewScroll} showsVerticalScrollIndicator>
              <Text style={s.previewText}>{previewText}</Text>
            </ScrollView>
            <TouchableOpacity
              style={[s.solidBtn, { backgroundColor: COLORS.blue, margin: 16, marginTop: 8 }]}
              onPress={() => { setShowPreview(false); handleSendEmail(); }}
            >
              <Ionicons name="send" size={16} color="#FFF" />
              <Text style={s.solidBtnText}>Mail Gönder</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </LinearGradient>
  );
}

// ─── Yardımcı Bileşenler ──────────────────────────────────────────────────────

interface SectionCardProps {
  title: string;
  icon: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  children: React.ReactNode;
}
const SectionCard: React.FC<SectionCardProps> = ({ title, icon, iconBg, iconColor, children }) => (
  <View style={s.card}>
    <View style={s.cardHeader}>
      <View style={[s.cardIconBg, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={17} color={iconColor} />
      </View>
      <Text style={s.cardTitle}>{title}</Text>
    </View>
    {children}
  </View>
);

// ─── Stiller ─────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 48 },

  profileCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surface, borderRadius: 14, padding: 14,
    marginBottom: 12, ...SHADOWS.small,
    borderWidth: 1, borderColor: COLORS.borderLight, gap: 12,
  },
  profileIcon:  { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  profileName:  { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  profileSub:   { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },

  card: {
    backgroundColor: COLORS.surface, borderRadius: 16, padding: 16,
    marginBottom: 12, ...SHADOWS.small, borderWidth: 1, borderColor: COLORS.borderLight,
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 12,
    paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight, gap: 10,
  },
  cardIconBg: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  cardTitle:  { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },

  hint: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 19, marginBottom: 12 },

  monthRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.background, borderRadius: 12,
    marginBottom: 14, overflow: 'hidden',
  },
  monthArrow:  { padding: 12 },
  monthCenter: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  monthText:   { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  monthStats:  { flexDirection: 'row', gap: 12, marginTop: 4 },
  monthStat:   { flexDirection: 'row', alignItems: 'center', gap: 3 },
  monthStatText: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600' },

  fieldLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 },
  input: {
    backgroundColor: COLORS.background, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 14, color: COLORS.textPrimary,
    borderWidth: 1.5, borderColor: COLORS.border, marginBottom: 12,
  },

  btnRow: { flexDirection: 'row', gap: 10 },
  outlineBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, paddingHorizontal: 16,
    borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.primary,
    backgroundColor: COLORS.surface, gap: 6,
  },
  outlineBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  solidBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 13, paddingHorizontal: 16,
    borderRadius: 12, gap: 8,
  },
  solidBtnText: { fontSize: 14, fontWeight: '700', color: '#FFF' },

  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  infoText: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },

  warningBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: '#FFF3E0', borderRadius: 10, padding: 12, marginBottom: 12,
  },
  warningText: { flex: 1, fontSize: 12, color: '#BF360C', lineHeight: 18 },

  previewOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end',
  },
  previewBox: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    maxHeight: '88%',
  },
  previewHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight,
  },
  previewTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  previewScroll: { maxHeight: 500, padding: 16 },
  previewText: {
    fontSize: 12, color: COLORS.textPrimary, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 19,
  },
});
