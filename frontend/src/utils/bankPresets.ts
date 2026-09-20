import { AccountType } from '../types';

export interface BankPreset {
  id: string;
  name: string;
  shortName: string;
  brandColor: string;
  textColor: string;
  defaultType: AccountType;
  description: string;
}

export const BANK_PRESETS: BankPreset[] = [
  {
    id: 'otp',
    name: 'OTP Bank',
    shortName: 'OTP',
    brandColor: '#008836',
    textColor: '#FFFFFF',
    defaultType: 'BANK_ACCOUNT',
    description: 'OTP Folyószámla / Bankkártya'
  },
  {
    id: 'mbh',
    name: 'MBH Bank',
    shortName: 'MBH',
    brandColor: '#003B77',
    textColor: '#FFFFFF',
    defaultType: 'BANK_ACCOUNT',
    description: 'MBH Lakossági számla'
  },
  {
    id: 'erste',
    name: 'Erste Bank',
    shortName: 'ERSTE',
    brandColor: '#0066B3',
    textColor: '#FFFFFF',
    defaultType: 'BANK_ACCOUNT',
    description: 'Erste George Folyószámla'
  },
  {
    id: 'kh',
    name: 'K&H Bank',
    shortName: 'K&H',
    brandColor: '#003399',
    textColor: '#FFFFFF',
    defaultType: 'BANK_ACCOUNT',
    description: 'K&H Lakossági számla'
  },
  {
    id: 'raiffeisen',
    name: 'Raiffeisen Bank',
    shortName: 'RAIF',
    brandColor: '#FEE600',
    textColor: '#1A1A1A',
    defaultType: 'BANK_ACCOUNT',
    description: 'Raiffeisen Díjnyertes számla'
  },
  {
    id: 'unicredit',
    name: 'UniCredit Bank',
    shortName: 'UNI',
    brandColor: '#ED1C24',
    textColor: '#FFFFFF',
    defaultType: 'BANK_ACCOUNT',
    description: 'UniCredit Folyószámla'
  },
  {
    id: 'cib',
    name: 'CIB Bank',
    shortName: 'CIB',
    brandColor: '#002D62',
    textColor: '#FFD100',
    defaultType: 'BANK_ACCOUNT',
    description: 'CIB ECO / Lakossági számla'
  },
  {
    id: 'granit',
    name: 'Gránit Bank',
    shortName: 'GRÁNIT',
    brandColor: '#2B303A',
    textColor: '#E0E6ED',
    defaultType: 'BANK_ACCOUNT',
    description: 'Gránit Bajnok / Digitális számla'
  },
  {
    id: 'magnet',
    name: 'MagNet Bank',
    shortName: 'MAGNET',
    brandColor: '#459E27',
    textColor: '#FFFFFF',
    defaultType: 'BANK_ACCOUNT',
    description: 'MagNet Közösségi Bank'
  },
  {
    id: 'cetelem',
    name: 'Cetelem Bank',
    shortName: 'CET',
    brandColor: '#008752',
    textColor: '#FFFFFF',
    defaultType: 'BANK_ACCOUNT',
    description: 'Cetelem Hitelkártya / Számla'
  },
  {
    id: 'revolut',
    name: 'Revolut',
    shortName: 'REV',
    brandColor: '#191C1F',
    textColor: '#FFFFFF',
    defaultType: 'REVOLUT',
    description: 'Revolut Standard / Premium'
  },
  {
    id: 'wise',
    name: 'Wise',
    shortName: 'WISE',
    brandColor: '#163300',
    textColor: '#9FE870',
    defaultType: 'REVOLUT',
    description: 'Wise Többdevizás számla'
  },
  {
    id: 'mak',
    name: 'Magyar Államkincstár (MÁK)',
    shortName: 'MÁK',
    brandColor: '#8C6D3B',
    textColor: '#FFFFFF',
    defaultType: 'SAVINGS',
    description: 'Államkincstári Értékpapírszámla'
  },
  {
    id: 'cash',
    name: 'Készpénz keret',
    shortName: 'KP',
    brandColor: '#27AE60',
    textColor: '#FFFFFF',
    defaultType: 'CASH',
    description: 'Otthoni készpénz / boríték'
  },
  {
    id: 'custom',
    name: 'Egyedi számla',
    shortName: 'BANK',
    brandColor: '#0E8A9A',
    textColor: '#FFFFFF',
    defaultType: 'BANK_ACCOUNT',
    description: 'Egyéb egyedi bank vagy számla'
  }
];

export function findBankPreset(nameOrCode?: string): BankPreset {
  if (!nameOrCode) return BANK_PRESETS[BANK_PRESETS.length - 1]; // custom

  const query = nameOrCode.toLowerCase().trim();

  // 1. Direct ID match
  const byId = BANK_PRESETS.find((p) => p.id === query);
  if (byId) return byId;

  // 2. Name / Description match
  if (query.includes('otp')) return BANK_PRESETS.find((p) => p.id === 'otp')!;
  if (query.includes('mbh')) return BANK_PRESETS.find((p) => p.id === 'mbh')!;
  if (query.includes('erste')) return BANK_PRESETS.find((p) => p.id === 'erste')!;
  if (query.includes('k&h') || query.includes('kh')) return BANK_PRESETS.find((p) => p.id === 'kh')!;
  if (query.includes('raiff') || query.includes('raiffeisen')) return BANK_PRESETS.find((p) => p.id === 'raiffeisen')!;
  if (query.includes('unicredit') || query.includes('uni')) return BANK_PRESETS.find((p) => p.id === 'unicredit')!;
  if (query.includes('cib')) return BANK_PRESETS.find((p) => p.id === 'cib')!;
  if (query.includes('granit') || query.includes('gránit')) return BANK_PRESETS.find((p) => p.id === 'granit')!;
  if (query.includes('magnet')) return BANK_PRESETS.find((p) => p.id === 'magnet')!;
  if (query.includes('cetelem')) return BANK_PRESETS.find((p) => p.id === 'cetelem')!;
  if (query.includes('revolut') || query.includes('revo')) return BANK_PRESETS.find((p) => p.id === 'revolut')!;
  if (query.includes('wise')) return BANK_PRESETS.find((p) => p.id === 'wise')!;
  if (query.includes('államkincstár') || query.includes('kincstár') || query.includes('mák')) return BANK_PRESETS.find((p) => p.id === 'mak')!;
  if (query.includes('készpénz') || query.includes('cash') || query.includes('kp')) return BANK_PRESETS.find((p) => p.id === 'cash')!;

  return BANK_PRESETS.find((p) => p.id === 'custom')!;
}
