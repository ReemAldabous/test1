import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { PrescriptionCard } from "@/components/PrescriptionCard";
import { useApp } from "@/context/AppContext";

export default function PrescriptionsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === "dark" ? "dark" : "light"];
  const insets = useSafeAreaInsets();
  const { prescriptions, refreshPrescriptions, deleteUserPrescription } =
    useApp();
  const [refreshing, setRefreshing] = useState(false);

  const topPadding = insets.top + (Platform.OS === "web" ? 67 : 0);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshPrescriptions();
    setRefreshing(false);
  };

  const handleDelete = (rxId: string, name: string) => {
    Alert.alert("Remove Prescription", `Remove "${name}" from your schedule?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          void (async () => {
            try {
              await deleteUserPrescription(rxId);
            } catch (error) {
              const message =
                error instanceof Error && error.message
                  ? error.message
                  : "Could not delete prescription. Please try again.";
              Alert.alert("Delete failed", message);
            }
          })();
        },
      },
    ]);
  };

  const handleEdit = (rxId: string) => {
    router.push({
      pathname: "/prescription/new",
      params: { prescriptionId: rxId },
    });
  };

  const active = prescriptions.filter(
    (rx) => !rx.endDate || new Date(rx.endDate) >= new Date(),
  );
  const completed = prescriptions.filter(
    (rx) => rx.endDate && new Date(rx.endDate) < new Date(),
  );
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: topPadding,
            backgroundColor: colors.surface,
            borderBottomColor: colors.borderLight,
          },
        ]}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>
              Prescription Schedule
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {active.length} active prescription
              {active.length !== 1 ? "s" : ""}
            </Text>
          </View>
          <Pressable
            onPress={() => router.push("/prescription/new")}
            style={({ pressed }) => [
              styles.addBtn,
              { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Feather name="plus" size={18} color="#fff" />
            <Text style={styles.addBtnText}>Add</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {active.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View
                style={[styles.sectionDot, { backgroundColor: colors.success }]}
              />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Active
              </Text>
            </View>
            {active.map((rx) => (
              <View key={rx.id} style={styles.cardWrap}>
                <PrescriptionCard
                  prescription={rx}
                  onPress={() =>
                    router.push({
                      pathname: "/medicine/[id]",
                      params: { id: rx.medicineId, prescriptionId: rx.id },
                    })
                  }
                />
                <Pressable
                  onPress={() => handleEdit(rx.id)}
                  style={({ pressed }) => [
                    styles.editBtn,
                    {
                      backgroundColor: colors.primary + "12",
                      opacity: pressed ? 0.6 : 1,
                    },
                  ]}
                  hitSlop={4}
                >
                  <Feather name="edit-2" size={14} color={colors.primary} />
                </Pressable>
                <Pressable
                  onPress={() => handleDelete(rx.id, rx.medicine.name)}
                  style={({ pressed }) => [
                    styles.deleteBtn,
                    {
                      backgroundColor: "#FF3B3010",
                      opacity: pressed ? 0.6 : 1,
                    },
                  ]}
                  hitSlop={4}
                >
                  <Feather name="trash-2" size={14} color="#FF3B30" />
                </Pressable>
              </View>
            ))}
          </View>
        )}

        {completed.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View
                style={[
                  styles.sectionDot,
                  { backgroundColor: colors.textMuted },
                ]}
              />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Completed
              </Text>
            </View>
            {completed.map((rx) => (
              <View key={rx.id} style={styles.cardWrap}>
                <PrescriptionCard
                  prescription={rx}
                  onPress={() =>
                    router.push({
                      pathname: "/medicine/[id]",
                      params: { id: rx.medicineId, prescriptionId: rx.id },
                    })
                  }
                />
                <Pressable
                  onPress={() => handleEdit(rx.id)}
                  style={({ pressed }) => [
                    styles.editBtn,
                    {
                      backgroundColor: colors.primary + "12",
                      opacity: pressed ? 0.6 : 1,
                    },
                  ]}
                  hitSlop={4}
                >
                  <Feather name="edit-2" size={14} color={colors.primary} />
                </Pressable>
                <Pressable
                  onPress={() => handleDelete(rx.id, rx.medicine.name)}
                  style={({ pressed }) => [
                    styles.deleteBtn,
                    {
                      backgroundColor: "#FF3B3010",
                      opacity: pressed ? 0.6 : 1,
                    },
                  ]}
                  hitSlop={4}
                >
                  <Feather name="trash-2" size={14} color="#FF3B30" />
                </Pressable>
              </View>
            ))}
          </View>
        )}

        {prescriptions.length === 0 && (
          <View
            style={[
              styles.emptyState,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Feather name="clipboard" size={40} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No Prescriptions Yet
            </Text>
            <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
              Tap "Add" to schedule your own medications, or your doctor can add
              them for you.
            </Text>
            <Pressable
              onPress={() => router.push("/prescription/new")}
              style={({ pressed }) => [
                styles.emptyAddBtn,
                { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Feather name="plus" size={16} color="#fff" />
              <Text style={styles.emptyAddText}>Add Prescription</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  title: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
    marginTop: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  addBtnText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  cardWrap: {
    position: "relative",
  },
  deleteBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  editBtn: {
    position: "absolute",
    top: 10,
    right: 46,
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 14,
    marginTop: 4,
  },
  emptyAddText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
    gap: 8,
  },
  section: {
    gap: 4,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  emptyDesc: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
});
