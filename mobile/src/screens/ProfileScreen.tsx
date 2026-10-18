import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert as RNAlert,
} from "react-native";
import { colors } from "../theme/colors";
import { useAuth } from "../context/AuthContext";
import { getApiBaseUrl, setApiBaseUrl } from "../services/api";

export function ProfileScreen() {
  const { user, logout } = useAuth();
  const [apiUrl, setApiUrl] = useState("");
  const [urlSaved, setUrlSaved] = useState(false);

  useEffect(() => {
    async function loadUrl() {
      const u = await getApiBaseUrl();
      setApiUrl(u);
    }
    loadUrl();
  }, []);

  const handleSaveUrl = async () => {
    await setApiBaseUrl(apiUrl);
    setUrlSaved(true);
    setTimeout(() => setUrlSaved(false), 2000);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      {/* User Card */}
      <View style={styles.userCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.full_name?.charAt(0) || "U"}</Text>
        </View>
        <Text style={styles.userName}>{user?.full_name}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{user?.role || "USER"} ACCOUNT</Text>
        </View>
      </View>

      {/* Backend API Configuration */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Backend Server Connection</Text>
        <Text style={styles.cardSub}>
          Android Emulator: 10.0.2.2:8000 • iOS Simulator: localhost:8000 • Physical Phone: Your PC&apos;s LAN IP
        </Text>

        <TextInput
          style={styles.input}
          value={apiUrl}
          onChangeText={setApiUrl}
          placeholder="http://10.0.2.2:8000/api/v1"
          autoCapitalize="none"
        />

        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveUrl}>
          <Text style={styles.saveBtnText}>{urlSaved ? "✓ URL Saved!" : "Update API Endpoint"}</Text>
        </TouchableOpacity>
      </View>

      {/* Privacy Notice */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Confidentiality & Privacy</Text>
        <Text style={styles.privacyText}>
          Your assessment responses and prediction outcomes are tied solely to your authenticated account. No sensitive survey answers are exposed through aggregate administrative statistics.
        </Text>
      </View>

      {/* Sign Out Button */}
      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutBtnText}>Sign Out of Account</Text>
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
  userCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.tealLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.tealDark,
  },
  userName: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
  },
  userEmail: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  badge: {
    marginTop: 10,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.text,
  },
  cardSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
    marginBottom: 10,
    lineHeight: 16,
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.text,
    marginBottom: 10,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  saveBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  privacyText: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
    marginTop: 4,
  },
  logoutBtn: {
    backgroundColor: "#FFE4E6",
    borderColor: "#FECDD3",
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 10,
  },
  logoutBtnText: {
    color: "#BE123C",
    fontSize: 13,
    fontWeight: "700",
  },
});
