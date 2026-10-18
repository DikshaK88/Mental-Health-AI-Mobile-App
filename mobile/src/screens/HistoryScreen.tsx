import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { colors } from "../theme/colors";
import { mobileApi } from "../services/api";
import { AssessmentHistoryItem } from "../types";
import { RiskBadge } from "../components/RiskBadge";

export function HistoryScreen({ navigation }: any) {
  const [items, setItems] = useState<AssessmentHistoryItem[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = async () => {
    try {
      const res = await mobileApi.getAssessmentHistory();
      setItems(res.items || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const filteredItems = items.filter((item) => {
    if (!filter) return true;
    return item.risk_level === filter;
  });

  return (
    <View style={styles.container}>
      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {["", "Low", "Moderate", "High"].map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f ? `${f} Risk` : "All Logs"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.teal} />
        </View>
      ) : filteredItems.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>No Assessments Found</Text>
          <Text style={styles.emptySub}>
            Take your first assessment to begin tracking your wellbeing trajectory.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => String(item.id)}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.teal]} />
          }
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate("Result", { id: item.id })}
            >
              <View style={styles.cardTop}>
                <Text style={styles.cardId}>#{item.id}</Text>
                <RiskBadge riskLevel={item.risk_level} />
              </View>

              <Text style={styles.cardTitle}>{item.prediction_label}</Text>
              <Text style={styles.cardMeta}>
                {new Date(item.created_at).toLocaleDateString()} • Score:{" "}
                {Math.round(item.probability * 100)}%
              </Text>

              <View style={styles.tagRow}>
                <Text style={styles.tag}>Sleep: {item.sleep_duration}</Text>
                <Text style={styles.tag}>Stress: {item.academic_pressure}/5</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  filterRow: {
    flexDirection: "row",
    padding: 12,
    gap: 8,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
  },
  filterChipActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: "#FFFFFF",
  },
  list: {
    padding: 16,
    gap: 12,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  emptySub: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  cardId: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textMuted,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.text,
  },
  cardMeta: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  tagRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: "#F1F5F9",
  },
  tag: {
    fontSize: 10,
    color: colors.textSecondary,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
});
