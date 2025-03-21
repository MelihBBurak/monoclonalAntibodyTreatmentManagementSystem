import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';

export interface AntibodyData {
  antibody_id: number;
  antibody_name: string;
  disease_id: number;
  disease_name: string;
  drug_id: number;
  drug_name: string;
  dosage_id: number;
  dosage_value: string;
  frequency_days: number;
}

class CSVReader {
  private static instance: CSVReader;
  private data: AntibodyData[] = [];
  private isLoaded: boolean = false;

  private constructor() {}

  static getInstance(): CSVReader {
    if (!CSVReader.instance) {
      CSVReader.instance = new CSVReader();
    }
    return CSVReader.instance;
  }

  async loadData(): Promise<void> {
    if (this.isLoaded) return;

    try {
      const asset = Asset.fromModule(require('../assets/data/antibody_data.csv'));
      await asset.downloadAsync();
      
      if (!asset.localUri) {
        throw new Error('CSV dosyası yüklenemedi');
      }

      const csvContent = await FileSystem.readAsStringAsync(asset.localUri);
      this.parseCSV(csvContent);
      this.isLoaded = true;
    } catch (error) {
      console.error('CSV dosyası okunamadı:', error);
      // Varsayılan veri yükle
      this.loadDefaultData();
      this.isLoaded = true;
    }
  }

  private loadDefaultData(): void {
    this.data = [
      {
        antibody_id: 1,
        antibody_name: 'adalimumab',
        disease_id: 1,
        disease_name: 'romatoid',
        drug_id: 1,
        drug_name: 'humira',
        dosage_id: 1,
        dosage_value: '40mg',
        frequency_days: 14
      },
      {
        antibody_id: 2,
        antibody_name: 'infliximab',
        disease_id: 2,
        disease_name: 'ankilozan',
        drug_id: 2,
        drug_name: 'remicade',
        dosage_id: 2,
        dosage_value: '100mg',
        frequency_days: 28
      }
    ];
  }

  private parseCSV(content: string): void {
    const lines = content.split('\n');
    const headers = lines[0].split(',');

    this.data = lines.slice(1)
      .filter(line => line.trim()) // Boş satırları filtrele
      .map(line => {
        const values = line.split(',').map(v => v.trim());
        return {
          antibody_id: parseInt(values[0]) || 0,
          antibody_name: values[1] || '',
          disease_id: parseInt(values[2]) || 0,
          disease_name: values[3] || '',
          drug_id: parseInt(values[4]) || 0,
          drug_name: values[5] || '',
          dosage_id: parseInt(values[6]) || 0,
          dosage_value: values[7] || '',
          frequency_days: parseInt(values[8]) || 0
        };
      });
  }

  getAntibodies(): string[] {
    return [...new Set(this.data.map(item => item.antibody_name))];
  }

  getDiseasesForAntibody(antibodyName: string): string[] {
    return [...new Set(
      this.data
        .filter(item => item.antibody_name === antibodyName)
        .map(item => item.disease_name)
    )];
  }

  getDrugsForDisease(antibodyName: string, diseaseName: string): string[] {
    return [...new Set(
      this.data
        .filter(item => 
          item.antibody_name === antibodyName && 
          item.disease_name === diseaseName
        )
        .map(item => item.drug_name)
    )];
  }

  getDosagesForDrug(antibodyName: string, diseaseName: string, drugName: string): string[] {
    return [...new Set(
      this.data
        .filter(item => 
          item.antibody_name === antibodyName && 
          item.disease_name === diseaseName &&
          item.drug_name === drugName
        )
        .map(item => item.dosage_value)
    )];
  }

  getFrequencyForDosage(
    antibodyName: string,
    diseaseName: string,
    drugName: string,
    dosageValue: string
  ): number {
    const item = this.data.find(item => 
      item.antibody_name === antibodyName &&
      item.disease_name === diseaseName &&
      item.drug_name === drugName &&
      item.dosage_value === dosageValue
    );
    return item ? item.frequency_days : 0;
  }

  getAntibodyId(name: string): number {
    const item = this.data.find(item => item.antibody_name === name);
    return item ? item.antibody_id : 0;
  }

  getDiseaseId(name: string): number {
    const item = this.data.find(item => item.disease_name === name);
    return item ? item.disease_id : 0;
  }

  getDrugId(name: string): number {
    const item = this.data.find(item => item.drug_name === name);
    return item ? item.drug_id : 0;
  }

  getDosageId(value: string): number {
    const item = this.data.find(item => item.dosage_value === value);
    return item ? item.dosage_id : 0;
  }
}

export const csvReader = CSVReader.getInstance(); 