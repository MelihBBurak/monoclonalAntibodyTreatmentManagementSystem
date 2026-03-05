import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Dimensions, Modal, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SHADOWS } from '../utils/styles';

const { width: SW } = Dimensions.get('window');
const STORAGE_KEY = 'symptom_logs_v1';

// Görseli 1.3× zoom yaparak vücudu ekranda daha büyük ve uzun göster
const MAP_W = SW - 32;
const IMG_SCALE = 1.3;
const IMG_W = Math.round(MAP_W * IMG_SCALE);
const IMG_H = Math.round(IMG_W * (720 / 1280));
const IMG_OFFSET_X = -Math.round((IMG_W - MAP_W) / 2);
const MAP_H = IMG_H; // container yüksekliği = zoom'lanmış görsel yüksekliği

// ─── Tipler ──────────────────────────────────────────────────────────────────
type ZoneColorKey =
  | 'head' | 'neck' | 'shoulder' | 'chest'
  | 'abdomen' | 'pelvis' | 'arm' | 'hand'
  | 'thigh' | 'knee' | 'leg' | 'foot';

interface Zone {
  id: string;
  label: string;
  x: number; y: number; w: number; h: number;
  r?: number;
  c: ZoneColorKey;
}

// Bölgeye özel renk paleti (medikal tasarım)
const ZONE_COLORS: Record<ZoneColorKey, string> = {
  head:     '#7C3AED', // mor  — kafa
  neck:     '#4F46E5', // indigo — boyun
  shoulder: '#0284C7', // mavi — omuz
  chest:    '#0891B2', // camgöbeği — göğüs/sırt
  abdomen:  '#059669', // zümrüt — karın
  pelvis:   '#D97706', // amber — pelvis/bel
  arm:      '#9333EA', // leylak — kol
  hand:     '#DB2777', // pembe — el
  thigh:    '#0F766E', // koyu teal — uyluk
  knee:     '#2563EB', // mavi — diz
  leg:      '#0369A1', // lacivert — bacak
  foot:     '#1D4ED8', // derin mavi — ayak
};

export interface SymptomLog {
  id: string; date: string; time: string;
  drug: string; antibody: string; disease: string;
  symptoms: string[]; painLevel: number;
  regions: string[]; bodySide: 'front' | 'back'; note: string;
}

// ─── Ön Yüz Bölgeleri ────────────────────────────────────────────────────────
const FRONT_ZONES: Zone[] = [
  { id: 'bas',       label: 'Baş',          x: 43, y: 3,  w: 14, h: 14, r: 99, c: 'head'     },
  { id: 'boyun',     label: 'Boyun',        x: 46, y: 17, w: 8,  h: 5,         c: 'neck'     },
  { id: 'sol_omuz',  label: 'Sol Omuz',     x: 30, y: 21, w: 15, h: 9,  r: 10, c: 'shoulder' },
  { id: 'sag_omuz',  label: 'Sağ Omuz',    x: 55, y: 21, w: 15, h: 9,  r: 10, c: 'shoulder' },
  { id: 'sol_uk',    label: 'Sol Üst Kol',  x: 19, y: 22, w: 13, h: 21, r: 10, c: 'arm'      },
  { id: 'sag_uk',    label: 'Sağ Üst Kol', x: 68, y: 22, w: 13, h: 21, r: 10, c: 'arm'      },
  { id: 'sol_gogus', label: 'Sol Göğüs',   x: 37, y: 23, w: 13, h: 13, r: 8,  c: 'chest'    },
  { id: 'sag_gogus', label: 'Sağ Göğüs',  x: 50, y: 23, w: 13, h: 13, r: 8,  c: 'chest'    },
  { id: 'sol_karin', label: 'Sol Karın',   x: 38, y: 36, w: 12, h: 11, r: 6,  c: 'abdomen'  },
  { id: 'sag_karin', label: 'Sağ Karın',  x: 50, y: 36, w: 12, h: 11, r: 6,  c: 'abdomen'  },
  { id: 'sol_ok',    label: 'Sol Ön Kol', x: 14, y: 43, w: 13, h: 19, r: 10, c: 'arm'      },
  { id: 'sag_ok',    label: 'Sağ Ön Kol',x: 73, y: 43, w: 13, h: 19, r: 10, c: 'arm'      },
  { id: 'pelvis',    label: 'Pelvis',      x: 38, y: 47, w: 24, h: 8,  r: 12, c: 'pelvis'   },
  { id: 'sol_el',    label: 'Sol El',      x: 11, y: 62, w: 13, h: 10, r: 12, c: 'hand'     },
  { id: 'sag_el',    label: 'Sağ El',     x: 76, y: 62, w: 13, h: 10, r: 12, c: 'hand'     },
  { id: 'sol_uyluk', label: 'Sol Uyluk',  x: 38, y: 55, w: 11, h: 14, r: 6,  c: 'thigh'    },
  { id: 'sag_uyluk', label: 'Sağ Uyluk', x: 51, y: 55, w: 11, h: 14, r: 6,  c: 'thigh'    },
  { id: 'sol_diz',   label: 'Sol Diz',    x: 38, y: 69, w: 11, h: 6,  r: 99, c: 'knee'     },
  { id: 'sag_diz',   label: 'Sağ Diz',   x: 51, y: 69, w: 11, h: 6,  r: 99, c: 'knee'     },
  { id: 'sol_bacak', label: 'Sol Bacak', x: 39, y: 75, w: 10, h: 13, r: 6,  c: 'leg'      },
  { id: 'sag_bacak', label: 'Sağ Bacak',x: 51, y: 75, w: 10, h: 13, r: 6,  c: 'leg'      },
  { id: 'sol_ayak',  label: 'Sol Ayak',  x: 37, y: 88, w: 12, h: 8,  r: 10, c: 'foot'     },
  { id: 'sag_ayak',  label: 'Sağ Ayak', x: 51, y: 88, w: 12, h: 8,  r: 10, c: 'foot'     },
];

// ─── Arka Yüz Bölgeleri ──────────────────────────────────────────────────────
const BACK_ZONES: Zone[] = [
  { id: 'kafa_a',     label: 'Kafa Arkası',     x: 43, y: 3,  w: 14, h: 14, r: 99, c: 'head'     },
  { id: 'ense',       label: 'Ense',             x: 46, y: 17, w: 8,  h: 5,         c: 'neck'     },
  { id: 'sol_omuz_a', label: 'Sol Omuz',         x: 30, y: 21, w: 15, h: 9,  r: 10, c: 'shoulder' },
  { id: 'sag_omuz_a', label: 'Sağ Omuz',         x: 55, y: 21, w: 15, h: 9,  r: 10, c: 'shoulder' },
  { id: 'sol_uk_a',   label: 'Sol Üst Kol',      x: 19, y: 22, w: 13, h: 21, r: 10, c: 'arm'      },
  { id: 'sag_uk_a',   label: 'Sağ Üst Kol',     x: 68, y: 22, w: 13, h: 21, r: 10, c: 'arm'      },
  { id: 'sol_sirt_u', label: 'Sol Üst Sırt',    x: 37, y: 23, w: 13, h: 14, r: 8,  c: 'chest'    },
  { id: 'sag_sirt_u', label: 'Sağ Üst Sırt',   x: 50, y: 23, w: 13, h: 14, r: 8,  c: 'chest'    },
  { id: 'sol_sirt_a', label: 'Sol Alt Sırt',    x: 38, y: 37, w: 12, h: 10, r: 6,  c: 'abdomen'  },
  { id: 'sag_sirt_a', label: 'Sağ Alt Sırt',   x: 50, y: 37, w: 12, h: 10, r: 6,  c: 'abdomen'  },
  { id: 'sol_ok_a',   label: 'Sol Arka Kol',    x: 14, y: 43, w: 13, h: 19, r: 10, c: 'arm'      },
  { id: 'sag_ok_a',   label: 'Sağ Arka Kol',   x: 73, y: 43, w: 13, h: 19, r: 10, c: 'arm'      },
  { id: 'bel',        label: 'Bel',              x: 38, y: 47, w: 24, h: 8,  r: 12, c: 'pelvis'   },
  { id: 'sol_el_a',   label: 'Sol El Arkası',   x: 11, y: 62, w: 13, h: 10, r: 12, c: 'hand'     },
  { id: 'sag_el_a',   label: 'Sağ El Arkası',  x: 76, y: 62, w: 13, h: 10, r: 12, c: 'hand'     },
  { id: 'sol_kalca',  label: 'Sol Kalça',       x: 37, y: 55, w: 13, h: 10, r: 8,  c: 'pelvis'   },
  { id: 'sag_kalca',  label: 'Sağ Kalça',      x: 50, y: 55, w: 13, h: 10, r: 8,  c: 'pelvis'   },
  { id: 'sol_uyluk_a',label: 'Sol Arka Uyluk', x: 38, y: 65, w: 11, h: 9,  r: 6,  c: 'thigh'    },
  { id: 'sag_uyluk_a',label: 'Sağ Arka Uyluk',x: 51, y: 65, w: 11, h: 9,  r: 6,  c: 'thigh'    },
  { id: 'sol_diz_a',  label: 'Sol Diz Arkası', x: 38, y: 74, w: 11, h: 6,  r: 99, c: 'knee'     },
  { id: 'sag_diz_a',  label: 'Sağ Diz Arkası',x: 51, y: 74, w: 11, h: 6,  r: 99, c: 'knee'     },
  { id: 'sol_baldur', label: 'Sol Baldır',     x: 38, y: 80, w: 10, h: 11, r: 6,  c: 'leg'      },
  { id: 'sag_baldur', label: 'Sağ Baldır',    x: 52, y: 80, w: 10, h: 11, r: 6,  c: 'leg'      },
  { id: 'sol_topuk',  label: 'Sol Topuk',      x: 37, y: 89, w: 12, h: 7,  r: 10, c: 'foot'     },
  { id: 'sag_topuk',  label: 'Sağ Topuk',     x: 51, y: 89, w: 12, h: 7,  r: 10, c: 'foot'     },
];

const ALL_ZONES = [...FRONT_ZONES, ...BACK_ZONES];

// ─── Semptomlar & Ağrı ───────────────────────────────────────────────────────
const SYMPTOM_TYPES = [
  { id: 'agri',     label: 'Ağrı / Sancı',  icon: 'body'                as const, color: COLORS.danger  },
  { id: 'yorgun',   label: 'Yorgunluk',      icon: 'battery-dead'        as const, color: '#6A1B9A'      },
  { id: 'bulanti',  label: 'Bulantı',        icon: 'remove-circle'       as const, color: '#1565C0'      },
  { id: 'titreme',  label: 'Titreme',        icon: 'flash'               as const, color: '#00838F'      },
  { id: 'nefes',    label: 'Nefes Darlığı', icon: 'cloud'               as const, color: COLORS.blue    },
  { id: 'sislik',   label: 'Şişlik / Ödem', icon: 'water'               as const, color: COLORS.teal    },
  { id: 'dokuntu',  label: 'Döküntü',        icon: 'hand-left'           as const, color: '#AD1457'      },
  { id: 'ates',     label: 'Ateş',           icon: 'thermometer'         as const, color: COLORS.amber   },
  { id: 'kasinti',  label: 'Kaşıntı',        icon: 'hand-right'          as const, color: '#558B2F'      },
  { id: 'bas_agri', label: 'Baş Ağrısı',    icon: 'alert-circle'        as const, color: '#4527A0'      },
  { id: 'eklem',    label: 'Eklem Ağrısı',  icon: 'fitness'             as const, color: COLORS.primary },
  { id: 'diger',    label: 'Diğer',          icon: 'ellipsis-horizontal' as const, color: '#455A64'      },
];

const PAIN_COLORS: Record<number, string> = {
  1: '#2E7D32', 2: '#388E3C', 3: '#7CB342',
  4: '#AFB42B', 5: '#F9A825', 6: '#FB8C00',
  7: '#E64A19', 8: '#D32F2F', 9: '#B71C1C', 10: '#880E4F',
};
const PAIN_LABELS: Record<number, string> = {
  0: '', 1: 'Yok', 2: 'Çok Hafif', 3: 'Hafif',
  4: 'Orta-Hafif', 5: 'Orta', 6: 'Orta-Şiddetli',
  7: 'Şiddetli', 8: 'Çok Şiddetli', 9: 'Dayanılmaz', 10: 'En Kötü',
};

const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const fmtDate = (d: string) => {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
};

// ─── Vücut Haritası Bileşeni ──────────────────────────────────────────────────
interface BodyMapProps {
  zones: Zone[];
  side: 'front' | 'back';
  selected: string[];
  onToggle: (id: string) => void;
  accentColor: string;
}

const BodyMap: React.FC<BodyMapProps> = ({ zones, side, selected, onToggle, accentColor }) => (
  <View style={{ width: MAP_W, height: MAP_H, overflow: 'hidden' }}>
    {/* 1.3× zoom ile büyütülmüş arka plan fotoğrafı */}
    <Image
      source={
        side === 'front'
          ? require('../assets/images/body_front.png')
          : require('../assets/images/body_back.png')
      }
      style={{ position: 'absolute', left: IMG_OFFSET_X, top: 0, width: IMG_W, height: IMG_H }}
      resizeMode="stretch"
    />

    {/* Hafif koyu arka plan overlay — zone'lar daha iyi görünsün */}
    <View
      style={{
        position: 'absolute', left: 0, top: 0, width: MAP_W, height: MAP_H,
        backgroundColor: 'rgba(0,0,0,0.04)',
      }}
      pointerEvents="none"
    />

    {/* İnteraktif dokunma bölgeleri */}
    {zones.map(zone => {
      const active   = selected.includes(zone.id);
      const baseColor = ZONE_COLORS[zone.c];
      const left = Math.round(zone.x * IMG_W / 100) + IMG_OFFSET_X;
      const top  = Math.round(zone.y * IMG_H / 100);
      const w    = Math.round(zone.w * IMG_W / 100);
      const h    = Math.round(zone.h * IMG_H / 100);
      const br   = zone.r ?? 6;

      return (
        <TouchableOpacity
          key={zone.id}
          onPress={() => onToggle(zone.id)}
          activeOpacity={0.6}
          hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
          style={{
            position: 'absolute',
            left, top, width: w, height: h,
            borderRadius: br,
            backgroundColor: active
              ? accentColor + 'D0'
              : baseColor + '28',
            borderWidth: active ? 2.5 : 1.5,
            borderColor: active
              ? accentColor
              : baseColor + '70',
            alignItems: 'center',
            justifyContent: 'center',
            // Aktif bölge için glow/shadow efekti
            ...(active ? {
              shadowColor: accentColor,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.7,
              shadowRadius: 6,
              elevation: 8,
            } : {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.08,
              shadowRadius: 2,
              elevation: 1,
            }),
          }}
        >
          {active ? (
            <Text
              style={{
                fontSize: Math.max(6, Math.min(10, h * 0.40)),
                fontWeight: '900',
                color: '#FFF',
                textAlign: 'center',
                letterSpacing: -0.3,
                textShadowColor: 'rgba(0,0,0,0.8)',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 4,
              }}
              numberOfLines={2}
            >
              {zone.label}
            </Text>
          ) : (
            // Pasif bölge: çok küçük nokta işareti (dokunulabilir alan ipucu)
            <View
              style={{
                width: 4, height: 4, borderRadius: 2,
                backgroundColor: baseColor + '90',
              }}
            />
          )}
        </TouchableOpacity>
      );
    })}
  </View>
);

// ─── Ana Ekran ────────────────────────────────────────────────────────────────
const SymptomLogScreen: React.FC = () => {
  const params = useLocalSearchParams();
  const date     = params.date as string;
  const drug     = params.selectedDrug as string;
  const antibody = params.selectedAntibody as string;
  const disease  = params.selectedDisease as string;

  const [symptoms,   setSymptoms]   = useState<string[]>([]);
  const [painLevel,  setPainLevel]  = useState(0);
  const [bodySide,   setBodySide]   = useState<'front' | 'back'>('front');
  const [regions,    setRegions]    = useState<string[]>([]);
  const [note,       setNote]       = useState('');
  const [logs,       setLogs]       = useState<SymptomLog[]>([]);
  const [savedModal, setSavedModal] = useState(false);
  const [detailLog,  setDetailLog]  = useState<SymptomLog | null>(null);

  useEffect(() => { loadLogs(); }, []);

  const loadLogs = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const all: SymptomLog[] = JSON.parse(raw);
        setLogs(all.filter(l => l.drug === drug).sort((a, b) => b.id.localeCompare(a.id)));
      }
    } catch {}
  };

  const toggleSymptom = (id: string) =>
    setSymptoms(p => p.includes(id) ? p.filter(s => s !== id) : [...p, id]);

  const toggleRegion = (id: string) =>
    setRegions(p => p.includes(id) ? p.filter(r => r !== id) : [...p, id]);

  const handleSave = async () => {
    if (symptoms.length === 0 && painLevel === 0 && regions.length === 0 && !note.trim()) return;
    const now  = new Date();
    const time = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    const entry: SymptomLog = {
      id: makeId(), date, time, drug, antibody, disease,
      symptoms, painLevel, regions, bodySide, note: note.trim(),
    };
    try {
      const raw  = await AsyncStorage.getItem(STORAGE_KEY);
      const all: SymptomLog[] = raw ? JSON.parse(raw) : [];
      all.unshift(entry);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(all));
      setLogs(p => [entry, ...p]);
      setSymptoms([]); setPainLevel(0); setRegions([]);
      setNote(''); setBodySide('front');
      setSavedModal(true);
    } catch {}
  };

  const deleteLog = async (id: string) => {
    try {
      const raw  = await AsyncStorage.getItem(STORAGE_KEY);
      const all: SymptomLog[] = raw ? JSON.parse(raw) : [];
      const updated = all.filter(l => l.id !== id);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setLogs(p => p.filter(l => l.id !== id));
    } catch {}
  };

  const todayLogs  = logs.filter(l => l.date === date);
  const pastLogs   = logs.filter(l => l.date !== date);
  const zones      = bodySide === 'front' ? FRONT_ZONES : BACK_ZONES;
  const paintColor = painLevel > 0 ? PAIN_COLORS[painLevel] : COLORS.danger;

  const regionLabels = regions.map(id => ALL_ZONES.find(z => z.id === id)?.label ?? id);

  return (
    <LinearGradient colors={['#F5F7F5', '#FFFFFF']} style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Bağlam ── */}
        <View style={styles.contextCard}>
          <View style={styles.contextLeft}>
            <Text style={styles.contextDate}>{fmtDate(date)}</Text>
            <Text style={styles.contextDrug} numberOfLines={1}>{drug}</Text>
            <Text style={styles.contextSub}  numberOfLines={1}>{antibody} · {disease}</Text>
          </View>
          <View style={[styles.contextIcon, { backgroundColor: COLORS.dangerLight }]}>
            <Ionicons name="pulse" size={28} color={COLORS.danger} />
          </View>
        </View>

        {/* ── Semptom Seçimi ── */}
        <SectionCard title="Semptom Türü" icon="list" iconBg={COLORS.blueLight} iconColor={COLORS.blue}>
          <Text style={styles.hint}>Yaşadığınız semptomlara dokunun (çoklu seçim)</Text>
          <View style={styles.chipGrid}>
            {SYMPTOM_TYPES.map(sym => {
              const active = symptoms.includes(sym.id);
              return (
                <TouchableOpacity
                  key={sym.id}
                  style={[styles.symChip, active && { backgroundColor: sym.color, borderColor: sym.color }]}
                  onPress={() => toggleSymptom(sym.id)}
                  activeOpacity={0.75}
                >
                  <Ionicons name={sym.icon} size={14} color={active ? '#FFF' : sym.color} />
                  <Text style={[styles.symChipText, active && { color: '#FFF' }]}>{sym.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </SectionCard>

        {/* ── Ağrı Şiddeti ── */}
        <SectionCard title="Ağrı Şiddeti" icon="fitness" iconBg={COLORS.dangerLight} iconColor={COLORS.danger}>
          <Text style={styles.hint}>1 = Hiç yok · 10 = Dayanılmaz</Text>
          <View style={styles.painRow}>
            {([1,2,3,4,5,6,7,8,9,10] as const).map(n => (
              <TouchableOpacity
                key={n}
                style={[
                  styles.painBtn,
                  { borderColor: PAIN_COLORS[n] + '99' },
                  painLevel === n && { backgroundColor: PAIN_COLORS[n], borderColor: PAIN_COLORS[n] },
                ]}
                onPress={() => setPainLevel(p => p === n ? 0 : n)}
                activeOpacity={0.75}
              >
                <Text style={[styles.painBtnNum, { color: painLevel === n ? '#FFF' : PAIN_COLORS[n] }]}>
                  {n}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {painLevel > 0 && (
            <View style={[styles.painBadge, { backgroundColor: PAIN_COLORS[painLevel] + '20', borderColor: PAIN_COLORS[painLevel] }]}>
              <Text style={[styles.painBadgeText, { color: PAIN_COLORS[painLevel] }]}>
                Düzey {painLevel} — {PAIN_LABELS[painLevel]}
              </Text>
            </View>
          )}
        </SectionCard>

        {/* ── Vücut Haritası ── */}
        <SectionCard title="Ağrı / Şikayet Bölgesi" icon="body" iconBg={COLORS.tealLight} iconColor={COLORS.teal}>
          <Text style={styles.hint}>Fotoğraf üzerindeki bölgeye dokunarak seçin</Text>

          {/* Ön / Arka */}
          <View style={styles.sideToggle}>
            {(['front', 'back'] as const).map(s => (
              <TouchableOpacity
                key={s}
                style={[styles.sideBtn, bodySide === s && styles.sideBtnActive]}
                onPress={() => setBodySide(s)}
              >
                <Ionicons
                  name={s === 'front' ? 'person' : 'person-outline'}
                  size={15}
                  color={bodySide === s ? '#FFF' : COLORS.primary}
                />
                <Text style={[styles.sideBtnText, bodySide === s && { color: '#FFF' }]}>
                  {s === 'front' ? '⬜ Ön Yüz' : '⬜ Arka Yüz'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Yön etiketi */}
          <View style={styles.dirRow}>
            <Text style={styles.dirText}>← Sol</Text>
            <Text style={styles.dirTitle}>{bodySide === 'front' ? 'Ön Görünüm' : 'Arka Görünüm'}</Text>
            <Text style={styles.dirText}>Sağ →</Text>
          </View>

          {/* Harita */}
          <View style={styles.mapWrapper}>
            <BodyMap
              zones={zones}
              side={bodySide}
              selected={regions}
              onToggle={toggleRegion}
              accentColor={paintColor}
            />
          </View>

          {/* Seçili bölge etiketleri */}
          {regionLabels.length > 0 && (
            <View style={styles.regionRow}>
              {regionLabels.map((label, i) => (
                <View key={i} style={[styles.regionChip, { borderColor: paintColor }]}>
                  <Ionicons name="location" size={10} color={paintColor} />
                  <Text style={[styles.regionChipText, { color: paintColor }]}>{label}</Text>
                </View>
              ))}
              <TouchableOpacity style={styles.clearBtn} onPress={() => setRegions([])}>
                <Text style={styles.clearBtnText}>Temizle</Text>
              </TouchableOpacity>
            </View>
          )}
        </SectionCard>

        {/* ── Detaylı Not ── */}
        <SectionCard title="Detaylı Not" icon="create" iconBg="#F3E5F5" iconColor="#7B1FA2">
          <TextInput
            style={styles.noteInput}
            multiline
            numberOfLines={6}
            value={note}
            onChangeText={setNote}
            placeholder={
              'Detaylarınızı buraya yazın:\n' +
              '• Ağrı ne zaman başladı?\n' +
              '• Şiddet nasıl değişti?\n' +
              '• Başka belirtiler var mıydı?\n' +
              '• İlaç aldınız mı?'
            }
            placeholderTextColor={COLORS.textMuted}
            textAlignVertical="top"
          />
        </SectionCard>

        {/* ── Kaydet ── */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
          <LinearGradient
            colors={[COLORS.primaryLight, COLORS.primaryDark]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.saveBtnGradient}
          >
            <Ionicons name="save" size={20} color="#FFF" />
            <Text style={styles.saveBtnText}>Semptomu Kaydet</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* ── Bugünkü Kayıtlar ── */}
        {todayLogs.length > 0 && (
          <HistorySection title={`Bu Tarihte (${todayLogs.length})`} icon="time"
            logs={todayLogs} onPress={setDetailLog} onDelete={deleteLog} />
        )}
        {pastLogs.length > 0 && (
          <HistorySection title="Geçmiş Kayıtlar" icon="calendar"
            logs={pastLogs.slice(0, 6)} onPress={setDetailLog} onDelete={deleteLog} />
        )}
      </ScrollView>

      {/* ── Başarı Modal ── */}
      <Modal transparent animationType="fade" visible={savedModal} onRequestClose={() => setSavedModal(false)}>
        <View style={styles.overlay}>
          <View style={styles.savedBox}>
            <Ionicons name="checkmark-circle" size={54} color={COLORS.primary} style={{ marginBottom: 12 }} />
            <Text style={styles.savedTitle}>Kaydedildi!</Text>
            <Text style={styles.savedSub}>Semptom kaydınız oluşturuldu.</Text>
            <TouchableOpacity style={styles.savedCloseBtn} onPress={() => setSavedModal(false)}>
              <Text style={styles.savedCloseBtnText}>Tamam</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Detay Modal ── */}
      {detailLog && <LogDetailModal log={detailLog} onClose={() => setDetailLog(null)} />}
    </LinearGradient>
  );
};

// ─── Yardımcı Bileşenler ──────────────────────────────────────────────────────

interface SectionCardProps {
  title: string; children: React.ReactNode;
  icon: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap;
  iconBg: string; iconColor: string;
}
const SectionCard: React.FC<SectionCardProps> = ({ title, icon, iconBg, iconColor, children }) => (
  <View style={styles.sectionCard}>
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionIconBg, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={16} color={iconColor} />
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    {children}
  </View>
);

interface HistSProps {
  title: string; icon: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap;
  logs: SymptomLog[]; onPress: (l: SymptomLog) => void; onDelete: (id: string) => void;
}
const HistorySection: React.FC<HistSProps> = ({ title, icon, logs, onPress, onDelete }) => (
  <View style={styles.histSection}>
    <View style={styles.histHeader}>
      <Ionicons name={icon} size={15} color={COLORS.textSecondary} />
      <Text style={styles.histTitle}>{title}</Text>
    </View>
    {logs.map(log => (
      <LogCard key={log.id} log={log} onPress={() => onPress(log)} onDelete={() => onDelete(log.id)} />
    ))}
  </View>
);

interface LogCardProps { log: SymptomLog; onPress: () => void; onDelete: () => void }
const LogCard: React.FC<LogCardProps> = ({ log, onPress, onDelete }) => {
  const pc = log.painLevel > 0 ? PAIN_COLORS[log.painLevel] : COLORS.textMuted;
  return (
    <TouchableOpacity style={styles.logCard} onPress={onPress} activeOpacity={0.8}>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
          <Text style={styles.logDate}>{fmtDate(log.date)}</Text>
          <Text style={styles.logTime}> · {log.time}</Text>
        </View>
        {log.symptoms.length > 0 && (
          <View style={styles.chipGrid}>
            {log.symptoms.slice(0, 4).map(id => {
              const s = SYMPTOM_TYPES.find(x => x.id === id);
              return s ? (
                <View key={id} style={[styles.logSymChip, { backgroundColor: s.color + '22' }]}>
                  <Text style={[styles.logSymText, { color: s.color }]}>{s.label}</Text>
                </View>
              ) : null;
            })}
            {log.symptoms.length > 4 && <Text style={styles.moreText}>+{log.symptoms.length - 4}</Text>}
          </View>
        )}
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
          {log.painLevel > 0 && (
            <View style={[styles.logPainBadge, { backgroundColor: pc }]}>
              <Text style={styles.logPainBadgeText}>Ağrı {log.painLevel}/10</Text>
            </View>
          )}
          {log.regions.length > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <Ionicons name="location" size={10} color={COLORS.textMuted} />
              <Text style={styles.logRegionText}>{log.regions.length} bölge</Text>
            </View>
          )}
        </View>
        {log.note ? <Text style={styles.logNote} numberOfLines={2}>{log.note}</Text> : null}
      </View>
      <View style={{ alignItems: 'flex-end', gap: 10, marginLeft: 8 }}>
        <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
        <TouchableOpacity onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="trash-outline" size={15} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

interface LogDetailProps { log: SymptomLog; onClose: () => void }
const LogDetailModal: React.FC<LogDetailProps> = ({ log, onClose }) => {
  const pc = log.painLevel > 0 ? PAIN_COLORS[log.painLevel] : COLORS.textMuted;
  return (
    <Modal transparent animationType="slide" visible onRequestClose={onClose}>
      <View style={styles.detailOverlay}>
        <View style={styles.detailBox}>
          <View style={styles.dragHandle} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <View>
              <Text style={styles.detailTitle}>{fmtDate(log.date)} · {log.time}</Text>
              <Text style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>{log.drug} · {log.antibody}</Text>
            </View>
            <TouchableOpacity style={styles.closeCircle} onPress={onClose}>
              <Ionicons name="close" size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {log.painLevel > 0 && (
              <View style={[styles.detailPainBox, { backgroundColor: pc + '18', borderColor: pc }]}>
                <Text style={[styles.detailPainNum, { color: pc }]}>{log.painLevel}</Text>
                <View>
                  <Text style={[{ fontSize: 16, fontWeight: '700' }, { color: pc }]}>{PAIN_LABELS[log.painLevel]}</Text>
                  <Text style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>Ağrı Şiddeti (VAS 0-10)</Text>
                </View>
              </View>
            )}
            {log.symptoms.length > 0 && (
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Semptomlar</Text>
                <View style={styles.chipGrid}>
                  {log.symptoms.map(id => {
                    const s = SYMPTOM_TYPES.find(x => x.id === id);
                    return s ? (
                      <View key={id} style={[styles.symChip, { backgroundColor: s.color + '22', borderColor: s.color }]}>
                        <Ionicons name={s.icon} size={13} color={s.color} />
                        <Text style={[styles.symChipText, { color: s.color }]}>{s.label}</Text>
                      </View>
                    ) : null;
                  })}
                </View>
              </View>
            )}
            {log.regions.length > 0 && (
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Bölgeler ({log.bodySide === 'front' ? 'Ön' : 'Arka'})</Text>
                <View style={styles.chipGrid}>
                  {log.regions.map(id => {
                    const z = ALL_ZONES.find(x => x.id === id);
                    return z ? (
                      <View key={id} style={[styles.regionChip, { borderColor: pc }]}>
                        <Ionicons name="location" size={10} color={pc} />
                        <Text style={[styles.regionChipText, { color: pc }]}>{z.label}</Text>
                      </View>
                    ) : null;
                  })}
                </View>
              </View>
            )}
            {log.note ? (
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Not</Text>
                <View style={{ backgroundColor: COLORS.background, borderRadius: 12, padding: 14 }}>
                  <Text style={{ fontSize: 14, color: COLORS.textPrimary, lineHeight: 22 }}>{log.note}</Text>
                </View>
              </View>
            ) : null}
          </ScrollView>
          <TouchableOpacity style={[styles.saveBtn, { marginBottom: 0 }]} onPress={onClose}>
            <LinearGradient
              colors={[COLORS.primaryLight, COLORS.primaryDark]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.saveBtnGradient}
            >
              <Text style={styles.saveBtnText}>Kapat</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// ─── Stiller ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 48 },

  contextCard: {
    backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, marginBottom: 12,
    flexDirection: 'row', alignItems: 'center', ...SHADOWS.small,
    borderWidth: 1, borderColor: COLORS.borderLight,
  },
  contextLeft:  { flex: 1 },
  contextDate:  { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.5 },
  contextDrug:  { fontSize: 14, fontWeight: '700', color: COLORS.primary, marginTop: 4 },
  contextSub:   { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  contextIcon:  { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },

  sectionCard: {
    backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, marginBottom: 12,
    ...SHADOWS.small, borderWidth: 1, borderColor: COLORS.borderLight,
  },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 12,
    paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight,
  },
  sectionIconBg: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  sectionTitle:  { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  hint:          { fontSize: 12, color: COLORS.textMuted, marginBottom: 10, fontWeight: '500' },

  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  symChip: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.border,
    backgroundColor: COLORS.surface, gap: 5,
  },
  symChipText: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },

  painRow: { flexDirection: 'row', gap: 5, flexWrap: 'wrap', marginBottom: 10 },
  painBtn: {
    width: Math.floor((SW - 32 - 32 - 45) / 10),
    aspectRatio: 1, borderRadius: 8, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.surface,
  },
  painBtnNum: { fontSize: 13, fontWeight: '800' },
  painBadge:  { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1.5, alignSelf: 'flex-start' },
  painBadgeText: { fontSize: 13, fontWeight: '700' },

  sideToggle: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  sideBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 8, borderRadius: 10, borderWidth: 1.5,
    borderColor: COLORS.primary, backgroundColor: COLORS.surface, gap: 6,
  },
  sideBtnActive: { backgroundColor: COLORS.primary },
  sideBtnText:   { fontSize: 13, fontWeight: '700', color: COLORS.primary },

  dirRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  dirText:  { fontSize: 11, color: COLORS.textMuted, fontWeight: '700' },
  dirTitle: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary },
  mapWrapper: { borderRadius: 12, overflow: 'hidden', marginBottom: 10 },

  regionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4, alignItems: 'center' },
  regionChip: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 12, borderWidth: 1.5, backgroundColor: COLORS.surface, gap: 3,
  },
  regionChipText: { fontSize: 11, fontWeight: '700' },
  clearBtn:       { paddingHorizontal: 10, paddingVertical: 4 },
  clearBtnText:   { fontSize: 12, fontWeight: '700', color: COLORS.textMuted },

  noteInput: {
    backgroundColor: COLORS.background, borderRadius: 12, padding: 14,
    fontSize: 14, color: COLORS.textPrimary, minHeight: 130,
    borderWidth: 1.5, borderColor: COLORS.border,
  },

  saveBtn:         { borderRadius: 16, overflow: 'hidden', ...SHADOWS.medium, marginBottom: 20 },
  saveBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 10 },
  saveBtnText:     { fontSize: 16, fontWeight: '700', color: '#FFF' },

  histSection: { marginTop: 4 },
  histHeader:  { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  histTitle:   { fontSize: 12, fontWeight: '800', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.4 },

  logCard: {
    backgroundColor: COLORS.surface, borderRadius: 14, padding: 14, marginBottom: 8,
    flexDirection: 'row', alignItems: 'flex-start', ...SHADOWS.small,
    borderWidth: 1, borderColor: COLORS.borderLight,
  },
  logDate:      { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  logTime:      { fontSize: 12, color: COLORS.textMuted },
  logSymChip:   { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8, marginBottom: 2 },
  logSymText:   { fontSize: 11, fontWeight: '700' },
  moreText:     { fontSize: 11, color: COLORS.textMuted, alignSelf: 'center' },
  logPainBadge: { borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 },
  logPainBadgeText: { fontSize: 11, fontWeight: '800', color: '#FFF' },
  logRegionText: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600' },
  logNote:       { fontSize: 12, color: COLORS.textSecondary, lineHeight: 17, marginTop: 4 },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  savedBox: { backgroundColor: COLORS.surface, borderRadius: 24, padding: 28, alignItems: 'center', width: '100%', ...SHADOWS.large },
  savedTitle: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 6 },
  savedSub:   { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 20 },
  savedCloseBtn: { backgroundColor: COLORS.primary, borderRadius: 14, paddingHorizontal: 40, paddingVertical: 14 },
  savedCloseBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },

  detailOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  detailBox: {
    backgroundColor: COLORS.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 20, paddingBottom: 36, maxHeight: '88%',
  },
  dragHandle:   { width: 40, height: 4, backgroundColor: COLORS.border, borderRadius: 2, alignSelf: 'center', marginBottom: 14 },
  closeCircle:  { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' },
  detailTitle:  { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
  detailPainBox:{ flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 14, padding: 14, borderWidth: 1.5, marginBottom: 14 },
  detailPainNum:{ fontSize: 44, fontWeight: '900', lineHeight: 50 },
  detailSection:{ marginBottom: 14 },
  detailSectionTitle: { fontSize: 11, fontWeight: '800', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
});

export default SymptomLogScreen;
