import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from './AuthContext';

const { width } = Dimensions.get('window');

type ClusterSummary = {
  cluster: number;
  name: string;
  priceRange: string;
  avgPrice: number;
  avgSales: number;
  count: number;
  profile: string;
  salesBehavior: string;
  color: string;
};

type ClusteredProduct = {
  id: number;
  name: string;
  brand: string;
  capacity: number;
  price: number;
  stock: number;
  unitsSold: number;
  image: string;
  cluster: number;
  clusterName: string;
  salesBehavior: string;
  color: string;
};

type ElbowData = {
  k: number;
  inertia: number;
};

type AnalyticsData = {
  totalProducts: number;
  k: number;
  clusterSummaries: ClusterSummary[];
  clusteredProducts: ClusteredProduct[];
  elbowData: ElbowData[];
};

const API_BASE_URL = 'http://119.59.102.161:3028/api';

export default function DashboardScreen({ onBack }: { onBack?: () => void }) {
  const { token } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  // State สำหรับสลับมุมมองระหว่าง Graph View (📊) และ Table View (📋) ตามสไลด์
  const [viewMode, setViewMode] = useState<'graph' | 'table'>('graph');
  const [selectedClusterFilter, setSelectedClusterFilter] = useState<number | null>(null);

  const fetchKMeansData = async () => {
    try {
      setIsLoading(true);
      setErrorMsg('');
      const response = await fetch(`${API_BASE_URL}/analytics/kmeans?k=3`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP Error! status: ${response.status}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err: any) {
      console.error('Fetch Dashboard Error:', err);
      setErrorMsg(err.message || 'ไม่สามารถโหลดข้อมูล Dashboard ได้');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKMeansData();
  }, [token]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>กำลังคำนวณและวิเคราะห์ K-Means Clustering...</Text>
      </View>
    );
  }

  if (errorMsg || !data) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>⚠️ {errorMsg || 'ไม่พบข้อมูล'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchKMeansData}>
          <Text style={styles.retryButtonText}>🔄 ลองใหม่อีกครั้ง</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const totalValue = data.clusteredProducts.reduce((sum, p) => sum + (p.price * (p.stock || p.unitsSold)), 0);
  const avgPriceOverall = data.totalProducts > 0
    ? Math.round(data.clusteredProducts.reduce((sum, p) => sum + p.price, 0) / data.totalProducts)
    : 0;

  const maxPrice = Math.max(...data.clusteredProducts.map(p => p.price), 850);
  const maxSales = Math.max(...data.clusteredProducts.map(p => p.unitsSold), 140);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 50 }}>
      {/* 🧭 HEADER NAVIGATION */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>← กลับหน้าสินค้า</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>📊 AI/ML K-Means Clustering Results</Text>
        <Text style={styles.headerSubtitle}>
          วิเคราะห์ความสัมพันธ์ระหว่างราคาและยอดขายสินค้า Powerbank (ข้อมูลภายในระบบ)
        </Text>
      </View>

      {/* 📈 KPI OVERVIEW CARDS */}
      <View style={styles.kpiContainer}>
        <View style={[styles.kpiCard, { borderLeftColor: '#3B82F6' }]}>
          <Text style={styles.kpiLabel}>สินค้าทั้งหมด</Text>
          <Text style={styles.kpiValue}>{data.totalProducts} รายการ</Text>
        </View>

        <View style={[styles.kpiCard, { borderLeftColor: '#10B981' }]}>
          <Text style={styles.kpiLabel}>มูลค่าสต็อกรวม</Text>
          <Text style={styles.kpiValue}>฿{totalValue.toLocaleString()}</Text>
        </View>

        <View style={[styles.kpiCard, { borderLeftColor: '#F59E0B' }]}>
          <Text style={styles.kpiLabel}>ราคาเฉลี่ยต่อหน่วย</Text>
          <Text style={styles.kpiValue}>฿{avgPriceOverall.toLocaleString()}</Text>
        </View>

        <View style={[styles.kpiCard, { borderLeftColor: '#8B5CF6' }]}>
          <Text style={styles.kpiLabel}>การจำแนกกลุ่ม (Clusters)</Text>
          <Text style={styles.kpiValue}>k = {data.k}</Text>
        </View>
      </View>

      {/* 💡 BEHAVIOR HIGHLIGHT BANNER: แสดงแนวโน้ม ราคาถูก-ซื้อเยอะ vs ราคาแพง-ซื้อน้อย */}
      <View style={styles.insightBanner}>
        <Text style={styles.insightTitle}>💡 ข้อสรุปพฤติกรรมยอดซื้อตามระดับราคา (Behavior Insights):</Text>
        <View style={styles.insightRow}>
          <View style={[styles.insightBadge, { backgroundColor: '#3B82F620', borderColor: '#3B82F6' }]}>
            <Text style={[styles.insightBadgeText, { color: '#60A5FA' }]}>
              🔵 Cluster 0 (budget): ราคาถูก (25-150 THB) ➔ 🔥 ซื้อเยอะ (100-140 units/เดือน)
            </Text>
          </View>
          <View style={[styles.insightBadge, { backgroundColor: '#F9731620', borderColor: '#F97316' }]}>
            <Text style={[styles.insightBadgeText, { color: '#FB923C' }]}>
              🟠 Cluster 1 (mid-range): ราคากลาง (150-500 THB) ➔ ⚡ ซื้อปานกลาง (50-90 units/เดือน)
            </Text>
          </View>
          <View style={[styles.insightBadge, { backgroundColor: '#10B98120', borderColor: '#10B981' }]}>
            <Text style={[styles.insightBadgeText, { color: '#34D399' }]}>
              🟢 Cluster 2 (premium): ราคาแพง (550-850 THB) ➔ 💎 ซื้อน้อย (10-25 units/เดือน)
            </Text>
          </View>
        </View>
      </View>

      {/* 🎯 MAIN CARD: SIMULATED K-MEANS CLUSTERING RESULTS (GRAPH VS TABLE TOGGLE) */}
      <View style={styles.card}>
        <View style={styles.cardHeaderWithToggle}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Simulated K-Means Clustering Results</Text>
            <Text style={styles.cardSubtitle}>Units sold per month by Product price (THB)</Text>
          </View>

          {/* 🎛️ ปุ่มเปิด-ปิดสลับโหมด Graph 📊 กับ Table 📋 เหมือนในสไลด์หน้า 10 */}
          <View style={styles.toggleGroup}>
            <TouchableOpacity
              style={[styles.toggleBtn, viewMode === 'graph' && styles.toggleBtnActive]}
              onPress={() => setViewMode('graph')}
            >
              <Text style={[styles.toggleBtnText, viewMode === 'graph' && styles.toggleBtnTextActive]}>📊 Graph</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toggleBtn, viewMode === 'table' && styles.toggleBtnActive]}
              onPress={() => setViewMode('table')}
            >
              <Text style={[styles.toggleBtnText, viewMode === 'table' && styles.toggleBtnTextActive]}>📋 Table</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 📊 MODE 1: GRAPH VIEW (SCATTER PLOT - MATCHING LECTURE SLIDE) */}
        {viewMode === 'graph' && (
          <View style={styles.graphSection}>
            <View style={styles.scatterPlotWrapper}>
              {/* Y-Axis Tick Labels (0 to 140) */}
              <View style={styles.yAxisColumn}>
                <Text style={styles.yTick}>140</Text>
                <Text style={styles.yTick}>120</Text>
                <Text style={styles.yTick}>100</Text>
                <Text style={styles.yTick}>80</Text>
                <Text style={styles.yTick}>60</Text>
                <Text style={styles.yTick}>40</Text>
                <Text style={styles.yTick}>20</Text>
                <Text style={styles.yTick}>0</Text>
              </View>

              <View style={styles.scatterBox}>
                {/* Horizontal Grid Lines */}
                <View style={[styles.gridHorizontal, { top: '0%' }]} />
                <View style={[styles.gridHorizontal, { top: '14.2%' }]} />
                <View style={[styles.gridHorizontal, { top: '28.5%' }]} />
                <View style={[styles.gridHorizontal, { top: '42.8%' }]} />
                <View style={[styles.gridHorizontal, { top: '57.1%' }]} />
                <View style={[styles.gridHorizontal, { top: '71.4%' }]} />
                <View style={[styles.gridHorizontal, { top: '85.7%' }]} />
                <View style={[styles.gridHorizontal, { top: '100%' }]} />

                {/* Clean Circular Scatter Dots */}
                {(() => {
                  const realMaxP = Math.max(...data.clusteredProducts.map(p => p.price), 1000);
                  const chartMaxP = Math.ceil(realMaxP / 500) * 500 || 4000;

                  return data.clusteredProducts.map((p, idx) => {
                    const xPercent = Math.min(Math.max((p.price / chartMaxP) * 86 + 5, 4), 94);
                    const yPercent = Math.min(Math.max((p.unitsSold / 150) * 86 + 5, 4), 94);

                    return (
                      <View
                        key={`scatter-pt-${p.id}-${idx}`}
                        style={[
                          styles.dotPoint,
                          {
                            left: `${xPercent}%`,
                            bottom: `${yPercent}%`,
                            backgroundColor: p.color,
                            borderColor: '#FFFFFF',
                          },
                        ]}
                      />
                    );
                  });
                })()}
              </View>
            </View>

            {/* Dynamic X-Axis Ticks based on DB Prices */}
            {(() => {
              const realMaxP = Math.max(...data.clusteredProducts.map(p => p.price), 1000);
              const chartMaxP = Math.ceil(realMaxP / 500) * 500 || 4000;
              return (
                <View style={styles.xAxisRow}>
                  <Text style={styles.xTick}>0</Text>
                  <Text style={styles.xTick}>฿{Math.round(chartMaxP * 0.25)}</Text>
                  <Text style={styles.xTick}>฿{Math.round(chartMaxP * 0.5)}</Text>
                  <Text style={styles.xTick}>฿{Math.round(chartMaxP * 0.75)}</Text>
                  <Text style={styles.xTick}>฿{chartMaxP} (THB)</Text>
                </View>
              );
            })()}

            {/* Legend Bar */}
            <View style={styles.legendRow}>
              {data.clusterSummaries.map(c => (
                <View key={`legend-bar-${c.cluster}`} style={styles.legendItem}>
                  <View style={[styles.colorDot, { backgroundColor: c.color }]} />
                  <Text style={styles.legendText}>{c.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 📋 MODE 2: TABLE VIEW (GROUPED BY CLUSTERS LIKE SLIDE 10) */}
        {viewMode === 'table' && (
          <View style={styles.tableSection}>
            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              <View style={styles.slideTableBox}>
                {/* Table Header */}
                <View style={styles.slideTableHeader}>
                  <Text style={[styles.slideTh, { width: 50 }]}>#</Text>
                  <Text style={[styles.slideTh, { width: 160 }]}>Product price (THB)</Text>
                  <Text style={[styles.slideTh, { width: 180 }]}>Units sold per month</Text>
                  <Text style={[styles.slideTh, { width: 220 }]}>Sales Behavior (พฤติกรรม)</Text>
                </View>

                {/* Grouped by Clusters */}
                {data.clusterSummaries.map(cluster => {
                  const clusterProds = data.clusteredProducts.filter(p => p.cluster === cluster.cluster);
                  return (
                    <View key={`cluster-group-${cluster.cluster}`}>
                      {/* Cluster Group Header Banner */}
                      <View style={[styles.clusterGroupHeader, { backgroundColor: `${cluster.color}15`, borderLeftColor: cluster.color }]}>
                        <View style={[styles.colorDot, { backgroundColor: cluster.color, marginRight: 8 }]} />
                        <Text style={[styles.clusterGroupTitle, { color: cluster.color }]}>{cluster.name}</Text>
                        <Text style={styles.clusterGroupSub}>({cluster.salesBehavior})</Text>
                      </View>

                      {/* Cluster Products */}
                      {clusterProds.length === 0 ? (
                        <View style={styles.emptyRow}>
                          <Text style={{ color: '#64748B' }}>ไม่มีข้อมูลสินค้าในกลุ่มนี้</Text>
                        </View>
                      ) : (
                        clusterProds.map((prod, pIdx) => (
                          <View
                            key={`prod-table-row-${prod.id}-${pIdx}`}
                            style={[styles.slideTableRow, pIdx % 2 === 1 && styles.slideTableRowAlt]}
                          >
                            <Text style={[styles.slideTd, { width: 50, color: '#94A3B8' }]}>{pIdx + 1}</Text>
                            <Text style={[styles.slideTd, { width: 160, fontWeight: 'bold', color: '#F8FAFC' }]}>
                              ฿{prod.price.toLocaleString()}
                            </Text>
                            <Text style={[styles.slideTd, { width: 180, color: '#38BDF8', fontWeight: 'bold' }]}>
                              {prod.unitsSold} units
                            </Text>
                            <View style={[styles.slideTd, { width: 220 }]}>
                              <View style={[styles.behaviorTag, { backgroundColor: `${prod.color}20`, borderColor: prod.color }]}>
                                <Text style={[styles.behaviorTagText, { color: prod.color }]}>
                                  {cluster.cluster === 0 ? '🔥 ซื้อเยอะ (Low Price)' : cluster.cluster === 1 ? '⚡ ซื้อปานกลาง (Mid Price)' : '💎 ซื้อน้อย (High Price)'}
                                </Text>
                              </View>
                            </View>
                          </View>
                        ))
                      )}
                    </View>
                  );
                })}
              </View>
            </ScrollView>

            {/* Bottom Legend for Table */}
            <View style={styles.legendRow}>
              {data.clusterSummaries.map(c => (
                <View key={`table-legend-${c.cluster}`} style={styles.legendItem}>
                  <View style={[styles.colorDot, { backgroundColor: c.color }]} />
                  <Text style={styles.legendText}>{c.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* 📊 CLUSTER CHARACTERISTICS TABLE */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Cluster Characteristics Table</Text>
        <Text style={styles.cardSubtitle}>ตารางสรุปลักษณะเฉพาะของแต่ละ Cluster (เพื่อวิเคราะห์ภาพรวม)</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={true} style={{ marginTop: 12 }}>
          <View style={styles.summaryTable}>
            <View style={styles.summaryTableHeader}>
              <Text style={[styles.sumTh, { width: 140 }]}>Cluster</Text>
              <Text style={[styles.sumTh, { width: 150 }]}>Price range (THB)</Text>
              <Text style={[styles.sumTh, { width: 160 }]}>Avg. monthly sales</Text>
              <Text style={[styles.sumTh, { width: 280 }]}>Product profile</Text>
            </View>

            {data.clusterSummaries.map((summary, idx) => (
              <View key={`summary-tab-${idx}`} style={[styles.summaryTableRow, idx % 2 === 1 && styles.summaryTableRowAlt]}>
                <View style={[styles.sumTd, { width: 140, flexDirection: 'row', alignItems: 'center' }]}>
                  <View style={[styles.colorDot, { backgroundColor: summary.color, marginRight: 6 }]} />
                  <Text style={{ color: '#F8FAFC', fontWeight: 'bold' }}>{summary.cluster}</Text>
                  <Text style={{ color: summary.color, fontSize: 11 }}> ({summary.name.split(' ')[2] || ''})</Text>
                </View>
                <Text style={[styles.sumTd, { width: 150 }]}>฿{summary.priceRange}</Text>
                <Text style={[styles.sumTd, { width: 160 }]}>
                  {summary.cluster === 0 ? 'High' : summary.cluster === 1 ? 'Moderate' : 'Low'} (~{summary.avgSales} units)
                </Text>
                <Text style={[styles.sumTd, { width: 280 }]}>{summary.profile}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* 📐 ELBOW METHOD METHODOLOGY */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Selecting the Number of Clusters k (Elbow Method)</Text>
        <Text style={styles.cardSubtitle}>กราฟแสดงค่า Inertia เพื่อวิเคราะห์ความคุ้มค่าของการเพิ่มจำนวน Cluster</Text>

        <View style={styles.elbowChartBox}>
          {data.elbowData.map(e => (
            <View key={`elbow-bar-${e.k}`} style={styles.elbowItem}>
              <Text style={styles.elbowInertia}>{e.inertia}</Text>
              <View
                style={[
                  styles.elbowBar,
                  {
                    height: Math.max(e.inertia * 0.75, 18),
                    backgroundColor: e.k === data.k ? '#3B82F6' : '#475569',
                  },
                ]}
              />
              <Text style={[styles.elbowK, e.k === data.k && styles.elbowKActive]}>
                k = {e.k} {e.k === data.k ? '(Optimal)' : ''}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#94A3B8',
    marginTop: 12,
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  header: {
    marginBottom: 16,
  },
  backButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#1E293B',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 10,
  },
  backButtonText: {
    color: '#3B82F6',
    fontWeight: '600',
    fontSize: 14,
  },
  headerTitle: {
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 4,
  },
  kpiContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  kpiCard: {
    backgroundColor: '#1E293B',
    width: width > 600 ? '23.5%' : '48%',
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 4,
    marginBottom: 10,
  },
  kpiLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
  },
  kpiValue: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
  insightBanner: {
    backgroundColor: '#1E293B',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 16,
  },
  insightTitle: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  insightRow: {
    gap: 8,
  },
  insightBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  insightBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardHeaderWithToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  cardTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  toggleGroup: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 3,
    borderWidth: 1,
    borderColor: '#334155',
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  toggleBtnActive: {
    backgroundColor: '#3B82F6',
  },
  toggleBtnText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  toggleBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  graphSection: {
    marginTop: 8,
  },
  scatterPlotWrapper: {
    height: 220,
    flexDirection: 'row',
    position: 'relative',
  },
  yAxisColumn: {
    width: 32,
    justifyContent: 'space-between',
    paddingVertical: 2,
    alignItems: 'flex-end',
    paddingRight: 6,
  },
  yTick: {
    color: '#64748B',
    fontSize: 10,
  },
  scatterBox: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    position: 'relative',
    overflow: 'hidden',
  },
  gridHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#1E293B',
  },
  dotPoint: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  dotTooltip: {
    position: 'absolute',
    top: -20,
    left: -20,
    backgroundColor: '#0F172A99',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    width: 60,
  },
  dotTooltipText: {
    color: '#FFFFFF',
    fontSize: 8,
    textAlign: 'center',
  },
  xAxisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 36,
    marginTop: 6,
  },
  xTick: {
    color: '#64748B',
    fontSize: 10,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendText: {
    color: '#CBD5E1',
    fontSize: 12,
    marginLeft: 6,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tableSection: {
    marginTop: 6,
  },
  slideTableBox: {
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
  },
  slideTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingVertical: 10,
  },
  slideTh: {
    color: '#94A3B8',
    fontWeight: 'bold',
    fontSize: 12,
    paddingHorizontal: 12,
  },
  clusterGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderLeftWidth: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  clusterGroupTitle: {
    fontWeight: 'bold',
    fontSize: 13,
  },
  clusterGroupSub: {
    color: '#94A3B8',
    fontSize: 11,
    marginLeft: 8,
  },
  slideTableRow: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingVertical: 10,
    alignItems: 'center',
  },
  slideTableRowAlt: {
    backgroundColor: '#172033',
  },
  slideTd: {
    paddingHorizontal: 12,
    fontSize: 13,
  },
  behaviorTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  behaviorTagText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  emptyRow: {
    padding: 16,
    alignItems: 'center',
  },
  summaryTable: {
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
  },
  summaryTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  sumTh: {
    color: '#94A3B8',
    fontWeight: 'bold',
    fontSize: 12,
    paddingHorizontal: 12,
  },
  summaryTableRow: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    alignItems: 'center',
  },
  summaryTableRowAlt: {
    backgroundColor: '#172033',
  },
  sumTd: {
    color: '#CBD5E1',
    fontSize: 13,
    paddingHorizontal: 12,
  },
  elbowChartBox: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 130,
    paddingTop: 16,
    backgroundColor: '#0F172A',
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  elbowItem: {
    alignItems: 'center',
  },
  elbowInertia: {
    color: '#94A3B8',
    fontSize: 10,
    marginBottom: 4,
  },
  elbowBar: {
    width: 28,
    borderRadius: 4,
  },
  elbowK: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 6,
  },
  elbowKActive: {
    color: '#3B82F6',
    fontWeight: 'bold',
  },
});
