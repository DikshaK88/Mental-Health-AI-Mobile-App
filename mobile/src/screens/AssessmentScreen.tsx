import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert as RNAlert,
} from "react-native";
import { colors } from "../theme/colors";
import { mobileApi } from "../services/api";
import { AssessmentCreate } from "../types";

export function AssessmentScreen({ navigation }: any) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<AssessmentCreate>({
    age: 21,
    gender: "Male",
    academic_pressure: 3,
    study_satisfaction: 3,
    sleep_duration: "7-8 hours",
    study_hours: 6,
    financial_stress: 3,
    social_support: "Medium",
    family_history: "No",
    attendance: 85,
  });

  const update = <K extends keyof AssessmentCreate>(key: K, val: AssessmentCreate[K]) => {
    setFormData((prev) => ({ ...prev, [key]: val }));
    setError(null);
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (formData.age < 16 || formData.age > 100) {
        setError("Age must be between 16 and 100 years.");
        return;
      }
    }
    setError(null);
    setCurrentStep((prev) => Math.min(prev + 1, 4));
  };

  const handlePrev = () => {
    setError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await mobileApi.createAssessment(formData);
      navigation.navigate("Result", { id: result.id });
    } catch (err: any) {
      setError(err.message || "Failed to submit assessment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      {/* Progress Card */}
      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.stepTag}>STEP {currentStep} OF 4</Text>
          <Text style={styles.percentText}>{currentStep * 25}% Complete</Text>
        </View>
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${currentStep * 25}%` }]} />
        </View>
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* STEP 1 */}
      {currentStep === 1 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Demographics & Daily Sleep</Text>
          <Text style={styles.cardSub}>Basic physiological and rest factors</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Age (Years)</Text>
            <TextInput
              style={styles.input}
              value={String(formData.age)}
              onChangeText={(t) => update("age", parseInt(t) || 0)}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Gender Identity</Text>
            <View style={styles.chipRow}>
              {["Male", "Female", "Other"].map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.chip, formData.gender === g && styles.chipActive]}
                  onPress={() => update("gender", g)}
                >
                  <Text style={[styles.chipText, formData.gender === g && styles.chipTextActive]}>
                    {g}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Daily Sleep Duration</Text>
            <View style={styles.chipGrid}>
              {["Less than 5 hours", "5-6 hours", "7-8 hours", "More than 8 hours"].map((dur) => (
                <TouchableOpacity
                  key={dur}
                  style={[styles.chipLarge, formData.sleep_duration === dur && styles.chipActive]}
                  onPress={() => update("sleep_duration", dur)}
                >
                  <Text
                    style={[styles.chipText, formData.sleep_duration === dur && styles.chipTextActive]}
                  >
                    {dur}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* STEP 2 */}
      {currentStep === 2 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Academic & Workload</Text>
          <Text style={styles.cardSub}>Pressure and study hours rating</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Academic / Work Pressure (1 to 5)</Text>
            <View style={styles.chipRow}>
              {[1, 2, 3, 4, 5].map((num) => (
                <TouchableOpacity
                  key={num}
                  style={[styles.chipSquare, formData.academic_pressure === num && styles.chipActive]}
                  onPress={() => update("academic_pressure", num)}
                >
                  <Text
                    style={[styles.chipText, formData.academic_pressure === num && styles.chipTextActive]}
                  >
                    {num}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.hint}>1: Very Low • 3: Moderate • 5: Extreme</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Study / Work Satisfaction (1 to 5)</Text>
            <View style={styles.chipRow}>
              {[1, 2, 3, 4, 5].map((num) => (
                <TouchableOpacity
                  key={num}
                  style={[styles.chipSquare, formData.study_satisfaction === num && styles.chipActive]}
                  onPress={() => update("study_satisfaction", num)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      formData.study_satisfaction === num && styles.chipTextActive,
                    ]}
                  >
                    {num}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Daily Study / Focus Hours</Text>
            <TextInput
              style={styles.input}
              value={String(formData.study_hours)}
              onChangeText={(t) => update("study_hours", parseInt(t) || 0)}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Attendance Rate (%)</Text>
            <TextInput
              style={styles.input}
              value={String(formData.attendance)}
              onChangeText={(t) => update("attendance", parseInt(t) || 0)}
              keyboardType="numeric"
            />
          </View>
        </View>
      )}

      {/* STEP 3 */}
      {currentStep === 3 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Social & Financial Context</Text>
          <Text style={styles.cardSub}>Support networks and economic stress</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Financial Strain / Pressure (1 to 5)</Text>
            <View style={styles.chipRow}>
              {[1, 2, 3, 4, 5].map((num) => (
                <TouchableOpacity
                  key={num}
                  style={[styles.chipSquare, formData.financial_stress === num && styles.chipActive]}
                  onPress={() => update("financial_stress", num)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      formData.financial_stress === num && styles.chipTextActive,
                    ]}
                  >
                    {num}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Social Support Availability</Text>
            <View style={styles.chipRow}>
              {["Low", "Medium", "High"].map((lvl) => (
                <TouchableOpacity
                  key={lvl}
                  style={[styles.chip, formData.social_support === lvl && styles.chipActive]}
                  onPress={() => update("social_support", lvl)}
                >
                  <Text
                    style={[styles.chipText, formData.social_support === lvl && styles.chipTextActive]}
                  >
                    {lvl}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Family History of Mental Health Struggles</Text>
            <View style={styles.chipRow}>
              {["No", "Yes"].map((val) => (
                <TouchableOpacity
                  key={val}
                  style={[styles.chip, formData.family_history === val && styles.chipActive]}
                  onPress={() => update("family_history", val)}
                >
                  <Text
                    style={[styles.chipText, formData.family_history === val && styles.chipTextActive]}
                  >
                    {val === "Yes" ? "Yes" : "No"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* STEP 4: Review */}
      {currentStep === 4 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Verify Your Responses</Text>
          <Text style={styles.cardSub}>Review parameters before executing ML model</Text>

          <View style={styles.summaryBox}>
            <Text style={styles.summaryRow}>
              Age: <Text style={styles.bold}>{formData.age}</Text> • Gender:{" "}
              <Text style={styles.bold}>{formData.gender}</Text>
            </Text>
            <Text style={styles.summaryRow}>
              Sleep: <Text style={styles.bold}>{formData.sleep_duration}</Text>
            </Text>
            <Text style={styles.summaryRow}>
              Academic Stress: <Text style={styles.bold}>{formData.academic_pressure} / 5</Text>
            </Text>
            <Text style={styles.summaryRow}>
              Study Hours: <Text style={styles.bold}>{formData.study_hours} hrs/day</Text>
            </Text>
            <Text style={styles.summaryRow}>
              Attendance: <Text style={styles.bold}>{formData.attendance}%</Text>
            </Text>
            <Text style={styles.summaryRow}>
              Financial Stress: <Text style={styles.bold}>{formData.financial_stress} / 5</Text>
            </Text>
            <Text style={styles.summaryRow}>
              Social Support: <Text style={styles.bold}>{formData.social_support}</Text>
            </Text>
          </View>
        </View>
      )}

      {/* Navigation Buttons */}
      <View style={styles.btnRow}>
        {currentStep > 1 && (
          <TouchableOpacity style={styles.prevBtn} onPress={handlePrev}>
            <Text style={styles.prevBtnText}>← Previous</Text>
          </TouchableOpacity>
        )}

        {currentStep < 4 ? (
          <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
            <Text style={styles.nextBtnText}>Continue →</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitBtnText}>Submit & Analyze Risk ✨</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
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
  progressCard: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  stepTag: {
    color: colors.tealLight,
    fontSize: 10,
    fontWeight: "700",
  },
  percentText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: 6,
    backgroundColor: colors.teal,
    borderRadius: 3,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
  },
  cardSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
    marginBottom: 16,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary,
    marginBottom: 8,
  },
  hint: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 4,
  },
  input: {
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.text,
  },
  chipRow: {
    flexDirection: "row",
    gap: 8,
  },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  chipLarge: {
    width: "48%",
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 8,
    alignItems: "center",
  },
  chipSquare: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  chipActive: {
    backgroundColor: colors.tealLight,
    borderColor: colors.teal,
  },
  chipText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "600",
    textAlign: "center",
  },
  chipTextActive: {
    color: colors.tealDark,
    fontWeight: "800",
  },
  summaryBox: {
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  summaryRow: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  bold: {
    fontWeight: "700",
    color: colors.text,
  },
  btnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  prevBtn: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  prevBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  nextBtn: {
    flex: 2,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  nextBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  submitBtn: {
    flex: 2,
    backgroundColor: colors.teal,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  errorBox: {
    backgroundColor: "#FFE4E6",
    borderColor: "#FECDD3",
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  errorText: {
    color: "#BE123C",
    fontSize: 12,
    fontWeight: "500",
  },
});
