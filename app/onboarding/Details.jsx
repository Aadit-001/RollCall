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
  Alert,
} from "react-native";
import { router } from "expo-router";
import { images } from "@/constants/images";
import { BlurView } from "expo-blur";

export default function Onboarding() {
  const [name, setName] = useState("");
  const [attendanceCriteria, setAttendanceCriteria] = useState(75);

 const handleNext = () => {
   if (name === "") {
     Alert.alert("Please enter a name");
     return;
   }
   if(attendanceCriteria < 0 || attendanceCriteria > 100) {
     Alert.alert("Please enter a valid attendance criteria");
     return;
   }
   router.push({
     pathname: "/auth/Register",
     params: { name, attendanceCriteria },
   });
 };

  const increaseAttendance = () => {
    if (attendanceCriteria < 100) {
      setAttendanceCriteria((prev) => Math.min(100, prev + 5));
    }
  };

  const decreaseAttendance = () => {
    if (attendanceCriteria > 0) {
      setAttendanceCriteria((prev) => Math.max(0, prev - 5));
    }
  };

  // Predefined attendance options
  const attendanceOptions = [50, 60, 75, 85, 90];

  return (
    <View style={styles.container}>
      {/* Hide the status bar completely */}
      <StatusBar hidden />

      <ImageBackground
        source={images.imag3}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <SafeAreaView style={styles.contentContainer}>
          <BlurView intensity={40} tint="dark" style={styles.formContainer}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your name"
              value={name}
              onChangeText={setName}
              placeholderTextColor="#aaa"
            />

            <Text style={styles.label}>Attendance Criteria (%)</Text>

            {/* Custom Attendance Selector */}
            <View style={styles.attendanceContainer}>
              <TouchableOpacity
                style={styles.attendanceButton}
                onPress={decreaseAttendance}
              >
                <Text style={styles.attendanceButtonText}>-</Text>
              </TouchableOpacity>

              <View style={styles.attendanceValueContainer}>
                <Text style={styles.attendanceValueText}>
                  {attendanceCriteria}%
                </Text>
              </View>

              <TouchableOpacity
                style={styles.attendanceButton}
                onPress={increaseAttendance}
              >
                <Text style={styles.attendanceButtonText}>+</Text>
              </TouchableOpacity>
            </View>

            {/* Predefined attendance percentage buttons */}
            <View style={styles.quickOptionsContainer}>
              <Text style={styles.quickOptionsLabel}>Quick Select:</Text>
              <View style={styles.quickOptions}>
                {attendanceOptions.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.quickOptionButton,
                      attendanceCriteria === option &&
                        styles.quickOptionButtonActive,
                    ]}
                    onPress={() => setAttendanceCriteria(option)}
                  >
                    <Text
                      style={[
                        styles.quickOptionText,
                        attendanceCriteria === option &&
                          styles.quickOptionTextActive,
                      ]}
                    >
                      {option}%
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </BlurView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.button}
              onPress={handleNext}
              disabled={!name.trim()}
            >
              <Text style={styles.buttonText}>Next</Text>
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
    // marginTop: 30,
    paddingTop: 30,
    paddingBottom: 40,
    paddingHorizontal: 30,
  },
  contentContainer: {
    flex: 1,
    justifyContent: "flex-end",
    paddingBottom: 60,
    paddingHorizontal: 24,
  },
  formContainer: {
    backgroundColor: "#1E90FF",
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    overflow: "hidden",
    borderColor: "#fff",
    borderWidth: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#fff",
  },
  input: {
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#fff",
  },
  attendanceContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  attendanceButton: {
    backgroundColor: "#1E90FF",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  attendanceButtonText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  attendanceValueContainer: {
    backgroundColor: "#fff",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    minWidth: 100,
    alignItems: "center",
  },
  attendanceValueText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1E90FF",
  },
  quickOptionsContainer: {
    marginTop: 8,
  },
  quickOptionsLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  quickOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  quickOptionButton: {
    backgroundColor: "#f0f0f0",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  quickOptionButtonActive: {
    backgroundColor: "#1E90FF",
    borderColor: "#1E90FF",
  },
  quickOptionText: {
    color: "#666",
    fontWeight: "500",
  },
  quickOptionTextActive: {
    color: "#fff",
  },
  buttonContainer: {
    width: "100%",
  },
  button: {
    backgroundColor: "#1E90FF",
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: "center",
    marginBottom: 20,
    width: "94%",
    alignSelf: "center",
  },
  buttonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "600",
  },
});
