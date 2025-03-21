export const getAntibodyLabel = (value: string) => {
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

export const getDiseaseLabel = (value: string) => {
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

export const getDrugLabel = (value: string) => {
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

export const getDosageLabel = (value: string) => {
  return value;
}; 