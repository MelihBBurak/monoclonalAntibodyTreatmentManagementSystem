import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Dimensions, Modal,
} from 'react-native';
import Svg, { Rect, Ellipse, Line, Circle, G } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SHADOWS } from '../utils/styles';

const { width: SW } = Dimensions.get('window');
const STORAGE_KEY   = 'symptom_logs_v1';

// ─── Diagram boyutları ────────────────────────────────────────────────────────
const BODY_COL_W = 160;   // SVG şema genişliği
const BODY_H     = 375;   // SVG şema yüksekliği
const DIAGRAM_W  = SW - 32;
const SIDE_COL_W = Math.floor((DIAGRAM_W - BODY_COL_W - 6) / 2);
const BODY_OFFSET = SIDE_COL_W + 3; // şemanın x başlangıcı

// SVG renkleri (vücut)
const SKIN     = '#F5D5B8';
const SKIN_S   = '#C68642';
const SKIN_SW  = 1.2;

// ─── Tipler ──────────────────────────────────────────────────────────────────
type ZoneSide = 'left' | 'right';

interface DiagramZone {
  id:    string;
  label: string;
  dotX:  number;   // SVG canvas içinde nokta merkezi X (px)
  dotY:  number;   // SVG canvas içinde nokta merkezi Y (px)
  side:  ZoneSide;
}

type ZonePainMap = Record<string, number>; // zoneId → 1..10

export interface SymptomLog {
  id: string; date: string; time: string;
  drug: string; antibody: string; disease: string;
  symptoms: string[]; painLevel: number;
  regions: string[]; bodySide: 'front' | 'back'; note: string;
  zonePain?: ZonePainMap;
}

// ─── Ön Vücut Bölgeleri ──────────────────────────────────────────────────────
const FRONT_ZONES: DiagramZone[] = [
  { id: 'bas',       label: 'Baş',          dotX:  80, dotY:  28, side: 'right' },
  { id: 'boyun',     label: 'Boyun',        dotX:  80, dotY:  62, side: 'right' },
  { id: 'sol_omuz',  label: 'Sol Omuz',     dotX:  46, dotY:  73, side: 'left'  },
  { id: 'sag_omuz',  label: 'Sağ Omuz',    dotX: 114, dotY:  73, side: 'right' },
  { id: 'sol_uk',    label: 'Sol Üst Kol',  dotX:  22, dotY: 100, side: 'left'  },
  { id: 'sag_uk',    label: 'Sağ Üst Kol', dotX: 138, dotY: 100, side: 'right' },
  { id: 'sol_gogus', label: 'Sol Göğüs',   dotX:  58, dotY:  89, side: 'left'  },
  { id: 'sag_gogus', label: 'Sağ Göğüs',  dotX: 102, dotY:  89, side: 'right' },
  { id: 'sol_karin', label: 'Sol Karın',   dotX:  59, dotY: 136, side: 'left'  },
  { id: 'sag_karin', label: 'Sağ Karın',  dotX: 101, dotY: 136, side: 'right' },
  { id: 'sol_ok',    label: 'Sol Ön Kol', dotX:  16, dotY: 166, side: 'left'  },
  { id: 'sag_ok',    label: 'Sağ Ön Kol',dotX: 144, dotY: 166, side: 'right' },
  { id: 'pelvis',    label: 'Pelvis',      dotX:  80, dotY: 171, side: 'right' },
  { id: 'sol_el',    label: 'Sol El',      dotX:  13, dotY: 211, side: 'left'  },
  { id: 'sag_el',    label: 'Sağ El',     dotX: 147, dotY: 211, side: 'right' },
  { id: 'sol_uyluk', label: 'Sol Uyluk',  dotX:  55, dotY: 218, side: 'left'  },
  { id: 'sag_uyluk', label: 'Sağ Uyluk', dotX: 105, dotY: 218, side: 'right' },
  { id: 'sol_diz',   label: 'Sol Diz',    dotX:  55, dotY: 256, side: 'left'  },
  { id: 'sag_diz',   label: 'Sağ Diz',   dotX: 105, dotY: 256, side: 'right' },
  { id: 'sol_bacak', label: 'Sol Bacak', dotX:  54, dotY: 300, side: 'left'  },
  { id: 'sag_bacak', label: 'Sağ Bacak',dotX: 106, dotY: 300, side: 'right' },
  { id: 'sol_ayak',  label: 'Sol Ayak',  dotX:  52, dotY: 344, side: 'left'  },
  { id: 'sag_ayak',  label: 'Sağ Ayak', dotX: 108, dotY: 344, side: 'right' },
];

// ─── Arka Vücut Bölgeleri ────────────────────────────────────────────────────
const BACK_ZONES: DiagramZone[] = [
  { id: 'kafa_a',      label: 'Kafa Arkası',     dotX:  80, dotY:  28, side: 'right' },
  { id: 'ense',        label: 'Ense',             dotX:  80, dotY:  62, side: 'right' },
  { id: 'sol_omuz_a',  label: 'Sol Omuz',         dotX:  46, dotY:  73, side: 'left'  },
  { id: 'sag_omuz_a',  label: 'Sağ Omuz',         dotX: 114, dotY:  73, side: 'right' },
  { id: 'sol_uk_a',    label: 'Sol Üst Kol',      dotX:  22, dotY: 100, side: 'left'  },
  { id: 'sag_uk_a',    label: 'Sağ Üst Kol',     dotX: 138, dotY: 100, side: 'right' },
  { id: 'sol_sirt_u',  label: 'Sol Üst Sırt',    dotX:  58, dotY:  89, side: 'left'  },
  { id: 'sag_sirt_u',  label: 'Sağ Üst Sırt',   dotX: 102, dotY:  89, side: 'right' },
  { id: 'sol_sirt_a',  label: 'Sol Alt Sırt',    dotX:  59, dotY: 136, side: 'left'  },
  { id: 'sag_sirt_a',  label: 'Sağ Alt Sırt',   dotX: 101, dotY: 136, side: 'right' },
  { id: 'sol_ok_a',    label: 'Sol Arka Kol',    dotX:  16, dotY: 166, side: 'left'  },
  { id: 'sag_ok_a',    label: 'Sağ Arka Kol',   dotX: 144, dotY: 166, side: 'right' },
  { id: 'bel',         label: 'Bel',              dotX:  80, dotY: 171, side: 'right' },
  { id: 'sol_el_a',    label: 'Sol El Arkası',   dotX:  13, dotY: 211, side: 'left'  },
  { id: 'sag_el_a',    label: 'Sağ El Arkası',  dotX: 147, dotY: 211, side: 'right' },
  { id: 'sol_kalca',   label: 'Sol Kalça',       dotX:  55, dotY: 218, side: 'left'  },
  { id: 'sag_kalca',   label: 'Sağ Kalça',      dotX: 105, dotY: 218, side: 'right' },
  { id: 'sol_uyluk_a', label: 'Sol Arka Uyluk', dotX:  55, dotY: 256, side: 'left'  },
  { id: 'sag_uyluk_a', label: 'Sağ Arka Uyluk',dotX: 105, dotY: 256, side: 'right' },
  { id: 'sol_baldur',  label: 'Sol Baldır',     dotX:  54, dotY: 300, side: 'left'  },
  { id: 'sag_baldur',  label: 'Sağ Baldır',    dotX: 106, dotY: 300, side: 'right' },
  { id: 'sol_topuk',   label: 'Sol Topuk',      dotX:  52, dotY: 344, side: 'left'  },
  { id: 'sag_topuk',   label: 'Sağ Topuk',     dotX: 108, dotY: 344, side: 'right' },
];

const ALL_DIAGRAM_ZONES = [...FRONT_ZONES, ...BACK_ZONES];

// ─── Ağrı renkleri ───────────────────────────────────────────────────────────
const PAIN_COLORS: Record<number, string> = {
  1:'#2E7D32',2:'#388E3C',3:'#7CB342',4:'#AFB42B',5:'#F9A825',
  6:'#FB8C00',7:'#E64A19',8:'#D32F2F',9:'#B71C1C',10:'#880E4F',
};
const PAIN_LABELS: Record<number,string> = {
  0:'',1:'Yok',2:'Çok Hafif',3:'Hafif',4:'Orta-Hafif',5:'Orta',
  6:'Orta-Şiddetli',7:'Şiddetli',8:'Çok Şiddetli',9:'Dayanılmaz',10:'En Kötü',
};

const SYMPTOM_TYPES = [
  { id:'agri',    label:'Ağrı / Sancı',   icon:'body'                as const, color:COLORS.danger  },
  { id:'yorgun',  label:'Yorgunluk',       icon:'battery-dead'        as const, color:'#6A1B9A'      },
  { id:'bulanti', label:'Bulantı',         icon:'remove-circle'       as const, color:'#1565C0'      },
  { id:'titreme', label:'Titreme',         icon:'flash'               as const, color:'#00838F'      },
  { id:'nefes',   label:'Nefes Darlığı',  icon:'cloud'               as const, color:COLORS.blue    },
  { id:'sislik',  label:'Şişlik / Ödem',  icon:'water'               as const, color:COLORS.teal    },
  { id:'dokuntu', label:'Döküntü',         icon:'hand-left'           as const, color:'#AD1457'      },
  { id:'ates',    label:'Ateş',            icon:'thermometer'         as const, color:COLORS.amber   },
  { id:'kasinti', label:'Kaşıntı',         icon:'hand-right'          as const, color:'#558B2F'      },
  { id:'bas_agri',label:'Baş Ağrısı',     icon:'alert-circle'        as const, color:'#4527A0'      },
  { id:'eklem',   label:'Eklem Ağrısı',   icon:'fitness'             as const, color:COLORS.primary },
  { id:'diger',   label:'Diğer',           icon:'ellipsis-horizontal' as const, color:'#455A64'      },
];

const makeId  = () => `${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
const fmtDate = (d: string) => { if(!d)return''; const[y,m,day]=d.split('-'); return`${day}/${m}/${y}`; };

// ─── SVG Vücut Şeması ─────────────────────────────────────────────────────────
// Vücut şeklini oluşturan SVG parçaları (rect / ellipse)
type ShapeDef =
  | { t:'e'; cx:number; cy:number; rx:number; ry:number }   // ellipse
  | { t:'r'; x:number;  y:number;  w:number;  h:number; r?:number }; // rect

const BODY_SHAPES: ShapeDef[] = [
  // Baş
  { t:'e', cx:80, cy:28, rx:22, ry:26 },
  // Boyun
  { t:'r', x:70, y:54, w:20, h:16, r:5 },
  // Sol omuz
  { t:'r', x:24, y:62, w:44, h:22, r:10 },
  // Sağ omuz
  { t:'r', x:92, y:62, w:44, h:22, r:10 },
  // Sol üst kol
  { t:'r', x:8,  y:64, w:28, h:72, r:14 },
  // Sağ üst kol
  { t:'r', x:124, y:64, w:28, h:72, r:14 },
  // Gövde sol (göğüs+karın)
  { t:'r', x:36, y:62, w:44, h:96, r:5 },
  // Gövde sağ
  { t:'r', x:80, y:62, w:44, h:96, r:5 },
  // Sol ön kol
  { t:'r', x:4,  y:138, w:24, h:56, r:12 },
  // Sağ ön kol
  { t:'r', x:132, y:138, w:24, h:56, r:12 },
  // Pelvis
  { t:'r', x:36, y:156, w:88, h:30, r:8 },
  // Sol el
  { t:'r', x:2,  y:196, w:22, h:30, r:8 },
  // Sağ el
  { t:'r', x:136, y:196, w:22, h:30, r:8 },
  // Sol uyluk
  { t:'r', x:36, y:184, w:38, h:68, r:10 },
  // Sağ uyluk
  { t:'r', x:86, y:184, w:38, h:68, r:10 },
  // Sol diz
  { t:'e', cx:55, cy:256, rx:17, ry:12 },
  // Sağ diz
  { t:'e', cx:105, cy:256, rx:17, ry:12 },
  // Sol alt bacak
  { t:'r', x:38, y:265, w:32, h:70, r:6 },
  // Sağ alt bacak
  { t:'r', x:90, y:265, w:32, h:70, r:6 },
  // Sol ayak
  { t:'r', x:30, y:332, w:44, h:24, r:8 },
  // Sağ ayak
  { t:'r', x:86, y:332, w:44, h:24, r:8 },
];

// ─── Vücut Diyagramı bileşeni ─────────────────────────────────────────────────
interface BodyDiagramProps {
  zones:     DiagramZone[];
  zonePain:  ZonePainMap;
  onSelect:  (zone: DiagramZone) => void;
}

const BodyDiagram: React.FC<BodyDiagramProps> = ({ zones, zonePain, onSelect }) => {
  const leftZones  = zones.filter(z => z.side === 'left');
  const rightZones = zones.filter(z => z.side === 'right');

  // Label y-koordinatları: her taraf için eşit aralıklı
  const leftLabelY  = leftZones.map((_,i) => (i + 0.5) * (BODY_H / leftZones.length));
  const rightLabelY = rightZones.map((_,i) => (i + 0.5) * (BODY_H / rightZones.length));

  // Tam SVG genişliği = tüm sütunlar
  const totalSvgW = DIAGRAM_W;
  // Vücut şemasının x-offset'i (sol sütun + boşluk)
  const bx = BODY_OFFSET;

  return (
    <View style={{ width: DIAGRAM_W, height: BODY_H }}>

      {/* SVG: vücut şekilleri + noktalar + çizgiler (dokunma devre dışı) */}
      <Svg
        width={totalSvgW}
        height={BODY_H}
        style={{ position: 'absolute', top: 0, left: 0 }}
        pointerEvents="none"
      >
        {/* ── Vücut şekilleri ── */}
        <G x={bx}>
          {BODY_SHAPES.map((s, i) => {
            if (s.t === 'e') {
              return (
                <Ellipse
                  key={i}
                  cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry}
                  fill={SKIN} stroke={SKIN_S} strokeWidth={SKIN_SW}
                />
              );
            }
            return (
              <Rect
                key={i}
                x={s.x} y={s.y} width={s.w} height={s.h}
                rx={s.r ?? 0} ry={s.r ?? 0}
                fill={SKIN} stroke={SKIN_S} strokeWidth={SKIN_SW}
              />
            );
          })}
        </G>

        {/* ── Seçili bölge dolguları ── */}
        {zones.map(zone => {
          const pain = zonePain[zone.id];
          if (!pain) return null;
          const col = PAIN_COLORS[pain];
          return (
            <Circle
              key={`fill-${zone.id}`}
              cx={bx + zone.dotX}
              cy={zone.dotY}
              r={18}
              fill={col + '55'}
              stroke={col}
              strokeWidth={1.5}
            />
          );
        })}

        {/* ── Callout çizgiler ── */}
        {leftZones.map((zone, i) => {
          const pain   = zonePain[zone.id];
          const color  = pain ? PAIN_COLORS[pain] : '#94A3B8';
          const labelY = leftLabelY[i];
          const dotAbsX = bx + zone.dotX;
          const lineEndX = SIDE_COL_W - 2;
          return (
            <Line
              key={`line-${zone.id}`}
              x1={dotAbsX} y1={zone.dotY}
              x2={lineEndX} y2={labelY}
              stroke={color}
              strokeWidth={pain ? 1.8 : 1}
              strokeDasharray={pain ? undefined : '4,3'}
              opacity={pain ? 1 : 0.55}
            />
          );
        })}
        {rightZones.map((zone, i) => {
          const pain   = zonePain[zone.id];
          const color  = pain ? PAIN_COLORS[pain] : '#94A3B8';
          const labelY = rightLabelY[i];
          const dotAbsX = bx + zone.dotX;
          const lineStartX = bx + BODY_COL_W + 2;
          return (
            <Line
              key={`line-${zone.id}`}
              x1={dotAbsX} y1={zone.dotY}
              x2={lineStartX} y2={labelY}
              stroke={color}
              strokeWidth={pain ? 1.8 : 1}
              strokeDasharray={pain ? undefined : '4,3'}
              opacity={pain ? 1 : 0.55}
            />
          );
        })}

        {/* ── Nokta (daire) işaretleri ── */}
        {zones.map(zone => {
          const pain  = zonePain[zone.id];
          const color = pain ? PAIN_COLORS[pain] : '#94A3B8';
          return (
            <Circle
              key={`dot-${zone.id}`}
              cx={bx + zone.dotX}
              cy={zone.dotY}
              r={5}
              fill={pain ? color : '#FFF'}
              stroke={color}
              strokeWidth={pain ? 2 : 1.5}
            />
          );
        })}
      </Svg>

      {/* ── Sol etiket sütunu ── */}
      {leftZones.map((zone, i) => {
        const pain  = zonePain[zone.id];
        const color = pain ? PAIN_COLORS[pain] : COLORS.textMuted;
        return (
          <TouchableOpacity
            key={zone.id}
            onPress={() => onSelect(zone)}
            activeOpacity={0.7}
            style={[
              s.calloutBox,
              {
                position: 'absolute',
                top:   leftLabelY[i] - 13,
                left:  0,
                width: SIDE_COL_W - 2,
                borderColor: pain ? color : COLORS.borderLight,
                backgroundColor: pain ? color + '18' : COLORS.surface,
              },
            ]}
          >
            {pain ? (
              <>
                <View style={[s.calloutDot, { backgroundColor: color }]} />
                <Text style={[s.calloutLabel, { color }]} numberOfLines={1}>
                  {zone.label}
                </Text>
                <Text style={[s.calloutPain, { color }]}>{pain}</Text>
              </>
            ) : (
              <>
                <View style={s.calloutDotEmpty} />
                <Text style={s.calloutLabelEmpty} numberOfLines={1}>
                  {zone.label}
                </Text>
              </>
            )}
          </TouchableOpacity>
        );
      })}

      {/* ── Sağ etiket sütunu ── */}
      {rightZones.map((zone, i) => {
        const pain  = zonePain[zone.id];
        const color = pain ? PAIN_COLORS[pain] : COLORS.textMuted;
        const xPos  = BODY_OFFSET + BODY_COL_W + 4;
        return (
          <TouchableOpacity
            key={zone.id}
            onPress={() => onSelect(zone)}
            activeOpacity={0.7}
            style={[
              s.calloutBox,
              {
                position: 'absolute',
                top:   rightLabelY[i] - 13,
                left:  xPos,
                width: SIDE_COL_W - 2,
                borderColor: pain ? color : COLORS.borderLight,
                backgroundColor: pain ? color + '18' : COLORS.surface,
              },
            ]}
          >
            {pain ? (
              <>
                <Text style={[s.calloutPain, { color }]}>{pain}</Text>
                <Text style={[s.calloutLabel, { color, flex:1, textAlign:'right' }]} numberOfLines={1}>
                  {zone.label}
                </Text>
                <View style={[s.calloutDot, { backgroundColor: color }]} />
              </>
            ) : (
              <>
                <Text style={s.calloutLabelEmpty} numberOfLines={1}>
                  {zone.label}
                </Text>
                <View style={s.calloutDotEmpty} />
              </>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

// ─── Ana Ekran ────────────────────────────────────────────────────────────────
const SymptomLogScreen: React.FC = () => {
  const params   = useLocalSearchParams();
  const date     = params.date     as string;
  const drug     = params.selectedDrug     as string;
  const antibody = params.selectedAntibody as string;
  const disease  = params.selectedDisease  as string;

  const [symptoms,     setSymptoms]     = useState<string[]>([]);
  const [zonePain,     setZonePain]     = useState<ZonePainMap>({});
  const [bodySide,     setBodySide]     = useState<'front' | 'back'>('front');
  const [note,         setNote]         = useState('');
  const [logs,         setLogs]         = useState<SymptomLog[]>([]);
  const [savedModal,   setSavedModal]   = useState(false);
  const [detailLog,    setDetailLog]    = useState<SymptomLog | null>(null);

  // Seçim modali
  const [editingZone,  setEditingZone]  = useState<DiagramZone | null>(null);
  const [pendingPain,  setPendingPain]  = useState(0);

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
    setSymptoms(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  // Etiket kutusuna basınca modal aç
  const openZoneEditor = (zone: DiagramZone) => {
    setEditingZone(zone);
    setPendingPain(zonePain[zone.id] ?? 0);
  };

  const confirmZonePain = () => {
    if (!editingZone) return;
    if (pendingPain > 0) {
      setZonePain(prev => ({ ...prev, [editingZone.id]: pendingPain }));
    } else {
      setZonePain(prev => { const n = { ...prev }; delete n[editingZone.id]; return n; });
    }
    setEditingZone(null);
  };

  const clearZone = () => {
    if (!editingZone) return;
    setZonePain(prev => { const n = { ...prev }; delete n[editingZone.id]; return n; });
    setEditingZone(null);
  };

  // Tüm seçili bölgeler (ön + arka)
  const selectedZoneIds    = Object.keys(zonePain);
  const globalPainLevel    = selectedZoneIds.length > 0 ? Math.max(...Object.values(zonePain)) : 0;

  const handleSave = async () => {
    if (symptoms.length === 0 && selectedZoneIds.length === 0 && !note.trim()) return;
    const now  = new Date();
    const time = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    const entry: SymptomLog = {
      id: makeId(), date, time, drug, antibody, disease,
      symptoms, painLevel: globalPainLevel,
      regions: selectedZoneIds,
      bodySide,
      note: note.trim(),
      zonePain: { ...zonePain },
    };
    try {
      const raw   = await AsyncStorage.getItem(STORAGE_KEY);
      const all: SymptomLog[] = raw ? JSON.parse(raw) : [];
      all.unshift(entry);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(all));
      setLogs(p => [entry, ...p]);
      setSymptoms([]); setZonePain({}); setNote(''); setBodySide('front');
      setSavedModal(true);
    } catch {}
  };

  const deleteLog = async (id: string) => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const all: SymptomLog[] = raw ? JSON.parse(raw) : [];
      const upd = all.filter(l => l.id !== id);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(upd));
      setLogs(p => p.filter(l => l.id !== id));
    } catch {}
  };

  const todayLogs = logs.filter(l => l.date === date);
  const pastLogs  = logs.filter(l => l.date !== date);
  const zones     = bodySide === 'front' ? FRONT_ZONES : BACK_ZONES;

  return (
    <LinearGradient colors={['#F5F7F5','#FFFFFF']} style={{ flex:1 }}>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Bağlam kartı ── */}
        <View style={s.contextCard}>
          <View style={{ flex:1 }}>
            <Text style={s.contextDate}>{fmtDate(date)}</Text>
            <Text style={s.contextDrug} numberOfLines={1}>{drug}</Text>
            <Text style={s.contextSub}  numberOfLines={1}>{antibody} · {disease}</Text>
          </View>
          <View style={[s.contextIcon, { backgroundColor: COLORS.dangerLight }]}>
            <Ionicons name="pulse" size={28} color={COLORS.danger} />
          </View>
        </View>

        {/* ── Semptom seçimi ── */}
        <SectionCard title="Semptom Türü" icon="list" iconBg={COLORS.blueLight} iconColor={COLORS.blue}>
          <Text style={s.hint}>Yaşadığınız semptomlara dokunun (çoklu seçim)</Text>
          <View style={s.chipGrid}>
            {SYMPTOM_TYPES.map(sym => {
              const active = symptoms.includes(sym.id);
              return (
                <TouchableOpacity
                  key={sym.id}
                  style={[s.symChip, active && { backgroundColor: sym.color, borderColor: sym.color }]}
                  onPress={() => toggleSymptom(sym.id)}
                  activeOpacity={0.75}
                >
                  <Ionicons name={sym.icon} size={14} color={active ? '#FFF' : sym.color} />
                  <Text style={[s.symChipText, active && { color:'#FFF' }]}>{sym.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </SectionCard>

        {/* ── Vücut Haritası ── */}
        <SectionCard title="Ağrı / Şikayet Bölgesi" icon="body" iconBg={COLORS.tealLight} iconColor={COLORS.teal}>
          <Text style={s.hint}>
            Etiket kutucuğuna basın → bölge adı ve ağrı şiddetini seçin
          </Text>

          {/* Ön / Arka toggle */}
          <View style={s.sideToggle}>
            {(['front','back'] as const).map(sv => (
              <TouchableOpacity
                key={sv}
                style={[s.sideBtn, bodySide === sv && s.sideBtnActive]}
                onPress={() => setBodySide(sv)}
              >
                <Ionicons
                  name={sv === 'front' ? 'person' : 'person-outline'}
                  size={15}
                  color={bodySide === sv ? '#FFF' : COLORS.primary}
                />
                <Text style={[s.sideBtnText, bodySide === sv && { color:'#FFF' }]}>
                  {sv === 'front' ? 'Ön Görünüm' : 'Arka Görünüm'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Yön etiketi */}
          <View style={s.dirRow}>
            <Text style={s.dirText}>← Sol</Text>
            <Text style={s.dirTitle}>{bodySide === 'front' ? 'ÖN' : 'ARKA'}</Text>
            <Text style={s.dirText}>Sağ →</Text>
          </View>

          {/* Şema */}
          <View style={{ alignItems:'center', marginVertical: 4 }}>
            <BodyDiagram
              zones={zones}
              zonePain={zonePain}
              onSelect={openZoneEditor}
            />
          </View>

          {/* Seçili bölge özeti */}
          {selectedZoneIds.length > 0 && (
            <View style={s.painSummary}>
              <Text style={s.painSummaryTitle}>
                <Ionicons name="location" size={12} color={COLORS.teal} />
                {'  '}Seçili Bölgeler
              </Text>
              <View style={s.chipGrid}>
                {selectedZoneIds.map(id => {
                  const zone = ALL_DIAGRAM_ZONES.find(z => z.id === id);
                  const pain = zonePain[id];
                  const col  = PAIN_COLORS[pain];
                  return (
                    <TouchableOpacity
                      key={id}
                      style={[s.painChip, { backgroundColor: col + '22', borderColor: col }]}
                      onPress={() => {
                        const z = ALL_DIAGRAM_ZONES.find(zz => zz.id === id);
                        if (z) openZoneEditor(z);
                      }}
                    >
                      <View style={[s.painChipDot, { backgroundColor: col }]} />
                      <Text style={[s.painChipText, { color: col }]} numberOfLines={1}>
                        {zone?.label ?? id}
                      </Text>
                      <Text style={[s.painChipNum, { color: col }]}>{pain}/10</Text>
                    </TouchableOpacity>
                  );
                })}
                <TouchableOpacity
                  style={s.clearAllBtn}
                  onPress={() => setZonePain({})}
                >
                  <Text style={s.clearAllText}>Temizle</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </SectionCard>

        {/* ── Detaylı Not ── */}
        <SectionCard title="Detaylı Not" icon="create" iconBg="#F3E5F5" iconColor="#7B1FA2">
          <TextInput
            style={s.noteInput}
            multiline
            numberOfLines={5}
            value={note}
            onChangeText={setNote}
            placeholder={
              'Detaylarınızı buraya yazın:\n' +
              '• Ağrı ne zaman başladı?\n' +
              '• Şiddet nasıl değişti?\n' +
              '• Başka belirtiler var mıydı?'
            }
            placeholderTextColor={COLORS.textMuted}
            textAlignVertical="top"
          />
        </SectionCard>

        {/* ── Kaydet ── */}
        <TouchableOpacity style={s.saveBtn} onPress={handleSave} activeOpacity={0.85}>
          <LinearGradient
            colors={[COLORS.primaryLight, COLORS.primaryDark]}
            start={{ x:0,y:0 }} end={{ x:1,y:0 }}
            style={s.saveBtnGrad}
          >
            <Ionicons name="save" size={20} color="#FFF" />
            <Text style={s.saveBtnText}>Semptomu Kaydet</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* ── Geçmiş ── */}
        {todayLogs.length > 0 && (
          <HistorySection
            title={`Bu Tarihte (${todayLogs.length})`} icon="time"
            logs={todayLogs} onPress={setDetailLog} onDelete={deleteLog}
          />
        )}
        {pastLogs.length > 0 && (
          <HistorySection
            title="Geçmiş Kayıtlar" icon="calendar"
            logs={pastLogs.slice(0,6)} onPress={setDetailLog} onDelete={deleteLog}
          />
        )}
      </ScrollView>

      {/* ── Başarı Modali ── */}
      <Modal transparent animationType="fade" visible={savedModal} onRequestClose={() => setSavedModal(false)}>
        <View style={s.overlay}>
          <View style={s.savedBox}>
            <Ionicons name="checkmark-circle" size={54} color={COLORS.primary} style={{ marginBottom:12 }} />
            <Text style={s.savedTitle}>Kaydedildi!</Text>
            <Text style={s.savedSub}>Semptom kaydınız oluşturuldu.</Text>
            <TouchableOpacity style={s.savedCloseBtn} onPress={() => setSavedModal(false)}>
              <Text style={s.savedCloseBtnText}>Tamam</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Bölge / Ağrı Seçim Modali ── */}
      {editingZone && (
        <Modal transparent animationType="fade" visible onRequestClose={() => setEditingZone(null)}>
          <View style={s.overlay}>
            <View style={s.painModal}>
              {/* Başlık */}
              <View style={s.painModalHeader}>
                <View style={[s.painModalIcon, { backgroundColor: COLORS.tealLight }]}>
                  <Ionicons name="location" size={18} color={COLORS.teal} />
                </View>
                <Text style={s.painModalTitle}>{editingZone.label}</Text>
                <TouchableOpacity onPress={() => setEditingZone(null)}>
                  <Ionicons name="close" size={22} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>

              <Text style={s.painModalHint}>Ağrı / rahatsızlık şiddetini seçin:</Text>

              {/* 1-10 ağrı butonları */}
              <View style={s.painBtnRow}>
                {([1,2,3,4,5,6,7,8,9,10] as const).map(n => {
                  const col     = PAIN_COLORS[n];
                  const active  = pendingPain === n;
                  return (
                    <TouchableOpacity
                      key={n}
                      onPress={() => setPendingPain(p => p === n ? 0 : n)}
                      style={[
                        s.painModalBtn,
                        { borderColor: col + '99' },
                        active && { backgroundColor: col, borderColor: col },
                      ]}
                    >
                      <Text style={[s.painModalBtnNum, { color: active ? '#FFF' : col }]}>
                        {n}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Seçilen ağrı badge */}
              {pendingPain > 0 && (
                <View style={[
                  s.painModalBadge,
                  { backgroundColor: PAIN_COLORS[pendingPain] + '20', borderColor: PAIN_COLORS[pendingPain] },
                ]}>
                  <Text style={[s.painModalBadgeText, { color: PAIN_COLORS[pendingPain] }]}>
                    {pendingPain} — {PAIN_LABELS[pendingPain]}
                  </Text>
                </View>
              )}

              {/* Butonlar */}
              <View style={s.painModalBtns}>
                {zonePain[editingZone.id] && (
                  <TouchableOpacity style={s.clearZoneBtn} onPress={clearZone}>
                    <Ionicons name="trash-outline" size={15} color={COLORS.danger} />
                    <Text style={s.clearZoneBtnText}>Bölgeyi Sil</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[
                    s.confirmBtn,
                    { backgroundColor: pendingPain > 0 ? PAIN_COLORS[pendingPain] : COLORS.textMuted },
                  ]}
                  onPress={confirmZonePain}
                  disabled={pendingPain === 0 && !zonePain[editingZone.id]}
                >
                  <Ionicons name="checkmark" size={16} color="#FFF" />
                  <Text style={s.confirmBtnText}>
                    {pendingPain > 0 ? 'Kaydet' : 'Vazgeç'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* ── Detay Modali ── */}
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
  <View style={s.sectionCard}>
    <View style={s.sectionHeader}>
      <View style={[s.sectionIconBg, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={16} color={iconColor} />
      </View>
      <Text style={s.sectionTitle}>{title}</Text>
    </View>
    {children}
  </View>
);

interface HistSProps {
  title: string; icon: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap;
  logs: SymptomLog[]; onPress: (l: SymptomLog) => void; onDelete: (id: string) => void;
}
const HistorySection: React.FC<HistSProps> = ({ title, icon, logs, onPress, onDelete }) => (
  <View style={s.histSection}>
    <View style={s.histHeader}>
      <Ionicons name={icon} size={15} color={COLORS.textSecondary} />
      <Text style={s.histTitle}>{title}</Text>
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
    <TouchableOpacity style={s.logCard} onPress={onPress} activeOpacity={0.8}>
      <View style={{ flex:1 }}>
        <View style={{ flexDirection:'row', alignItems:'center', marginBottom:5 }}>
          <Text style={s.logDate}>{fmtDate(log.date)}</Text>
          <Text style={s.logTime}> · {log.time}</Text>
        </View>
        {log.symptoms.length > 0 && (
          <View style={s.chipGrid}>
            {log.symptoms.slice(0,4).map(id => {
              const sym = SYMPTOM_TYPES.find(x => x.id === id);
              return sym ? (
                <View key={id} style={[s.logSymChip, { backgroundColor: sym.color+'22' }]}>
                  <Text style={[s.logSymText, { color: sym.color }]}>{sym.label}</Text>
                </View>
              ) : null;
            })}
            {log.symptoms.length > 4 && <Text style={s.moreText}>+{log.symptoms.length-4}</Text>}
          </View>
        )}
        <View style={{ flexDirection:'row', gap:6, marginTop:4, flexWrap:'wrap' }}>
          {log.painLevel > 0 && (
            <View style={[s.logPainBadge, { backgroundColor: pc }]}>
              <Text style={s.logPainBadgeText}>Ağrı {log.painLevel}/10</Text>
            </View>
          )}
          {log.regions.length > 0 && (
            <View style={{ flexDirection:'row', alignItems:'center', gap:3 }}>
              <Ionicons name="location" size={10} color={COLORS.textMuted} />
              <Text style={s.logRegionText}>{log.regions.length} bölge</Text>
            </View>
          )}
        </View>
        {log.note ? <Text style={s.logNote} numberOfLines={2}>{log.note}</Text> : null}
      </View>
      <View style={{ alignItems:'flex-end', gap:10, marginLeft:8 }}>
        <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
        <TouchableOpacity onPress={onDelete} hitSlop={{ top:8,bottom:8,left:8,right:8 }}>
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
      <View style={s.detailOverlay}>
        <View style={s.detailBox}>
          <View style={s.dragHandle} />
          <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
            <View>
              <Text style={s.detailTitle}>{fmtDate(log.date)} · {log.time}</Text>
              <Text style={{ fontSize:12, color:COLORS.textMuted, marginTop:2 }}>{log.drug} · {log.antibody}</Text>
            </View>
            <TouchableOpacity style={s.closeCircle} onPress={onClose}>
              <Ionicons name="close" size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {log.painLevel > 0 && (
              <View style={[s.detailPainBox, { backgroundColor: pc+'18', borderColor: pc }]}>
                <Text style={[s.detailPainNum, { color: pc }]}>{log.painLevel}</Text>
                <View>
                  <Text style={[{ fontSize:16, fontWeight:'700' }, { color: pc }]}>{PAIN_LABELS[log.painLevel]}</Text>
                  <Text style={{ fontSize:12, color:COLORS.textMuted, marginTop:2 }}>Maksimum Ağrı Şiddeti</Text>
                </View>
              </View>
            )}
            {log.symptoms.length > 0 && (
              <View style={s.detailSection}>
                <Text style={s.detailSectionTitle}>Semptomlar</Text>
                <View style={s.chipGrid}>
                  {log.symptoms.map(id => {
                    const sym = SYMPTOM_TYPES.find(x => x.id === id);
                    return sym ? (
                      <View key={id} style={[s.symChip, { backgroundColor: sym.color+'22', borderColor: sym.color }]}>
                        <Ionicons name={sym.icon} size={13} color={sym.color} />
                        <Text style={[s.symChipText, { color: sym.color }]}>{sym.label}</Text>
                      </View>
                    ) : null;
                  })}
                </View>
              </View>
            )}
            {/* Bölge özeti - yeni format */}
            {log.regions.length > 0 && (
              <View style={s.detailSection}>
                <Text style={s.detailSectionTitle}>Ağrı Bölgeleri</Text>
                <View style={s.chipGrid}>
                  {log.regions.map(id => {
                    const zone  = ALL_DIAGRAM_ZONES.find(z => z.id === id);
                    const pain  = log.zonePain?.[id];
                    const col   = pain ? PAIN_COLORS[pain] : pc;
                    return (
                      <View key={id} style={[s.painChip, { backgroundColor: col+'22', borderColor: col }]}>
                        <View style={[s.painChipDot, { backgroundColor: col }]} />
                        <Text style={[s.painChipText, { color: col }]}>{zone?.label ?? id}</Text>
                        {pain && <Text style={[s.painChipNum, { color: col }]}>{pain}/10</Text>}
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
            {log.note ? (
              <View style={s.detailSection}>
                <Text style={s.detailSectionTitle}>Not</Text>
                <View style={{ backgroundColor: COLORS.background, borderRadius:12, padding:14 }}>
                  <Text style={{ fontSize:14, color:COLORS.textPrimary, lineHeight:22 }}>{log.note}</Text>
                </View>
              </View>
            ) : null}
          </ScrollView>
          <TouchableOpacity style={[s.saveBtn, { marginBottom:0 }]} onPress={onClose}>
            <LinearGradient
              colors={[COLORS.primaryLight, COLORS.primaryDark]}
              start={{ x:0,y:0 }} end={{ x:1,y:0 }}
              style={s.saveBtnGrad}
            >
              <Text style={s.saveBtnText}>Kapat</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// ─── Stiller ─────────────────────────────────────────────────────────────────
const CALLOUT_H = 26; // etiket kutusu yüksekliği

const s = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 48 },

  contextCard: {
    backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, marginBottom: 12,
    flexDirection: 'row', alignItems: 'center', ...SHADOWS.small,
    borderWidth: 1, borderColor: COLORS.borderLight,
  },
  contextDate: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.5 },
  contextDrug: { fontSize: 14, fontWeight: '700', color: COLORS.primary, marginTop: 4 },
  contextSub:  { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  contextIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginLeft: 12 },

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
  hint: { fontSize: 12, color: COLORS.textMuted, marginBottom: 10, fontWeight: '500' },

  chipGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  symChip:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.surface, gap: 5 },
  symChipText: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },

  sideToggle:    { flexDirection: 'row', gap: 10, marginBottom: 8 },
  sideBtn:       { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: COLORS.primary, backgroundColor: COLORS.surface, gap: 6 },
  sideBtnActive: { backgroundColor: COLORS.primary },
  sideBtnText:   { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  dirRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  dirText:  { fontSize: 11, color: COLORS.textMuted, fontWeight: '700' },
  dirTitle: { fontSize: 12, fontWeight: '800', color: COLORS.textSecondary, letterSpacing: 1 },

  // Callout etiket kutuları
  calloutBox: {
    height: CALLOUT_H,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderRadius: 6,
    borderWidth: 1.2,
    gap: 4,
  },
  calloutDot:      { width: 7, height: 7, borderRadius: 4 },
  calloutDotEmpty: { width: 7, height: 7, borderRadius: 4, borderWidth: 1.2, borderColor: '#94A3B8' },
  calloutLabel:    { fontSize: 9.5, fontWeight: '700', flex: 1 },
  calloutLabelEmpty:{ fontSize: 9, color: COLORS.textMuted, flex: 1 },
  calloutPain:     { fontSize: 10, fontWeight: '900', minWidth: 14, textAlign: 'center' },

  // Özet bölge chips
  painSummary:      { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.borderLight },
  painSummaryTitle: { fontSize: 11, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  painChip:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 12, borderWidth: 1.5, gap: 4 },
  painChipDot:      { width: 7, height: 7, borderRadius: 4 },
  painChipText:     { fontSize: 11, fontWeight: '700', maxWidth: 70 },
  painChipNum:      { fontSize: 11, fontWeight: '900' },
  clearAllBtn:      { paddingHorizontal: 10, paddingVertical: 5 },
  clearAllText:     { fontSize: 11, color: COLORS.textMuted, fontWeight: '700' },

  noteInput: {
    backgroundColor: COLORS.background, borderRadius: 12, padding: 14,
    fontSize: 14, color: COLORS.textPrimary, minHeight: 110,
    borderWidth: 1.5, borderColor: COLORS.border,
  },
  saveBtn:    { borderRadius: 16, overflow: 'hidden', ...SHADOWS.medium, marginBottom: 20 },
  saveBtnGrad:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 10 },
  saveBtnText:{ fontSize: 16, fontWeight: '700', color: '#FFF' },

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

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },

  savedBox:          { backgroundColor: COLORS.surface, borderRadius: 24, padding: 28, alignItems: 'center', width: '100%', ...SHADOWS.large },
  savedTitle:        { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 6 },
  savedSub:          { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 20 },
  savedCloseBtn:     { backgroundColor: COLORS.primary, borderRadius: 14, paddingHorizontal: 40, paddingVertical: 14 },
  savedCloseBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },

  // Ağrı Seçim Modali
  painModal:       { backgroundColor: COLORS.surface, borderRadius: 20, padding: 20, width: '100%', ...SHADOWS.large },
  painModalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
  painModalIcon:   { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  painModalTitle:  { flex: 1, fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  painModalHint:   { fontSize: 12, color: COLORS.textMuted, marginBottom: 12, fontWeight: '500' },
  painBtnRow:      { flexDirection: 'row', gap: 5, flexWrap: 'wrap', marginBottom: 10, justifyContent: 'center' },
  painModalBtn: {
    width: Math.floor((SW - 32 - 32 - 45) / 10),
    aspectRatio: 1, borderRadius: 8, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.surface,
  },
  painModalBtnNum:   { fontSize: 13, fontWeight: '800' },
  painModalBadge:    { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1.5, alignSelf: 'center', marginBottom: 12 },
  painModalBadgeText:{ fontSize: 14, fontWeight: '700', textAlign: 'center' },
  painModalBtns:     { flexDirection: 'row', gap: 10, justifyContent: 'flex-end', marginTop: 4 },
  clearZoneBtn:      { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 10 },
  clearZoneBtnText:  { fontSize: 13, color: COLORS.danger, fontWeight: '700' },
  confirmBtn:        { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 12, paddingVertical: 12, gap: 6 },
  confirmBtnText:    { fontSize: 14, fontWeight: '700', color: '#FFF' },

  detailOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  detailBox:     { backgroundColor: COLORS.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: 36, maxHeight: '88%' },
  dragHandle:    { width: 40, height: 4, backgroundColor: COLORS.border, borderRadius: 2, alignSelf: 'center', marginBottom: 14 },
  closeCircle:   { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' },
  detailTitle:   { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
  detailPainBox: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 14, padding: 14, borderWidth: 1.5, marginBottom: 14 },
  detailPainNum: { fontSize: 44, fontWeight: '900', lineHeight: 50 },
  detailSection: { marginBottom: 14 },
  detailSectionTitle: { fontSize: 11, fontWeight: '800', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
});

export default SymptomLogScreen;
