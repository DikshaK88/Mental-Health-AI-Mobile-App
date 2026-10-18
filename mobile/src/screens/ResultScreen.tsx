import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from "react-native";
import { colors } from "../theme/colors";
import { mobileApi } from "../services/api";
import { AssessmentResponse } from "../types";
import { RiskBadge } from "../components/RiskBadge";
import { MedicalDisclaimer } from "../components/MedicalDisclaimer";

export function ResultScreen({ route, navigation }: any) {
  const { id } = route.params || {};
  const [assessment, setAssessment] = useState<AssessmentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadResult() {
      if (!id) {
        setError("Invalid assessment ID.");
        setLoading(false);
        return;
      }
      try {
        const data = await mobileApi.getAssessmentDetail(id);
        setAssessment(data);
      } catch (err: any) {
        setError(err.message || "Failed to load assessment.");
      } finally {
        setLoading(false);
      }
    }
    loadResult();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.teal} />
        <Text style={styles.loadingText}>Compiling machine learning prediction...</Text>
      </View>
    );
  }

  if (error || !assessment) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error || "Result not found."}</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate("Dashboard")}>
          <Text style={styles.backBtnText}>Return to Dashboard</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const probPercent = Math.round(assessment.probability * 100);
  const factors = assessment.feature_importance_snapshot?.contributing_factors || [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      {/* Risk Outcome Card */}
      <View
        style={[
          styles.heroCard,
          assessment.risk_level === "High" && styles.heroHigh,
          assessment.risk_level === "Moderate" && styles.heroModerate,
        ]}
      >
        <Text style={styles.heroSub}>SCREENING OUTCOME #{assessment.id}</Text>
        <Text style={styles.heroTitle}>{assessment.prediction_label}</Text>

        <View style={styles.gaugeRow}>
          <View style={styles.gaugeBox}>
            <Text style={styles.gaugeVal}>{probPercent}%</Text>
            <Text style={styles.gaugeLabel}>Risk Probability</Text>
          </View>
          <View style={styles.badgeWrap}>
            <RiskBadge riskLevel={assessment.risk_level} />
          </View>
        </View>

        <Text style={styles.modelMeta}>
          Evaluated by {assessment.model_type} (v{assessment.model_version})
        </Text>
      </View>

      <MedicalDisclaimer />

      {/* Contributing Factors */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Contributing Lifestyle Factors</Text>
        <Text style={styles.cardSub}>Influential patterns from your submitted survey</Text>

        {factors.map((fac, idx) => (
          <View key={idx} style={styles.factorItem}>
            <View style={styles.factorHeader}>
              <Text style={styles.factorName}>{fac.factor}</Text>
              <Text style={styles.factorImpact}>{fac.impact}</Text>
            </View>
            <Text style={styles.factorDetail}>{fac.detail}</Text>
          </View>
        ))}
      </View>

      {/* Recommendations */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Personalized Self-Care Insights</Text>
        <View style={styles.tipBox}>
          <Text style={styles.tipTitle}>• Sleep Rhythm Routine</Text>
          <Text style={styles.tipText}>
            Establish a regular sleep schedule. Aim for 7-8 hours to improve resilience against academic stress.
          </Text>
        </View>
        <View style={styles.tipBox}>
          <Text style={styles.tipTitle}>• Interval Study Workload</Text>
          <Text style={styles.tipText}>
            Break demanding assignments into 25-minute Pomodoro focus blocks to prevent fatigue.
          </Text>
        </View>
      </View>

      {/* Emergency Crisis Contact */}
      <View style={styles.helplineCard}>
        <Text style={styles.helplineTitle}>Need to talk to someone confidentially?</Text>
        <Text style={styles.helplineSub}>Immediate free support is available 24/7:</Text>

        <View style={styles.btnRow}>
          <TouchableOpacity
            style={styles.callBtn}
            onPress={() => Linking.openURL("tel:988")}
          >
            <Text style={styles.callBtnText}>Call 988 (US/CA)</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.callBtnTeal}
            onPress={() => Linking.openURL("tel:14416")}
          >
            <Text style={styles.callBtnText}>Call 14416 (Tele-MANAS)</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Navigation Return */}
      <TouchableOpacity
        style={styles.returnBtn}
        onPress={() => navigation.navigate("Dashboard")}
      >
        <Text style={styles.returnBtnText}>Return to Dashboard</Text>
      </TouchableOpacity>
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
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 12,
    color: colors.textMuted,
  },
  errorText: {
    color: "#BE123C",
    fontSize: 13,
    marginBottom: 16,
  },
  backBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  heroCard: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 20,
  },
  heroHigh: {
    backgroundColor: "#881337",
  },
  heroModerate: {
    backgroundColor: "#78350F",
  },
  heroSub: {
    color: "#94A3B8",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: 4,
  },
  gaugeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 14,
    backgroundColor: "rgba(0,0,0,0.2)",
    padding: 12,
    borderRadius: 12,
  },
  gaugeBox: {},
  gaugeVal: {
    fontSize: 28,
    fontWeight: "900",
    color: colors.tealLight,
  },
  gaugeLabel: {
    fontSize: 10,
    color: "#CBD5E1",
  },
  badgeWrap: {},
  modelMeta: {
    fontSize: 10,
    color: "#94A3B8",
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginVertical: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.text,
  },
  cardSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
    marginBottom: 10,
  },
  factorItem: {
    backgroundColor: "#F8FAFC",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 8,
  },
  factorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  factorName: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text,
  },
  factorImpact: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.moderateRisk,
  },
  factorDetail: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  tipBox: {
    paddingVertical: 6,
  },
  tipTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text,
  },
  tipText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  helplineCard: {
    backgroundColor: "#EEF2FF",
    borderColor: "#C7D2FE",
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginVertical: 8,
  },
  helplineTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#312E81",
  },
  helplineSub: {
    fontSize: 11,
    color: "#4338CA",
    marginTop: 2,
    marginBottom: 10,
  },
  btnRow: {
    flexDirection: "row",
    gap: 8,
  },
  callBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  callBtnTeal: {
    flex: 1,
    backgroundColor: colors.teal,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  callBtnText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  returnBtn: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  returnBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textSecondary,
  },
});
