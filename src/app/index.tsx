import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import {
  Dimensions,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AddProductScreen from './add';
import EditProductScreen from './edit';
import DashboardScreen from './dashboard';
import { useAuth } from './AuthContext';

const { width } = Dimensions.get('window');

// ⚡ รูปแบบข้อมูลสินค้า Powerbank
type Product = {
  id: number;
  name: string;
  brand: string;
  capacity: number;
  price: number;
  stock: number;
  image: string;
};

const API_BASE_URL = 'http://119.59.102.161:3028/api';
const PRODUCTS_URL = `${API_BASE_URL}/products`;

// ===================================================
// 🖥️ [FRONTEND] หน้าหลักแสดงสินค้า POWERBANK (INDEX SCREEN)
// ===================================================
export default function ProductsScreen() {
  const [activeTab, setActiveTab] = useState('Products');
  const [searchQuery, setSearchQuery] = useState('');
  
  // 🖥️ [FRONTEND] 6. ตัวแปรสำหรับระบบ Filter (Min/Max Price) & Sorting
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortOption, setSortOption] = useState<'newest' | 'price_asc' | 'price_desc'>('newest');
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // ดึงข้อมูลผู้ใช้สิทธิ์ Admin / Customer จาก AuthContext
  const { user, token, logout } = useAuth();

  // ---------------------------------------------------
  // 🖥️ [FRONTEND] 4. ค้นหา (SEARCH) & 6. กรองราคา (FILTER) & เรียงลำดับ (SORT)
  // ---------------------------------------------------
  async function loadProducts() {
    try {
      setIsLoading(true);
      setErrorMsg('');

      // สร้าง Query Parameters ส่งไปหา Backend
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (minPrice) params.append('minPrice', minPrice);
      if (maxPrice) params.append('maxPrice', maxPrice);
      if (sortOption) params.append('sort', sortOption);

      const url = `${PRODUCTS_URL}?${params.toString()}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setProducts(data);
    } catch (error: any) {
      console.error("Error fetching products:", error);
      setErrorMsg(error.message || "Failed to load");
    } finally {
      setIsLoading(false);
    }
  }

  // เรียกโหลดข้อมูลเมื่อมีการเปลี่ยนคำค้นหา ราคา หรือตัวเลือกการเรียงลำดับ (Debounce 300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      loadProducts();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, minPrice, maxPrice, sortOption, token]);

  // ---------------------------------------------------
  // 🖥️ [FRONTEND] 2. ฟังก์ชันส่งคำสั่งลบสินค้า (DELETE PRODUCT)
  // ---------------------------------------------------
  const handleDelete = (productId: number) => {
    const doDelete = async () => {
      try {
        const response = await fetch(`${PRODUCTS_URL}/${productId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          if (Platform.OS !== 'web') Alert.alert('สำเร็จ', 'ลบสินค้าเรียบร้อยแล้ว');
          else alert('ลบสินค้าเรียบร้อยแล้ว');
          loadProducts();
        } else {
          const data = await response.json();
          if (Platform.OS !== 'web') Alert.alert('ข้อผิดพลาด', data.error || 'ไม่สามารถลบสินค้าได้');
          else alert(data.error || 'ไม่สามารถลบสินค้าได้');
        }
      } catch (error) {
        console.error('Delete error', error);
        if (Platform.OS !== 'web') Alert.alert('ข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
        else alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบสินค้านี้?')) {
        doDelete();
      }
    } else {
      Alert.alert(
        'ยืนยันการลบสินค้า',
        'คุณแน่ใจหรือไม่ว่าต้องการลบสินค้านี้?',
        [
          { text: 'ยกเลิก', style: 'cancel' },
          { text: 'ลบสินค้า', style: 'destructive', onPress: doDelete }
        ]
      );
    }
  };

  // ล้างการกรองราคา
  const handleResetFilter = () => {
    setMinPrice('');
    setMaxPrice('');
    setSortOption('newest');
    setSearchQuery('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* สลับสลับหน้าจอ (Add/Edit/Dashboard vs Product List) */}
      {activeTab === 'Dashboard' ? (
        <DashboardScreen onBack={() => setActiveTab('Products')} />
      ) : activeTab === 'Add' ? (
        <AddProductScreen 
          onSuccess={() => { setActiveTab('Products'); loadProducts(); }} 
          onCancel={() => setActiveTab('Products')} 
        />
      ) : activeTab === 'Edit' && editingProduct ? (
        <EditProductScreen 
          product={editingProduct as any} 
          onSuccess={() => { setActiveTab('Products'); loadProducts(); setEditingProduct(null); }} 
          onCancel={() => { setActiveTab('Products'); setEditingProduct(null); }} 
        />
      ) : (
        <>
          {/* ⚡ HEADER: แถบหัวข้อบนสุด */}
          <View style={styles.header}>
            <View style={styles.brandTitleContainer}>
              <Text style={styles.brandLogoIcon}>⚡</Text>
              <View>
                <Text style={styles.headerTitle}>POWERVAULT</Text>
                <Text style={styles.headerSubtitle}>
                  {user?.role === 'admin' ? '👑 Mode: ADMIN' : '👤 Mode: CUSTOMER'}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {/* 📊 ปุ่มเปิด Dashboard */}
              <TouchableOpacity
                style={{
                  backgroundColor: '#3B82F6',
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
                onPress={() => setActiveTab('Dashboard')}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 }}>📊 Dashboard</Text>
              </TouchableOpacity>

              {/* 🚪 ปุ่ม Logout */}
              <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                <Text style={styles.logoutIconText}>🚪</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 🖥️ [FRONTEND] 4. SEARCH BAR & 6. FILTER & SORT CONTROLS */}
          <View style={styles.actionContainer}>
            {/* ช่องค้นหา */}
            <View style={styles.searchBar}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="ค้นหา Powerbank หรือแบรนด์..."
                placeholderTextColor="#64748B"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery !== '' && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Text style={{ color: '#94A3B8', fontSize: 16 }}>✖</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* แถบปุ่มควบคุม Filter & Sort */}
            <View style={styles.controlRow}>
              {/* ปุ่มเปิดแผงกรองราคา */}
              <TouchableOpacity 
                style={[styles.filterToggleButton, showFilterPanel && styles.filterToggleButtonActive]} 
                onPress={() => setShowFilterPanel(!showFilterPanel)}
              >
                <Text style={styles.filterToggleText}>⚙️ ตัวกรอง & เรียงราคา</Text>
                <Text style={styles.filterToggleArrow}>{showFilterPanel ? '▲' : '▼'}</Text>
              </TouchableOpacity>

              {/* 🖥️ [FRONTEND] 1. ปุ่มเพิ่มสินค้า (แสดงเฉพาะ ADMIN) */}
              {user?.role === 'admin' && (
                <TouchableOpacity style={styles.primaryAddButton} onPress={() => setActiveTab('Add')}>
                  <Text style={styles.primaryAddButtonText}>+ เพิ่มสินค้า</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* 🖥️ [FRONTEND] 6. แผงควบคุม FILTER ราคา Min/Max และ SORTING */}
            {showFilterPanel && (
              <View style={styles.filterPanel}>
                <Text style={styles.filterPanelTitle}>💰 กรองตามราคา (Min - Max)</Text>
                <View style={styles.priceInputRow}>
                  <TextInput
                    style={styles.priceInput}
                    placeholder="ราคาสุดมิน (Min)"
                    placeholderTextColor="#64748B"
                    keyboardType="numeric"
                    value={minPrice}
                    onChangeText={setMinPrice}
                  />
                  <Text style={{ color: '#94A3B8', fontWeight: 'bold' }}>-</Text>
                  <TextInput
                    style={styles.priceInput}
                    placeholder="ราคาสูงสุด (Max)"
                    placeholderTextColor="#64748B"
                    keyboardType="numeric"
                    value={maxPrice}
                    onChangeText={setMaxPrice}
                  />
                </View>

                <Text style={[styles.filterPanelTitle, { marginTop: 12 }]}>📊 เรียงลำดับราคา</Text>
                <View style={styles.sortChipsRow}>
                  <TouchableOpacity
                    style={[styles.sortChip, sortOption === 'newest' && styles.sortChipActive]}
                    onPress={() => setSortOption('newest')}
                  >
                    <Text style={[styles.sortChipText, sortOption === 'newest' && styles.sortChipTextActive]}>🆕 ล่าสุด</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.sortChip, sortOption === 'price_asc' && styles.sortChipActive]}
                    onPress={() => setSortOption('price_asc')}
                  >
                    <Text style={[styles.sortChipText, sortOption === 'price_asc' && styles.sortChipTextActive]}>⬇️ ราคาน้อย ➔ มาก</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.sortChip, sortOption === 'price_desc' && styles.sortChipActive]}
                    onPress={() => setSortOption('price_desc')}
                  >
                    <Text style={[styles.sortChipText, sortOption === 'price_desc' && styles.sortChipTextActive]}>⬆️ ราคามาก ➔ น้อย</Text>
                  </TouchableOpacity>
                </View>

                {/* ปุ่มรีเซ็ตตัวกรอง */}
                <TouchableOpacity style={styles.resetFilterButton} onPress={handleResetFilter}>
                  <Text style={styles.resetFilterText}>🔄 ล้างตัวกรองทั้งหมด</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* 🛒 PRODUCT GRID / LIST: แสดงรายการ Powerbank */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {isLoading && (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>⚡ กำลังโหลดข้อมูล Powerbank...</Text>
              </View>
            )}

            {errorMsg ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>❌ เกิดข้อผิดพลาด: {errorMsg}</Text>
              </View>
            ) : null}

            {!isLoading && !errorMsg && products.length === 0 && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>🔋</Text>
                <Text style={styles.emptyText}>ไม่พบสินค้า Powerbank ที่ค้นหา</Text>
                <TouchableOpacity style={styles.resetFilterButtonInline} onPress={handleResetFilter}>
                  <Text style={styles.resetFilterText}>ล้างการค้นหา</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.productList}>
              {products.map((product) => (
                <View key={product.id} style={styles.productCard}>
                  {/* รูปสินค้า Powerbank */}
                  <View style={styles.productImageContainer}>
                    <Image
                      source={{ uri: product.image || 'https://via.placeholder.com/150' }}
                      style={styles.productImage}
                      contentFit="cover"
                      transition={300}
                    />
                    {/* Badge ความจุ mAh */}
                    <View style={styles.capacityBadge}>
                      <Text style={styles.capacityBadgeText}>
                        ⚡ {product.capacity ? `${product.capacity.toLocaleString()} mAh` : 'Standard'}
                      </Text>
                    </View>
                  </View>

                  {/* ข้อมูลสินค้า */}
                  <View style={styles.productInfo}>
                    <Text style={styles.productBrand}>{product.brand || 'POWERBANK'}</Text>
                    <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
                    
                    <View style={styles.priceRow}>
                      <Text style={styles.productPrice}>
                        ฿{product.price ? Number(product.price).toLocaleString() : '0'}
                      </Text>

                      {/* Badge สถานะสต็อก */}
                      <View style={[styles.stockBadge, product.stock < 5 ? styles.stockLow : styles.stockNormal]}>
                        <Text style={[styles.stockText, product.stock < 5 ? styles.stockTextLow : styles.stockTextNormal]}>
                          {product.stock > 0 ? `เหลือ ${product.stock} ชิ้น` : 'สินค้าหมด'}
                        </Text>
                      </View>
                    </View>

                    {/* 🖥️ [FRONTEND] 3. ปุ่ม EDIT & 2. ปุ่ม DELETE (แสดงเฉพาะ ADMIN) */}
                    {user?.role === 'admin' && (
                      <View style={styles.adminActionRow}>
                        <TouchableOpacity 
                          onPress={() => { setEditingProduct(product); setActiveTab('Edit'); }} 
                          style={styles.editButton}
                        >
                          <Text style={styles.editButtonText}>✏️ แก้ไข</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                          onPress={() => handleDelete(product.id)} 
                          style={styles.deleteButton}
                        >
                          <Text style={styles.deleteButtonText}>🗑️ ลบสินค้า</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        </>
      )}

      {/* 🧭 BOTTOM NAVIGATION BAR */}
      <View style={styles.bottomNavContainer}>
        <View style={styles.bottomNav}>
          {[
            { id: 'Products', label: 'สินค้าทั้งหมด', icon: '🔋' },
            { id: 'Add', label: 'เพิ่มสินค้า', icon: '➕' },
          ].map((tab) => {
            if (tab.id === 'Add' && user?.role !== 'admin') return null;
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.navItem, isActive && styles.navItemActive]}
                onPress={() => setActiveTab(tab.id)}
              >
                <Text style={styles.navIcon}>{tab.icon}</Text>
                <Text style={[styles.navText, isActive && styles.navTextActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

// 🎨 สไตล์ธีม Cyberpunk Tech สวยงามสำหรับร้าน Powerbank
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A', // สีโทนเข้มดีไซน์เทคโนโลยี (Dark Slate)
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  brandTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandLogoIcon: {
    fontSize: 28,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#06B6D4', // ฟ้า Electric Cyan
    letterSpacing: 1.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  logoutButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  logoutIconText: {
    fontSize: 20,
  },
  actionContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 50,
    borderWidth: 1,
    borderColor: '#334155',
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#F8FAFC',
    fontWeight: '500',
  },
  controlRow: {
    flexDirection: 'row',
    gap: 10,
  },
  filterToggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B',
    paddingHorizontal: 16,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  filterToggleButtonActive: {
    borderColor: '#06B6D4',
    backgroundColor: '#0F2B48',
  },
  filterToggleText: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '600',
  },
  filterToggleArrow: {
    color: '#06B6D4',
    fontSize: 12,
  },
  primaryAddButton: {
    backgroundColor: '#06B6D4',
    paddingHorizontal: 16,
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryAddButtonText: {
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 14,
  },
  filterPanel: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  filterPanelTitle: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  priceInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  priceInput: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    color: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#334155',
    fontSize: 13,
  },
  sortChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
  },
  sortChipActive: {
    backgroundColor: '#06B6D4',
    borderColor: '#06B6D4',
  },
  sortChipText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  sortChipTextActive: {
    color: '#0F172A',
    fontWeight: '700',
  },
  resetFilterButton: {
    marginTop: 14,
    alignItems: 'center',
    paddingVertical: 8,
  },
  resetFilterButtonInline: {
    marginTop: 12,
    backgroundColor: '#06B6D4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  resetFilterText: {
    color: '#06B6D4',
    fontSize: 13,
    fontWeight: '700',
  },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 100 },
  productList: { gap: 16, marginTop: 8 },
  productCard: {
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
    flexDirection: 'row',
    gap: 14,
  },
  productImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#0F172A',
    overflow: 'hidden',
    position: 'relative',
  },
  productImage: { width: '100%', height: '100%' },
  capacityBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    right: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 6,
    paddingVertical: 2,
    alignItems: 'center',
  },
  capacityBadgeText: { color: '#06B6D4', fontSize: 10, fontWeight: '700' },
  productInfo: { flex: 1, justifyContent: 'space-between' },
  productBrand: { color: '#06B6D4', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  productName: { color: '#F8FAFC', fontSize: 15, fontWeight: '700', marginTop: 2 },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  productPrice: { color: '#38BDF8', fontSize: 18, fontWeight: '800' },
  stockBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  stockNormal: { backgroundColor: 'rgba(16, 185, 129, 0.15)' },
  stockLow: { backgroundColor: 'rgba(239, 68, 68, 0.15)' },
  stockText: { fontSize: 11, fontWeight: '700' },
  stockTextNormal: { color: '#34D399' },
  stockTextLow: { color: '#F87171' },
  adminActionRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  editButton: {
    flex: 1,
    backgroundColor: '#334155',
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: { color: '#F8FAFC', fontSize: 12, fontWeight: '700' },
  deleteButton: {
    flex: 1,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  deleteButtonText: { color: '#F87171', fontSize: 12, fontWeight: '700' },
  loadingContainer: { padding: 40, alignItems: 'center' },
  loadingText: { color: '#06B6D4', fontSize: 15, fontWeight: '600' },
  errorContainer: { padding: 20, alignItems: 'center' },
  errorText: { color: '#F87171', fontSize: 14 },
  emptyContainer: { padding: 40, alignItems: 'center' },
  emptyIcon: { fontSize: 40, marginBottom: 10 },
  emptyText: { color: '#94A3B8', fontSize: 15 },
  bottomNavContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    width: '100%',
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: '#334155',
    elevation: 8,
  },
  navItem: { alignItems: 'center', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 16 },
  navItemActive: { backgroundColor: '#0F2B48' },
  navIcon: { fontSize: 18, marginBottom: 2 },
  navText: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
  navTextActive: { color: '#06B6D4', fontWeight: '700' },
});
