// ==============================================================================
// 🌐 API Configuration - HR Manager & Salary Analytics System
// ==============================================================================

import { Platform } from 'react-native';

// 💡 IP เครื่องปัจจุบันของคุณในเครือข่ายคือ: 10.64.189.206
// - หากรันบน Web Browser หรือ Node ในเครื่องเดียวกัน: ใช้ 'http://localhost:3028/api'
// - หากรันบน Android Emulator: ใช้ 'http://10.0.2.2:3028/api'
// - หากรันบนมือถือจริงผ่าน Expo Go ให้เปลี่ยนเป็น IP เครื่องคอมฯ เช่น: 'http://10.64.189.206:3028/api'

const LOCAL_IP = '10.64.189.206'; // IP ของเครื่องคอมพิวเตอร์นี้

export const API_BASE_URL =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:3028/api'
    : 'http://localhost:3028/api';

// หากต้องการบังคับใช้ IP เครื่องทุกแพลตฟอร์ม (เช่น สำหรับ Expo Go บนโทรศัพท์มือถือ) ให้สลับมาใช้บรรทัดนี้:
// export const API_BASE_URL = `http://${LOCAL_IP}:3028/api`;
