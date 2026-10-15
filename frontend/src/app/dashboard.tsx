// ==============================================================================
// 🧠 Salary Analytics & Clustering Dashboard Screen
// Final Exam: Internet Programming (2026) - Phase 2
// ==============================================================================

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { API_BASE_URL } from '../constants/api';

export type SalaryCluster = {
  group: string;
  centroid: number;
  count: number;
  minSalary?: number;
  maxSalary?: number;
};

export default function AnalyticsDashboardScreen() {
  const router = useRouter();
  const [clusters, setClusters] = useState<SalaryCluster[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [totalEmployees, setTotalEmployees] = useState<number>(0);

  const fetchClusters = async () => {
    setIsLoading(true);
    try {
      // Fetch clusters
      const res = await fetch(`${API_BASE_URL}/employees/salary-clusters`);
      const data = await res.json();

      // Fetch all employees to count total
      const empRes = await fetch(`${API_BASE_URL}/employees`);
      const empData = await empRes.json();

      if (res.ok && data.success) {
        setClusters(data.clusters);
        setTotalEmployees(Array.isArray(empData) ? empData.length : 0);
      } else {
        Alert.alert('เกิดข้อผิดพลาด', data.error || 'ไม่สามารถวิเคราะห์ข้อมูลเงินเดือนได้');
      }
    } catch (err) {
      console.error('Analytics error:', err);
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClusters();
  }, []);

  const formatSalary = (val: number) => {
    return '฿' + (val || 0).toLocaleString('th-TH');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/')}>
          <Text style={styles.backBtnText}>‹ กลับหน้าหลัก</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Salary Analytics (K-Means)</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchClusters}>
          <Text style={styles.refreshBtnText}>🔄</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroBox}>
          <Text style={styles.heroTitle}>🧠 K-Means Salary Clustering (k=3)</Text>
          <Text style={styles.heroSubtitle}>
            การจัดกลุ่มฐานเงินเดือนของพนักงานในองค์กรเป็น 3 ระดับ (Tier 1, Tier 2, Tier 3)
            ด้วย Machine Learning อัลกอริทึม
          </Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#38BDF8" />
            <Text style={styles.loadingText}>กำลังคำนวณ 1D K-Means Clustering...</Text>
          </View>
        ) : (
          <View style={styles.clustersList}>
            {clusters.map((cluster, idx) => {
              const theme = [
                {
                  border: '#059669',
                  color: '#34D399',
                  title: 'Tier 1 - ระดับเริ่มต้น (Junior / Entry)',
                  icon: '🌱',
                },
                {
                  border: '#D97706',
                  color: '#FBBF24',
                  title: 'Tier 2 - ระดับกลาง (Mid-Level)',
                  icon: '⭐',
                },
                {
                  border: '#7C3AED',
                  color: '#A78BFA',
                  title: 'Tier 3 - ระดับสูง (Senior / Executive)',
                  icon: '👑',
                },
              ][idx] || {
                border: '#3B82F6',
                color: '#60A5FA',
                title: cluster.group,
                icon: '💼',
              };

              const percentage =
                totalEmployees > 0
                  ? Math.round((cluster.count / totalEmployees) * 100)
                  : 0;

              return (
                <View
                  key={cluster.group}
                  style={[styles.clusterCard, { borderColor: theme.border }]}
                >
                  <View style={styles.clusterCardHeader}>
                    <Text style={styles.clusterIcon}>{theme.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.clusterGroup, { color: theme.color }]}>
                        {cluster.group}
                      </Text>
                      <Text style={styles.clusterTitle}>{theme.title}</Text>
                    </View>
                    <View style={styles.countBadge}>
                      <Text style={styles.countText}>{cluster.count} คน</Text>
                      <Text style={styles.percentText}>{percentage}%</Text>
                    </View>
                  </View>

                  <View style={styles.centroidCard}>
                    <Text style={styles.centroidLabel}>เงินเดือนเฉลี่ย (Centroid):</Text>
                    <Text style={[styles.centroidValue, { color: theme.color }]}>
                      {formatSalary(cluster.centroid)}
                    </Text>
                  </View>

                  {cluster.minSalary !== undefined && cluster.maxSalary !== undefined && (
                    <View style={styles.rangeRow}>
                      <Text style={styles.rangeLabel}>ช่วงเงินเดือน (Min - Max):</Text>
                      <Text style={styles.rangeValue}>
                        {formatSalary(cluster.minSalary)} - {formatSalary(cluster.maxSalary)}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
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
  refreshBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#1E293B',
  },
  refreshBtnText: {
    fontSize: 14,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  heroBox: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  heroSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
    lineHeight: 18,
  },
  loadingBox: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  clustersList: {
    gap: 14,
  },
  clusterCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    gap: 12,
  },
  clusterCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clusterIcon: {
    fontSize: 24,
  },
  clusterGroup: {
    fontSize: 18,
    fontWeight: '900',
  },
  clusterTitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  countBadge: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'flex-end',
  },
  countText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  percentText: {
    fontSize: 10,
    color: '#94A3B8',
  },
  centroidCard: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: 12,
  },
  centroidLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 4,
  },
  centroidValue: {
    fontSize: 22,
    fontWeight: '900',
  },
  rangeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rangeLabel: {
    fontSize: 11,
    color: '#94A3B8',
  },
  rangeValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#CBD5E1',
  },
});
