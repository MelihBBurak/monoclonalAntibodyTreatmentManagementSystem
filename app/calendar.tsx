import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Modal, Pressable, TextInput, Dimensions, Platform } from 'react-native';
import Tooltip, { TooltipProps } from 'react-native-walkthrough-tooltip';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

// Tip tanımlamaları
type Week = (number | null)[];
type Weeks = Week[];

interface DayInfo {
  imageIndex: number;
  descIndex: number;
}

const { width } = Dimensions.get('window');

const daysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay();

const Calendar = () => {
  const params = useLocalSearchParams();
  const startDate = params.startDate as string;
  const frequency = parseInt(params.frequency as string, 10);

  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [note, setNote] = useState('');
  const [savedNotes, setSavedNotes] = useState<{[key: string]: string}>({});
  const [currentMonth, setCurrentMonth] = useState(() => {
    const date = new Date(startDate);
    return date.getMonth();
  });
  const year = 2025;

  const monthNames = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];

  // Doz günlerini hesapla (seçilen başlangıç gününden itibaren seçilen sıklıkta)
  const calculateDoseDays = (day: number, month: number) => {
    const currentDate = new Date(2025, month, day);
    const startDateObj = new Date(startDate);
    const diffTime = currentDate.getTime() - startDateObj.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return -1; // Başlangıç tarihinden önceki günler için
    return diffDays % frequency;
  };

  // Gün için gösterilecek ikonu ve açıklamayı belirle
  const getDayInfo = (day: number, month: number) => {
    const doseDay = calculateDoseDays(day, month);
    
    if (doseDay === -1) return { imageIndex: -1, descIndex: -1 }; // Başlangıç tarihinden önce
    if (doseDay === 0) return { imageIndex: 1, descIndex: 1 }; // Doz günü
    if (doseDay === frequency - 1) return { imageIndex: 0, descIndex: 0 }; // Doz öncesi
    if (doseDay === 1) return { imageIndex: 2, descIndex: 2 }; // Duş almayın
    if (doseDay <= 7) return { imageIndex: (doseDay + 2) % images.length, descIndex: (doseDay + 2) % descriptions.length };
    
    return { imageIndex: -1, descIndex: -1 }; // Normal gün
  };

  const images = [
    require('../assets/images/warning.webp'),
    require('../assets/images/syringe.png'),
    require('../assets/images/donottakeashower.jpeg'),
    require('../assets/images/donotsmoke.jpeg'),
    require('../assets/images/donotdrinkalcohol.jpeg'),
    require('../assets/images/junkfood.jpeg'),
    require('../assets/images/donotstayinpeople.jpeg')
  ];

  const descriptions = [
    'Doz Öncesi Hatırlatma',
    'Doz Günü',
    'Duş Almayın',
    'Sigara İçmeyin',
    'Alkol Almayın',
    'Sağlıklı Beslenme',
    'Kalabalıkta Kalmayın'
  ];

  const dayNames = ['Pzt', 'Sal', 'Çar', 'Per', 'Cuma', 'Cmt', 'Pzr'];

  useEffect(() => {
    loadNotes();
  }, []);

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

  const handleDayPress = (day: number) => {
    setSelectedDay(day);
    const noteKey = `${year}-${currentMonth + 1}-${day}`;
    setNote(savedNotes[noteKey] || '');
    setIsModalVisible(true);
  };

  const navigateMonth = (direction: number) => {
    setCurrentMonth(prev => {
      const newMonth = prev + direction;
      if (newMonth < 0) return 11;
      if (newMonth > 11) return 0;
      return newMonth;
    });
  };

  // Ayın günlerini hesapla
  const days = daysInMonth(currentMonth, year);
  const firstDay = getFirstDayOfMonth(currentMonth, year);
  const weeks: Weeks = [];
  let week: Week = Array(firstDay === 0 ? 6 : firstDay - 1).fill(null);

  for (let day = 1; day <= days; day++) {
    week.push(day);
    if (week.length === 7) {
      weeks.push([...week]);
      week = [];
    }
  }

  if (week.length > 0) {
    weeks.push([...week].concat(Array(7 - week.length).fill(null)));
  }

  return (
    <LinearGradient
      colors={['#E8F5E9', '#FFFFFF']}
      style={styles.container}
    >
      <View style={styles.headerContainer}>
        <TouchableOpacity 
          style={styles.navButton} 
          onPress={() => navigateMonth(-1)}
        >
          <Ionicons name="chevron-back" size={24} color="#2E7D32" />
        </TouchableOpacity>
        <Text style={styles.header}>{monthNames[currentMonth]} 2025</Text>
        <TouchableOpacity 
          style={styles.navButton} 
          onPress={() => navigateMonth(1)}
        >
          <Ionicons name="chevron-forward" size={24} color="#2E7D32" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.calendarContainer}>
        <View style={styles.week}>
          {dayNames.map((dayName, index) => (
            <Text key={index} style={styles.dayName}>{dayName}</Text>
          ))}
        </View>
        {weeks.map((week, weekIndex) => (
          <View key={weekIndex} style={styles.week}>
            {week.map((day, dayIndex) => (
              day ? (
                <Tooltip
                  key={dayIndex}
                  isVisible={selectedDay === day}
                  content={
                    <Text style={styles.tooltipText}>
                      {getDayInfo(day, currentMonth).descIndex >= 0 
                        ? descriptions[getDayInfo(day, currentMonth).descIndex] 
                        : ''}
                    </Text>
                  }
                  placement="top"
                  onClose={() => setSelectedDay(null)}
                >
                  <TouchableOpacity 
                    style={[
                      styles.dayCard,
                      getDayInfo(day, currentMonth).imageIndex >= 0 && styles.activeDayCard
                    ]}
                    onPress={() => {
                      setSelectedDay(day);
                      handleDayPress(day);
                    }}
                  >
                    <Text style={styles.dayText}>{day}</Text>
                    {getDayInfo(day, currentMonth).imageIndex >= 0 && (
                      <Image 
                        source={images[getDayInfo(day, currentMonth).imageIndex]} 
                        style={styles.image} 
                      />
                    )}
                  </TouchableOpacity>
                </Tooltip>
              ) : (
                <View key={dayIndex} style={styles.emptyDay} />
              )
            ))}
          </View>
        ))}

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
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedDay} {monthNames[currentMonth]} 2025</Text>
              <TouchableOpacity 
                onPress={() => setIsModalVisible(false)}
                style={styles.closeButton}
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
              <Pressable
                style={[styles.button, styles.saveButton]}
                onPress={saveNote}
              >
                <Text style={styles.buttonText}>Kaydet</Text>
                <Ionicons name="save-outline" size={20} color="#FFFFFF" />
              </Pressable>
            </View>
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
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: Platform.select({
      web: 20,
      default: 15
    }),
    ...Platform.select({
      web: {
        maxWidth: 1200,
        marginHorizontal: 'auto',
      },
      default: {}
    }),
  },
  navButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  calendarContainer: {
    padding: Platform.select({
      web: 30,
      default: 15
    }),
    ...Platform.select({
      web: {
        maxWidth: 1200,
        marginHorizontal: 'auto',
      },
      default: {}
    }),
  },
  week: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  dayName: {
    width: 40,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#2E7D32',
    fontSize: 14,
  },
  dayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Platform.select({
      web: 12,
      default: 10
    }),
    padding: Platform.select({
      web: 10,
      default: 8
    }),
    width: Platform.select({
      web: 50,
      default: 40
    }),
    height: Platform.select({
      web: 70,
      default: 60
    }),
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.2s',
        ':hover': {
          transform: 'scale(1.05)',
        },
      },
      default: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
      }
    }),
  },
  activeDayCard: {
    backgroundColor: '#E8F5E9',
    borderWidth: 2,
    borderColor: '#2E7D32',
  },
  emptyDay: {
    width: 40,
    height: 60,
    marginHorizontal: 2,
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
  tooltipText: {
    color: '#2E7D32',
    fontSize: 14,
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: Platform.select({
      web: 25,
      default: 20
    }),
    padding: Platform.select({
      web: 30,
      default: 20
    }),
    width: Platform.select({
      web: '60%',
      default: '90%'
    }),
    maxHeight: '80%',
    ...Platform.select({
      web: {
        maxWidth: 800,
      },
      default: {}
    }),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  closeButton: {
    padding: 5,
  },
  modalMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
  },
  modalImage: {
    width: 40,
    height: 40,
    marginRight: 15,
  },
  modalMessage: {
    flex: 1,
    fontSize: 16,
    color: '#2E7D32',
  },
  noteContainer: {
    marginBottom: 20,
  },
  noteLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
  },
  noteInput: {
    width: '100%',
    height: 100,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 10,
    textAlignVertical: 'top',
    fontSize: 16,
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  button: {
    backgroundColor: '#2E7D32',
    borderRadius: 30,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  saveButton: {
    backgroundColor: '#2E7D32',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
});

export default Calendar;
