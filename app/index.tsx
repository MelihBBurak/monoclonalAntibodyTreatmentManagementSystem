import { Text, View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function Index() {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#E8F5E9', '#FFFFFF']}
        style={styles.gradient}
      >
        <View style={styles.headerContainer}>
          <Ionicons name="medical-outline" size={80} color="#2E7D32" />
          <Text style={styles.title}>Monoklonal Antikor</Text>
          <Text style={styles.subtitle}>Tedavi Yönetim Sistemi</Text>
        </View>

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

        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            Tedavinizi daha etkili yönetmek için yanınızdayız
          </Text>
        </View>

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  gradient: {
    flex: 1,
    padding: 20,
  },
  headerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginTop: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 20,
    color: '#4CAF50',
    marginTop: 5,
    textAlign: 'center',
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 40,
    paddingHorizontal: 20,
  },
  featureItem: {
    alignItems: 'center',
    width: width / 4,
  },
  featureText: {
    marginTop: 8,
    fontSize: 12,
    color: '#2E7D32',
    textAlign: 'center',
  },
  infoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  infoText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
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
    elevation: 5,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 10,
  },
});
