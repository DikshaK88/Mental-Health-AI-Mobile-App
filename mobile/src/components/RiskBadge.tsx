import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../theme/colors";

export function RiskBadge({ riskLevel }: { riskLevel: "Low" | "Moderate" | "High" | string }) {
  let bg = colors.lowRiskLight;
  let text = colors.lowRisk;

  if (riskLevel === "High") {
    bg = colors.highRiskLight;
    text = colors.highRisk;
  } else if (riskLevel === "Moderate") {
    bg = colors.moderateRiskLight;
    text = colors.moderateRisk;
  }

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: text }]}>{riskLevel} Risk</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
});
