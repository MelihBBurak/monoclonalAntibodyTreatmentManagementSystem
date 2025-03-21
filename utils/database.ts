import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id: number;
  name: string;
  surname: string;
  age: number;
  created_at: string;
}

export interface Treatment {
  id: number;
  user_id: number;
  antibody_id: number;
  disease_id: number;
  drug_id: number;
  dosage_id: number;
  disease_duration: number;
  disease_duration_type: string;
  drug_duration: number;
  drug_duration_type: string;
  start_date: string;
  frequency_days: number;
  created_at: string;
}

export interface CalendarNote {
  id: number;
  treatment_id: number;
  date: string;
  note: string;
  created_at: string;
  updated_at: string;
}

interface Antibody {
  id: number;
  name: string;
  description: string;
}

interface Drug {
  id: number;
  name: string;
  description: string;
}

interface Disease {
  id: number;
  name: string;
  description: string;
}

interface Dosage {
  id: number;
  value: string;
  description: string;
}

interface DatabaseData {
  users: User[];
  treatments: Treatment[];
  calendar_notes: CalendarNote[];
  antibodies: Antibody[];
  drugs: Drug[];
  diseases: Disease[];
  dosages: Dosage[];
}

export class Database {
  private static instance: Database;
  private storageKey: string = '@mab_database';
  private data: DatabaseData = {
    users: [],
    treatments: [],
    calendar_notes: [],
    antibodies: [
      { id: 1, name: 'Adalimumab', description: 'TNF-alfa inhibitörü' },
      { id: 2, name: 'Infliximab', description: 'TNF-alfa inhibitörü' },
      { id: 3, name: 'Rituximab', description: 'CD20 antikoru' },
      { id: 4, name: 'Omalizumab', description: 'IgE antikoru' },
      { id: 5, name: 'Dupilumab', description: 'IL-4/IL-13 inhibitörü' }
    ],
    drugs: [
      { id: 1, name: 'Methotrexate', description: 'İmmünosupresif ilaç' },
      { id: 2, name: 'Prednisone', description: 'Kortikosteroid' },
      { id: 3, name: 'Azathioprine', description: 'İmmünosupresif ilaç' },
      { id: 4, name: 'Cyclosporine', description: 'İmmünosupresif ilaç' },
      { id: 5, name: 'Mycophenolate', description: 'İmmünosupresif ilaç' }
    ],
    diseases: [
      { id: 1, name: 'Romatoid Artrit', description: 'Otoimmün eklem hastalığı' },
      { id: 2, name: 'Crohn Hastalığı', description: 'İnflamatuar bağırsak hastalığı' },
      { id: 3, name: 'Ülseratif Kolit', description: 'İnflamatuar bağırsak hastalığı' },
      { id: 4, name: 'Psöriyazis', description: 'Otoimmün cilt hastalığı' },
      { id: 5, name: 'Astım', description: 'Kronik solunum yolu hastalığı' }
    ],
    dosages: [
      { id: 1, value: '40mg', description: 'Standart doz' },
      { id: 2, value: '80mg', description: 'Yüksek doz' },
      { id: 3, value: '100mg', description: 'Yüksek doz' },
      { id: 4, value: '150mg', description: 'Yüksek doz' },
      { id: 5, value: '200mg', description: 'Yüksek doz' }
    ]
  };

  private constructor() {
    this.initDatabase();
  }

  static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  private async initDatabase() {
    try {
      const data = await AsyncStorage.getItem(this.storageKey);
      if (!data) {
        await AsyncStorage.setItem(this.storageKey, JSON.stringify(this.data));
      } else {
        this.data = JSON.parse(data);
      }
    } catch (error) {
      console.error('Veritabanı başlatma hatası:', error);
    }
  }

  private async saveData() {
    try {
      await AsyncStorage.setItem(this.storageKey, JSON.stringify(this.data));
    } catch (error) {
      console.error('Veri kaydetme hatası:', error);
    }
  }

  async createUser(user: Omit<User, 'id' | 'created_at'>): Promise<number> {
    const newUser: User = {
      id: Date.now(),
      ...user,
      created_at: new Date().toISOString()
    };
    this.data.users.push(newUser);
    await this.saveData();
    return newUser.id;
  }

  async getUser(id: number): Promise<User | null> {
    return this.data.users.find(user => user.id === id) || null;
  }

  async createTreatment(treatment: Omit<Treatment, 'id' | 'created_at'>): Promise<number> {
    const newTreatment: Treatment = {
      id: Date.now(),
      ...treatment,
      created_at: new Date().toISOString()
    };
    this.data.treatments.push(newTreatment);
    await this.saveData();
    return newTreatment.id;
  }

  async getTreatment(id: number): Promise<Treatment | null> {
    return this.data.treatments.find(treatment => treatment.id === id) || null;
  }

  async getUserTreatments(userId: number): Promise<Treatment[]> {
    return this.data.treatments
      .filter(treatment => treatment.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  async saveCalendarNote(note: Omit<CalendarNote, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    const newNote: CalendarNote = {
      id: Date.now(),
      ...note,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.data.calendar_notes.push(newNote);
    await this.saveData();
    return newNote.id;
  }

  async updateCalendarNote(id: number, note: string): Promise<void> {
    const noteIndex = this.data.calendar_notes.findIndex(n => n.id === id);
    if (noteIndex !== -1) {
      this.data.calendar_notes[noteIndex] = {
        ...this.data.calendar_notes[noteIndex],
        note,
        updated_at: new Date().toISOString()
      };
      await this.saveData();
    }
  }

  async getCalendarNotes(treatmentId: number): Promise<CalendarNote[]> {
    return this.data.calendar_notes
      .filter(note => note.treatment_id === treatmentId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  async getAntibodies(): Promise<Antibody[]> {
    return this.data.antibodies.sort((a, b) => a.name.localeCompare(b.name));
  }

  async getDrugs(): Promise<Drug[]> {
    return this.data.drugs.sort((a, b) => a.name.localeCompare(b.name));
  }

  async getDiseases(): Promise<Disease[]> {
    return this.data.diseases.sort((a, b) => a.name.localeCompare(b.name));
  }

  async getDosages(): Promise<Dosage[]> {
    return this.data.dosages.sort((a, b) => a.value.localeCompare(b.value));
  }
}

export const database = Database.getInstance(); 