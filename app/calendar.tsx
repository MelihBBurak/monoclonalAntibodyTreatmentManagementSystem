import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Modal, Pressable, TextInput, Dimensions, Platform, Linking } from 'react-native';
import Tooltip, { TooltipProps } from 'react-native-walkthrough-tooltip';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { commonStyles } from '../utils/styles';

// Tip tanımlamaları - Takvim bileşeninin veri yapılarını tanımlar
type Week = (number | null)[];
type Weeks = Week[];

// Gün bilgilerini tutan interface - her gün için gösterilecek ikon ve açıklama indekslerini saklar
interface DayInfo {
  imageIndex: number;  // Gösterilecek ikonun indeksi
  descIndex: number;   // Gösterilecek açıklamanın indeksi
}

const { width } = Dimensions.get('window');

/**
 * Belirli bir ayın günlerini hesaplar ve takvim görünümü için düzenler
 * @param month - Ay (0-11 arası)
 * @param year - Yıl
 * @returns Ayın günlerini içeren dizi (boş günler null ile doldurulur)
 */
const daysInMonth = (month: number, year: number): (number | null)[] => {
  const firstDay = new Date(year, month, 1).getDay(); // Ayın ilk gününün haftanın hangi günü olduğu
  const daysInMonth = new Date(year, month + 1, 0).getDate(); // Ayın toplam gün sayısı
  const days: (number | null)[] = Array(firstDay === 0 ? 6 : firstDay - 1).fill(null); // İlk haftanın boş günleri

  // Ayın günlerini ekle
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  // 6 haftalık görünüm için kalan günleri null ile doldur
  const remainingDays = 42 - days.length; // 6 hafta x 7 gün = 42
  if (remainingDays > 0) {
    days.push(...Array(remainingDays).fill(null));
  }

  return days;
};

/**
 * Ayın ilk gününün haftanın hangi günü olduğunu döndürür
 */
const getFirstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay();

const Calendar = () => {
  // URL parametrelerinden gelen verileri al
  const params = useLocalSearchParams();
  const startDate = params.startDate as string;        // Tedavi başlangıç tarihi
  const frequency = parseInt(params.frequency as string, 10); // Doz sıklığı (gün)
  const selectedDrug = params.selectedDrug as string;  // Seçilen ilaç
  const selectedDosage = params.selectedDosage as string; // Seçilen dozaj
  const selectedForm = params.selectedForm as string;  // Seçilen form (enjektör/kalem)

  // State tanımlamaları
  const [selectedDay, setSelectedDay] = useState<number | null>(null); // Seçilen gün
  const [isModalVisible, setIsModalVisible] = useState(false); // Modal görünürlüğü
  const [note, setNote] = useState(''); // Günlük not
  const [savedNotes, setSavedNotes] = useState<{[key: string]: string}>({}); // Kaydedilen notlar
  const [currentMonth, setCurrentMonth] = useState(() => {
    const date = new Date(startDate);
    return date.getMonth(); // Başlangıç tarihinin ayını al
  });
  const year = 2025; // Sabit yıl

  // Türkçe ay isimleri
  const monthNames = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];

  /**
   * Belirli bir günün doz günü olup olmadığını hesaplar
   * @param day - Gün
   * @param month - Ay
   * @returns Doz günü indeksi (-1: doz günü değil, 0: doz günü, diğer: doz öncesi günler)
   */
  const calculateDoseDays = (day: number, month: number) => {
    const currentDate = new Date(2025, month, day);
    const startDateObj = new Date(startDate);
    const diffTime = currentDate.getTime() - startDateObj.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return -1; // Başlangıç tarihinden önceki günler için
    return diffDays % frequency; // Doz sıklığına göre kalan gün
  };

  /**
   * Gün için gösterilecek ikonu ve açıklamayı belirler
   * @param day - Gün
   * @param month - Ay
   * @returns Gün bilgisi (ikon ve açıklama indeksleri)
   */
  const getDayInfo = (day: number, month: number) => {
    const doseDay = calculateDoseDays(day, month);
    
    if (doseDay === -1) return { imageIndex: -1, descIndex: -1 }; // Başlangıç tarihinden önce
    if (doseDay === 0) return { imageIndex: 1, descIndex: 1 }; // Doz günü
    if (doseDay === frequency - 1) return { imageIndex: 0, descIndex: 0 }; // Doz öncesi
    if (doseDay === 1) return { imageIndex: 2, descIndex: 2 }; // Duş almayın
    if (doseDay <= 7) return { imageIndex: (doseDay + 2) % images.length, descIndex: (doseDay + 2) % descriptions.length };
    
    return { imageIndex: -1, descIndex: -1 }; // Normal gün
  };

  // Takvimde gösterilecek ikonlar
  const images = [
    require('../assets/images/warning.webp'),        // Doz öncesi uyarı
    require('../assets/images/syringe.png'),         // Doz günü
    require('../assets/images/donottakeashower.jpeg'), // Duş almayın
    require('../assets/images/donotsmoke.jpeg'),     // Sigara içmeyin
    require('../assets/images/donotdrinkalcohol.jpeg'), // Alkol almayın
    require('../assets/images/junkfood.jpeg'),       // Sağlıklı beslenme
    require('../assets/images/donotstayinpeople.jpeg') // Kalabalıkta kalmayın
  ];

  // İkonların açıklamaları
  const descriptions = [
    'Doz Öncesi Hatırlatma',
    'Doz Günü',
    'Duş Almayın',
    'Sigara İçmeyin',
    'Alkol Almayın',
    'Sağlıklı Beslenme',
    'Kalabalıkta Kalmayın'
  ];

  // Haftanın günleri
  const dayNames = ['Pzt', 'Sal', 'Çar', 'Per', 'Cuma', 'Cmt', 'Pzr'];

  // Component yüklendiğinde kaydedilen notları yükle
  useEffect(() => {
    loadNotes();
  }, []);

  /**
   * AsyncStorage'dan kaydedilen notları yükler
   */
  const loadNotes = async () => {
    try {
      const notes = await AsyncStorage.getItem('calendar_notes');
      if (notes) {
        setSavedNotes(JSON.parse(notes));
      }
    } catch (error) {
      console.error('Notlar yüklenirken hata oluştu:', error);
    }
  };

  /**
   * Günlük notu kaydeder
   */
  const saveNote = async () => {
    if (selectedDay) {
      try {
        const noteKey = `${year}-${currentMonth + 1}-${selectedDay}`;
        const updatedNotes = { ...savedNotes, [noteKey]: note };
        await AsyncStorage.setItem('calendar_notes', JSON.stringify(updatedNotes));
        setSavedNotes(updatedNotes);
        setIsModalVisible(false);
        setNote('');
      } catch (error) {
        console.error('Not kaydedilirken hata oluştu:', error);
      }
    }
  };

  /**
   * Gün tıklandığında modal'ı açar ve notu yükler
   */
  const handleDayPress = (day: number) => {
    setSelectedDay(day);
    const noteKey = `${year}-${currentMonth + 1}-${day}`;
    setNote(savedNotes[noteKey] || '');
    setIsModalVisible(true);
  };

  /**
   * Ay navigasyonu - önceki/sonraki aya geçer
   */
  const navigateMonth = (direction: number) => {
    setCurrentMonth(prev => {
      const newMonth = prev + direction;
      if (newMonth < 0) return 11; // Aralık'tan Kasım'a
      if (newMonth > 11) return 0; // Ocak'tan Şubat'a
      return newMonth;
    });
  };

  // Ayın günlerini hesapla
  const days = daysInMonth(currentMonth, year);

  /**
   * Seçilen ilaç ve dozaja göre prospektüs linkini açar
   * Her ilaç için farklı dozaj ve form kombinasyonlarına göre TİTCK linkleri
   */
  const openProspectus = () => {
    if (selectedDrug === 'HUMİRA') {
      if (selectedDosage === '20mg/0.2ml') {
        Linking.openURL('https://titck.gov.tr/storage/Archive/2025/kubKtAttachments/ek41312humirapfs2002kttemiz_26_03_2025.pdf');
      } else if (selectedDosage === '40mg/0.4ml') {
        if (selectedForm === 'enjektor') {
          Linking.openURL('https://titck.gov.tr/storage/Archive/2025/kubKtAttachments/humirapfs4004kttemiz_26_03_2025.pdf');
        } else if (selectedForm === 'kalem') {
          Linking.openURL('https://titck.gov.tr/storage/Archive/2025/kubKtAttachments/humirapen401312kttemiz_26_03_2025.pdf');
        }
      } else if (selectedDosage === '40mg/0.8ml') {
        Linking.openURL('https://titck.gov.tr/storage/kubKtAttachments/mfgfGfWpZDnrK5.pdf');
      }
    } else if (selectedDrug === 'AMGEVİTA') {
      if (selectedDosage === '20mg/0.4ml') {
        Linking.openURL('https://titck.gov.tr/storage/Archive/2023/kubKtAttachments/amgetivatemizkt_6ef678d8-bfd9-43ac-889b-6affa9e5a3d3.pdf');
      } else if (selectedDosage === '40mg/0.8ml') {
        if (selectedForm === 'enjektor') {
          Linking.openURL('https://titck.gov.tr/storage/Archive/2023/kubKtAttachments/amgetivakt_f781bd38-a5c5-45d6-a3c0-555d6240411e.pdf');
        } else if (selectedForm === 'kalem') {
          Linking.openURL('https://titck.gov.tr/storage/Archive/2023/kubKtAttachments/amgevita4008kt_a5500d80-ac15-4925-b388-e340fa23f934.pdf');
        }
      }
    } else if (selectedDrug === 'HYRIMOZ') {
      if (selectedDosage === '40mg/0.8ml') {
        if (selectedForm === 'enjektor') {
          Linking.openURL('https://titck.gov.tr/storage/Archive/2023/kubKtAttachments/SonKTEnjektr_4fab1a4b-f379-4089-b570-7e391d0fadca.pdf');
        } else if (selectedForm === 'kalem') {
          Linking.openURL('https://titck.gov.tr/storage/Archive/2023/kubKtAttachments/OnaylKTkalem_3eea0ccf-ff5a-4761-a19b-e4559b5f5edc.pdf');
        }
      }
    } else if (selectedDrug === 'CIMZIA') {
      if (selectedDosage === '200mg/1ml') {
        Linking.openURL('https://titck.gov.tr/storage/Archive/2023/kubKtAttachments/ek9temizkt_d9c99a8a-dac1-45e9-9e1c-7593fa784209.pdf');
      }
    } else if (selectedDrug === 'SIMPONI') {
      if (selectedDosage === '50mg/0.5ml') {
        if (selectedForm === 'enjektor') {
          Linking.openURL('https://titck.gov.tr/storage/Archive/2024/kubKtAttachments/yaynlanacaksimponienjektr1312ktbaxter_8346333e-2b69-426a-80e9-0e410c02df89.pdf');
        } else if (selectedForm === 'kalem') {
          Linking.openURL('https://titck.gov.tr/storage/Archive/2024/kubKtAttachments/yaynlanacaksimponipen1312ktbaxter_167429d9-906f-45e1-8aea-ee9f3dacc091.pdf');
        }
      }
    } else if (selectedDrug === 'AVSOLA') {
      if (selectedDosage === '100mg/10ml') {
        Linking.openURL('https://titck.gov.tr/storage/Archive/2023/kubKtAttachments/FirmaKT06.04.2023UYGUNyaynlanacak_9ad31be9-3f92-4b26-9c71-3bf0b5d63174.pdf');
      }
    } else if (selectedDrug === 'IXIFI') {
      if (selectedDosage === '100mg/10ml') {
        Linking.openURL('https://titck.gov.tr/storage/Archive/2025/kubKtAttachments/ONAYLIKT_12_03_2025.pdf');
      }
    } else if (selectedDrug === 'REMICADE') {
      if (selectedDosage === '100mg/10ml') {
        Linking.openURL('https://titck.gov.tr/storage/Archive/2024/kubKtAttachments/yaynlanacakremicade1312kt_e94b0acd-3a55-4d39-bc1e-ec67ba521178.pdf');
      }
    } else if (selectedDrug === 'TOLURİNE') {
      if (selectedDosage === '100mg/10ml') {
        Linking.openURL('https://titck.gov.tr/storage/Archive/2024/kubKtAttachments/uygunKT_c014a2e7-3d37-4626-88df-3d98f39c6bc2.pdf');
      }
    } else if (selectedDrug === 'ILARIS') {
      if (selectedDosage === '150mg/1ml') {
        if (selectedForm === 'enjektor') {
          Linking.openURL('https://titck.gov.tr/storage/Archive/2023/kubKtAttachments/uygunktilarisenjzelti_fe65e5d3-165c-40a0-b427-ac7083854469.pdf');
        } else if (selectedForm === 'toz') {
          Linking.openURL('https://titck.gov.tr/storage/Archive/2023/kubKtAttachments/uygunktilaristoz_eda29fb1-636b-41b1-9ec7-68106cb98871.pdf');
        }
      }
    }
  };

  return (
    <LinearGradient
      colors={['#E8F5E9', '#FFFFFF']}
      style={commonStyles.container}
    >
      <ScrollView contentContainerStyle={commonStyles.scrollContainer}>
        <View style={commonStyles.headerContainer}>
          <Text style={commonStyles.header}>Tedavi Takvimi</Text>
          <Text style={commonStyles.subHeader}>Doz günlerinizi ve hatırlatmalarınızı takip edin</Text>
        </View>

        <View style={commonStyles.formContainer}>
          <View style={styles.calendarContainer}>
            <View style={styles.monthHeader}>
              <TouchableOpacity onPress={() => navigateMonth(-1)}>
                <Ionicons name="chevron-back" size={24} color="#2E7D32" />
              </TouchableOpacity>
              <Text style={styles.monthText}>{monthNames[currentMonth]} 2025</Text>
              <TouchableOpacity onPress={() => navigateMonth(1)}>
                <Ionicons name="chevron-forward" size={24} color="#2E7D32" />
              </TouchableOpacity>
            </View>

            <View style={styles.weekDaysContainer}>
              {dayNames.map((day, index) => (
                <Text key={index} style={styles.weekDayText}>{day}</Text>
              ))}
            </View>

            <View style={styles.daysContainer}>
              {days.map((day, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.dayContainer}
                  onPress={() => day && handleDayPress(day)}
                >
                  <Text style={styles.dayText}>{day}</Text>
                  {day && getDayInfo(day, currentMonth).imageIndex >= 0 && (
                    <Image
                      source={images[getDayInfo(day, currentMonth).imageIndex]}
                      style={styles.image}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.legendContainer}>
            {images.map((image, index) => (
              <View key={index} style={styles.legendItem}>
                <Image source={image} style={styles.legendImage} />
                <View style={styles.legendTextContainer}>
                  <Text style={styles.legendText}>{descriptions[index]}</Text>
                  <Text style={styles.legendDescriptionText}>
                    {index === 0 && 'Doz öncesi hatırlatma mesajıdır. Dozunuzu yarın almayı unutmayın.'}
                    {index === 1 && 'Doz alım günündesiniz. Kullanım talimatlarına uyun.'}
                    {index === 2 && 'Dozunuzu aldığınız andan itibaren 24 saat boyunca duş almamanız önerilir.'}
                    {index === 3 && 'Sigara içmek sağlığınızı olumsuz etkiler. İçmeyin.'}
                    {index === 4 && 'Alkol tüketimi tedavi sürecinizi olumsuz etkileyebilir. Alkol almayın.'}
                    {index === 5 && 'Sağlıksız besinlerin tüketimi sağlığınıza zararlıdır. Sağlıklı beslenin.'}
                    {index === 6 && 'Kalabalık ortamlarda bulunmak enfeksiyon riskini artırır. Kalabalıkta kalmayın.'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={commonStyles.modalOverlay}>
          <View style={commonStyles.modalContent}>
            <View style={commonStyles.modalHeader}>
              <Text style={commonStyles.modalTitle}>{selectedDay} {monthNames[currentMonth]} 2025</Text>
              <TouchableOpacity 
                onPress={() => setIsModalVisible(false)}
                style={commonStyles.closeButton}
              >
                <Ionicons name="close-circle" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalMessageContainer}>
              {selectedDay && getDayInfo(selectedDay, currentMonth).imageIndex >= 0 && (
                <>
                  <Image 
                    source={images[getDayInfo(selectedDay, currentMonth).imageIndex]} 
                    style={styles.modalImage} 
                  />
                  <Text style={styles.modalMessage}>
                    {descriptions[getDayInfo(selectedDay, currentMonth).descIndex]}
                  </Text>
                </>
              )}
            </View>

            <View style={styles.noteContainer}>
              <Text style={styles.noteLabel}>Notunuz:</Text>
              <TextInput
                style={styles.noteInput}
                multiline
                numberOfLines={4}
                value={note}
                onChangeText={setNote}
                placeholder="Buraya notunuzu yazın..."
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[commonStyles.button, styles.prospectusButton]}
                onPress={openProspectus}
              >
                <Text style={commonStyles.buttonText}>Prospektüs</Text>
                <Ionicons name="document-text-outline" size={20} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={commonStyles.button}
                onPress={saveNote}
              >
                <Text style={commonStyles.buttonText}>Kaydet</Text>
                <Ionicons name="save-outline" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  calendarContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  monthText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  weekDaysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  weekDayText: {
    width: 40,
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dayContainer: {
    width: 40,
    height: 60,
    marginHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  },
  image: {
    width: 20,
    height: 20,
    marginTop: 5,
  },
  legendContainer: {
    marginTop: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
  },
  legendImage: {
    width: 30,
    height: 30,
    marginRight: 10,
  },
  legendTextContainer: {
    flex: 1,
  },
  legendText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  legendDescriptionText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  modalMessageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalImage: {
    width: 100,
    height: 100,
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
  },
  noteContainer: {
    marginBottom: 20,
  },
  noteLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  noteInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#333',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  prospectusButton: {
    backgroundColor: '#4CAF50',
    marginRight: 10,
  },
});

export default Calendar;
