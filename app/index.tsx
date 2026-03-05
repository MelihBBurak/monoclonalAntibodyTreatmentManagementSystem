import { useEffect, useState } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, Dimensions, ScrollView, ActivityIndicator } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SHADOWS } from '../utils/styles';

const { width, height } = Dimensions.get('window');

const FEATURES = [
  {
    icon: 'medical' as const,
    iconBg: COLORS.primaryPale,
    iconColor: COLORS.primary,
    title: 'Kişiselleştirilmiş Tedavi',
    desc: '26 monoklonal antikor için özel doz takibi',
  },
  {
    icon: 'calendar' as const,
    iconBg: COLORS.blueLight,
    iconColor: COLORS.blue,
    title: 'Akıllı Takvim',
    desc: 'Doz günleri, ön uyarılar ve günlük hatırlatmalar',
  },
  {
    icon: 'warning' as const,
    iconBg: COLORS.dangerLight,
    iconColor: COLORS.danger,
    title: 'İlaç Güvenliği',
    desc: 'Kara kutu uyarıları ve ilaç etkileşim bildirimleri',
  },
  {
    icon: 'analytics' as const,
    iconBg: '#F3E5F5',
    iconColor: '#7B1FA2',
    title: 'Akıllı İzlem',
    desc: 'Hastalığınıza özel izlem ve kontrol önerileri',
  },
];

export default function Index() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkSavedProfile = async () => {
      try {
        const raw = await AsyncStorage.getItem('@mabcare_profile');
        if (raw) {
          const profile = JSON.parse(raw);
          router.replace({ pathname: '/calendar', params: profile });
          return;
        }
      } catch {}
      setChecking(false);
    };
    checkSavedProfile();
  }, []);

  if (checking) {
    return (
      <LinearGradient colors={['#0F3B1A', '#1B5E20', '#2E7D32']} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#FFF" />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#0F3B1A', '#1B5E20', '#2E7D32']}
      style={styles.outerGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.logoContainer}>
            <View style={styles.logoInner}>
              <Ionicons name="medkit" size={44} color={COLORS.primary} />
            </View>
            <View style={styles.logoPulse1} />
            <View style={styles.logoPulse2} />
          </View>

          <View style={styles.titleBlock}>
            <Text style={styles.appName}>MAbCare</Text>
            <Text style={styles.appNameSub}>Monoklonal Antikor Tedavi Yönetimi</Text>
          </View>

          <View style={styles.pillContainer}>
            <View style={styles.pill}>
              <View style={styles.pillDot} />
              <Text style={styles.pillText}>26 Antikor</Text>
            </View>
            <View style={styles.pill}>
              <View style={styles.pillDot} />
              <Text style={styles.pillText}>58 Hastalık</Text>
            </View>
            <View style={styles.pill}>
              <View style={styles.pillDot} />
              <Text style={styles.pillText}>31 İlaç</Text>
            </View>
          </View>
        </View>

        {/* White card section */}
        <View style={styles.cardSection}>
          <Text style={styles.cardSectionTitle}>Neler Sunuyoruz?</Text>

          <View style={styles.featuresGrid}>
            {FEATURES.map((f, i) => (
              <View key={i} style={styles.featureCard}>
                <View style={[styles.featureIconBg, { backgroundColor: f.iconBg }]}>
                  <Ionicons name={f.icon} size={22} color={f.iconColor} />
                </View>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            ))}
          </View>

          {/* Info banner */}
          <View style={styles.infoBanner}>
            <Ionicons name="shield-checkmark" size={20} color={COLORS.primary} />
            <Text style={styles.infoBannerText}>
              Micromedex verilerine dayalı klinik içerikler ile her doz günü kişiselleştirilmiş uyarılar alın.
            </Text>
          </View>

          {/* CTA */}
          <Link href="/about" asChild>
            <TouchableOpacity style={styles.ctaButton} activeOpacity={0.85}>
              <LinearGradient
                colors={[COLORS.primaryLight, COLORS.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.ctaGradient}
              >
                <Text style={styles.ctaText}>Tedavi Profilini Oluştur</Text>
                <View style={styles.ctaArrow}>
                  <Ionicons name="arrow-forward" size={18} color={COLORS.primary} />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Link>

          <Text style={styles.disclaimer}>
            Bu uygulama tıbbi tavsiye vermez. Tedavi kararları için hekiminize danışın.
          </Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  outerGradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },

  // Hero
  heroSection: {
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 48,
    paddingHorizontal: 24,
  },
  logoContainer: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  logoInner: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
    ...SHADOWS.large,
  },
  logoPulse1: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    zIndex: 2,
  },
  logoPulse2: {
    position: 'absolute',
    width: 116,
    height: 116,
    borderRadius: 58,
    backgroundColor: 'rgba(255,255,255,0.08)',
    zIndex: 1,
  },
  titleBlock: {
    alignItems: 'center',
    marginBottom: 24,
  },
  appName: {
    fontSize: 40,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  appNameSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '500',
  },
  pillContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  pillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#A5D6A7',
    marginRight: 6,
  },
  pillText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },

  // Card section
  cardSection: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 28,
    paddingBottom: 48,
    flex: 1,
    minHeight: height * 0.55,
  },
  cardSectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 20,
    letterSpacing: -0.3,
  },

  // Features
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  featureCard: {
    width: (width - 56 - 12) / 2,
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  featureIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  featureTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
    lineHeight: 18,
  },
  featureDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 17,
  },

  // Info banner
  infoBanner: {
    backgroundColor: COLORS.primaryPale,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  infoBannerText: {
    fontSize: 13,
    color: COLORS.primary,
    flex: 1,
    marginLeft: 10,
    lineHeight: 20,
    fontWeight: '500',
  },

  // CTA button
  ctaButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    ...SHADOWS.medium,
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  ctaText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  ctaArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  disclaimer: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
});
