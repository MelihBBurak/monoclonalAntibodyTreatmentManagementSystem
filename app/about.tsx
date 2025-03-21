import { useState, useEffect } from 'react';
import { Text, View, StyleSheet, TextInput, TouchableOpacity, ScrollView, Modal, Dimensions, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Calendar, DateData } from 'react-native-calendars';

// Statik veri
const MOCK_DATA = {
  antibodies: ['Adalimumab', 'Infliximab', 'Rituximab'],
  diseases: {
    'Adalimumab': ['Romatoid Artrit', 'Crohn Hastalığı'],
    'Infliximab': ['Ülseratif Kolit', 'Ankilozan Spondilit'],
    'Rituximab': ['Lenfoma', 'Lösemi']
  },
  drugs: {
    'Romatoid Artrit': ['Humira', 'Amgevita'],
    'Crohn Hastalığı': ['Humira'],
    'Ülseratif Kolit': ['Remicade'],
    'Ankilozan Spondilit': ['Remicade'],
    'Lenfoma': ['MabThera'],
    'Lösemi': ['MabThera']
  },
  dosages: {
    'Humira': ['40mg/0.4ml', '80mg/0.8ml'],
    'Amgevita': ['40mg/0.8ml'],
    'Remicade': ['100mg'],
    'MabThera': ['500mg', '1000mg']
  },
  frequencies: {
    '40mg/0.4ml': 14,
    '80mg/0.8ml': 28,
    '40mg/0.8ml': 14,
    '100mg': 56,
    '500mg': 180,
    '1000mg': 180
  }
};

const AboutScreen = () => {
  const router = useRouter();
  const [antibodies, setAntibodies] = useState<string[]>([]);
  const [diseases, setDiseases] = useState<string[]>([]);
  const [drugs, setDrugs] = useState<string[]>([]);
  const [dosages, setDosages] = useState<string[]>([]);
  const [selectedAntibody, setSelectedAntibody] = useState<string>('');
  const [selectedDisease, setSelectedDisease] = useState<string>('');
  const [selectedDrug, setSelectedDrug] = useState<string>('');
  const [selectedDosage, setSelectedDosage] = useState<string>('');
  const [selectedFrequency, setSelectedFrequency] = useState<number>(0);
  const [name, setName] = useState<string>('');
  const [surname, setSurname] = useState<string>('');
  const [age, setAge] = useState<string>('');
  const [diseaseDuration, setDiseaseDuration] = useState<string>('');
  const [diseaseDurationType, setDiseaseDurationType] = useState<'year' | 'month' | 'week'>('week');
  const [drugDuration, setDrugDuration] = useState<string>('');
  const [drugDurationType, setDrugDurationType] = useState<'year' | 'month' | 'week'>('week');
  const [isCalendarVisible, setIsCalendarVisible] = useState<boolean>(false);
  const [selectedStartDate, setSelectedStartDate] = useState<string>('');
  const [startDate, setStartDate] = useState<Date>(new Date());

  useEffect(() => {
    // CSV okuma yerine statik veriyi kullan
    setAntibodies(MOCK_DATA.antibodies);
  }, []);

  const handleAgeChange = (text: string) => {
    const num = parseInt(text);
    if (text === '' || (num >= 1 && num <= 99)) {
      setAge(text);
    }
  };

  const handleDurationChange = (text: string) => {
    const num = parseInt(text);
    if (text === '') {
      setDiseaseDuration(text);
      return;
    }

    let isValid = false;
    switch (diseaseDurationType) {
      case 'year':
        isValid = num >= 1 && num <= 99;
        break;
      case 'month':
        isValid = num >= 1 && num <= 12;
        break;
      case 'week':
        isValid = num >= 0 && num <= 52;
        break;
    }

    if (isValid) {
      setDiseaseDuration(text);
    }
  };

  const handleDrugDurationChange = (text: string) => {
    const num = parseInt(text);
    if (text === '') {
      setDrugDuration(text);
      return;
    }

    let isValid = false;
    switch (drugDurationType) {
      case 'year':
        isValid = num >= 1 && num <= 99;
        break;
      case 'month':
        isValid = num >= 1 && num <= 12;
        break;
      case 'week':
        isValid = num >= 0 && num <= 52;
        break;
    }

    if (isValid) {
      // İlaç kullanım süresinin hastalık süresinden fazla olmaması için kontrol
      const diseaseNum = parseInt(diseaseDuration);
      if (diseaseDuration && diseaseNum) {
        let diseaseInWeeks = 0;
        let drugInWeeks = 0;

        // Hastalık süresini haftaya çevir
        switch (diseaseDurationType) {
          case 'year':
            diseaseInWeeks = diseaseNum * 52;
            break;
          case 'month':
            diseaseInWeeks = diseaseNum * 4;
            break;
          case 'week':
            diseaseInWeeks = diseaseNum;
            break;
        }

        // İlaç süresini haftaya çevir
        switch (drugDurationType) {
          case 'year':
            drugInWeeks = num * 52;
            break;
          case 'month':
            drugInWeeks = num * 4;
            break;
          case 'week':
            drugInWeeks = num;
            break;
        }

        if (drugInWeeks > diseaseInWeeks) {
          Alert.alert('Hata', 'İlaç kullanım süresi hastalık süresinden fazla olamaz.');
          return;
        }
      }
      setDrugDuration(text);
    }
  };

  const handleAntibodyChange = (value: string) => {
    setSelectedAntibody(value);
    setSelectedDisease('');
    setSelectedDrug('');
    setSelectedDosage('');
    setSelectedFrequency(0);
    if (value) {
      setDiseases(MOCK_DATA.diseases[value] || []);
    } else {
      setDiseases([]);
    }
  };

  const handleDiseaseChange = (value: string) => {
    setSelectedDisease(value);
    setSelectedDrug('');
    setSelectedDosage('');
    setSelectedFrequency(0);
    if (value) {
      setDrugs(MOCK_DATA.drugs[value] || []);
    } else {
      setDrugs([]);
    }
  };

  const handleDrugChange = (value: string) => {
    setSelectedDrug(value);
    setSelectedDosage('');
    setSelectedFrequency(0);
    if (value) {
      setDosages(MOCK_DATA.dosages[value] || []);
    } else {
      setDosages([]);
    }
  };

  const handleDosageChange = (value: string) => {
    setSelectedDosage(value);
    if (value) {
      setSelectedFrequency(MOCK_DATA.frequencies[value] || 0);
    } else {
      setSelectedFrequency(0);
    }
  };

  const handleSubmit = async () => {
    if (!name || !surname || !age || !selectedAntibody || !selectedDisease || 
        !selectedDrug || !selectedDosage || !diseaseDuration || !drugDuration || !selectedStartDate) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
      return;
    }

    try {
      // Profil sayfasına yönlendir
      await router.replace({
        pathname: '/profile',
        params: {
          name,
          surname,
          age,
          selectedAntibody,
          selectedDisease,
          selectedDrug,
          selectedDosage,
          diseaseDuration,
          diseaseDurationType,
          drugDuration,
          drugDurationType,
          startDate: selectedStartDate,
          frequency: selectedFrequency
        }
      });

      // Form alanlarını temizle
      setName('');
      setSurname('');
      setAge('');
      setSelectedAntibody('');
      setSelectedDisease('');
      setSelectedDrug('');
      setSelectedDosage('');
      setSelectedFrequency(0);
      setDiseaseDuration('');
      setDrugDuration('');
      setSelectedStartDate('');
    } catch (error) {
      console.error('Yönlendirme hatası:', error);
      Alert.alert('Hata', 'Profil sayfasına yönlendirme sırasında bir hata oluştu.');
    }
  };

  const formatDate = (date: string) => {
    if (!date) return '';
    const [year, month, day] = date.split('-');
    return `${day}/${month}/${year}`;
  };

  const getMinDate = () => {
    const date = new Date();
    date.setMonth(date.getMonth() - 3);
    return date.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 10); // 10 yıl ileriye kadar seçilebilir
    return date.toISOString().split('T')[0];
  };

  return (
    <LinearGradient
      colors={['#E8F5E9', '#FFFFFF']}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.headerContainer}>
          <Ionicons name="person-add-outline" size={40} color="#2E7D32" />
          <Text style={styles.header}>Profil Bilgileri</Text>
          <Text style={styles.subHeader}>Lütfen bilgilerinizi eksiksiz doldurun</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Kişisel Bilgiler</Text>
            <View style={styles.inputRow}>
              <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.inputLabel}>Ad</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Adınız"
                  value={name}
                  onChangeText={setName}
                  placeholderTextColor="#999"
                />
              </View>
              <View style={[styles.inputContainer, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Soyad</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Soyadınız"
                  value={surname}
                  onChangeText={setSurname}
                  placeholderTextColor="#999"
                />
              </View>
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Yaş (1-99)</Text>
              <TextInput
                style={styles.input}
                placeholder="Yaşınız"
                value={age}
                onChangeText={handleAgeChange}
                keyboardType="numeric"
                placeholderTextColor="#999"
                maxLength={2}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tedavi Bilgileri</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Antikor</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedAntibody}
                  style={styles.picker}
                  onValueChange={(value: string) => handleAntibodyChange(value)}
                  dropdownIconColor="#2E7D32"
                >
                  <Picker.Item label="Antikor Seçin" value="" />
                  {antibodies.map((antibody: string) => (
                    <Picker.Item key={antibody} label={antibody} value={antibody} />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Hastalık</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedDisease}
                  style={styles.picker}
                  onValueChange={(value: string) => handleDiseaseChange(value)}
                  dropdownIconColor="#2E7D32"
                  enabled={!!selectedAntibody}
                >
                  <Picker.Item label="Hastalık Seçin" value="" />
                  {diseases.map((disease: string) => (
                    <Picker.Item key={disease} label={disease} value={disease} />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Hastalık Süresi</Text>
              <View style={styles.durationContainer}>
                <View style={[styles.pickerContainer, { flex: 1, marginRight: 10 }]}>
                  <Picker
                    selectedValue={diseaseDurationType}
                    style={styles.picker}
                    onValueChange={(itemValue: 'year' | 'month' | 'week') => {
                      setDiseaseDurationType(itemValue);
                      setDiseaseDuration('');
                    }}
                    dropdownIconColor="#2E7D32"
                  >
                    <Picker.Item label="Yıl" value="year" />
                    <Picker.Item label="Ay" value="month" />
                    <Picker.Item label="Hafta" value="week" />
                  </Picker>
                </View>
                <View style={[styles.inputContainer, { flex: 2 }]}>
                  <TextInput
                    style={styles.input}
                    placeholder={
                      diseaseDurationType === 'year' ? "1-99 yıl" :
                      diseaseDurationType === 'month' ? "1-12 ay" :
                      "0-52 hafta"
                    }
                    value={diseaseDuration}
                    onChangeText={handleDurationChange}
                    keyboardType="numeric"
                    placeholderTextColor="#999"
                    maxLength={2}
                  />
                </View>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>İlaç</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedDrug}
                  style={styles.picker}
                  onValueChange={(value: string) => handleDrugChange(value)}
                  dropdownIconColor="#2E7D32"
                  enabled={!!selectedDisease}
                >
                  <Picker.Item label="İlaç Seçin" value="" />
                  {drugs.map((drug: string) => (
                    <Picker.Item key={drug} label={drug} value={drug} />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Dozaj</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedDosage}
                  style={styles.picker}
                  onValueChange={(value: string) => handleDosageChange(value)}
                  dropdownIconColor="#2E7D32"
                  enabled={!!selectedDrug}
                >
                  <Picker.Item label="Dozaj Seçin" value="" />
                  {dosages.map((dosage: string) => (
                    <Picker.Item key={dosage} label={dosage} value={dosage} />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>İlaç Kullanım Süresi</Text>
              <View style={styles.durationContainer}>
                <View style={[styles.pickerContainer, { flex: 1, marginRight: 10 }]}>
                  <Picker
                    selectedValue={drugDurationType}
                    style={styles.picker}
                    onValueChange={(itemValue: 'year' | 'month' | 'week') => {
                      setDrugDurationType(itemValue);
                      setDrugDuration('');
                    }}
                    dropdownIconColor="#2E7D32"
                  >
                    <Picker.Item label="Yıl" value="year" />
                    <Picker.Item label="Ay" value="month" />
                    <Picker.Item label="Hafta" value="week" />
                  </Picker>
                </View>
                <View style={[styles.inputContainer, { flex: 2 }]}>
                  <TextInput
                    style={styles.input}
                    placeholder={
                      drugDurationType === 'year' ? "1-99 yıl" :
                      drugDurationType === 'month' ? "1-12 ay" :
                      "0-52 hafta"
                    }
                    value={drugDuration}
                    onChangeText={handleDrugDurationChange}
                    keyboardType="numeric"
                    placeholderTextColor="#999"
                    maxLength={2}
                  />
                </View>
              </View>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Doz Bilgileri</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Doz Başlangıç Günü</Text>
              <TouchableOpacity 
                style={styles.dateButton}
                onPress={() => setIsCalendarVisible(true)}
              >
                <Text style={[styles.dateButtonText, !selectedStartDate && styles.placeholder]}>
                  {selectedStartDate ? formatDate(selectedStartDate) : 'Tarih Seçin'}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#2E7D32" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Doz Sıklığı</Text>
              <View style={styles.frequencyInfo}>
                <Text style={styles.frequencyText}>
                  {selectedDrug ? 
                    `${selectedFrequency} günde bir` : 
                    'Lütfen önce ilaç seçin'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Devam Et</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={isCalendarVisible}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Doz Başlangıç Günü Seçin</Text>
            <Calendar
              onDayPress={(day: DateData) => {
                const selectedDate = new Date(day.dateString);
                const minDate = new Date();
                minDate.setMonth(minDate.getMonth() - 3);
                
                if (selectedDate >= minDate) {
                  setSelectedStartDate(day.dateString);
                  setIsCalendarVisible(false);
                } else {
                  Alert.alert('Hata', 'Lütfen bugünden en fazla 3 ay öncesini seçin.');
                }
              }}
              markedDates={{
                [selectedStartDate]: { selected: true, selectedColor: '#2E7D32' }
              }}
              minDate={getMinDate()}
              maxDate={getMaxDate()}
              theme={{
                todayTextColor: '#2E7D32',
                selectedDayBackgroundColor: '#2E7D32',
              }}
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsCalendarVisible(false)}
            >
              <Text style={styles.closeButtonText}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginTop: 10,
  },
  subHeader: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  inputGroup: {
    marginBottom: 25,
  },
  label: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 15,
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  pickerContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 12,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
  },
  placeholder: {
    color: '#999',
  },
  frequencyInfo: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 12,
  },
  frequencyText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#2E7D32',
    borderRadius: 30,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 10,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 15,
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: '#95A5A6',
    padding: 12,
    borderRadius: 10,
    marginTop: 15,
  },
  closeButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default AboutScreen;
