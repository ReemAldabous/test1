import {
  Feather,
  MaterialIcons,
  Ionicons,
  AntDesign,
} from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";

const { width, height } = Dimensions.get("window");

export default function WelcomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === "dark" ? "dark" : "light"];
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useApp();

  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(60)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.3)).current;
  const bounceAnim = React.useRef(new Animated.Value(0)).current;
  const rotateAnim = React.useRef(new Animated.Value(0)).current;
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 6,
          tension: 50,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 3,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.elastic(1.2),
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Pulse animation for CTA button
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();

    // Bounce animation for floating elements
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const goNext = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start(() => {
      if (isAuthenticated) {
        router.replace("/(tabs)");
      } else {
        router.replace("/login");
      }
    });
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["-360deg", "0deg"],
  });

  const bounce = bounceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          opacity: fadeAnim,
        },
      ]}
    >
      {/* Hero Section with Premium Design */}
      <LinearGradient
        colors={["#0B4FD6", "#2A6BFF", "#4D8DFF", "#77ADFF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop: insets.top + 20 }]}
      >
        {/* Animated Background Elements */}
        <Animated.View
          style={[
            styles.bgShape1,
            {
              transform: [
                { translateY: bounce },
                {
                  scale: scaleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 1],
                  }),
                },
              ],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.bgShape2,
            {
              transform: [
                {
                  translateY: bounceAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 15],
                  }),
                },
                { scale: scaleAnim },
              ],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.bgShape3,
            {
              transform: [
                {
                  translateY: bounceAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -8],
                  }),
                },
                {
                  rotate: rotateAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0deg", "180deg"],
                  }),
                },
              ],
            },
          ]}
        />

        {/* Logo Section */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              transform: [{ scale: scaleAnim }, { rotate }],
            },
          ]}
        >
          <LinearGradient
            colors={[
              "rgba(255,255,255,0.25)",
              "rgba(255,255,255,0.1)",
              "rgba(255,255,255,0.05)",
            ]}
            style={styles.logoGlow}
          >
            <View style={styles.logoInner}>
              <MaterialIcons name="local-pharmacy" size={36} color="#fff" />
              <View style={styles.logoSparkle}>
                <AntDesign name="star" size={13} color="#FFD700" />
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        <Animated.View
          style={{
            alignItems: "center",
            transform: [{ translateY: slideAnim }],
          }}
        >
          <Text style={styles.title}>PharmaTel</Text>
        </Animated.View>
      </LinearGradient>

      {/* Features Section */}
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Premium Feature Cards */}
        <Animated.View
          style={[
            styles.featureCard,
            styles.premiumCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.primary + "30",
              opacity: fadeAnim,
              transform: [
                {
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [80, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={[
              colors.primary + "20",
              colors.primary + "10",
              colors.primary + "05",
            ]}
            style={styles.featureIconContainer}
          >
            <Ionicons
              name="notifications-circle"
              size={36}
              color={colors.primary}
            />
            <View
              style={[
                styles.iconGlow,
                { backgroundColor: colors.primary + "40" },
              ]}
            />
          </LinearGradient>
          <View style={styles.featureContent}>
            <Text style={[styles.featureTitle, { color: colors.text }]}>
              🔔 Smart Notifications
            </Text>
            <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>
              AI-powered reminders that learn your patterns and never let you
              miss a dose.
            </Text>
          </View>
          <View
            style={[styles.featureBadge, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.badgeText}>AI</Text>
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.featureCard,
            styles.premiumCard,
            {
              backgroundColor: colors.surface,
              borderColor: "#86b8dc" + "30",
              opacity: fadeAnim,
              transform: [
                {
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [100, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={["#4F46E5" + "20", "#7873d8" + "10", "#4F46E5" + "05"]}
            style={styles.featureIconContainer}
          >
            <Feather name="activity" size={32} color="#4F46E5" />
            <View
              style={[styles.iconGlow, { backgroundColor: "#4F46E5" + "40" }]}
            />
          </LinearGradient>
          <View style={styles.featureContent}>
            <Text style={[styles.featureTitle, { color: colors.text }]}>
              📊 Health Analytics
            </Text>
            <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>
              Comprehensive insights into your medication adherence and health
              trends.
            </Text>
          </View>
          <View style={[styles.featureBadge, { backgroundColor: "#4F46E5" }]}>
            <Text style={styles.badgeText}>PRO</Text>
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.featureCard,
            styles.premiumCard,
            {
              backgroundColor: colors.surface,
              borderColor: "#4752d0" + "30",
              opacity: fadeAnim,
              transform: [
                {
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [120, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={["#3a4de0" + "20", "#576fd7" + "10", "#5ea8c8" + "05"]}
            style={styles.featureIconContainer}
          >
            <MaterialIcons name="location-on" size={32} color="#7ca0ee" />
            <View
              style={[styles.iconGlow, { backgroundColor: "#3d9fc6" + "40" }]}
            />
          </LinearGradient>
          <View style={styles.featureContent}>
            <Text style={[styles.featureTitle, { color: colors.text }]}>
              🗺️ Smart Locator
            </Text>
            <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>
              Instant pharmacy discovery with real-time inventory and
              directions.
            </Text>
          </View>
          <View style={[styles.featureBadge, { backgroundColor: "#2e4cd0" }]}>
            <Text style={styles.badgeText}>GPS</Text>
          </View>
        </Animated.View>

        {/* Premium CTA Button */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [
              {
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [140, 0],
                }),
              },
              { scale: pulseAnim },
            ],
          }}
        >
          <LinearGradient
            colors={["#0A4CCB", "#2F74FF", "#67A0FF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaGradient}
          >
            <Pressable
              onPress={goNext}
              style={({ pressed }) => [
                styles.ctaButton,
                {
                  transform: [{ scale: pressed ? 0.96 : 1 }],
                },
              ]}
            >
              <View style={styles.ctaContent}>
                <AntDesign name="rocket" size={24} color="#fff" />
                <Text style={styles.ctaText}>
                  {isAuthenticated
                    ? "Continue Your Journey"
                    : "Start Your Health Journey"}
                </Text>
                <MaterialIcons name="arrow-forward" size={24} color="#fff" />
              </View>
            </Pressable>
          </LinearGradient>
        </Animated.View>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  hero: {
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingHorizontal: 10,
    paddingBottom: 5,
    minHeight: height * 0.03,
    justifyContent: "center",
    alignItems: "center",
  },
  bgShape1: {
    position: "absolute",
    top: 20,
    left: 20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  bgShape2: {
    position: "absolute",
    top: 100,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  bgShape3: {
    position: "absolute",
    bottom: 80,
    left: 40,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  logoContainer: {
    marginBottom: 3,
    marginTop: 0.1,
  },
  logoGlow: {
    borderRadius: 25,
    padding: 3,
  },
  logoInner: {
    width: 80,
    height: 70,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  logoSparkle: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  title: {
    color: "#fff",
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.8,
    textAlign: "center",
    marginBottom: 12,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    color: "rgba(255,255,255,0.95)",
    fontSize: 16,
    lineHeight: 24,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 32,
    gap: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    marginBottom: 8,
  },
  featureCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  premiumCard: {
    borderWidth: 2,
    marginVertical: 4,
  },
  featureIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    position: "relative",
  },
  iconGlow: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 35,
    opacity: 0.3,
  },
  featureContent: {
    flex: 1,
    gap: 4,
  },
  featureTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  featureDesc: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: "Inter_400Regular",
  },
  featureBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    position: "absolute",
    top: -8,
    right: 16,
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
  ctaGradient: {
    borderRadius: 16,
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  ctaButton: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  ctaText: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
});
