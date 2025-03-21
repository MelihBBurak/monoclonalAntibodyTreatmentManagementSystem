import { useState, useEffect } from 'react';
import { Text, View, TextInput, TouchableOpacity, ScrollView, Modal, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Calendar, DateData } from 'react-native-calendars';
import { Database } from '../utils/database';
import { commonStyles } from '../utils/styles';

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
    const initializeData = async () => {
      try {
        const db = Database.getInstance();
        await db.initialize();
        const data = db.getData();
        // Benzersiz antikor isimlerini al
        const uniqueAntibodies = [...new Set(data.antibodies.map(ab => ab.name))];
        setAntibodies(uniqueAntibodies);
      } catch (error) {
        console.error('Veri başlatma hatası:', error);
        Alert.alert('Hata', 'Veriler yüklenirken bir hata oluştu.');
      }
    };

    initializeData();
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

  const handleAntibodyChange = async (value: string) => {
    setSelectedAntibody(value);
    setSelectedDisease('');
    setSelectedDrug('');
    setSelectedDosage('');
    setSelectedFrequency(0);
    if (value) {
      try {
        const db = Database.getInstance();
        await db.initialize();
        const data = db.getData();
        // Seçilen antikora ait hastalıkları filtrele
        const relatedDiseases = data.diseases
          .filter(d => data.antibodies.some(ab => ab.name === value && ab.disease_id === d.id))
          .map(d => d.name);
        setDiseases(relatedDiseases);
      } catch (error) {
        console.error('Hastalık verisi yüklenirken hata:', error);
        Alert.alert('Hata', 'Hastalık verileri yüklenirken bir hata oluştu.');
      }
    } else {
      setDiseases([]);
    }
  };

  const handleDiseaseChange = async (value: string) => {
    setSelectedDisease(value);
    setSelectedDrug('');
    setSelectedDosage('');
    setSelectedFrequency(0);
    if (value) {
      try {
        const db = Database.getInstance();
        await db.initialize();
        const data = db.getData();
        // Seçilen hastalığa ait ilaçları filtrele
        const relatedDrugs = data.drugs
          .filter(d => data.diseases.some(ds => ds.name === value && ds.id === d.disease_id))
          .map(d => d.name);
        setDrugs(relatedDrugs);
      } catch (error) {
        console.error('İlaç verisi yüklenirken hata:', error);
        Alert.alert('Hata', 'İlaç verileri yüklenirken bir hata oluştu.');
      }
    } else {
      setDrugs([]);
    }
  };

  const handleDrugChange = async (value: string) => {
    setSelectedDrug(value);
    setSelectedDosage('');
    setSelectedFrequency(0);
    if (value) {
      try {
        const db = Database.getInstance();
        await db.initialize();
        const data = db.getData();
        // Seçilen ilaca ait dozajları filtrele
        const relatedDosages = data.dosages
          .filter(d => data.drugs.some(dr => dr.name === value && dr.dosage_id === d.id))
          .map(d => d.value);
        setDosages(relatedDosages);
      } catch (error) {
        console.error('Dozaj verisi yüklenirken hata:', error);
        Alert.alert('Hata', 'Dozaj verileri yüklenirken bir hata oluştu.');
      }
    } else {
      setDosages([]);
    }
  };

  const handleDosageChange = (value: string) => {
    setSelectedDosage(value);
    if (value) {
      // Doz sıklığını belirle
      let frequency = 14; // Varsayılan değer
      if (value.includes('80mg')) frequency = 28;
      if (value.includes('100mg')) frequency = 56;
      if (value.includes('150mg') || value.includes('200mg')) frequency = 180;
      setSelectedFrequency(frequency);
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
      style={commonStyles.container}
    >
      <ScrollView contentContainerStyle={commonStyles.scrollContainer}>
        <View style={commonStyles.headerContainer}>
          <Text style={commonStyles.header}>Tedavi Bilgileri</Text>
          <Text style={commonStyles.subHeader}>Lütfen tedavi bilgilerinizi girin</Text>
        </View>

        <View style={commonStyles.formContainer}>
          <View style={commonStyles.inputGroup}>
            <Text style={commonStyles.label}>Kişisel Bilgiler</Text>
            <View style={commonStyles.inputRow}>
              <View style={[commonStyles.inputContainer, { flex: 1, marginRight: 10 }]}>
                <Text style={commonStyles.inputLabel}>Ad</Text>
                <TextInput
                  style={commonStyles.input}
                  placeholder="Adınız"
                  value={name}
                  onChangeText={setName}
                  placeholderTextColor="#999"
                />
              </View>
              <View style={[commonStyles.inputContainer, { flex: 1 }]}>
                <Text style={commonStyles.inputLabel}>Soyad</Text>
                <TextInput
                  style={commonStyles.input}
                  placeholder="Soyadınız"
                  value={surname}
                  onChangeText={setSurname}
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            <View style={commonStyles.inputContainer}>
              <Text style={commonStyles.inputLabel}>Yaş (1-99)</Text>
              <TextInput
                style={commonStyles.input}
                placeholder="Yaşınız"
                value={age}
                onChangeText={handleAgeChange}
                keyboardType="numeric"
                placeholderTextColor="#999"
                maxLength={2}
              />
            </View>
          </View>

          <View style={commonStyles.inputGroup}>
            <Text style={commonStyles.label}>Tedavi Bilgileri</Text>
            <View style={commonStyles.inputContainer}>
              <Text style={commonStyles.inputLabel}>Antikor</Text>
              <View style={commonStyles.pickerContainer}>
                <Picker
                  selectedValue={selectedAntibody}
                  style={commonStyles.picker}
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

            <View style={commonStyles.inputContainer}>
              <Text style={commonStyles.inputLabel}>Hastalık</Text>
              <View style={commonStyles.pickerContainer}>
                <Picker
                  selectedValue={selectedDisease}
                  style={commonStyles.picker}
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

            <View style={commonStyles.inputContainer}>
              <Text style={commonStyles.inputLabel}>Hastalık Süresi</Text>
              <View style={commonStyles.durationContainer}>
                <View style={[commonStyles.pickerContainer, { flex: 1, marginRight: 10 }]}>
                  <Picker
                    selectedValue={diseaseDurationType}
                    style={commonStyles.picker}
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
                <View style={[commonStyles.inputContainer, { flex: 2 }]}>
                  <TextInput
                    style={commonStyles.input}
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

            <View style={commonStyles.inputContainer}>
              <Text style={commonStyles.inputLabel}>İlaç</Text>
              <View style={commonStyles.pickerContainer}>
                <Picker
                  selectedValue={selectedDrug}
                  style={commonStyles.picker}
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

            <View style={commonStyles.inputContainer}>
              <Text style={commonStyles.inputLabel}>Dozaj</Text>
              <View style={commonStyles.pickerContainer}>
                <Picker
                  selectedValue={selectedDosage}
                  style={commonStyles.picker}
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

            <View style={commonStyles.inputContainer}>
              <Text style={commonStyles.inputLabel}>İlaç Kullanım Süresi</Text>
              <View style={commonStyles.durationContainer}>
                <View style={[commonStyles.pickerContainer, { flex: 1, marginRight: 10 }]}>
                  <Picker
                    selectedValue={drugDurationType}
                    style={commonStyles.picker}
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
                <View style={[commonStyles.inputContainer, { flex: 2 }]}>
                  <TextInput
                    style={commonStyles.input}
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

          <View style={commonStyles.inputGroup}>
            <Text style={commonStyles.label}>Doz Bilgileri</Text>
            <View style={commonStyles.inputContainer}>
              <Text style={commonStyles.inputLabel}>Doz Başlangıç Günü</Text>
              <TouchableOpacity 
                style={commonStyles.dateButton}
                onPress={() => setIsCalendarVisible(true)}
              >
                <Text style={[commonStyles.dateButtonText, !selectedStartDate && commonStyles.placeholder]}>
                  {selectedStartDate ? formatDate(selectedStartDate) : 'Tarih Seçin'}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#2E7D32" />
              </TouchableOpacity>
            </View>

            <View style={commonStyles.inputContainer}>
              <Text style={commonStyles.inputLabel}>Doz Sıklığı</Text>
              <View style={commonStyles.frequencyInfo}>
                <Text style={commonStyles.frequencyText}>
                  {selectedDrug ? 
                    `${selectedFrequency} günde bir` : 
                    'Lütfen önce ilaç seçin'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <TouchableOpacity style={commonStyles.button} onPress={handleSubmit}>
          <Text style={commonStyles.buttonText}>Devam Et</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={isCalendarVisible}
        transparent={true}
        animationType="slide"
      >
        <View style={commonStyles.modalOverlay}>
          <View style={commonStyles.modalContent}>
            <Text style={commonStyles.modalTitle}>Doz Başlangıç Günü Seçin</Text>
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
              style={commonStyles.closeButton}
              onPress={() => setIsCalendarVisible(false)}
            >
              <Text style={commonStyles.closeButtonText}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

export default AboutScreen;
