import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  Platform,
  Modal,
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AttendancePercentageFinder({ onClose }) {
  const [attendanceCriteria, setAttendanceCriteria] = useState(75);

  const handleDone = async () => {
    if(attendanceCriteria < 0 || attendanceCriteria > 100) {
      Alert.alert("Please enter a valid attendance criteria");
      return;
    }

    try {
      // Save the attendance percentage to AsyncStorage
      await AsyncStorage.setItem('percentage', attendanceCriteria.toString());
      
      // Close the modal
      onClose();
    } catch (error) {
      console.error('Error saving attendance percentage:', error);
    }
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
    <Modal
      animationType="slide"
      transparent={true}
      visible={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.glassContainer}>
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

          {/* Done Button */}
          <TouchableOpacity
            style={styles.doneButton}
            onPress={handleDone}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(21, 20, 20, 0.79)',

  },
  glassContainer: {
    backgroundColor: 'rgb(6, 1, 1)', 
    borderRadius: 10,
    borderWidth: 1,
    padding: 20,
    width: '90%',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0, 0, 0, 0.2)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
      },
      android: {
        elevation: 5,
      },
    }),
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
    backgroundColor: "black",
    padding: 20,
    borderRadius: 15,
    // marginBottom: 20,
    overflow: "hidden",
    // borderColor: "#fff",
    borderWidth: 1,
    // position: "absolute",
    zIndex: 1090,
    shadowColor: "gray",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 1,
    shadowRadius: 3.84,
    elevation: 4,

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
  doneButton: {
    backgroundColor: "#1E90FF",
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 20,
    width: "100%",
  },
  doneButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "600",
  },
});
