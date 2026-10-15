// นำเข้า React และ useState สำหรับเก็บค่าในหน้าจอ ( state )
import React, { useState } from 'react';
// นำเข้าคอมโพเนนต์พื้นฐานจาก React Native
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
// นำเข้า useRouter สำหรับสั่งย้อนกลับไปหน้า Login
import { useRouter } from 'expo-router';
// นำเข้า SafeAreaView ช่วยจัดการขอบหน้าจอ
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_BASE_URL } from '../constants/api';

// ===================================================
// 🖥️ [FRONTEND] 5. หน้า REGISTER (สมัครสมาชิก - TECH THEME)
// ===================================================
export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // 📝 ฟังก์ชันกดปุ่มสมัครสมาชิก ส่งข้อมูลไปสร้างไอดีที่ Backend
  const handleRegister = async () => {
    if (!username || !password) {
      Alert.alert('ข้อผิดพลาด', 'กรุณากรอก Username และ Password');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('สำเร็จ', 'สร้างบัญชีลูกค้าเรียบร้อยแล้ว กรุณาเข้าสู่ระบบ');
        router.back();
      } else {
        Alert.alert('สมัครสมาชิกไม่สำเร็จ', data.error || 'ไม่สามารถสร้างบัญชีได้');
      }
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* โลโก้แบรนด์ร้าน Powerbank */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoIcon}>⚡</Text>
          <Text style={styles.brandTitle}>POWERVAULT</Text>
          <Text style={styles.brandSubtitle}>Customer Registration</Text>
        </View>

        {/* ฟอร์มสมัครสมาชิก */}
        <View style={styles.card}>
          <Text style={styles.title}>สร้างบัญชีลูกค้าใหม่</Text>
          <Text style={styles.subtitle}>กรอกข้อมูลเพื่อสมัครใช้งานสำหรับซื้อสินค้า</Text>

          <View style={styles.form}>
            {/* ช่องพิมพ์ Username */}
            <Text style={styles.label}>ชื่อผู้ใช้ที่ต้องการ (Username)</Text>
            <TextInput
              style={styles.input}
              placeholder="ตั้งชื่อผู้ใช้..."
              placeholderTextColor="#64748B"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />

            {/* ช่องพิมพ์ Password */}
            <Text style={styles.label}>รหัสผ่าน (Password)</Text>
            <TextInput
              style={styles.input}
              placeholder="ตั้งรหัสผ่าน..."
              placeholderTextColor="#64748B"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            {/* ปุ่มกดสมัครสมาชิก */}
            <TouchableOpacity
              style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              <Text style={styles.registerButtonText}>
                {isLoading ? 'กำลังสร้างบัญชี...' : 'สมัครสมาชิก 🚀'}
              </Text>
            </TouchableOpacity>

            {/* ปุ่มย้อนกลับไปหน้า Login */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>มีบัญชีอยู่แล้ว? </Text>
              <TouchableOpacity onPress={() => router.back()}>
                <Text style={styles.loginLink}>กลับไปหน้าเข้าสู่ระบบ</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

// 🎨 สไตล์ธีม Cyberpunk Tech สวยงามสำหรับหน้า Register
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#10B981',
    letterSpacing: 2,
  },
  brandSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 24,
  },
  form: {
    gap: 14,
  },
  label: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#F8FAFC',
  },
  registerButton: {
    backgroundColor: '#10B981',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  registerButtonDisabled: {
    backgroundColor: '#475569',
  },
  registerButtonText: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  loginLink: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '700',
  },
});
