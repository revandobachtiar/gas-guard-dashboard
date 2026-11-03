import { NextResponse } from 'next/server';

export interface GasLog {
  id: string;
  device_id: string;
  location: string;
  ppm_level: number;
  status: 'AMAN' | 'WASPADA' | 'BAHAYA';
  buzzer_active: boolean;
  notification_sent: boolean;
  timestamp: string;
}

// Penyimpanan sementara di memori server untuk keperluan demo/prototipe
let currentGasData: GasLog = {
  id: 'init-1',
  device_id: 'GASGUARD-01',
  location: 'Dapur Utama (UMKM Kuliner)',
  ppm_level: 140,
  status: 'AMAN',
  buzzer_active: false,
  notification_sent: false,
  timestamp: new Date().toISOString(),
};

let gasHistory: GasLog[] = [currentGasData];

// Endpoint GET: Dipanggil otomatis oleh Dashboard Web setiap 2 detik
export async function GET() {
  return NextResponse.json({
    current: currentGasData,
    history: gasHistory.slice(0, 15), // Ambil 15 riwayat terakhir
  });
}

// Endpoint POST: Dipanggil oleh Insomnia atau perangkat ESP32
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const ppm = Number(body.ppm_level) || 0;

    // Logika penentuan threshold otomatis
    let status: 'AMAN' | 'WASPADA' | 'BAHAYA' = 'AMAN';
    let buzzer_active = false;
    let notification_sent = false;

    if (ppm >= 500) {
      status = 'BAHAYA';
      buzzer_active = true;
      notification_sent = true; // Trigger kirim ke Telegram / WhatsApp API
    } else if (ppm >= 300) {
      status = 'WASPADA';
      buzzer_active = false;
      notification_sent = false;
    }

    const newLog: GasLog = {
      id: Math.random().toString(36).substring(2, 9),
      device_id: body.device_id || 'GASGUARD-01',
      location: body.location || 'Dapur Utama (UMKM Kuliner)',
      ppm_level: ppm,
      status: body.status || status,
      buzzer_active: body.buzzer_active !== undefined ? body.buzzer_active : buzzer_active,
      notification_sent: body.notification_sent !== undefined ? body.notification_sent : notification_sent,
      timestamp: body.timestamp || new Date().toISOString(),
    };

    currentGasData = newLog;
    gasHistory = [newLog, ...gasHistory].slice(0, 20);

    return NextResponse.json(
      {
        success: true,
        message: 'Data sensor MQ-6 berhasil diperbarui',
        data: newLog,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Format JSON tidak valid' },
      { status: 400 }
    );
  }
}