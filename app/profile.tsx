import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getAntibodyLabel, getDiseaseLabel, getDrugLabel, getDosageLabel } from '../utils/labels';

const { width } = Dimensions.get('window');

const ProfileScreen: React.FC = () => {
  const params = useLocalSearchParams();
  const router = useRouter();

  const handleContinue = () => {
    if (!params.startDate) {
      alert('Lütfen doz başlangıç gününü seçin');
      return;
    }
    router.push({
      pathname: '/calendar',
      params: {
        ...params,
        selectedForm: params.selectedForm || '',
      }
    });
  };

  const formatDate = (date: string) => {
    if (!date) return '';
    const [year, month, day] = date.split('-');
    return `${day}/${month}/${year}`;
  };

  return (
    <LinearGradient
      colors={['#E8F5E9', '#FFFFFF']}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.headerContainer}>
          <View style={styles.profileIconContainer}>
            <Ionicons name="person-circle-outline" size={80} color="#2E7D32" />
          </View>
          <Text style={styles.name}>{params.name as string} {params.surname as string}</Text>
          <Text style={styles.age}>{params.age as string} yaşında</Text>
        </View>

        <View style={styles.cardContainer}>
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

        <TouchableOpacity style={styles.button} onPress={handleContinue}>
          <Text style={styles.buttonText}>Takvime Git</Text>
          <Ionicons name="calendar-outline" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: Platform.select({
      web: 40,
      default: 20
    }),
    ...Platform.select({
      web: {
        maxWidth: 1200,
        marginHorizontal: 'auto',
      },
      default: {}
    }),
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: Platform.select({
      web: 40,
      default: 30
    }),
  },
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
    elevation: 5,
  },
  name: {
    fontSize: Platform.select({
      web: 28,
      default: 24
    }),
    fontWeight: 'bold',
    color: '#2E7D32',
    marginTop: 15,
  },
  age: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  cardContainer: {
    gap: Platform.select({
      web: 30,
      default: 20
    }),
    ...Platform.select({
      web: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
      },
      default: {}
    }),
  },
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
        transition: 'transform 0.2s',
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
        elevation: 5,
      }
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginLeft: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
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
        maxWidth: 400,
        marginHorizontal: 'auto',
        cursor: 'pointer',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
      }
    }),
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 10,
  },
});

export default ProfileScreen;