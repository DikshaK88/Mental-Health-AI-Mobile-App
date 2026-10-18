import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Linking } from "react-native";
import { colors } from "../theme/colors";

export function MedicalDisclaimer() {
  const call988 = () => {
    Linking.openURL("tel:988");
  };

  const callTeleManas = () => {
    Linking.openURL("tel:14416");
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>EXPERIMENTAL SCREENING NOTICE</Text>
      <Text style={styles.body}>
        This application uses machine learning for screening decision support. It is not a clinical diagnosis or crisis service.
      </Text>
      <View style={styles.row}>
        <TouchableOpacity style={styles.btn} onPress={call988}>
          <Text style={styles.btnText}>Call 988 (US/CA)</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnSecondary} onPress={callTeleManas}>
          <Text style={styles.btnSecondaryText}>Call 14416 (India)</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FEF3C7",
    borderColor: "#FDE68A",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginVertical: 10,
  },
  title: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#92400E",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  body: {
    fontSize: 11,
    color: "#78350F",
    lineHeight: 16,
  },
  row: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  btn: {
    backgroundColor: "#B45309",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  btnText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  btnSecondary: {
    backgroundColor: "#FDE68A",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  btnSecondaryText: {
    color: "#78350F",
    fontSize: 10,
    fontWeight: "700",
  },
});
