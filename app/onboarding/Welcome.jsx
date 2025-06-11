import React from "react";
import {
  SafeAreaView,
  StyleSheet,
  View,
  ImageBackground,
  Text,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from "react-native";
import { Link } from "expo-router";
import { images } from "@/constants/images";
// import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Welcome() {
  return (
    <View style={styles.container}>
      {/* Hide the status bar completely */}
      <StatusBar hidden/>

      <ImageBackground
        source={images.onboarding1}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <SafeAreaView style={styles.contentContainer}>
          <View style={styles.dotContainer}>
            <View style={styles.dot1}/>
            <View style={styles.dot2}/>
            {/* <View style={styles.dot}/> */}
          </View>
          <View style={styles.buttonContainer}>
            <Link href="/onboarding/Welcome2" asChild>
              <TouchableOpacity style={styles.button}>
                <Text style={styles.buttonText}>Next</Text>
              </TouchableOpacity>
            </Link>
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
  dotContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  dot1: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#1E90FF",
    marginHorizontal: 4,
  },
  dot2: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#fff",
    marginHorizontal: 4,
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
});
