import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { colors } from "../theme/colors";
import { useAuth } from "../context/AuthContext";
import { mobileApi } from "../services/api";
import { DashboardSummary } from "../types";
import { RiskBadge } from "../components/RiskBadge";
import { MedicalDisclaimer } from "../components/MedicalDisclaimer";

export function DashboardScreen({ navigation }: any) {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setError(null);
      const res = await mobileApi.getDashboardSummary();
      setData(res);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.teal} />
        <Text style={styles.loadingText}>Loading wellbeing summary...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scroll}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.teal]} />
      }
    >
      {/* Welcome Banner */}
      <View style={styles.banner}>
        <Text style={styles.badgeLabel}>CONFIDENTIAL WELLNESS</Text>
        <Text style={styles.greeting}>Hello, {user?.full_name || "Student"}</Text>
        <Text style={styles.bannerSubtitle}>
          Track your academic load, sleep rhythm, and mental health screening risk indicators.
        </Text>

        <TouchableOpacity
          style={styles.ctaBtn}
          onPress={() => navigation.navigate("AssessmentTab")}
        >
          <Text style={styles.ctaBtnText}>+ Take New Assessment</Text>
        </TouchableOpacity>
      </View>

      <MedicalDisclaimer />

      {/* KPI Cards Row */}
      <View style={styles.grid}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiTitle}>SCREENINGS</Text>
          <Text style={styles.kpiVal}>{data?.total_assessments ?? 0}</Text>
          <Text style={styles.kpiSub}>Total logged</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiTitle}>AVG RISK SCORE</Text>
          <Text style={styles.kpiVal}>
            {data ? `${Math.round(data.average_risk_score * 100)}%` : "0%"}
          </Text>
          <Text style={styles.kpiSub}>Model mean</Text>
        </View>
      </View>

      {/* Latest Result Card */}
      {data?.latest_result ? (
        <View style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <Text style={styles.sectionTitle}>Latest Screening Outcome</Text>
            <RiskBadge riskLevel={data.latest_result.risk_level} />
          </View>
          <Text style={styles.resultLabel}>{data.latest_result.prediction_label}</Text>
          <Text style={styles.resultMeta}>
            Model: {data.latest_result.model_type} • Risk Probability:{" "}
            {Math.round(data.latest_result.probability * 100)}%
          </Text>
          <TouchableOpacity
            style={styles.viewResultBtn}
            onPress={() => navigation.navigate("Result", { id: data.latest_result?.id })}
          >
            <Text style={styles.viewResultBtnText}>View Detailed Insights →</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No Assessments Yet</Text>
          <Text style={styles.emptyDesc}>
            Complete your initial questionnaire to generate your statistical risk screening.
          </Text>
        </View>
      )}

      {/* Factor Summary */}
      {data && data.total_assessments > 0 && (
        <View style={styles.factorCard}>
          <Text style={styles.sectionTitle}>Key Routine Indicators</Text>
          <View style={styles.factorRow}>
            <Text style={styles.factorName}>Sleep &lt; 6 hrs</Text>
            <Text style={styles.factorVal}>{data.sleep_summary.short_sleep_pct}% of records</Text>
          </View>
          <View style={styles.factorRow}>
            <Text style={styles.factorName}>Avg Academic Stress</Text>
            <Text style={styles.factorVal}>{data.stress_summary.avg_academic_pressure} / 5</Text>
          </View>
          <View style={styles.factorRow}>
            <Text style={styles.factorName}>Avg Financial Strain</Text>
            <Text style={styles.factorVal}>{data.stress_summary.avg_financial_stress} / 5</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    padding: 16,
    paddingBottom: 30,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 12,
    color: colors.textMuted,
  },
  banner: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 8,
  },
  badgeLabel: {
    color: colors.tealLight,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  greeting: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: 4,
  },
  bannerSubtitle: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 4,
    lineHeight: 18,
  },
  ctaBtn: {
    backgroundColor: colors.teal,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: "flex-start",
    marginTop: 16,
  },
  ctaBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  grid: {
    flexDirection: "row",
    gap: 12,
    marginVertical: 10,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  kpiTitle: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  kpiVal: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.text,
    marginTop: 4,
  },
  kpiSub: {
    fontSize: 10,
    color: colors.teal,
    marginTop: 2,
    fontWeight: "600",
  },
  resultCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  resultLabel: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.primary,
    marginTop: 4,
  },
  resultMeta: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
  },
  viewResultBtn: {
    marginTop: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderColor: "#F1F5F9",
  },
  viewResultBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.teal,
  },
  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    marginVertical: 10,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  emptyDesc: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 4,
  },
  factorCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 4,
  },
  factorRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "#F1F5F9",
  },
  factorName: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  factorVal: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text,
  },
});
