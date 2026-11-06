'use client';

import React, { useEffect, useState } from 'react';
import { 
  Flame, 
  Bell, 
  Wifi, 
  ShieldCheck, 
  AlertTriangle, 
  Siren, 
  MessageSquareShare, 
  Activity, 
  Clock, 
  Cpu,
  RefreshCw
} from 'lucide-react';

interface GasLog {
  id: string;
  device_id: string;
  location: string;
  ppm_level: number;
  status: 'AMAN' | 'WASPADA' | 'BAHAYA';
  buzzer_active: boolean;
  notification_sent: boolean;
  timestamp: string;
}

const formatTimeIndonesia = (timestamp: string) =>
  new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date(timestamp));

export default function GasGuardDashboard() {
  const [current, setCurrent] = useState<GasLog | null>(null);
  const [history, setHistory] = useState<GasLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/gas', { cache: 'no-store' });
      const data = await res.json();
      setCurrent(data.current);
      setHistory(data.history);
    } catch (err) {
      console.error('Gagal mengambil data sensor:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Polling otomatis setiap 2 detik agar saat ditembak dari Insomnia langsung berubah
    const interval = setInterval(fetchDashboardData, 2000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !current) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
          <span>Memuat Sistem Monitoring GasGuard...</span>
        </div>
      </div>
    );
  }

  // Konfigurasi warna dinamis berdasarkan status
  const statusConfig = {
    AMAN: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-700',
      badge: 'bg-emerald-500 text-white',
      icon: ShieldCheck,
      desc: 'Kadar gas normal. Lingkungan dapur aman.',
    },
    WASPADA: {
      bg: 'bg-amber-50',
      border: 'border-amber-300',
      text: 'text-amber-700',
      badge: 'bg-amber-500 text-white',
      icon: AlertTriangle,
      desc: 'Terdeteksi peningkatan gas! Periksa area sekitar tabung LPG.',
    },
    BAHAYA: {
      bg: 'bg-rose-50',
      border: 'border-rose-500',
      text: 'text-rose-600',
      badge: 'bg-rose-600 text-white animate-pulse',
      icon: Siren,
      desc: 'KEBOCORAN GAS KRITIS! Buzzer menyala & alert dikirim ke Smartphone.',
    },
  }[current.status];

  const StatusIcon = statusConfig.icon;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm backdrop-blur">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl text-orange-600">
              <Flame className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">GASGUARD</h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  IoT Smart Gas Alarm
                </span>
              </div>
              <p className="text-sm text-slate-500">
                Sistem Keselamatan Dapur Real-Time • {current.location}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-600">
              <Cpu className="w-4 h-4 text-sky-600" />
              <span>ID: <strong>{current.device_id}</strong> (ESP32 + MQ-6)</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Live Polling</span>
            </div>
          </div>
        </header>

        {/* BANNER PERINGATAN DARURAT (Hanya muncul saat status BAHAYA) */}
        {current.status === 'BAHAYA' && (
          <div className="bg-rose-50 border-2 border-rose-500 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 animate-pulse">
            <div className="flex items-center gap-4">
              <Siren className="w-10 h-10 text-rose-500 shrink-0" />
              <div>
                <h2 className="text-lg font-bold text-rose-600 uppercase tracking-wider">
                  Peringatan Bahaya Kebocoran Gas LPG!
                </h2>
                <p className="text-sm text-slate-700">
                  Kadar gas mencapai <strong>{current.ppm_level} PPM</strong>. Buzzer di lokasi telah diaktifkan dan notifikasi darurat telah dikirim ke Telegram/WhatsApp pemilik.
                </p>
              </div>
            </div>
            <span className="px-4 py-2 rounded-xl bg-rose-600 text-white font-semibold text-xs shrink-0">
              Respons &lt; 3 Detik
            </span>
          </div>
        )}

        {/* GRID KARTU UTAMA */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Kadar Gas MQ-6 */}
          <div className={`p-6 rounded-2xl border ${statusConfig.bg} ${statusConfig.border} transition-all duration-300`}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-slate-600">Kadar Gas Saat Ini (MQ-6)</span>
              <StatusIcon className={`w-6 h-6 ${statusConfig.text}`} />
            </div>
            <div className="flex items-baseline gap-3 my-2">
              <span className={`text-5xl font-extrabold tracking-tight ${statusConfig.text}`}>
                {current.ppm_level}
              </span>
              <span className="text-lg text-slate-600 font-medium">PPM</span>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${statusConfig.badge}`}>
                STATUS: {current.status}
              </span>
              <span className="text-xs text-slate-600">Batas Bahaya: 500 PPM</span>
            </div>
            <p className="mt-4 text-xs text-slate-700 border-t border-slate-200 pt-3">
              {statusConfig.desc}
            </p>
          </div>

          {/* Card 2: Status Buzzer & Aktuator Fisik */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-slate-600">Status Alarm & Buzzer Lokal</span>
                <Bell className={`w-6 h-6 ${current.buzzer_active ? 'text-rose-500 animate-bounce' : 'text-slate-400'}`} />
              </div>
              <div className="my-3">
                <div className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  {current.buzzer_active ? (
                    <span className="text-rose-600">AKTIF (BERBUNYI)</span>
                  ) : (
                    <span className="text-slate-700">STANDBY (NONAKTIF)</span>
                  )}
                </div>
                
              </div>
            </div>

            
          </div>

          {/* Card 3: Status Notifikasi Smartphone */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-slate-600">Integrasi Alert Smartphone</span>
                <MessageSquareShare className="w-6 h-6 text-sky-600" />
              </div>
              <div className="my-3">
                <div className="text-2xl font-bold">
                  {current.notification_sent ? (
                    <span className="text-amber-700">Notifikasi Terkirim!</span>
                  ) : (
                    <span className="text-slate-700">Terhubung ke Cloud API</span>
                  )}
                </div>
                
              </div>
            </div>

            <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-xs text-slate-600">
              <span className="flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5 text-emerald-600" /> WiFi OTA Ready
              </span>
              <span>Update terakhir: {formatTimeIndonesia(current.timestamp)}</span>
            </div>
          </div>
        </div>

        {/* BAGIAN BAWAH: GRAFIK REAL-TIME & TABEL LOG RIWAYAT */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          
          {/* Visualisasi Bar Chart Tren Kadar Gas */}
          <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-orange-600" />
                    Grafik Tren Kadar Gas (Real-Time)
                  </h3>
                  
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1 text-emerald-700"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"/> Aman</span>
                  <span className="flex items-center gap-1 text-amber-700"><span className="w-2.5 h-2.5 rounded-sm bg-amber-500"/> Waspada</span>
                  <span className="flex items-center gap-1 text-rose-600"><span className="w-2.5 h-2.5 rounded-sm bg-rose-500"/> Bahaya</span>
                </div>
              </div>

              {/* Area Grafik Batang (CSS Bar Chart) */}
              <div className="h-64 flex items-end gap-2 pt-6 px-2 border-b border-l border-slate-200 relative">
                {/* Garis Threshold Bahaya (500 PPM) */}
                <div className="absolute left-0 right-0 bottom-[50%] border-t border-dashed border-rose-500/50 flex justify-end pr-2">
                  <span className="text-[10px] text-rose-600 -mt-4 bg-white px-1">Threshold Bahaya (500 PPM)</span>
                </div>

                {[...history].reverse().map((item) => {
                  // Kalkulasi tinggi bar (Maks skala 1000 PPM)
                  const heightPercent = Math.min(Math.max((item.ppm_level / 1000) * 100, 5), 100);
                  const barColor =
                    item.status === 'BAHAYA'
                      ? 'bg-rose-500 hover:bg-rose-400'
                      : item.status === 'WASPADA'
                      ? 'bg-amber-500 hover:bg-amber-400'
                      : 'bg-emerald-500 hover:bg-emerald-400';

                  return (
                    <div key={item.id} className="flex-1 flex flex-col items-center gap-2 group relative h-full justify-end">
                      {/* Tooltip saat di-hover */}
                      <div className="opacity-0 group-hover:opacity-100 transition bg-slate-900 text-white text-[10px] px-2 py-1 rounded pointer-events-none whitespace-nowrap mb-1 border border-slate-700">
                        {item.ppm_level} PPM ({formatTimeIndonesia(item.timestamp)})
                      </div>
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full max-w-[32px] rounded-t-md transition-all duration-500 ${barColor}`}
                      />
                      <span className="text-[10px] text-slate-500 truncate w-full text-center">
                        {formatTimeIndonesia(item.timestamp)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between text-xs text-slate-600">
              <span>Skala Maksimal Grafik: 1000 PPM</span>
              
            </div>
          </div>

          {/* Tabel Riwayat Deteksi */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-sky-600" />
                  Riwayat Deteksi & Log Alert
                </h3>
                
              </div>
            </div>

            <div className="overflow-y-auto max-h-72 pr-1 space-y-2.5">
              {history.map((log) => {
                const badgeStyle =
                  log.status === 'BAHAYA'
                    ? 'bg-rose-50 text-rose-600 border-rose-200'
                    : log.status === 'WASPADA'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200';

                return (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{log.ppm_level} PPM</span>
                        <span className={`px-2 py-0.5 rounded-md border text-[10px] font-semibold ${badgeStyle}`}>
                          {log.status}
                        </span>
                      </div>
                      <div className="text-slate-600">
                        {log.buzzer_active ? '🔔 Buzzer Menyala • 📱 Alert Terkirim' : '✔️ Kondisi Terkendali'}
                      </div>
                    </div>
                    <div className="text-right text-slate-600">
                      <div>{formatTimeIndonesia(log.timestamp)}</div>
                      <div className="text-[10px] text-slate-500">{log.device_id}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}