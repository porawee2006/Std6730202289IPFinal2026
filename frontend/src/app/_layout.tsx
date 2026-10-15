// ===================================================
// 🧭 ไฟล์โครงสร้างหลักและการนำทางของแอป (_layout.tsx)
// ===================================================
// ไฟล์นี้เปรียบเสมือนประตูหน้าบ้าน ทำหน้าที่คอยดูว่าผู้ใช้ล็อกอินหรือยัง?
// ถ้ายังไม่ล็อกอิน จะพาไปหน้า Login / Register ทันที!
// ถ้าล็อกอินแล้ว จะพาเข้าไปหน้าหลัก (index) ให้อัตโนมัติครับ 😊

import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from './AuthContext';

// ป้องกันไม่ให้หน้าโลโก้ (Splash Screen) ปิดตัวลงก่อนที่เราจะเช็คสิทธิ์ผู้ใช้เสร็จ
SplashScreen.preventAutoHideAsync();

// ส่วนจัดการเปลี่ยนหน้าตามสถานะการล็อกอิน
function RootLayoutNav() {
  const { user, isLoading } = useAuth(); // ดึงข้อมูลผู้ใช้ที่ล็อกอินอยู่
  const segments = useSegments();        // ดูว่าตอนนี้ผู้ใช้กำลังเปิดหน้าไหนอยู่
  const router = useRouter();            // ตัวช่วยในการสั่งเปลี่ยนหน้า

  useEffect(() => {
    // ถ้ากำลังโหลดข้อมูลล็อกอินอยู่ ให้รอแป๊บนึงนะ
    if (isLoading) return;

    // เช็คว่าตอนนี้อยู่ในหน้า Login หรือ Register หรือเปล่า?
    const inAuthGroup = segments[0] === 'login' || segments[0] === 'register';

    if (!user && !inAuthGroup) {
      // 🔒 ถ้ายังไม่ได้ล็อกอิน แล้วจะแอบเข้าหน้าหลัก -> เด้งกลับไปหน้า Login!
      router.replace('/login');
      SplashScreen.hideAsync();
    } else if (user && inAuthGroup) {
      // ✅ ถ้าล็อกอินแล้ว แต่เผลอเปิดหน้า Login -> เด้งพาไปหน้าหลักทันที!
      router.replace('/');
      SplashScreen.hideAsync();
    } else {
      // 🚀 สถานะปกติ ปิดหน้า Splash Screen ได้เลย
      SplashScreen.hideAsync();
    }
  }, [user, isLoading, segments]);

  // กำหนดรายชื่อหน้าจอทั้งหมดในแอป (Stack Navigation)
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}

// ส่วนห่อหุ้มแอปทั้งหมดด้วย AuthProvider เพื่อให้ทุกหน้าเรียกใช้ข้อมูลล็อกอินได้
export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
