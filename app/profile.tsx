import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../utils/styles';
import {
  getAntibodyEntry,
  getBlackBoxWarning,
  getMechanismDetail,
  getDrugInteractions,
  getMajorWarnings,
  getMonitoringRecommendations,
  type DrugInteraction,
} from '../utils/treatmentDataService';

// ─── Yardımcılar ─────────────────────────────────────────────────────────────
const FORM_LABELS: Record<string, string> = { enjektor: 'Enjektör', kalem: 'Kalem', toz: 'Toz' };
const DUR_LABELS:  Record<string, string> = { year: 'yıl', month: 'ay', week: 'hafta' };

/** Metni belirtilen karakter sayısında kırpar */
const truncate = (text: string, n = 80) =>
  text.length > n ? text.slice(0, n).trimEnd() + '…' : text;

// ─── Genel Bilgi Popup ────────────────────────────────────────────────────────
interface InfoPopupProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  content: string;
  accentColor: string;
  accentBg: string;
  iconName: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap;
  onClose: () => void;
}
const InfoPopup: React.FC<InfoPopupProps> = ({
  visible, title, subtitle, content, accentColor, accentBg, iconName, onClose,
}) => (
  <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
    <View style={popupStyles.overlay}>
      <View style={popupStyles.box}>
        <View style={popupStyles.header}>
          <View style={[popupStyles.iconBg, { backgroundColor: accentBg }]}>
            <Ionicons name={iconName} size={20} color={accentColor} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={popupStyles.title}>{title}</Text>
            {subtitle ? <Text style={popupStyles.subtitle}>{subtitle}</Text> : null}
          </View>
          <TouchableOpacity style={popupStyles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
        <ScrollView style={popupStyles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={popupStyles.content}>{content}</Text>
        </ScrollView>
        <TouchableOpacity style={[popupStyles.okBtn, { backgroundColor: accentColor }]} onPress={onClose}>
          <Text style={popupStyles.okBtnText}>Tamam</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

// ─── Ana Bileşen ─────────────────────────────────────────────────────────────
const ProfileScreen: React.FC = () => {
  const params = useLocalSearchParams();
  const router = useRouter();

  const antibody     = params.selectedAntibody as string;
  const blackBox     = getBlackBoxWarning(antibody);
  const mechanism    = getMechanismDetail(antibody);
  const interactions = getDrugInteractions(antibody);
  const warnings     = getMajorWarnings(antibody);
  const monitoring   = getMonitoringRecommendations(antibody);
  const entry        = getAntibodyEntry(antibody);

  // Popup state'leri
  const [mechPopup,    setMechPopup]    = useState(false);
  const [blackPopup,   setBlackPopup]   = useState(false);
  const [warnPopup,    setWarnPopup]    = useState(false);
  const [monitorPopup, setMonitorPopup] = useState(false);
  const [interPopup,   setInterPopup]   = useState<DrugInteraction | null>(null);

  const handleContinue = () => {
    router.push({
      pathname: '/calendar',
      params: { ...params, selectedForm: params.selectedForm || '' },
    });
  };

  const formatDate = (d: string) => {
    if (!d) return '';
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
  };

  const majorInteractions = interactions.filter(i => i.severity === 'Major');

  return (
    <LinearGradient colors={['#F5F7F5', '#FFFFFF']} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Hero ── */}
        <View style={styles.hero}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={34} color={COLORS.primary} />
          </View>
          <Text style={styles.heroName}>{params.name} {params.surname}</Text>
          <Text style={styles.heroAge}>{params.age} yaşında</Text>
          <View style={styles.heroBadgeRow}>
            <View style={[styles.badge, { backgroundColor: COLORS.primaryPale }]}>
              <Ionicons name="medical" size={12} color={COLORS.primary} />
              <Text style={[styles.badgeText, { color: COLORS.primary }]}>{antibody}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: COLORS.blueLight }]}>
              <Ionicons name="repeat" size={12} color={COLORS.blue} />
              <Text style={[styles.badgeText, { color: COLORS.blue }]}>
                {params.frequency} günde bir
              </Text>
            </View>
          </View>
        </View>

        {/* ── Kara Kutu Uyarısı (kısa + detay butonu) ── */}
        {blackBox && (
          <View style={styles.blackCard}>
            <View style={styles.blackCardTop}>
              <Ionicons name="warning" size={18} color={COLORS.danger} style={{ flexShrink: 0 }} />
              <Text style={styles.blackCardTitle}>Kara Kutu Uyarısı (FDA)</Text>
            </View>
            <Text style={styles.blackCardShort} numberOfLines={2}>
              {truncate(blackBox, 100)}
            </Text>
            <TouchableOpacity style={styles.readMoreBtn} onPress={() => setBlackPopup(true)}>
              <Text style={[styles.readMoreText, { color: COLORS.danger }]}>Tamamını oku</Text>
              <Ionicons name="chevron-forward" size={13} color={COLORS.danger} />
            </TouchableOpacity>
          </View>
        )}

        {/* ── Tedavi Detayları ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconBg, { backgroundColor: COLORS.primaryPale }]}>
              <Ionicons name="medical" size={16} color={COLORS.primary} />
            </View>
            <Text style={styles.cardTitle}>Tedavi Detayları</Text>
          </View>
          {[
            { label: 'Hastalık',   value: params.selectedDisease as string,   icon: 'fitness'   as const },
            { label: 'İlaç',       value: params.selectedDrug as string,       icon: 'flask'     as const },
            { label: 'Dozaj',      value: params.selectedDosage as string,     icon: 'beaker'    as const },
            ...(params.selectedForm
              ? [{ label: 'Form', value: FORM_LABELS[params.selectedForm as string] || params.selectedForm as string, icon: 'water' as const }]
              : []),
            { label: 'Sıklık',     value: `Her ${params.frequency} günde bir`,icon: 'repeat'    as const },
            { label: 'İlk Doz',    value: formatDate(params.startDate as string), icon: 'calendar' as const },
            { label: 'Hastalık Süresi',
              value: `${params.diseaseDuration} ${DUR_LABELS[params.diseaseDurationType as string] || ''}`,
              icon: 'hourglass' as const },
            { label: 'İlaç Kullanım Süresi',
              value: `${params.drugDuration} ${DUR_LABELS[params.drugDurationType as string] || ''}`,
              icon: 'time'     as const },
          ].map((row, i, arr) => (
            <View key={row.label} style={[styles.infoRow, i === arr.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={styles.infoLabelWrap}>
                <Ionicons name={row.icon} size={13} color={COLORS.textMuted} style={{ marginRight: 6 }} />
                <Text style={styles.infoLabel}>{row.label}</Text>
              </View>
              <Text style={styles.infoValue} numberOfLines={2}>{row.value}</Text>
            </View>
          ))}
        </View>

        {/* ── Etki Mekanizması (kısa + detay butonu) ── */}
        {mechanism ? (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconBg, { backgroundColor: COLORS.tealLight }]}>
                <Ionicons name="flask" size={16} color={COLORS.teal} />
              </View>
              <Text style={styles.cardTitle}>Nasıl Çalışır?</Text>
            </View>
            <View style={styles.mechBox}>
              <Text style={styles.mechCategory}>{entry?.mechanism}</Text>
              <Text style={styles.mechShort} numberOfLines={3}>{truncate(mechanism, 120)}</Text>
              <TouchableOpacity style={styles.readMoreBtn} onPress={() => setMechPopup(true)}>
                <Text style={[styles.readMoreText, { color: COLORS.teal }]}>Mekanizmayı anla</Text>
                <Ionicons name="chevron-forward" size={13} color={COLORS.teal} />
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* ── İstatistik Kutuları ── */}
        <View style={styles.statRow}>
          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: majorInteractions.length > 0 ? COLORS.dangerLight : COLORS.primaryPale }]}
            onPress={() => majorInteractions.length > 0 && setInterPopup(majorInteractions[0])}
          >
            <Text style={[styles.statNum, { color: majorInteractions.length > 0 ? COLORS.danger : COLORS.primary }]}>
              {majorInteractions.length}
            </Text>
            <Text style={[styles.statLabel, { color: majorInteractions.length > 0 ? COLORS.danger : COLORS.primary }]}>
              Major{'\n'}Etkileşim
            </Text>
            {majorInteractions.length > 0 && (
              <Ionicons name="chevron-forward" size={14} color={COLORS.danger} style={{ marginTop: 4 }} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: COLORS.amberLight }]}
            onPress={() => warnings.length > 0 && setWarnPopup(true)}
          >
            <Text style={[styles.statNum, { color: COLORS.amber }]}>{warnings.length}</Text>
            <Text style={[styles.statLabel, { color: COLORS.amber }]}>Önemli{'\n'}Uyarı</Text>
            {warnings.length > 0 && (
              <Ionicons name="chevron-forward" size={14} color={COLORS.amber} style={{ marginTop: 4 }} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: COLORS.blueLight }]}
            onPress={() => monitoring.length > 0 && setMonitorPopup(true)}
          >
            <Text style={[styles.statNum, { color: COLORS.blue }]}>{monitoring.length}</Text>
            <Text style={[styles.statLabel, { color: COLORS.blue }]}>İzlem{'\n'}Kriteri</Text>
            {monitoring.length > 0 && (
              <Ionicons name="chevron-forward" size={14} color={COLORS.blue} style={{ marginTop: 4 }} />
            )}
          </TouchableOpacity>
        </View>
        <Text style={styles.statHint}>Kutucuklara dokunarak detayları inceleyin</Text>

        {/* ── İlaç Etkileşimleri (major, ilk 3 göster) ── */}
        {majorInteractions.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconBg, { backgroundColor: COLORS.dangerLight }]}>
                <Ionicons name="swap-horizontal" size={16} color={COLORS.danger} />
              </View>
              <Text style={styles.cardTitle}>Dikkat: İlaç Etkileşimleri</Text>
            </View>
            {majorInteractions.slice(0, 3).map((inter, i) => (
              <TouchableOpacity
                key={i}
                style={styles.interRow}
                onPress={() => setInterPopup(inter)}
                activeOpacity={0.75}
              >
                <View style={styles.interLeft}>
                  <View style={styles.majorBadge}>
                    <Text style={styles.majorBadgeText}>MAJOR</Text>
                  </View>
                  <Text style={styles.interDrug} numberOfLines={1}>{inter.drug}</Text>
                </View>
                <Text style={styles.interNote} numberOfLines={1}>{truncate(inter.note, 50)}</Text>
                <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} style={{ marginLeft: 4, flexShrink: 0 }} />
              </TouchableOpacity>
            ))}
            {majorInteractions.length > 3 && (
              <Text style={styles.moreText}>+{majorInteractions.length - 3} daha fazla etkileşim</Text>
            )}
          </View>
        )}

        {/* ── CTA ── */}
        <TouchableOpacity style={styles.ctaButton} onPress={handleContinue} activeOpacity={0.85}>
          <LinearGradient
            colors={[COLORS.primaryLight, COLORS.primaryDark]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.ctaGradient}
          >
            <Ionicons name="calendar" size={20} color="#FFF" />
            <Text style={styles.ctaText}>Tedavi Takvimime Git</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* ═══════════ Popuplar ═══════════ */}

      {/* Kara Kutu */}
      <InfoPopup
        visible={blackPopup}
        title="Kara Kutu Uyarısı"
        subtitle={`${antibody} · FDA Güvenlik Uyarısı`}
        content={blackBox || ''}
        accentColor={COLORS.danger}
        accentBg={COLORS.dangerLight}
        iconName="warning"
        onClose={() => setBlackPopup(false)}
      />

      {/* Mekanizma */}
      <InfoPopup
        visible={mechPopup}
        title="Etki Mekanizması"
        subtitle={entry?.mechanism}
        content={mechanism}
        accentColor={COLORS.teal}
        accentBg={COLORS.tealLight}
        iconName="flask"
        onClose={() => setMechPopup(false)}
      />

      {/* Uyarılar */}
      <InfoPopup
        visible={warnPopup}
        title="Önemli Uyarılar"
        subtitle={`${warnings.length} uyarı`}
        content={warnings.map((w, i) => `${i + 1}. ${w}`).join('\n\n')}
        accentColor={COLORS.amber}
        accentBg={COLORS.amberLight}
        iconName="alert-circle"
        onClose={() => setWarnPopup(false)}
      />

      {/* İzlem */}
      <InfoPopup
        visible={monitorPopup}
        title="İzlem Gereksinimleri"
        subtitle="Doktorunuzun takip etmesi gereken parametreler"
        content={monitoring.map((m, i) => `${i + 1}. ${m}`).join('\n\n')}
        accentColor={COLORS.blue}
        accentBg={COLORS.blueLight}
        iconName="pulse"
        onClose={() => setMonitorPopup(false)}
      />

      {/* Etkileşim detayı */}
      {interPopup && (
        <Modal transparent animationType="fade" visible={!!interPopup} onRequestClose={() => setInterPopup(null)}>
          <View style={popupStyles.overlay}>
            <View style={popupStyles.box}>
              <View style={popupStyles.header}>
                <View style={[popupStyles.iconBg, { backgroundColor: COLORS.dangerLight }]}>
                  <Ionicons name="swap-horizontal" size={20} color={COLORS.danger} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={popupStyles.title}>{interPopup.drug}</Text>
                  <View style={[popupStyles.severityBadge, { backgroundColor: COLORS.danger }]}>
                    <Text style={popupStyles.severityText}>{interPopup.severity}</Text>
                  </View>
                </View>
                <TouchableOpacity style={popupStyles.closeBtn} onPress={() => setInterPopup(null)}>
                  <Ionicons name="close" size={20} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>
              <View style={[popupStyles.interNoteBox, { backgroundColor: COLORS.dangerLight, borderColor: COLORS.dangerBorder }]}>
                <Text style={popupStyles.interNoteText}>{interPopup.note}</Text>
              </View>
              <Text style={popupStyles.interDisclaimer}>
                Bu etkileşimi doktorunuza bildirin. Bir ilacı kendi başınıza bırakmayın.
              </Text>
              <TouchableOpacity
                style={[popupStyles.okBtn, { backgroundColor: COLORS.danger }]}
                onPress={() => setInterPopup(null)}
              >
                <Text style={popupStyles.okBtnText}>Anladım</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </LinearGradient>
  );
};

// ─── Stiller ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  scroll: { paddingBottom: 48 },

  hero: {
    alignItems: 'center', paddingTop: 28, paddingBottom: 24,
    paddingHorizontal: 20, backgroundColor: COLORS.surface,
    borderBottomWidth: 1, borderBottomColor: COLORS.borderLight, marginBottom: 12,
  },
  avatar: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: COLORS.primaryPale, alignItems: 'center',
    justifyContent: 'center', borderWidth: 3, borderColor: '#C8E6C9',
    marginBottom: 12, ...SHADOWS.small,
  },
  heroName:    { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary, letterSpacing: -0.3 },
  heroAge:     { fontSize: 14, color: COLORS.textSecondary, marginTop: 4, marginBottom: 12 },
  heroBadgeRow:{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  badge:       { flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, gap: 5 },
  badgeText:   { fontSize: 12, fontWeight: '700' },

  blackCard: {
    marginHorizontal: 16, marginBottom: 12,
    backgroundColor: COLORS.dangerLight, borderRadius: 16,
    padding: 14, borderLeftWidth: 4, borderLeftColor: COLORS.danger,
    ...SHADOWS.small,
  },
  blackCardTop:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  blackCardTitle: { fontSize: 13, fontWeight: '800', color: COLORS.danger, textTransform: 'uppercase', letterSpacing: 0.4 },
  blackCardShort: { fontSize: 13, color: '#7F1D1D', lineHeight: 19, fontWeight: '500', marginBottom: 6 },

  readMoreBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 3 },
  readMoreText: { fontSize: 13, fontWeight: '700' },

  card: {
    backgroundColor: COLORS.surface, borderRadius: 16,
    padding: 16, marginHorizontal: 16, marginBottom: 12,
    ...SHADOWS.small, borderWidth: 1, borderColor: COLORS.borderLight,
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 12, paddingBottom: 10,
    borderBottomWidth: 1, borderBottomColor: COLORS.borderLight,
  },
  cardIconBg: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  cardTitle:  { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },

  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: COLORS.borderLight,
  },
  infoLabelWrap: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  infoLabel:     { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  infoValue:     { fontSize: 13, color: COLORS.textPrimary, fontWeight: '700', textAlign: 'right', flex: 1, marginLeft: 8 },

  mechBox: {
    backgroundColor: COLORS.tealLight, borderRadius: 12, padding: 12,
  },
  mechCategory: { fontSize: 12, fontWeight: '800', color: COLORS.teal, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.3 },
  mechShort:    { fontSize: 13, color: '#004D40', lineHeight: 19, fontWeight: '500', marginBottom: 6 },

  statRow:  { flexDirection: 'row', gap: 10, marginHorizontal: 16, marginBottom: 4 },
  statCard: { flex: 1, borderRadius: 14, padding: 14, alignItems: 'center', ...SHADOWS.small },
  statNum:  { fontSize: 28, fontWeight: '800', letterSpacing: -1 },
  statLabel:{ fontSize: 11, fontWeight: '600', marginTop: 2, textAlign: 'center', lineHeight: 15 },
  statHint: { fontSize: 11, color: COLORS.textMuted, textAlign: 'center', marginBottom: 12, marginHorizontal: 16 },

  interRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: COLORS.borderLight,
  },
  interLeft:       { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 },
  majorBadge:      { backgroundColor: COLORS.danger, borderRadius: 5, paddingHorizontal: 5, paddingVertical: 2, marginRight: 8, flexShrink: 0 },
  majorBadgeText:  { fontSize: 9, fontWeight: '800', color: '#FFF', letterSpacing: 0.5 },
  interDrug:       { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary, flex: 1 },
  interNote:       { fontSize: 12, color: COLORS.textSecondary, flex: 1 },
  moreText:        { fontSize: 12, color: COLORS.textMuted, textAlign: 'center', marginTop: 8, fontWeight: '600' },

  ctaButton: {
    marginHorizontal: 16, marginTop: 4, borderRadius: 16,
    overflow: 'hidden', ...SHADOWS.medium,
  },
  ctaGradient: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', paddingVertical: 18, paddingHorizontal: 20, gap: 10,
  },
  ctaText: { fontSize: 16, fontWeight: '700', color: '#FFF', flex: 1, textAlign: 'center' },
});

const popupStyles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  box: {
    backgroundColor: COLORS.surface, borderRadius: 24,
    padding: 22, width: '100%', maxHeight: '80%',
    ...SHADOWS.large,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16, gap: 12 },
  iconBg: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  title:  { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary },
  subtitle: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2, fontWeight: '500' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  scroll: { maxHeight: 280, marginBottom: 16 },
  content: { fontSize: 14, color: COLORS.textPrimary, lineHeight: 22 },
  okBtn:   { borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  okBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  severityBadge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, marginTop: 4, alignSelf: 'flex-start' },
  severityText:  { fontSize: 10, fontWeight: '800', color: '#FFF', letterSpacing: 0.5 },
  interNoteBox:  { borderRadius: 12, padding: 14, borderWidth: 1, marginBottom: 12 },
  interNoteText: { fontSize: 14, color: COLORS.textPrimary, lineHeight: 22 },
  interDisclaimer: { fontSize: 12, color: COLORS.textMuted, textAlign: 'center', marginBottom: 16, lineHeight: 18 },
});

export default ProfileScreen;
