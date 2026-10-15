// ==============================================================================
// 🔐 Login Screen - HR Manager & Salary Analytics System
// Final Exam: Internet Programming (2026)
// ==============================================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from './AuthContext';
import { API_BASE_URL } from '../constants/api';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const { login } = useAuth();

  // 1-Click Auto Fill for test convenience
  const handleQuickFill = () => {
    setUsername('admin');
    setPassword('password123');
  };

  // 🚀 Phase 1.2: Login Handler
  // Form accepting username and password. Display alert if login fails.
  // If successful, navigate to the Dashboard screen.
  const handleLogin = async () => {
    if (!username.trim() || !password) {
      Alert.alert('ข้อผิดพลาด', 'กรุณากรอก Username และ Password ให้ครบถ้วน');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const userData = data.user || {
          id: '1',
          username: username.trim(),
          role: 'admin',
          name: 'HR Administrator',
        };
        await login(userData, data.token || 'mock-jwt-token');
        router.replace('/');
      } else {
        Alert.alert(
          'เข้าสู่ระบบไม่สำเร็จ',
          data.error || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง (สิทธิ์ผู้ดูแล: admin / password123)'
        );
      }
    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert(
        'การเชื่อมต่อขัดข้อง',
        `ไม่สามารถเชื่อมต่อไปยังเซิร์ฟเวอร์ได้ที่:\n${API_BASE_URL}\n\nกรุณาตรวจสอบว่า Backend Server รันอยู่ (node server.js)`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header Brand */}
          <View style={styles.brandContainer}>
            <View style={styles.iconCircle}>
              <Text style={styles.brandIcon}>📊</Text>
            </View>
            <Text style={styles.brandTitle}>HR MANAGER</Text>
            <Text style={styles.brandSubtitle}>Salary Analytics & Clustering System</Text>
            <View style={styles.examBadge}>
              <Text style={styles.examBadgeText}>FINAL EXAM 2026 • STD6730202289</Text>
            </View>
          </View>

          {/* Login Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>เข้าสู่ระบบ (Sign In)</Text>
            <Text style={styles.cardSubtitle}>
              กรุณาเข้าสู่ระบบเพื่อจัดการข้อมูลพนักงานและการวิเคราะห์เงินเดือน
            </Text>

            <View style={styles.form}>
              {/* Username Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>ชื่อผู้ใช้ (Username)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="เช่น admin"
                  placeholderTextColor="#64748B"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Password Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>รหัสผ่าน (Password)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="เช่น password123"
                  placeholderTextColor="#64748B"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

              {/* Quick Fill Button */}
              <TouchableOpacity style={styles.quickFillBtn} onPress={handleQuickFill}>
                <Text style={styles.quickFillText}>⚡ กดเพื่อกรอกข้อมูลทดสอบ (admin / password123)</Text>
              </TouchableOpacity>

              {/* Login Button */}
              <TouchableOpacity
                style={[styles.loginBtn, isLoading && styles.loginBtnDisabled]}
                onPress={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.loginBtnText}>เข้าสู่ระบบ (Sign In) 🚀</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer Info */}
          <View style={styles.footerInfo}>
            <Text style={styles.apiEndpointText}>API Server: {API_BASE_URL}</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#1E293B',
    borderWidth: 2,
    borderColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  brandIcon: {
    fontSize: 34,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: 2,
  },
  brandSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 4,
  },
  examBadge: {
    marginTop: 10,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  examBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#60A5FA',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 20,
    lineHeight: 18,
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#F8FAFC',
  },
  quickFillBtn: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginVertical: 4,
  },
  quickFillText: {
    color: '#60A5FA',
    fontSize: 12,
    fontWeight: '700',
  },
  loginBtn: {
    backgroundColor: '#3B82F6',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 6,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginBtnDisabled: {
    backgroundColor: '#475569',
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  footerInfo: {
    alignItems: 'center',
    marginTop: 24,
  },
  apiEndpointText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '500',
  },
});
