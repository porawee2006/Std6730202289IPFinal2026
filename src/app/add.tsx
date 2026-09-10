import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useAuth } from './AuthContext';
import { API_BASE_URL } from '../constants/api';

export type EditableProduct = {
  id?: number | string;
  name: string;
  category?: string;
  brand?: string;
  capacity?: number;
  price?: number;
  stock: number;
  image?: string;
  location?: string;
};

export type AddProductScreenProps = {
  existingCategories?: string[];
  product?: EditableProduct | null;
  onSuccess?: () => void;
  onCancel?: () => void;
};

// ==========================================
// 🖥️ [FRONTEND] 1. หน้าฟอร์มเพิ่มสินค้า & 3. แก้ไขสินค้า (ADD / EDIT FORM - TECH THEME)
// ==========================================
export default function AddProductScreen({
  existingCategories = [],
  product = null,
  onSuccess,
  onCancel,
}: AddProductScreenProps) {
  const isEditMode = !!product;

  const [name, setName] = useState(product?.name ?? '');
  const [stock, setStock] = useState(String(product?.stock ?? 0));
  const [category, setCategory] = useState(product?.category ?? '');
  const [brand, setBrand] = useState(product?.brand ?? '');
  const [price, setPrice] = useState(String(product?.price ?? 0));
  const [capacity, setCapacity] = useState(String(product?.capacity ?? 0));
  const [image, setImage] = useState(product?.image ?? '');
  const [location, setLocation] = useState(product?.location ?? '');
  const [isLoading, setIsLoading] = useState(false);
  const { token } = useAuth();

  // 📝 ฟังก์ชันยิง API เพิ่ม/แก้ไขสินค้าไปยัง Backend
  const handleSubmit = async () => {
    if (!name) {
      Alert.alert('ข้อผิดพลาด', 'กรุณากรอกชื่อสินค้า Powerbank');
      return;
    }

    const payload = {
      name,
      stock: parseInt(stock) || 0,
      category,
      brand,
      price: parseFloat(price) || 0,
      capacity: parseInt(capacity) || 0,
      image,
      location,
    };

    try {
      setIsLoading(true);
      const url = isEditMode 
        ? `${API_BASE_URL}/products/${product.id}`
        : `${API_BASE_URL}/products`;
      
      const response = await fetch(url, {
        method: isEditMode ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'ไม่สามารถบันทึกข้อมูลสินค้าได้');
      }

      Alert.alert('สำเร็จ', isEditMode ? 'อัปเดตข้อมูลสินค้าเรียบร้อยแล้ว!' : `เพิ่มสินค้าเรียบร้อยแล้ว! ID: ${data.productId}`);
      
      if (!isEditMode) {
        setName('');
        setStock('0');
        setCategory('');
        setBrand('');
        setPrice('0');
        setCapacity('0');
        setImage('');
        setLocation('');
      }

      if (onSuccess) onSuccess();
    } catch (err: any) {
      Alert.alert('ข้อผิดพลาด', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
      {/* HEADER BAR */}
      <View style={styles.header}>
        {onCancel && (
          <TouchableOpacity onPress={onCancel} style={styles.backButton}>
            <Text style={styles.backButtonText}>← ย้อนกลับ</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.title}>{isEditMode ? '✏️ แก้ไขข้อมูล Powerbank' : '➕ เพิ่มสินค้า Powerbank ใหม่'}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* FORM CARD */}
      <View style={styles.formCard}>
        <Text style={styles.label}>ชื่อสินค้า Powerbank *</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="เช่น Anker 20000mAh Fast Charge" placeholderTextColor="#64748B" />

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>แบรนด์ (Brand)</Text>
            <TextInput style={styles.input} value={brand} onChangeText={setBrand} placeholder="เช่น Anker, Eloop" placeholderTextColor="#64748B" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>ความจุ (mAh)</Text>
            <TextInput style={styles.input} value={capacity} onChangeText={setCapacity} placeholder="เช่น 20000" placeholderTextColor="#64748B" keyboardType="numeric" />
          </View>
        </View>

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>ราคา (บาท ฿)</Text>
            <TextInput style={styles.input} value={price} onChangeText={setPrice} placeholder="เช่น 1290" placeholderTextColor="#64748B" keyboardType="numeric" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>จำนวนสต็อก (ชิ้น)</Text>
            <TextInput style={styles.input} value={stock} onChangeText={setStock} placeholder="เช่น 15" placeholderTextColor="#64748B" keyboardType="numeric" />
          </View>
        </View>

        <Text style={styles.label}>หมวดหมู่สินค้า (Category)</Text>
        <TextInput style={styles.input} value={category} onChangeText={setCategory} placeholder="เช่น Fast Charge, Wireless" placeholderTextColor="#64748B" />

        <Text style={styles.label}>URL รูปภาพสินค้า (Image URL)</Text>
        <TextInput style={styles.input} value={image} onChangeText={setImage} placeholder="https://..." placeholderTextColor="#64748B" autoCapitalize="none" />

        <Text style={styles.label}>สถานที่จัดเก็บ / คลังสินค้า</Text>
        <TextInput style={styles.input} value={location} onChangeText={setLocation} placeholder="เช่น Warehouse A" placeholderTextColor="#64748B" />

        {/* SUBMIT BUTTON */}
        <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={isLoading}>
          <Text style={styles.buttonText}>{isLoading ? 'กำลังบันทึก...' : (isEditMode ? '💾 บันทึกการแก้ไข' : '⚡ เพิ่มสินค้าลงคลัง')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// 🎨 สไตล์ธีม Cyberpunk Tech สวยงามสำหรับหน้า Add/Edit
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B'
  },
  backButton: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  backButtonText: { fontSize: 13, color: '#06B6D4', fontWeight: '700' },
  title: { fontSize: 18, fontWeight: '800', color: '#F8FAFC' },
  formCard: { 
    margin: 20,
    padding: 20,
    backgroundColor: '#1E293B',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 6,
  },
  row: { flexDirection: 'row', gap: 12 },
  label: { fontSize: 13, fontWeight: '700', color: '#CBD5E1', marginBottom: 6, marginTop: 12 },
  input: { 
    backgroundColor: '#0F172A',
    borderWidth: 1, 
    borderColor: '#334155', 
    borderRadius: 12, 
    padding: 14, 
    fontSize: 14, 
    color: '#F8FAFC',
  },
  button: { 
    backgroundColor: '#06B6D4', 
    padding: 16, 
    borderRadius: 12, 
    alignItems: 'center', 
    marginTop: 24 
  },
  buttonText: { color: '#0F172A', fontSize: 16, fontWeight: '900' },
});
