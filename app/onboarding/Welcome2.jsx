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
import { images } from "@/constants/images";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from "expo-router";

export default function Welcome() {
  const router = useRouter();

  const handleCompleteOnboarding = async () => {
    try {
      // Save onboarding status
      await AsyncStorage.setItem('onboardingDone', 'true');
      router.replace('/(tabs)'); // Navigate to the main app screen
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Hide the status bar completely */}
      <StatusBar hidden/>

      <ImageBackground
        source={images.onboarding2}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <SafeAreaView style={styles.contentContainer}>
          <View style={styles.headingContainer}>  
            <Text style={styles.heading}>ROLL CALL</Text>
            <Text style={styles.heading2}>Track your attendance</Text>
          </View>
          
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
    justifyContent: "space-between", // Position at the bottom
    paddingBottom: 60,
    paddingHorizontal: 24,
  },
  headingContainer: {
    alignItems: "center",
    marginTop: 420,
    // marginBottom: 20,
  },
  buttonContainer: {
    width: "100%",
  },
  button: {
    backgroundColor: "#1E90FF",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "600",
  },
  heading: {
    fontSize: 34,
    fontWeight: "bold",
    color: "#fff",
    // marginBottom: ,
    textAlign: "center",
  },
  heading2: {
    fontSize: 24,
    fontWeight: "light",
    color: "#999",
    marginBottom: 20,
    textAlign: "center",
  },
});
