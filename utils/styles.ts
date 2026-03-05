import { StyleSheet, Platform, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const COLORS = {
  primary: '#2E7D32',
  primaryDark: '#1B5E20',
  primaryLight: '#4CAF50',
  primaryPale: '#E8F5E9',
  primaryMid: '#388E3C',

  teal: '#00897B',
  tealLight: '#E0F2F1',

  amber: '#E65100',
  amberLight: '#FFF3E0',
  amberBorder: '#FFB74D',

  danger: '#C62828',
  dangerLight: '#FFEBEE',
  dangerBorder: '#EF9A9A',

  blue: '#0277BD',
  blueLight: '#E1F5FE',
  blueBorder: '#81D4FA',

  purple: '#6A1B9A',
  purpleLight: '#F3E5F5',

  surface: '#FFFFFF',
  background: '#F5F7F5',
  border: '#E0E7E0',
  borderLight: '#F0F4F0',

  textPrimary: '#1A1A2E',
  textSecondary: '#4B5563',
  textMuted: '#9CA3AF',
  textInverse: '#FFFFFF',
};

export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 8,
  },
};

export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 8,
  },
  header: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 8,
    letterSpacing: -0.5,
  },
  subHeader: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    ...SHADOWS.medium,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 12,
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  inputContainer: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: COLORS.textPrimary,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  inputFocused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryPale,
  },
  pickerContainer: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  picker: {
    height: 52,
    color: COLORS.textPrimary,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  dateButtonText: {
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  placeholder: {
    color: COLORS.textMuted,
  },
  frequencyInfo: {
    backgroundColor: COLORS.primaryPale,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: COLORS.primaryLight,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  frequencyText: {
    fontSize: 16,
    color: COLORS.primary,
    textAlign: 'center',
    fontWeight: '700',
    marginLeft: 6,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    ...SHADOWS.medium,
  },
  buttonText: {
    color: COLORS.textInverse,
    fontSize: 17,
    fontWeight: '700',
    marginRight: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    padding: 24,
    width: '100%',
    maxHeight: '90%',
    ...SHADOWS.large,
  },
  modalDragHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },

  // Card styles
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    ...SHADOWS.small,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    marginLeft: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  infoRowLast: {
    borderBottomWidth: 0,
  },
  infoLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    flex: 1,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '600',
    flex: 1.5,
    textAlign: 'right',
  },

  // Badge styles
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  badgePrimary: {
    backgroundColor: COLORS.primaryPale,
  },
  badgePrimaryText: {
    color: COLORS.primary,
  },
  badgeDanger: {
    backgroundColor: COLORS.dangerLight,
  },
  badgeDangerText: {
    color: COLORS.danger,
  },
  badgeAmber: {
    backgroundColor: COLORS.amberLight,
  },
  badgeAmberText: {
    color: COLORS.amber,
  },
  badgeBlue: {
    backgroundColor: COLORS.blueLight,
  },
  badgeBlueText: {
    color: COLORS.blue,
  },

  // Warning banner
  warningBanner: {
    backgroundColor: COLORS.dangerLight,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.danger,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  warningBannerText: {
    fontSize: 13,
    color: COLORS.danger,
    flex: 1,
    marginLeft: 8,
    lineHeight: 20,
    fontWeight: '500',
  },
  amberBanner: {
    backgroundColor: COLORS.amberLight,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.amberBorder,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  amberBannerText: {
    fontSize: 13,
    color: COLORS.amber,
    flex: 1,
    marginLeft: 8,
    lineHeight: 20,
    fontWeight: '500',
  },
  infoBanner: {
    backgroundColor: COLORS.blueLight,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.blueBorder,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoBannerText: {
    fontSize: 13,
    color: COLORS.blue,
    flex: 1,
    marginLeft: 8,
    lineHeight: 20,
    fontWeight: '500',
  },

  // Section divider
  sectionDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 16,
  },

  // Chip
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryPale,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  chipText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
    marginLeft: 4,
  },
});
