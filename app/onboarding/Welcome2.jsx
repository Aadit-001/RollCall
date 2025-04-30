import React from "react";
import {
  SafeAreaView,
  StyleSheet,
  View,
  ImageBackground,
  Text,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { images } from "@/constants/images";

export default function Welcome2() {
  const router = useRouter();

  const handleCompleteOnboarding = async () => {
    try {
      await AsyncStorage.setItem("onboardingDone", "true"); // Mark onboarding as complete
      router.replace("../auth/Register"); // Navigate to the main app screen
    } catch (error) {
      console.error("Error saving onboarding status:", error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Hide the status bar completely */}
      <StatusBar hidden />

      <ImageBackground
        source={images.onboarding2}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <SafeAreaView style={styles.contentContainer}>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={handleCompleteOnboarding}>
              <Text style={styles.buttonText}>Get Started</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  contentContainer: {
    flex: 1,
    justifyContent: "flex-end", // Position at the bottom
    paddingBottom: 60,
    paddingHorizontal: 24,
  },
  buttonContainer: {
    width: "100%",
  },
  button: {
    backgroundColor: "#1E90FF",
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: "center",
    marginBottom: 60,
    width: "80%",
    alignSelf: "center",
  },
  buttonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "600",
  },
});