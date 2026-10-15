// ===================================================
// 🔐 ไฟล์จัดการสถานะการล็อกอินส่วนกลาง (AuthContext.tsx)
// ===================================================
// ไฟล์นี้เปรียบเหมือน "สมุดจดความจำส่วนกลาง" ของแอป
// คอยจำว่า ตอนนี้ใครล็อกอินอยู่? เป็น Admin หรือ Customer?
// และทำการเซฟข้อมูลรหัสผ่าน Token ลงเครื่อง เพื่อให้ปิดแอปเปิดใหม่ก็ยังไม่ต้องล็อกอินซ้ำครับ!

import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// รูปแบบข้อมูลผู้ใช้งานที่ล็อกอินเข้ามา
export type User = {
  id: number | string;
  username: string;
  role: 'admin' | 'user' | string;
  name?: string;
};

// รูปแบบการทำงานใน Context
type AuthContextType = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (userData: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
};

// สร้างตัว Context สำหรับแจกจ่ายข้อมูลให้หน้าอื่นใช้งาน
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // เมื่อเปิดแอปขึ้นมา ให้ดึงข้อมูลที่เคียบันทึกไว้ในเครื่องขึ้นมาตรวจทันที
  useEffect(() => {
    loadStoredData();
  }, []);

  // ฟังก์ชันอ่านข้อมูลจาก AsyncStorage (ความจำในเครื่อง)
  const loadStoredData = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('userToken');
      const storedUser = await AsyncStorage.getItem('userData');
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error('Failed to load auth data', e);
    } finally {
      setIsLoading(false);
    }
  };

  // 🚪 ฟังก์ชันบันทึกการ Login (เซฟลงเครื่องและเปลี่ยนสถานะเป็นล็อกอินสำเร็จ)
  const login = async (userData: User, newToken: string) => {
    try {
      await AsyncStorage.setItem('userToken', newToken);
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      setToken(newToken);
      setUser(userData);
    } catch (e) {
      console.error('Failed to save auth data', e);
    }
  };

  // 🚪 ฟังก์ชัน Logout (ลบข้อมูลออกจากเครื่องและลบสถานะการล็อกอิน)
  const logout = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
      setToken(null);
      setUser(null);
    } catch (e) {
      console.error('Failed to remove auth data', e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// 💡 Hook สำหรับเรียกใช้งานง่ายๆ ในหน้าอื่น เช่น const { user, logout } = useAuth();
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
