// ==============================================================================
// ➕ Add Employee Screen - HR Manager System
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
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_BASE_URL } from '../constants/api';

export default function AddEmployeeScreen() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [salary, setSalary] = useState('');
  const [status, setStatus] = useState<'Active' | 'On Leave'>('Active');
  const [isLoading, setIsLoading] = useState(false);

  // Client-side Validation & API Submission
  const handleSubmit = async () => {
    // Phase 1.2: Prevent submission (Client-side validation) if fields are empty
    if (!name.trim() || !position.trim() || !salary.trim()) {
      Alert.alert(
        'กรอกข้อมูลไม่ครบถ้วน',
        'กรุณากรอกชื่อ (Name), ตำแหน่ง (Position) และเงินเดือน (Salary) ให้ครบทุกช่อง'
      );
      return;
    }

    const numSalary = Number(salary);
    if (isNaN(numSalary) || numSalary <= 0) {
      Alert.alert('ข้อมูลเงินเดือนไม่ถูกต้อง', 'กรุณากรอกเงินเดือนเป็นตัวเลขที่มากกว่า 0');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/employees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          position: position.trim(),
          salary: numSalary,
          status,
        }),
      });

      const data = await response.json();

      if (response.status === 201 || response.ok) {
        Alert.alert('สำเร็จ', `เพิ่มพนักงาน "${name.trim()}" เรียบร้อยแล้ว`, [
          { text: 'ตกลง', onPress: () => router.replace('/') },
        ]);
      } else {
        Alert.alert('เกิดข้อผิดพลาด', data.error || 'ไม่สามารถเพิ่มข้อมูลพนักงานได้');
      }
    } catch (error) {
      console.error('Add employee error:', error);
      Alert.alert('ข้อผิดพลาดการเชื่อมต่อ', 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>‹ ย้อนกลับ</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>เพิ่มพนักงานใหม่ (Add Employee)</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>ข้อมูลพนักงาน</Text>
          <Text style={styles.cardSubtitle}>
            กรอกข้อมูลรายละเอียดของพนักงานเพื่อบันทึกลงในระบบ
          </Text>

          {/* Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              ชื่อ-นามสกุล (Name) <Text style={styles.requiredStar}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="เช่น สมชาย ใจดี หรือ John Doe"
              placeholderTextColor="#64748B"
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Position */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              ตำแหน่งงาน (Position) <Text style={styles.requiredStar}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="เช่น Software Engineer, HR Manager"
              placeholderTextColor="#64748B"
              value={position}
              onChangeText={setPosition}
            />
          </View>

          {/* Salary */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              เงินเดือน (Salary) <Text style={styles.requiredStar}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="เช่น 45000"
              placeholderTextColor="#64748B"
              value={salary}
              onChangeText={setSalary}
              keyboardType="numeric"
            />
          </View>

          {/* Status */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>สถานะการทำงาน (Status)</Text>
            <View style={styles.statusRow}>
              <TouchableOpacity
                style={[styles.statusOption, status === 'Active' && styles.statusActive]}
                onPress={() => setStatus('Active')}
              >
                <Text
                  style={[
                    styles.statusOptionText,
                    status === 'Active' && styles.statusActiveText,
                  ]}
                >
                  ● Active
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.statusOption, status === 'On Leave' && styles.statusLeave]}
                onPress={() => setStatus('On Leave')}
              >
                <Text
                  style={[
                    styles.statusOptionText,
                    status === 'On Leave' && styles.statusLeaveText,
                  ]}
                >
                  ○ On Leave
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#0F172A" />
            ) : (
              <Text style={styles.submitBtnText}>บันทึกข้อมูลพนักงาน 💾</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#1E293B',
  },
  backBtnText: {
    color: '#38BDF8',
    fontSize: 14,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  content: {
    padding: 20,
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: -8,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  requiredStar: {
    color: '#EF4444',
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
  statusRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statusOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
  },
  statusActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10B981',
  },
  statusLeave: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: '#F59E0B',
  },
  statusOptionText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600',
  },
  statusActiveText: {
    color: '#34D399',
    fontWeight: '700',
  },
  statusLeaveText: {
    color: '#FBBF24',
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: '#38BDF8',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnDisabled: {
    backgroundColor: '#475569',
  },
  submitBtnText: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
  },
});
