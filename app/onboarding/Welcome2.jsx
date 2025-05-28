import React, { useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  View,
  ImageBackground,
  Text,
  TouchableOpacity,
  StatusBar,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { images } from "@/constants/images";

export default function Welcome2() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");

  const handleCompleteOnboarding = async () => {
    // Validate name
    // if (!name.trim()) {
    //   setNameError("Please enter your name");
    //   return;
    // }

    try {
      // Save both onboarding status and user name
      await AsyncStorage.multiSet([
        ["onboardingDone", "true"],
        // ["userName", name.trim()]
      ]);
      router.replace("./(tabs)/index"); // Navigate to the main app screen
    } catch (error) {
      console.error("Error saving data:", error);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        {/* Hide the status bar completely */}
        <StatusBar hidden />

        <ImageBackground
          source={images.onboarding2}
          style={styles.backgroundImage}
          resizeMode="cover"
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardAvoidingView}
          >
            <SafeAreaView style={styles.contentContainer}>
              <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.button} onPress={handleCompleteOnboarding}>
                  <Text style={styles.buttonText}>Get Started</Text>
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </KeyboardAvoidingView>
        </ImageBackground>
      </View>
    </TouchableWithoutFeedback>
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
  keyboardAvoidingView: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: "space-between", // Changed to space-between to accommodate name input at top
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  nameInputContainer: {
    marginTop: 60,
    alignItems: "center",
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 16,
    padding: 20,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  namePrompt: {
    fontSize: 18,
    color: "#555",
    marginBottom: 15,
    textAlign: "center",
  },
  input: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderColor: "#1E90FF",
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: "white",
    color: "#333",
  },
  errorText: {
    color: "red",
    marginTop: 5,
    fontSize: 14,
  },
  buttonContainer: {
    width: "100%",
  },
  button: {
    backgroundColor: "#1E90FF",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 40,
    width: "100%",
    alignSelf: "center",
  },
  buttonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "600",
  },
});