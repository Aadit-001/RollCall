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
            <View style={styles.dotContainer}>
                        <View style={styles.dot1}/>
                        <View style={styles.dot2}/>
                        {/* <View style={styles.dot}/> */}
                      </View>
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
    height: "100%",

    justifyContent: "center", // Position at the bottom
    // alignItems: "center",
    // paddingBottom: 60,
    paddingHorizontal: 24,
    paddingTop: 380,
  },
  headingContainer: {
    alignItems: "center",
    // marginTop: 420,
    // backgroundColor: "red",
    // marginBottom: 20,
  },
  buttonContainer: {
    width: "100%",
    marginTop: 110,
  },
  dotContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  dot1: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#fff",
    marginHorizontal: 4,
  },
  dot2: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#1E90FF",
    marginHorizontal: 4,
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
