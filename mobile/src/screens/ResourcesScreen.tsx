import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from "react-native";
import { colors } from "../theme/colors";

export function ResourcesScreen() {
  const helplines = [
    {
      country: "US / Canada",
      service: "988 Suicide & Crisis Lifeline",
      phone: "988",
      desc: "Free, confidential 24/7 call and text support.",
    },
    {
      country: "India (Govt. of India)",
      service: "Tele-MANAS Helpline",
      phone: "14416",
      desc: "Comprehensive 24/7 national mental health tele-counseling.",
    },
    {
      country: "India (Psychosocial)",
      service: "iCall Psychosocial (TISS)",
      phone: "9152987821",
      desc: "Counseling provided by professional psychologists (Mon-Sat).",
    },
    {
      country: "India (Crisis)",
      service: "Vandrevala Foundation",
      phone: "9999666555",
      desc: "24/7 free emotional counseling in multiple languages.",
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <Text style={styles.headerTitle}>Emergency & Wellness Directory</Text>
      <Text style={styles.headerSub}>
        Verified 24/7 crisis numbers. Tap any service to dial directly from your device.
      </Text>

      {helplines.map((h, i) => (
        <View key={i} style={styles.card}>
          <Text style={styles.countryBadge}>{h.country}</Text>
          <Text style={styles.serviceName}>{h.service}</Text>
          <Text style={styles.serviceDesc}>{h.desc}</Text>

          <TouchableOpacity
            style={styles.callBtn}
            onPress={() => Linking.openURL(`tel:${h.phone}`)}
          >
            <Text style={styles.callBtnText}>📞 Call {h.phone}</Text>
          </TouchableOpacity>
        </View>
      ))}

      {/* Coping framework card */}
      <View style={styles.copingCard}>
        <Text style={styles.copingTitle}>Self-Care Best Practices</Text>
        <Text style={styles.copingItem}>
          • <Text style={styles.bold}>Circadian Anchor:</Text> Wake at the same time daily to stabilize sleep architecture.
        </Text>
        <Text style={styles.copingItem}>
          • <Text style={styles.bold}>Interval Work:</Text> Study in 25-minute segments with 5-minute cognitive breaks.
        </Text>
        <Text style={styles.copingItem}>
          • <Text style={styles.bold}>Social Resilience:</Text> Maintain regular contact with peer study partners and family.
        </Text>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.primary,
  },
  headerSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 18,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  countryBadge: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.teal,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.text,
  },
  serviceDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: 12,
    lineHeight: 16,
  },
  callBtn: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  callBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  copingCard: {
    backgroundColor: "#F0FDFA",
    borderColor: "#CCFBF1",
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
  },
  copingTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F766E",
    marginBottom: 8,
  },
  copingItem: {
    fontSize: 11,
    color: "#115E59",
    marginBottom: 6,
    lineHeight: 16,
  },
  bold: {
    fontWeight: "700",
  },
});
