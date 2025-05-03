import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import React, { useState, useCallback } from "react";
import { FlatList, Pressable } from "react-native-gesture-handler";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter, useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import AttendancePercentageFinder from "@/components/AttendancePercentageFinder";

const getToday = () => {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return days[new Date().getDay()];
};

const Home = () => {
  const [lectures, setLectures] = useState([]);
  const [hasTimetable, setHasTimetable] = useState(false);
  const [showAttendanceFinder, setShowAttendanceFinder] = useState(false);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      const checkAttendancePercentage = async () => {
        try {
          const percentage = await AsyncStorage.getItem("percentage");
          if (!percentage) {
            setShowAttendanceFinder(true);
          }
        } catch (error) {
          console.error("Error checking attendance percentage:", error);
        }
      };
      checkAttendancePercentage();
      loadTodayLectures();
    }, [])
  );

  // Load today's lectures from timetable in AsyncStorage
  const loadTodayLectures = async () => {
    try {
      const timetableData = await AsyncStorage.getItem("timetable");
      console.log("timetableData", timetableData);
      if (timetableData) {
        const timetable = JSON.parse(timetableData);
        const today = getToday();
        const todayEntry = timetable.days?.find((d) => d.day === today);
        if (
          todayEntry &&
          todayEntry.subjects &&
          todayEntry.subjects.length > 0
        ) {
          setLectures(todayEntry.subjects);
          setHasTimetable(true);
        } else {
          setLectures([]);
          setHasTimetable(false);
        }
      } else {
        setLectures([]);
        setHasTimetable(false);
      }
    } catch (error) {
      setLectures([]);
      setHasTimetable(false);
      console.error("Error loading timetable:", error);
    }
  };

  // Logout and onboarding reset logic
  const deleteOnboardingData = async () => {
    try {
      await AsyncStorage.removeItem("onboardingDone");
      await AsyncStorage.removeItem("percentage");
      router.replace("/onboarding/Welcome");
    } catch (error) {
      console.error("Error deleting onboarding data:", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {showAttendanceFinder && (
        <AttendancePercentageFinder
          onClose={() => setShowAttendanceFinder(false)}
        />
      )}
      <FlatList
        ListHeaderComponent={
          <>
            {/* Welcome Box */}
            <Pressable style={styles.topBox} onPress={deleteOnboardingData}>
              <Text style={styles.topBoxText}>Welcome To</Text>
              <Text style={styles.topBoxTextName}>R O L L C A L L</Text>
            </Pressable>

            {/* Creative Timetable Button - MOVED UP */}
            <View style={styles.timetableButtonContainer}>
              <TouchableOpacity
                style={styles.timetableButton}
                onPress={() => router.push("/timetable")}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={["#4f6cff", "#3fa4ff"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  <View style={styles.buttonIconContainer}>
                    <Ionicons name="calendar" size={28} color="#fff" />
                  </View>
                  <View style={styles.buttonTextContainer}>
                    <Text style={styles.buttonTitle}>Manage Timetable</Text>
                    <Text style={styles.buttonSubtitle}>
                      Add or edit your schedule
                    </Text>
                  </View>
                  <View style={styles.buttonArrow}>
                    <Ionicons name="chevron-forward" size={24} color="#fff" />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Today's Lectures Title - MOVED DOWN */}
            <View style={styles.bottomBoxTittle}>
              <Text style={styles.bottomBoxTittleText}>Today's Lectures</Text>
            </View>
          </>
        }
        data={hasTimetable ? lectures : []}
        keyExtractor={(item, idx) => (item.id ? item.id : idx.toString())}
        renderItem={({ item }) => (
          <View style={styles.lectureCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.lectureName}>{item.name}</Text>
              {item.professor && (
                <Text style={styles.profName}>{item.professor}</Text>
              )}
              {item.startTime && item.endTime && (
                <Text style={styles.profName}>
                  {item.startTime} - {item.endTime}
                </Text>
              )}
            </View>
            <View style={styles.attendanceBtns}>
              <TouchableOpacity style={styles.attendanceBtnRed}>
                <MaterialIcons name="close" size={32} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.attendanceBtnGreen}>
                <MaterialIcons name="check" size={32} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          !hasTimetable && (
            <View style={styles.ttPlaceholderBox}>
              <Text style={styles.ttPlaceholderText}>
                Please add your TT first ……
              </Text>
            </View>
          )
        }
        contentContainerStyle={{ width: "95%", alignSelf: "center" }}
        style={{ flex: 1 }}
      />
      {/* Logout Button */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={deleteOnboardingData}
      >
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#181818",
    flex: 1,
  },
  logoutButton: {
    backgroundColor: "#FF0000",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
    marginHorizontal: 20,
    marginBottom: 100,
  },
  logoutButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  headerText: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
  },
  topBox: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#3fa4ff",
    height: 200,
    width: "95%",
    padding: 20,
    margin: 10,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
  topBoxText: {
    color: "#3fa4ff",
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
  },
  topBoxTextName: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "bold",
    letterSpacing: 4,
    textAlign: "center",
    marginTop: 4,
  },
  bottomBoxTittle: {
    backgroundColor: "transparent",
    width: "100%",
    height: 40,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  bottomBoxTittleText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  ttPlaceholderBox: {
    backgroundColor: "#222",
    borderRadius: 10,
    margin: 10,
    padding: 16,
    width: "95%",
    alignSelf: "center",
  },
  ttPlaceholderText: {
    color: "#aaa",
    fontSize: 16,
    textAlign: "center",
  },
  lectureCard: {
    backgroundColor: "#222",
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginBottom: 12,
    marginTop: 6,
  },
  lectureName: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  profName: {
    color: "#ccc",
    fontSize: 14,
    marginTop: 4,
  },
  attendanceBtns: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
  },
  attendanceBtnRed: {
    backgroundColor: "#e53935",
    borderRadius: 8,
    padding: 4,
    marginRight: 8,
  },
  attendanceBtnGreen: {
    backgroundColor: "#43a047",
    borderRadius: 8,
    padding: 4,
  },
  // New styles for the redesigned timetable button
  timetableButtonContainer: {
    marginTop: 20,
    marginHorizontal: 16,
    marginBottom: 30,
  },
  timetableButton: {
    borderRadius: 16,
    elevation: 4,
    shadowColor: "#3fa4ff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  buttonIconContainer: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  buttonTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  buttonSubtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    marginTop: 2,
  },
  buttonArrow: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 50,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  // Existing legacy styles
  scrolle: {},
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#222",
    marginTop: 10,
    marginBottom: 10,
    padding: 10,
    borderRadius: 10,
    width: "90%",
    alignSelf: "center",
  },
  addTTBtn: {
    backgroundColor: "#3fa4ff",
    borderRadius: 10,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 100,
    width: "90%",
    alignSelf: "center",
  },
  addTTBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
    textAlign: "center",
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#181818",
    borderTopWidth: 1,
    borderTopColor: "#222",
    height: 56,
    width: "100%",
    position: "absolute",
    bottom: 0,
    left: 0,
  },
  navIcon: {
    flex: 1,
    alignItems: "center",
  },
  attendanceContainer: {
    position: "absolute",
    flex: 1,
    backgroundColor: "transparent",
    padding: 16,
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
});
