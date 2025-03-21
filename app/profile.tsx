import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const getAntibodyLabel = (value: string) => {
  switch (value) {
    case 'adalimumab':
      return 'Adalimumab';
    case 'certolizumab':
      return 'Certolizumab pegol';
    case 'golimumab':
      return 'Golimumab';
    case 'infliximab':
      return 'Infliximab';
    case 'canakinumab':
      return 'Canakinumab';
    default:
      return value;
  }
};

const getDiseaseLabel = (value: string) => {
  switch (value) {
    case 'romatoid':
      return 'Romatoid artrit';
    case 'ankilozan':
      return 'Ankilozan spondilit';
    case 'psoriyatik':
      return 'Psöriyatik artrit';
    case 'crohn':
      return 'Crohn hastalığı';
    case 'ulseratif':
      return 'Ülseratif Kolit';
    default:
      return value;
  }
};

const getDrugLabel = (value: string) => {
  switch (value) {
    case 'humira':
      return 'Humira';
    case 'cimzia':
      return 'Cimzia';
    case 'simponi':
      return 'Simponi';
    case 'remicade':
      return 'Remicade';
    case 'inflectra':
      return 'Inflectra';
    case 'remsima':
      return 'Remsima';
    case 'ilaris':
      return 'Ilaris';
    default:
      return value;
  }
};

const getDosageLabel = (value: string) => {
  switch (value) {
    case '40mg':
      return '40mg/0.4ml';
    case '200mg':
      return '200mg/1ml';
    case '50mg':
      return '50mg/0.5ml';
    case '100mg':
      return '100mg/10ml';
    case '400mg':
      return '400mg/40ml';
    case '150mg':
      return '150mg/1ml';
    default:
      return value;
  }
};

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
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="time-outline" size={24} color="#2E7D32" />
              <Text style={styles.cardTitle}>Süre Bilgileri</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Hastalık Süresi:</Text>
              <Text style={styles.infoValue}>{params.diseaseDuration as string}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>İlaç Kullanım Süresi:</Text>
              <Text style={styles.infoValue}>{params.drugDuration as string}</Text>
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