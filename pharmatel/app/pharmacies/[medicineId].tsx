import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
  Pressable,
} from "react-native";
import Colors from "@/constants/colors";
import { LeafletMap } from "@/components/LeafletMap";
import { PharmacyCard } from "@/components/PharmacyCard";
import { fetchPharmaciesForMedicine } from "@/services/backendCatalog";
import type { Pharmacy } from "@/models";

export default function PharmaciesScreen() {
  const { medicineId, medicineName } = useLocalSearchParams<{
    medicineId: string;
    medicineName: string;
  }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === "dark" ? "dark" : "light"];
  const [filterInStock, setFilterInStock] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [allPharmacies, setAllPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!medicineId) {
        setAllPharmacies([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const data = await fetchPharmaciesForMedicine(medicineId);
        if (!cancelled) {
          setAllPharmacies(data);
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : "Failed to load pharmacies";
          setError(message);
          setAllPharmacies([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [medicineId]);

  const pharmacies = filterInStock
    ? allPharmacies.filter((p) => p.inStock)
    : allPharmacies;

  const inStockCount = allPharmacies.filter((p) => p.inStock).length;
  const pharmaciesWithCoordinates = pharmacies.filter(
    (item) => item.lat != null && item.lng != null,
  );

  // Center map on selected pharmacy or average of all
  const centerLat = selectedId
    ? (allPharmacies.find((p) => p.id === selectedId)?.lat ?? 40.7389)
    : (pharmaciesWithCoordinates[0]?.lat ?? 40.7389);
  const centerLng = selectedId
    ? (allPharmacies.find((p) => p.id === selectedId)?.lng ?? -73.9903)
    : (pharmaciesWithCoordinates[0]?.lng ?? -73.9903);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Summary header */}
        <View style={[styles.summaryCard, { backgroundColor: colors.primary }]}>
          <View style={styles.summaryLeft}>
            <Text style={styles.summaryMedicine}>
              {medicineName ?? "Medication"}
            </Text>
            <Text style={styles.summarySubtitle}>
              Available at nearby pharmacies
            </Text>
          </View>
          <View style={styles.summaryRight}>
            <Text style={styles.summaryCount}>{inStockCount}</Text>
            <Text style={styles.summaryCountLabel}>in stock</Text>
          </View>
        </View>

        {/* Filter row */}
        <View style={styles.filterRow}>
          <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>
            {pharmacies.length} pharmacies found
          </Text>
          <Pressable
            onPress={() => setFilterInStock((v) => !v)}
            style={[
              styles.filterBtn,
              {
                backgroundColor: filterInStock
                  ? colors.success + "20"
                  : colors.surfaceSecondary,
                borderColor: filterInStock ? colors.success : colors.border,
              },
            ]}
          >
            <Feather
              name="filter"
              size={13}
              color={filterInStock ? colors.success : colors.textMuted}
            />
            <Text
              style={[
                styles.filterBtnText,
                {
                  color: filterInStock ? colors.success : colors.textSecondary,
                },
              ]}
            >
              {filterInStock ? "In Stock Only" : "All Pharmacies"}
            </Text>
          </Pressable>
        </View>

        {loading && (
          <View style={styles.loadingState}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.filterLabel, { color: colors.textMuted }]}>
              Loading pharmacies...
            </Text>
          </View>
        )}

        {!!error && (
          <View
            style={[
              styles.infoBanner,
              {
                backgroundColor: colors.error + "10",
                borderColor: colors.error + "35",
              },
            ]}
          >
            <Feather name="alert-triangle" size={14} color={colors.error} />
            <Text style={[styles.infoText, { color: colors.error }]}>
              {error}
            </Text>
          </View>
        )}

        {pharmaciesWithCoordinates.length > 0 && (
          <>
            {/* Leaflet map */}
            <View style={[styles.mapContainer, { borderColor: colors.border }]}>
              <LeafletMap
                pharmacies={pharmaciesWithCoordinates}
                centerLat={centerLat}
                centerLng={centerLng}
                height={280}
              />
              <View
                style={[
                  styles.mapLegend,
                  { backgroundColor: colors.surface + "EE" },
                ]}
              >
                <View style={styles.legendItem}>
                  <View
                    style={[
                      styles.legendDot,
                      { backgroundColor: colors.success },
                    ]}
                  />
                  <Text
                    style={[styles.legendText, { color: colors.textSecondary }]}
                  >
                    In Stock
                  </Text>
                </View>
                <View style={styles.legendItem}>
                  <View
                    style={[
                      styles.legendDot,
                      { backgroundColor: colors.error },
                    ]}
                  />
                  <Text
                    style={[styles.legendText, { color: colors.textSecondary }]}
                  >
                    Out of Stock
                  </Text>
                </View>
              </View>
            </View>

            <View
              style={[
                styles.infoBanner,
                {
                  backgroundColor: colors.primary + "10",
                  borderColor: colors.primary + "25",
                },
              ]}
            >
              <Feather name="info" size={14} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.primary }]}>
                Tap a card to highlight a pharmacy on the map.
              </Text>
            </View>
          </>
        )}

        {pharmaciesWithCoordinates.length === 0 && !loading && !error && (
          <View
            style={[
              styles.infoBanner,
              {
                backgroundColor: colors.surfaceSecondary,
                borderColor: colors.border,
              },
            ]}
          >
            <Feather name="map" size={14} color={colors.textMuted} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Map coordinates are not available from backend for these
              pharmacies yet.
            </Text>
          </View>
        )}

        {/* Pharmacy list */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Nearby Pharmacies
        </Text>

        {pharmacies.length === 0 ? (
          <View
            style={[
              styles.emptyState,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Feather name="map-pin" size={32} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No results
            </Text>
            <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
              No pharmacies have this medication in stock right now. Try
              removing the filter.
            </Text>
          </View>
        ) : (
          pharmacies.map((pharmacy) => (
            <PharmacyCard
              key={pharmacy.id}
              pharmacy={pharmacy}
              isSelected={selectedId === pharmacy.id}
              onPress={() =>
                setSelectedId((id) => (id === pharmacy.id ? null : pharmacy.id))
              }
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },
  summaryCard: {
    borderRadius: 18,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  summaryLeft: {
    flex: 1,
    gap: 4,
  },
  summaryMedicine: {
    color: "#fff",
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
  },
  summarySubtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  summaryRight: {
    alignItems: "center",
  },
  summaryCount: {
    color: "#fff",
    fontSize: 36,
    fontFamily: "Inter_700Bold",
    lineHeight: 40,
  },
  summaryCountLabel: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  filterLabel: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  filterBtnText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  mapContainer: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    position: "relative",
  },
  mapLegend: {
    position: "absolute",
    bottom: 10,
    left: 10,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  infoBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  loadingState: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 19,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
  },
  emptyState: {
    alignItems: "center",
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  emptyDesc: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
});
