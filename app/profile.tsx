import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getAntibodyLabel, getDiseaseLabel, getDrugLabel, getDosageLabel } from '../utils/labels';

// Ekran genişliğini al - responsive tasarım için
const { width } = Dimensions.get('window');

/**
 * Profil özet ekranı bileşeni
 * Kullanıcının girdiği tedavi bilgilerini kartlar halinde gösterir
 * Takvim sayfasına yönlendirme yapar
 */
const ProfileScreen: React.FC = () => {
  // URL parametrelerinden gelen verileri al
  const params = useLocalSearchParams();
  const router = useRouter();

  /**
   * Takvim sayfasına yönlendirme fonksiyonu
   * Başlangıç tarihi kontrolü yapar
   */
  const handleContinue = () => {
    if (!params.startDate) {
      alert('Lütfen doz başlangıç gününü seçin');
      return;
    }
    // Tüm parametreleri takvim sayfasına aktar
    router.push({
      pathname: '/calendar',
      params: {
        ...params,
        selectedForm: params.selectedForm || '', // Form seçimi yoksa boş string
      }
    });
  };

  /**
   * Tarih formatını değiştirir (YYYY-MM-DD -> DD/MM/YYYY)
   * @param date - YYYY-MM-DD formatında tarih
   * @returns DD/MM/YYYY formatında tarih
   */
  const formatDate = (date: string) => {
    if (!date) return '';
    const [year, month, day] = date.split('-');
    return `${day}/${month}/${year}`;
  };

  return (
    // Yeşil tonlarında gradient arka plan
    <LinearGradient
      colors={['#E8F5E9', '#FFFFFF']}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Profil başlık bölümü - kullanıcı adı ve yaşı */}
        <View style={styles.headerContainer}>
          <View style={styles.profileIconContainer}>
            <Ionicons name="person-circle-outline" size={80} color="#2E7D32" />
          </View>
          <Text style={styles.name}>{params.name as string} {params.surname as string}</Text>
          <Text style={styles.age}>{params.age as string} yaşında</Text>
        </View>

        {/* Bilgi kartları container'ı */}
        <View style={styles.cardContainer}>
          {/* Tedavi bilgileri kartı */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="medical-outline" size={24} color="#2E7D32" />
              <Text style={styles.cardTitle}>Tedavi Bilgileri</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Antikor:</Text>
              <Text style={styles.infoValue}>{getAntibodyLabel(params.selectedAntibody as string)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Hastalık:</Text>
              <Text style={styles.infoValue}>{getDiseaseLabel(params.selectedDisease as string)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>İlaç:</Text>
              <Text style={styles.infoValue}>{getDrugLabel(params.selectedDrug as string)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Dozaj:</Text>
              <Text style={styles.infoValue}>{getDosageLabel(params.selectedDosage as string)}</Text>
            </View>
            {/* Form seçimi varsa göster */}
            {params.selectedForm && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Form:</Text>
                <Text style={styles.infoValue}>
                  {params.selectedForm === 'enjektor' ? 'Enjektör' : 
                   params.selectedForm === 'toz' ? 'Toz' : 
                   params.selectedForm === 'kalem' ? 'Kalem' : 
                   params.selectedForm}
                </Text>
              </View>
            )}
          </View>

          {/* Süre bilgileri kartı */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="time-outline" size={24} color="#2E7D32" />
              <Text style={styles.cardTitle}>Süre Bilgileri</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Hastalık Süresi:</Text>
              <Text style={styles.infoValue}>
                {params.diseaseDuration as string} {
                  params.diseaseDurationType === 'year' ? 'yıl' :
                  params.diseaseDurationType === 'month' ? 'ay' :
                  'gün'
                }
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>İlaç Kullanım Süresi:</Text>
              <Text style={styles.infoValue}>
                {params.drugDuration as string} {
                  params.drugDurationType === 'year' ? 'yıl' :
                  params.drugDurationType === 'month' ? 'ay' :
                  'gün'
                }
              </Text>
            </View>
          </View>

          {/* Doz bilgileri kartı */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="calendar-outline" size={24} color="#2E7D32" />
              <Text style={styles.cardTitle}>Doz Bilgileri</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Başlangıç Tarihi:</Text>
              <Text style={styles.infoValue}>{formatDate(params.startDate as string)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Doz Sıklığı:</Text>
              <Text style={styles.infoValue}>{params.frequency as string} gün</Text>
            </View>
          </View>
        </View>

        {/* Takvime git butonu */}
        <TouchableOpacity style={styles.button} onPress={handleContinue}>
          <Text style={styles.buttonText}>Takvime Git</Text>
          <Ionicons name="calendar-outline" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
};

// Stil tanımlamaları
const styles = StyleSheet.create({
  // Ana container
  container: {
    flex: 1,
  },
  // Scroll container - platform'a göre farklı padding değerleri
  scrollContainer: {
    padding: Platform.select({
      web: 40, // Web için daha fazla padding
      default: 20 // Mobil için standart padding
    }),
    ...Platform.select({
      web: {
        maxWidth: 1200, // Web için maksimum genişlik
        marginHorizontal: 'auto', // Merkezleme
      },
      default: {}
    }),
  },
  // Profil başlık bölümü
  headerContainer: {
    alignItems: 'center',
    marginBottom: Platform.select({
      web: 40,
      default: 30
    }),
  },
  // Profil ikonu container'ı - yuvarlak beyaz arka plan
  profileIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5, // Android gölge efekti
  },
  // Kullanıcı adı
  name: {
    fontSize: Platform.select({
      web: 28,
      default: 24
    }),
    fontWeight: 'bold',
    color: '#2E7D32',
    marginTop: 15,
  },
  // Kullanıcı yaşı
  age: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  // Kartlar container'ı - platform'a göre farklı düzen
  cardContainer: {
    gap: Platform.select({
      web: 30,
      default: 20
    }),
    ...Platform.select({
      web: {
        flexDirection: 'row', // Web'de yan yana
        flexWrap: 'wrap',
        justifyContent: 'space-between',
      },
      default: {}
    }),
  },
  // Tek kart stili
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Platform.select({
      web: 20,
      default: 15
    }),
    padding: Platform.select({
      web: 30,
      default: 20
    }),
    ...Platform.select({
      web: {
        transition: 'transform 0.2s', // Web hover efekti
        ':hover': {
          transform: 'scale(1.02)',
        },
      },
      default: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5, // Android gölge efekti
      }
    }),
  },
  // Kart başlık bölümü - ikon ve başlık
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  // Kart başlık metni
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginLeft: 10,
  },
  // Bilgi satırı - etiket ve değer yan yana
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  // Bilgi etiketi
  infoLabel: {
    fontSize: 16,
    color: '#666',
  },
  // Bilgi değeri
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  // Takvime git butonu
  button: {
    backgroundColor: '#2E7D32',
    borderRadius: 30,
    padding: Platform.select({
      web: 20,
      default: 15
    }),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Platform.select({
      web: 40,
      default: 20
    }),
    marginBottom: Platform.select({
      web: 40,
      default: 30
    }),
    ...Platform.select({
      web: {
        maxWidth: 400, // Web için maksimum genişlik
        marginHorizontal: 'auto', // Merkezleme
        cursor: 'pointer', // Web cursor efekti
      },
      default: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5, // Android gölge efekti
      }
    }),
  },
  // Buton metni
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 10,
  },
});

export default ProfileScreen;