import { Text, View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

// Ekran genişliğini al - responsive tasarım için kullanılır
const { width } = Dimensions.get('window');

/**
 * Ana giriş ekranı bileşeni
 * Kullanıcıya uygulamanın ne olduğunu açıklar ve tedavi bilgileri formuna yönlendirir
 */
export default function Index() {
  return (
    <View style={styles.container}>
      {/* Yeşil tonlarında gradient arka plan */}
      <LinearGradient
        colors={['#E8F5E9', '#FFFFFF']}
        style={styles.gradient}
      >
        {/* Başlık bölümü - Uygulama adı ve açıklaması */}
        <View style={styles.headerContainer}>
          <Ionicons name="medical-outline" size={80} color="#2E7D32" />
          <Text style={styles.title}>Monoklonal Antikor</Text>
          <Text style={styles.subtitle}>Tedavi Yönetim Sistemi</Text>
        </View>

        {/* Özellikler bölümü - Uygulamanın sunduğu hizmetleri gösterir */}
        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <Ionicons name="calendar-outline" size={24} color="#2E7D32" />
            <Text style={styles.featureText}>Doz Takibi</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="notifications-outline" size={24} color="#2E7D32" />
            <Text style={styles.featureText}>Hatırlatmalar</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="analytics-outline" size={24} color="#2E7D32" />
            <Text style={styles.featureText}>Tedavi Takibi</Text>
          </View>
        </View>

        {/* Bilgilendirme metni */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            Tedavinizi daha etkili yönetmek için yanınızdayız
          </Text>
        </View>

        {/* Başlama butonu - Tedavi bilgileri formuna yönlendirir */}
        <Link href="/about" asChild>
          <TouchableOpacity style={styles.button}>
            <View style={styles.buttonContent}>
              <Text style={styles.buttonText}>Başlayın</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        </Link>
      </LinearGradient>
    </View>
  );
}

// Stil tanımlamaları
const styles = StyleSheet.create({
  // Ana container - tüm ekranı kaplar
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  // Gradient arka plan - yeşil tonlarında geçiş efekti
  gradient: {
    flex: 1,
    padding: 20,
  },
  // Başlık bölümü - logo, başlık ve alt başlık
  headerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  // Ana başlık - uygulama adı
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginTop: 20,
    textAlign: 'center',
  },
  // Alt başlık - uygulama açıklaması
  subtitle: {
    fontSize: 20,
    color: '#4CAF50',
    marginTop: 5,
    textAlign: 'center',
  },
  // Özellikler container - 3 özellik kartını yan yana gösterir
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 40,
    paddingHorizontal: 20,
  },
  // Tek özellik kartı - ikon ve açıklama
  featureItem: {
    alignItems: 'center',
    width: width / 4, // Ekran genişliğinin 1/4'ü kadar yer kaplar
  },
  // Özellik açıklama metni
  featureText: {
    marginTop: 8,
    fontSize: 12,
    color: '#2E7D32',
    textAlign: 'center',
  },
  // Bilgilendirme metni container'ı
  infoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  // Bilgilendirme metni
  infoText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  // Başlama butonu - yeşil arka plan ve gölge efekti
  button: {
    backgroundColor: '#2E7D32',
    borderRadius: 30,
    padding: 15,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5, // Android için gölge efekti
  },
  // Buton içeriği - metin ve ikon yan yana
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Buton metni
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 10,
  },
});
