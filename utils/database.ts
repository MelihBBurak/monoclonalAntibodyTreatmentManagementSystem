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
  disease_id: number;
}

interface Drug {
  id: number;
  name: string;
  description: string;
  prospectus_links: string[];
  disease_id: number;
  dosage_id: number;
}

interface Disease {
  id: number;
  name: string;
  description: string;
}

export interface Dosage {
  id: number;
  value: string;
  description?: string;
}

interface Frequency {
  id: number;
  days: number;
}

interface DatabaseData {
  users: User[];
  treatments: Treatment[];
  calendar_notes: CalendarNote[];
  antibodies: Antibody[];
  drugs: Drug[];
  diseases: Disease[];
  dosages: Dosage[];
  frequencies: Frequency[];
}

// Sabit veriler
const MOCK_DATA: DatabaseData = {
  users: [],
  treatments: [],
  calendar_notes: [],
  antibodies: [
    { id: 1, name: "Adalimumab", description: "TNF-alfa inhibitörü", disease_id: 1 },
    { id: 2, name: "Certolizumab pegol", description: "TNF-alfa inhibitörü", disease_id: 1 },
    { id: 3, name: "Golimumab", description: "TNF-alfa inhibitörü", disease_id: 1 },
    { id: 4, name: "Infliximab", description: "TNF-alfa inhibitörü", disease_id: 1 },
    { id: 5, name: "Canakinumab", description: "IL-1β inhibitörü", disease_id: 8 }
  ],
  diseases: [
    { id: 1, name: "Romatoid Artrit", description: "Otoimmün eklem hastalığı" },
    { id: 2, name: "Ankilozan Spondilit", description: "Omurga ve eklem hastalığı" },
    { id: 3, name: "Psöriyatik Artrit", description: "Sedef hastalığı ile ilişkili eklem hastalığı" },
    { id: 4, name: "Crohn Hastalığı", description: "İnflamatuar bağırsak hastalığı" },
    { id: 5, name: "Ülseratif Kolit", description: "İnflamatuar bağırsak hastalığı" },
    { id: 6, name: "Jüvenil İdiopatik Artrit", description: "Çocukluk çağı romatizması" },
    { id: 7, name: "Hidradenitis Suppurativa", description: "Cilt hastalığı" },
    { id: 8, name: "Gut", description: "Metabolik eklem hastalığı" }
  ],
  drugs: [
    { 
      id: 1, 
      name: "AMGEVİTA", 
      description: "Adalimumab orijinal", 
      prospectus_links: ["https://titck.gov.tr/storage/Archive/2024/kubKtAttachments/yaynlanacakamgevitaenjektr1312ktbamgen_0c0c0c0c-0c0c-0c0c-0c0c-0c0c0c0c0c0c.pdf"],
      disease_id: 1,
      dosage_id: 1
    },
    { 
      id: 2, 
      name: "HUMİRA", 
      description: "Adalimumab orijinal", 
      prospectus_links: ["https://titck.gov.tr/storage/Archive/2024/kubKtAttachments/yaynlanacakhumiraenjektr1312ktbabbott_1d1d1d1d-1d1d-1d1d-1d1d-1d1d1d1d1d1d.pdf"],
      disease_id: 1,
      dosage_id: 1
    },
    { 
      id: 3, 
      name: "HYRIMOZ", 
      description: "Adalimumab biyobenzer", 
      prospectus_links: ["https://titck.gov.tr/storage/Archive/2024/kubKtAttachments/yaynlanacakhyrimozenjektr1312ktbsandoz_2e2e2e2e-2e2e-2e2e-2e2e-2e2e2e2e2e2e.pdf"],
      disease_id: 1,
      dosage_id: 1
    },
    { 
      id: 4, 
      name: "CIMZIA", 
      description: "Certolizumab pegol orijinal", 
      prospectus_links: ["https://titck.gov.tr/storage/Archive/2024/kubKtAttachments/yaynlanacakcimziaenjektr1312ktbucb_3f3f3f3f-3f3f-3f3f-3f3f-3f3f3f3f3f3f.pdf"],
      disease_id: 1,
      dosage_id: 2
    },
    { 
      id: 5, 
      name: "SIMPONI", 
      description: "Golimumab orijinal", 
      prospectus_links: [
        "https://titck.gov.tr/storage/Archive/2024/kubKtAttachments/yaynlanacaksimponienjektr1312ktbaxter_8346333e-2b69-426a-80e9-0e410c02df89.pdf",
        "https://titck.gov.tr/storage/Archive/2024/kubKtAttachments/yaynlanacaksimponipen1312ktbaxter_167429d9-906f-45e1-8aea-ee9f3dacc091.pdf"
      ],
      disease_id: 1,
      dosage_id: 3
    },
    { 
      id: 6, 
      name: "AVSOLA", 
      description: "Infliximab biyobenzer", 
      prospectus_links: ["https://titck.gov.tr/storage/Archive/2024/kubKtAttachments/yaynlanacakavsolaenjektr1312ktbcelltrion_4h4h4h4h-4h4h-4h4h-4h4h-4h4h4h4h4h4h.pdf"],
      disease_id: 1,
      dosage_id: 4
    },
    { 
      id: 7, 
      name: "IXIFI", 
      description: "Infliximab biyobenzer", 
      prospectus_links: ["https://titck.gov.tr/storage/Archive/2024/kubKtAttachments/yaynlanacakixifienjektr1312ktbpfizer_5i5i5i5i-5i5i-5i5i-5i5i-5i5i5i5i5i5i.pdf"],
      disease_id: 1,
      dosage_id: 4
    },
    { 
      id: 8, 
      name: "REMICADE", 
      description: "Infliximab orijinal", 
      prospectus_links: ["https://titck.gov.tr/storage/Archive/2024/kubKtAttachments/yaynlanacakremicadeenjektr1312ktbjanssen_6j6j6j6j-6j6j-6j6j-6j6j-6j6j6j6j6j6j.pdf"],
      disease_id: 1,
      dosage_id: 4
    },
    { 
      id: 9, 
      name: "TOLURİNE", 
      description: "Infliximab biyobenzer", 
      prospectus_links: ["https://titck.gov.tr/storage/Archive/2024/kubKtAttachments/yaynlanacaktolurineenjektr1312ktbcelltrion_7k7k7k7k-7k7k-7k7k-7k7k-7k7k7k7k7k7k.pdf"],
      disease_id: 1,
      dosage_id: 4
    },
    { 
      id: 10, 
      name: "ILARIS", 
      description: "Canakinumab orijinal", 
      prospectus_links: [
        "https://titck.gov.tr/storage/Archive/2024/kubKtAttachments/yaynlanacakilarisenjektr1312ktbnovartis_8l8l8l8l-8l8l-8l8l-8l8l-8l8l8l8l8l8l.pdf",
        "https://titck.gov.tr/storage/Archive/2024/kubKtAttachments/yaynlanacakilarisenjektr1312ktbnovartis_9m9m9m9m-9m9m-9m9m-9m9m-9m9m9m9m9m9m.pdf"
      ],
      disease_id: 8,
      dosage_id: 5
    }
  ],
  dosages: [
    { id: 1, value: "40mg/0.4ml" },
    { id: 2, value: "200mg/1ml" },
    { id: 3, value: "50mg/0.5ml" },
    { id: 4, value: "100mg/10ml" },
    { id: 5, value: "150mg/1ml" }
  ],
  frequencies: [
    { id: 14, days: 14 },
    { id: 28, days: 28 },
    { id: 56, days: 56 },
    { id: 180, days: 180 }
  ]
};

export class Database {
  private static instance: Database;
  private data: DatabaseData;
  private readonly STORAGE_KEY = 'mab_treatment_data';

  private constructor() {
    this.data = {
      users: [],
      treatments: [],
      calendar_notes: [],
      antibodies: [],
      diseases: [],
      drugs: [],
      dosages: [],
      frequencies: []
    };
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public async initialize(): Promise<void> {
    try {
      const storedData = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (storedData) {
        this.data = JSON.parse(storedData);
        return;
      }

      // MOCK_DATA'yı kullan
      this.data = {
        ...MOCK_DATA,
        users: [],
        treatments: [],
        calendar_notes: []
      };

      // Verileri AsyncStorage'a kaydet
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
    } catch (error) {
      console.error('Veritabanı başlatılırken hata oluştu:', error);
      throw error;
    }
  }

  private async saveData() {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
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

  public getData(): DatabaseData {
    if (!this.data.antibodies.length) {
      throw new Error('Veritabanı henüz başlatılmamış. Lütfen initialize() metodunu çağırın.');
    }
    return this.data;
  }
}

export const database = Database.getInstance(); 