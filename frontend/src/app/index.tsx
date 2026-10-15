// ==============================================================================
// 🌟 HR Manager & Salary Analytics System - Main Application Screen
// Final Exam: Internet Programming (2026)
// Student ID: 6730202289
// ==============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
  RefreshControl,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from './AuthContext';
import { API_BASE_URL } from '../constants/api';

// Type Definitions
export type Employee = {
  id: string;
  name: string;
  position: string;
  status: 'Active' | 'On Leave';
  salary: number;
};

export type SalaryCluster = {
  group: string;
  centroid: number;
  count: number;
  minSalary?: number;
  maxSalary?: number;
};

export default function HRDashboardScreen() {
  const { user, logout } = useAuth();

  // State Management
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Tab State: 'employees' | 'analytics'
  const [activeTab, setActiveTab] = useState<'employees' | 'analytics'>('employees');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'On Leave'>('All');

  // Add Employee Modal State
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>('');
  const [newPosition, setNewPosition] = useState<string>('');
  const [newSalary, setNewSalary] = useState<string>('');
  const [newStatus, setNewStatus] = useState<'Active' | 'On Leave'>('Active');
  const [isSubmittingAdd, setIsSubmittingAdd] = useState<boolean>(false);

  // Edit Employee Modal State
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editPosition, setEditPosition] = useState<string>('');
  const [editSalary, setEditSalary] = useState<string>('');
  const [editStatus, setEditStatus] = useState<'Active' | 'On Leave'>('Active');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState<boolean>(false);

  // K-Means Analytics State (Phase 2)
  const [clusters, setClusters] = useState<SalaryCluster[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [hasAnalyzed, setHasAnalyzed] = useState<boolean>(false);

  // --------------------------------------------------------------------------
  // 1. Fetch Employees (CRUD: Read)
  // --------------------------------------------------------------------------
  const fetchEmployees = async (showLoadingIndicator = true) => {
    if (showLoadingIndicator) setIsLoadingEmployees(true);
    setErrorMsg('');
    try {
      const response = await fetch(`${API_BASE_URL}/employees`);
      if (!response.ok) {
        throw new Error(`Server returned status: ${response.status}`);
      }
      const data: Employee[] = await response.json();
      setEmployees(data);
    } catch (err: any) {
      console.error('Fetch employees error:', err);
      setErrorMsg('ไม่สามารถดึงข้อมูลพนักงานจากเซิร์ฟเวอร์ได้');
    } finally {
      setIsLoadingEmployees(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchEmployees(false);
  };

  // --------------------------------------------------------------------------
  // 2. Add Employee (CRUD: Create with Client-Side Validation)
  // --------------------------------------------------------------------------
  const handleAddEmployee = async () => {
    // Client-side Validation: Prevent submission if any field is empty
    if (!newName.trim() || !newPosition.trim() || !newSalary.trim()) {
      Alert.alert(
        'กรอกข้อมูลไม่ครบถ้วน',
        'กรุณากรอกชื่อ (Name), ตำแหน่ง (Position) และเงินเดือน (Salary) ให้ครบทุกช่อง'
      );
      return;
    }

    const numericSalary = Number(newSalary);
    if (isNaN(numericSalary) || numericSalary <= 0) {
      Alert.alert('ข้อมูลเงินเดือนไม่ถูกต้อง', 'กรุณากรอกเงินเดือนเป็นตัวเลขที่มากกว่า 0');
      return;
    }

    setIsSubmittingAdd(true);
    try {
      const response = await fetch(`${API_BASE_URL}/employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          position: newPosition.trim(),
          salary: numericSalary,
          status: newStatus,
        }),
      });

      const result = await response.json();

      if (response.status === 201 || response.ok) {
        Alert.alert('สำเร็จ', `เพิ่มพนักงาน "${newName.trim()}" เรียบร้อยแล้ว`);
        // Reset form
        setNewName('');
        setNewPosition('');
        setNewSalary('');
        setNewStatus('Active');
        setShowAddModal(false);
        // Refresh list
        fetchEmployees(false);
      } else {
        Alert.alert('เกิดข้อผิดพลาด', result.error || 'ไม่สามารถเพิ่มข้อมูลพนักงานได้');
      }
    } catch (err: any) {
      console.error('Add employee error:', err);
      Alert.alert('ข้อผิดพลาดการเชื่อมต่อ', 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  // --------------------------------------------------------------------------
  // 3. Toggle Status (CRUD: Update Status Active <-> On Leave)
  // --------------------------------------------------------------------------
  const handleToggleStatus = async (emp: Employee) => {
    try {
      const response = await fetch(`${API_BASE_URL}/employees/${emp.id}/status`, {
        method: 'PUT',
      });

      if (response.ok) {
        const nextStatus = emp.status === 'Active' ? 'On Leave' : 'Active';
        setEmployees(prev =>
          prev.map(e => (e.id === emp.id ? { ...e, status: nextStatus } : e))
        );
      } else {
        Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถเปลี่ยนสถานะพนักงานได้');
      }
    } catch (err) {
      console.error('Toggle status error:', err);
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
    }
  };

  // --------------------------------------------------------------------------
  // 4. Edit Employee (CRUD: Update / แก้ไข)
  // --------------------------------------------------------------------------
  const openEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setEditName(emp.name);
    setEditPosition(emp.position);
    setEditSalary(String(emp.salary));
    setEditStatus(emp.status);
  };

  const handleSaveEdit = async () => {
    if (!editingEmployee) return;

    if (!editName.trim() || !editPosition.trim() || !editSalary.trim()) {
      Alert.alert('กรอกข้อมูลไม่ครบถ้วน', 'กรุณากรอกข้อมูลให้ครบถ้วนทุกช่อง');
      return;
    }

    const numericSalary = Number(editSalary);
    if (isNaN(numericSalary) || numericSalary <= 0) {
      Alert.alert('ข้อมูลเงินเดือนไม่ถูกต้อง', 'กรุณากรอกเงินเดือนเป็นตัวเลขที่ถูกต้อง');
      return;
    }

    setIsSubmittingEdit(true);
    try {
      const response = await fetch(`${API_BASE_URL}/employees/${editingEmployee.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          position: editPosition.trim(),
          salary: numericSalary,
          status: editStatus,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        Alert.alert('สำเร็จ', 'บันทึกการแก้ไขข้อมูลพนักงานเรียบร้อย');
        setEditingEmployee(null);
        fetchEmployees(false);
      } else {
        Alert.alert('เกิดข้อผิดพลาด', result.error || 'ไม่สามารถแก้ไขข้อมูลได้');
      }
    } catch (err) {
      console.error('Edit error:', err);
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // --------------------------------------------------------------------------
  // 5. Delete Employee with Confirmation Alert Dialog ("Are you sure?")
  // --------------------------------------------------------------------------
  const handleDeleteEmployee = (emp: Employee) => {
    // Required: Display an Alert Confirmation dialog ("Are you sure?") before sending DELETE
    Alert.alert(
      'ยืนยันการลบข้อมูลพนักงาน',
      `คุณแน่ใจหรือไม่ว่าต้องการลบคุณ "${emp.name}" (รหัส: ${emp.id}) ออกจากระบบ?`,
      [
        {
          text: 'ยกเลิก',
          style: 'cancel',
        },
        {
          text: 'ลบข้อมูล',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${API_BASE_URL}/employees/${emp.id}`, {
                method: 'DELETE',
              });

              if (response.ok) {
                // Remove from local state immediately
                setEmployees(prev => prev.filter(e => e.id !== emp.id));
                Alert.alert('สำเร็จ', `ลบพนักงาน "${emp.name}" เรียบร้อยแล้ว`);
              } else {
                Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถลบข้อมูลพนักงานได้');
              }
            } catch (err) {
              console.error('Delete error:', err);
              Alert.alert('ข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
            }
          },
        },
      ]
    );
  };

  // --------------------------------------------------------------------------
  // 6. Phase 2: K-Means Salary Clustering Analytics
  // --------------------------------------------------------------------------
  const handleAnalyzeSalary = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch(`${API_BASE_URL}/employees/salary-clusters`);
      const result = await response.json();

      if (response.ok && result.success) {
        setClusters(result.clusters);
        setHasAnalyzed(true);
        setActiveTab('analytics');
      } else {
        Alert.alert('เกิดข้อผิดพลาด', result.error || 'ไม่สามารถวิเคราะห์ข้อมูลเงินเดือนได้');
      }
    } catch (err) {
      console.error('K-Means Analytics error:', err);
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อไปยัง K-Means API ได้');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // --------------------------------------------------------------------------
  // Computed Data / Filters
  // --------------------------------------------------------------------------
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchesSearch =
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.position.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'All' ? true : emp.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [employees, searchQuery, statusFilter]);

  // Overall Statistics
  const totalEmployees = employees.length;
  const activeCount = employees.filter(e => e.status === 'Active').length;
  const onLeaveCount = employees.filter(e => e.status === 'On Leave').length;
  const avgSalary =
    totalEmployees > 0
      ? Math.round(employees.reduce((acc, e) => acc + Number(e.salary), 0) / totalEmployees)
      : 0;

  // Currency Formatter
  const formatSalary = (val: number) => {
    return '฿' + (val || 0).toLocaleString('th-TH');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 🧭 Top Navigation Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIconCircle}>
            <Text style={styles.headerIcon}>👥</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>HR MANAGER</Text>
            <Text style={styles.headerSubtitle}>Salary Analytics & Clustering</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutBtnText}>ออกจากระบบ 🚪</Text>
        </TouchableOpacity>
      </View>

      {/* 📊 Quick Stats Overview Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{totalEmployees}</Text>
          <Text style={styles.statLabel}>พนักงานทั้งหมด</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: '#10B981' }]}>{activeCount}</Text>
          <Text style={styles.statLabel}>กำลังทำงาน</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: '#F59E0B' }]}>{onLeaveCount}</Text>
          <Text style={styles.statLabel}>ลางาน (On Leave)</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: '#38BDF8' }]}>{formatSalary(avgSalary)}</Text>
          <Text style={styles.statLabel}>เงินเดือนเฉลี่ย</Text>
        </View>
      </View>

      {/* 🏷️ Navigation Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'employees' && styles.tabButtonActive]}
          onPress={() => setActiveTab('employees')}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'employees' && styles.tabButtonTextActive,
            ]}
          >
            👥 พนักงาน ({filteredEmployees.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'analytics' && styles.tabButtonActive]}
          onPress={() => {
            setActiveTab('analytics');
            if (!hasAnalyzed) handleAnalyzeSalary();
          }}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'analytics' && styles.tabButtonTextActive,
            ]}
          >
            🧠 วิเคราะห์ K-Means {clusters.length > 0 && `(k=3)`}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#38BDF8"
            colors={['#38BDF8']}
          />
        }
      >
        {/* =================================================================== */}
        {/* TAB 1: EMPLOYEES CRUD MANAGEMENT                                    */}
        {/* =================================================================== */}
        {activeTab === 'employees' && (
          <View>
            {/* 🧠 Phase 2 Hero Button Banner */}
            <TouchableOpacity
              style={styles.mlBannerBtn}
              onPress={handleAnalyzeSalary}
              disabled={isAnalyzing}
            >
              <View style={styles.mlBannerContent}>
                <View style={styles.mlIconWrapper}>
                  <Text style={styles.mlIcon}>🧠</Text>
                </View>
                <View style={styles.mlTextWrapper}>
                  <Text style={styles.mlBannerTitle}>Analyze Salary Structure (K-Means)</Text>
                  <Text style={styles.mlBannerSubtitle}>
                    จัดกลุ่มโครงสร้างเงินเดือน 3 ระดับด้วย Machine Learning Algorithm
                  </Text>
                </View>
                {isAnalyzing ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <View style={styles.mlRunBadge}>
                    <Text style={styles.mlRunBadgeText}>วิเคราะห์ ➔</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>

            {/* 🔍 Search & Filter Bar ("ค้นหา") */}
            <View style={styles.searchSection}>
              <View style={styles.searchInputWrapper}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                  style={styles.searchInput}
                  placeholder="ค้นหาชื่อพนักงาน หรือตำแหน่ง..."
                  placeholderTextColor="#64748B"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery !== '' && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Text style={styles.clearSearchIcon}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Status Filter Chips */}
              <View style={styles.filterChipsRow}>
                {(['All', 'Active', 'On Leave'] as const).map(status => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.filterChip,
                      statusFilter === status && styles.filterChipActive,
                    ]}
                    onPress={() => setStatusFilter(status)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        statusFilter === status && styles.filterChipTextActive,
                      ]}
                    >
                      {status === 'All' ? 'ทั้งหมด' : status === 'Active' ? 'Active' : 'On Leave'}
                    </Text>
                  </TouchableOpacity>
                ))}

                {/* + Add Employee Button */}
                <TouchableOpacity
                  style={styles.addEmployeeBtn}
                  onPress={() => setShowAddModal(true)}
                >
                  <Text style={styles.addEmployeeBtnText}>+ เพิ่มพนักงาน</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 📋 Employee List */}
            {isLoadingEmployees ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#38BDF8" />
                <Text style={styles.loadingText}>กำลังโหลดข้อมูลพนักงาน...</Text>
              </View>
            ) : errorMsg ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={() => fetchEmployees(true)}>
                  <Text style={styles.retryBtnText}>ลองใหม่อีกครั้ง</Text>
                </TouchableOpacity>
              </View>
            ) : filteredEmployees.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>📂</Text>
                <Text style={styles.emptyTitle}>ไม่พบข้อมูลพนักงาน</Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery ? 'ลองเปลี่ยนคำค้นหาใหม่' : 'กดปุ่ม "+ เพิ่มพนักงาน" เพื่อเริ่มต้น'}
                </Text>
              </View>
            ) : (
              <View style={styles.employeeList}>
                {filteredEmployees.map(emp => (
                  <View key={emp.id} style={styles.employeeCard}>
                    {/* Card Top: Name & Status */}
                    <View style={styles.cardHeader}>
                      <View style={styles.avatarCircle}>
                        <Text style={styles.avatarInitial}>
                          {emp.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.cardHeaderInfo}>
                        <Text style={styles.empName}>{emp.name}</Text>
                        <Text style={styles.empPosition}>{emp.position}</Text>
                      </View>
                      <View
                        style={[
                          styles.statusBadge,
                          emp.status === 'Active'
                            ? styles.statusBadgeActive
                            : styles.statusBadgeLeave,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            emp.status === 'Active'
                              ? styles.statusBadgeTextActive
                              : styles.statusBadgeTextLeave,
                          ]}
                        >
                          {emp.status === 'Active' ? '● Active' : '○ On Leave'}
                        </Text>
                      </View>
                    </View>

                    {/* Card Body: Salary */}
                    <View style={styles.cardSalaryRow}>
                      <Text style={styles.salaryLabel}>เงินเดือนประจำเดือน (Salary):</Text>
                      <Text style={styles.salaryValue}>{formatSalary(emp.salary)}</Text>
                    </View>

                    {/* Card Actions: Toggle Status, Edit, Delete */}
                    <View style={styles.cardActionsRow}>
                      {/* Toggle Status Button */}
                      <TouchableOpacity
                        style={[
                          styles.actionBtn,
                          styles.toggleStatusBtn,
                          emp.status === 'Active'
                            ? styles.toggleToLeaveBtn
                            : styles.toggleToActiveBtn,
                        ]}
                        onPress={() => handleToggleStatus(emp)}
                      >
                        <Text style={styles.toggleStatusBtnText}>
                          {emp.status === 'Active' ? '🔄 เปลี่ยนเป็น On Leave' : '⚡ เปลี่ยนเป็น Active'}
                        </Text>
                      </TouchableOpacity>

                      {/* Edit Button */}
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.editBtn]}
                        onPress={() => openEditModal(emp)}
                      >
                        <Text style={styles.editBtnText}>✏️ แก้ไข</Text>
                      </TouchableOpacity>

                      {/* Delete Button (with Confirmation Alert) */}
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.deleteBtn]}
                        onPress={() => handleDeleteEmployee(emp)}
                      >
                        <Text style={styles.deleteBtnText}>🗑️ ลบ</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* =================================================================== */}
        {/* TAB 2: K-MEANS SALARY CLUSTERING ANALYTICS                           */}
        {/* =================================================================== */}
        {activeTab === 'analytics' && (
          <View style={styles.analyticsSection}>
            {/* Header & Trigger */}
            <View style={styles.analyticsHeader}>
              <View>
                <Text style={styles.analyticsTitle}>K-Means Salary Analytics (k=3)</Text>
                <Text style={styles.analyticsSubtitle}>
                  การจัดกลุ่มฐานเงินเดือนพนักงานในองค์กรด้วย 1D K-Means Clustering
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.reAnalyzeBtn, isAnalyzing && styles.reAnalyzeBtnDisabled]}
                onPress={handleAnalyzeSalary}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.reAnalyzeBtnText}>🔄 วิเคราะห์ใหม่</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Loading Indicator */}
            {isAnalyzing ? (
              <View style={styles.analyticsLoadingBox}>
                <ActivityIndicator size="large" color="#38BDF8" />
                <Text style={styles.analyticsLoadingText}>
                  กำลังประมวลผลอัลกอริทึม 1D K-Means Clustering (k=3)...
                </Text>
                <Text style={styles.analyticsLoadingSubtext}>
                  ดึงข้อมูลเงินเดือนพนักงานทั้งหมดและคำนวณหาค่า Centroid
                </Text>
              </View>
            ) : clusters.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>📊</Text>
                <Text style={styles.emptyTitle}>ยังไม่ได้ประมวลผลข้อมูล</Text>
                <Text style={styles.emptySubtitle}>
                  กดปุ่ม "วิเคราะห์โครงสร้างเงินเดือน" ด้านบนเพื่อเริ่มรัน K-Means
                </Text>
              </View>
            ) : (
              <View>
                {/* Clustering Overview Card */}
                <View style={styles.clusteringIntroCard}>
                  <Text style={styles.introCardTitle}>💡 ผลสรุปการจัดกลุ่มโครงสร้างเงินเดือน</Text>
                  <Text style={styles.introCardDesc}>
                    ระบบได้นำเงินเดือนของพนักงานทั้งหมด ({totalEmployees} คน) เข้าสู่ 1D K-Means
                    Clustering Algorithm โดยแบ่งออกเป็น 3 ระดับ (Tier 1: เงินเดือนระดับเริ่มต้น,
                    Tier 2: เงินเดือนระดับกลาง, Tier 3: เงินเดือนระดับสูง)
                  </Text>
                </View>

                {/* 3 Tier Summary Cards */}
                <View style={styles.clustersList}>
                  {clusters.map((cluster, idx) => {
                    // Visual styling depending on tier
                    const tierStyles = [
                      {
                        border: '#059669',
                        bg: 'rgba(16, 185, 129, 0.1)',
                        text: '#34D399',
                        label: 'ระดับเริ่มต้น (Entry / Junior Tier)',
                        icon: '🌱',
                      },
                      {
                        border: '#D97706',
                        bg: 'rgba(245, 158, 11, 0.1)',
                        text: '#FBBF24',
                        label: 'ระดับกลาง (Mid-Level Tier)',
                        icon: '⭐',
                      },
                      {
                        border: '#7C3AED',
                        bg: 'rgba(139, 92, 246, 0.1)',
                        text: '#A78BFA',
                        label: 'ระดับสูง / บริหาร (Senior / Lead Tier)',
                        icon: '👑',
                      },
                    ][idx] || {
                      border: '#3B82F6',
                      bg: 'rgba(59, 130, 246, 0.1)',
                      text: '#60A5FA',
                      label: 'General Tier',
                      icon: '💼',
                    };

                    const percentage =
                      totalEmployees > 0
                        ? Math.round((cluster.count / totalEmployees) * 100)
                        : 0;

                    return (
                      <View
                        key={cluster.group}
                        style={[styles.clusterCard, { borderColor: tierStyles.border }]}
                      >
                        <View style={styles.clusterCardHeader}>
                          <View style={styles.clusterTitleGroup}>
                            <Text style={styles.clusterIcon}>{tierStyles.icon}</Text>
                            <View>
                              <Text style={[styles.clusterGroupText, { color: tierStyles.text }]}>
                                {cluster.group}
                              </Text>
                              <Text style={styles.clusterTierLabel}>{tierStyles.label}</Text>
                            </View>
                          </View>

                          <View style={styles.clusterCountBadge}>
                            <Text style={styles.clusterCountNumber}>{cluster.count}</Text>
                            <Text style={styles.clusterCountLabel}>คน ({percentage}%)</Text>
                          </View>
                        </View>

                        {/* Centroid / Average Salary Display */}
                        <View style={styles.centroidSection}>
                          <Text style={styles.centroidLabel}>
                            ค่าเฉลี่ยเงินเดือนของกลุ่ม (Centroid):
                          </Text>
                          <Text style={[styles.centroidValue, { color: tierStyles.text }]}>
                            {formatSalary(cluster.centroid)}
                          </Text>
                        </View>

                        {/* Min / Max Salary Range if available */}
                        {cluster.minSalary !== undefined && cluster.maxSalary !== undefined && (
                          <View style={styles.clusterRangeRow}>
                            <Text style={styles.clusterRangeLabel}>ช่วงเงินเดือนในกลุ่ม:</Text>
                            <Text style={styles.clusterRangeValue}>
                              {formatSalary(cluster.minSalary)} - {formatSalary(cluster.maxSalary)}
                            </Text>
                          </View>
                        )}

                        {/* Progress Distribution Bar */}
                        <View style={styles.progressBarBg}>
                          <View
                            style={[
                              styles.progressBarFill,
                              {
                                width: `${percentage}%`,
                                backgroundColor: tierStyles.border,
                              },
                            ]}
                          />
                        </View>
                      </View>
                    );
                  })}
                </View>

                {/* Algorithmic Details Box */}
                <View style={styles.algoDetailsCard}>
                  <Text style={styles.algoTitle}>📌 ข้อมูลทางเทคนิค (Phase 2 Spec)</Text>
                  <Text style={styles.algoText}>• อัลกอริทึม: 1D K-Means Clustering ($k=3$)</Text>
                  <Text style={styles.algoText}>• Endpoint: GET /api/employees/salary-clusters</Text>
                  <Text style={styles.algoText}>
                    • รูปแบบการตอบกลับ: JSON format ตรงตามเกณฑ์ประเมิน (group, centroid, count)
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* =================================================================== */}
      {/* MODAL 1: ADD EMPLOYEE FORM (with Client-Side Validation)           */}
      {/* =================================================================== */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>+ เพิ่มพนักงานใหม่</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Text style={styles.modalCloseBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalForm}>
              {/* Name Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  ชื่อ-นามสกุล (Name) <Text style={styles.requiredStar}>*</Text>
                </Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="เช่น สมชาย ใจดี หรือ John Doe"
                  placeholderTextColor="#64748B"
                  value={newName}
                  onChangeText={setNewName}
                />
              </View>

              {/* Position Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  ตำแหน่งงาน (Position) <Text style={styles.requiredStar}>*</Text>
                </Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="เช่น Software Engineer, HR Manager"
                  placeholderTextColor="#64748B"
                  value={newPosition}
                  onChangeText={setNewPosition}
                />
              </View>

              {/* Salary Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  เงินเดือน (Salary ในหน่วยบาท) <Text style={styles.requiredStar}>*</Text>
                </Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="เช่น 45000"
                  placeholderTextColor="#64748B"
                  value={newSalary}
                  onChangeText={setNewSalary}
                  keyboardType="numeric"
                />
              </View>

              {/* Status Selector */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>สถานะเริ่มต้น (Status)</Text>
                <View style={styles.statusToggleRow}>
                  <TouchableOpacity
                    style={[
                      styles.statusToggleOption,
                      newStatus === 'Active' && styles.statusToggleOptionActive,
                    ]}
                    onPress={() => setNewStatus('Active')}
                  >
                    <Text
                      style={[
                        styles.statusToggleOptionText,
                        newStatus === 'Active' && styles.statusToggleOptionTextActive,
                      ]}
                    >
                      ● Active
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.statusToggleOption,
                      newStatus === 'On Leave' && styles.statusToggleOptionLeave,
                    ]}
                    onPress={() => setNewStatus('On Leave')}
                  >
                    <Text
                      style={[
                        styles.statusToggleOptionText,
                        newStatus === 'On Leave' && styles.statusToggleOptionTextLeave,
                      ]}
                    >
                      ○ On Leave
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Submit Buttons */}
              <View style={styles.modalButtonsRow}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setShowAddModal(false)}
                >
                  <Text style={styles.modalCancelBtnText}>ยกเลิก</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalSubmitBtn, isSubmittingAdd && styles.modalSubmitBtnDisabled]}
                  onPress={handleAddEmployee}
                  disabled={isSubmittingAdd}
                >
                  {isSubmittingAdd ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.modalSubmitBtnText}>บันทึกข้อมูลพนักงาน 💾</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* =================================================================== */}
      {/* MODAL 2: EDIT EMPLOYEE FORM                                         */}
      {/* =================================================================== */}
      <Modal
        visible={editingEmployee !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setEditingEmployee(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>✏️ แก้ไขข้อมูลพนักงาน</Text>
              <TouchableOpacity onPress={() => setEditingEmployee(null)}>
                <Text style={styles.modalCloseBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalForm}>
              {/* Name Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  ชื่อ-นามสกุล (Name) <Text style={styles.requiredStar}>*</Text>
                </Text>
                <TextInput
                  style={styles.modalInput}
                  value={editName}
                  onChangeText={setEditName}
                />
              </View>

              {/* Position Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  ตำแหน่งงาน (Position) <Text style={styles.requiredStar}>*</Text>
                </Text>
                <TextInput
                  style={styles.modalInput}
                  value={editPosition}
                  onChangeText={setEditPosition}
                />
              </View>

              {/* Salary Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  เงินเดือน (Salary) <Text style={styles.requiredStar}>*</Text>
                </Text>
                <TextInput
                  style={styles.modalInput}
                  value={editSalary}
                  onChangeText={setEditSalary}
                  keyboardType="numeric"
                />
              </View>

              {/* Status Selector */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>สถานะการทำงาน (Status)</Text>
                <View style={styles.statusToggleRow}>
                  <TouchableOpacity
                    style={[
                      styles.statusToggleOption,
                      editStatus === 'Active' && styles.statusToggleOptionActive,
                    ]}
                    onPress={() => setEditStatus('Active')}
                  >
                    <Text
                      style={[
                        styles.statusToggleOptionText,
                        editStatus === 'Active' && styles.statusToggleOptionTextActive,
                      ]}
                    >
                      ● Active
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.statusToggleOption,
                      editStatus === 'On Leave' && styles.statusToggleOptionLeave,
                    ]}
                    onPress={() => setEditStatus('On Leave')}
                  >
                    <Text
                      style={[
                        styles.statusToggleOptionText,
                        editStatus === 'On Leave' && styles.statusToggleOptionTextLeave,
                      ]}
                    >
                      ○ On Leave
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Submit Buttons */}
              <View style={styles.modalButtonsRow}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setEditingEmployee(null)}
                >
                  <Text style={styles.modalCancelBtnText}>ยกเลิก</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalSubmitBtn, isSubmittingEdit && styles.modalSubmitBtnDisabled]}
                  onPress={handleSaveEdit}
                  disabled={isSubmittingEdit}
                >
                  {isSubmittingEdit ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.modalSubmitBtnText}>บันทึกการแก้ไข 💾</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
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
    backgroundColor: '#0F172A',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#38BDF8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIcon: {
    fontSize: 20,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  logoutBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  logoutBtnText: {
    color: '#F87171',
    fontSize: 12,
    fontWeight: '700',
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#334155',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  statLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#334155',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#1E293B',
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: '#334155',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: '#38BDF8',
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
  },
  tabButtonTextActive: {
    color: '#0F172A',
  },
  contentScroll: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  mlBannerBtn: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    marginBottom: 16,
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  mlBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mlIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mlIcon: {
    fontSize: 22,
  },
  mlTextWrapper: {
    flex: 1,
  },
  mlBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  mlBannerSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  mlRunBadge: {
    backgroundColor: '#38BDF8',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  mlRunBadgeText: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '800',
  },
  searchSection: {
    marginBottom: 16,
    gap: 10,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: '#F8FAFC',
  },
  clearSearchIcon: {
    fontSize: 14,
    color: '#94A3B8',
    padding: 4,
  },
  filterChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  filterChipActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    borderColor: '#38BDF8',
  },
  filterChipText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#38BDF8',
    fontWeight: '700',
  },
  addEmployeeBtn: {
    marginLeft: 'auto',
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  addEmployeeBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 10,
  },
  errorText: {
    color: '#F87171',
    fontSize: 14,
    fontWeight: '600',
  },
  retryBtn: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 8,
  },
  emptyIcon: {
    fontSize: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94A3B8',
  },
  employeeList: {
    gap: 12,
  },
  employeeCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#38BDF8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: '800',
    color: '#38BDF8',
  },
  cardHeaderInfo: {
    flex: 1,
  },
  empName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  empPosition: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  statusBadgeLeave: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusBadgeTextActive: {
    color: '#34D399',
  },
  statusBadgeTextLeave: {
    color: '#FBBF24',
  },
  cardSalaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  salaryLabel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  salaryValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#38BDF8',
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  actionBtn: {
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleStatusBtn: {
    flex: 1,
  },
  toggleToLeaveBtn: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  toggleToActiveBtn: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  toggleStatusBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  editBtn: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  editBtnText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
  },
  deleteBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  deleteBtnText: {
    color: '#F87171',
    fontSize: 11,
    fontWeight: '700',
  },
  analyticsSection: {
    gap: 16,
  },
  analyticsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  analyticsTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  analyticsSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  reAnalyzeBtn: {
    backgroundColor: '#38BDF8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  reAnalyzeBtnDisabled: {
    backgroundColor: '#475569',
  },
  reAnalyzeBtnText: {
    color: '#0F172A',
    fontSize: 11,
    fontWeight: '800',
  },
  analyticsLoadingBox: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 30,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  analyticsLoadingText: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  analyticsLoadingSubtext: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
  },
  clusteringIntroCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  introCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#38BDF8',
    marginBottom: 4,
  },
  introCardDesc: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 18,
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clusterTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  clusterIcon: {
    fontSize: 26,
  },
  clusterGroupText: {
    fontSize: 18,
    fontWeight: '900',
  },
  clusterTierLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  clusterCountBadge: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    alignItems: 'center',
  },
  clusterCountNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  clusterCountLabel: {
    fontSize: 10,
    color: '#94A3B8',
  },
  centroidSection: {
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
    letterSpacing: 0.5,
  },
  clusterRangeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  clusterRangeLabel: {
    fontSize: 11,
    color: '#94A3B8',
  },
  clusterRangeValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#CBD5E1',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#0F172A',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  algoDetailsCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 6,
    marginTop: 8,
  },
  algoTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  algoText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  modalCloseBtn: {
    fontSize: 18,
    color: '#94A3B8',
    padding: 4,
  },
  modalForm: {
    gap: 14,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  requiredStar: {
    color: '#EF4444',
  },
  modalInput: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#F8FAFC',
  },
  statusToggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statusToggleOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
  },
  statusToggleOptionActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10B981',
  },
  statusToggleOptionLeave: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: '#F59E0B',
  },
  statusToggleOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  statusToggleOptionTextActive: {
    color: '#34D399',
    fontWeight: '700',
  },
  statusToggleOptionTextLeave: {
    color: '#FBBF24',
    fontWeight: '700',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#334155',
  },
  modalCancelBtnText: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: '700',
  },
  modalSubmitBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#38BDF8',
  },
  modalSubmitBtnDisabled: {
    backgroundColor: '#475569',
  },
  modalSubmitBtnText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },
});
