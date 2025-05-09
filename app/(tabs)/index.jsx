import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import React, { useState, useCallback, useEffect } from "react";
import { FlatList, Pressable } from "react-native-gesture-handler";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter, useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import AttendancePercentageFinder from "@/components/AttendancePercentageFinder";
import { StatusBar } from "expo-status-bar";
import { Alert } from "react-native";

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

const getCurrentDateString = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0"); // Months are 0-indexed
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const Home = () => {
  const [lectures, setLectures] = useState([]);
  const [hasTimetable, setHasTimetable] = useState(false);
  const [showAttendanceFinder, setShowAttendanceFinder] = useState(false);
  const [name, setName] = useState("");
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
      const currentDateString = getCurrentDateString(); // Added back
      const lastAttendanceDate = await AsyncStorage.getItem(
        "lastAttendanceDate"
      ); // Added back

      if (lastAttendanceDate && lastAttendanceDate !== currentDateString) {
        // Day has changed, clear old statuses for the previous day
        console.log(
          `Day changed from ${lastAttendanceDate} to ${currentDateString}. Clearing old statuses.`
        );
        const allKeys = await AsyncStorage.getAllKeys();
        // Filter for keys that start with the lastAttendanceDate and the specific prefix we use for statuses
        const keysToRemove = allKeys.filter((key) =>
          key.startsWith(`${lastAttendanceDate}_lecture_status_`)
        );
        if (keysToRemove.length > 0) {
          await AsyncStorage.multiRemove(keysToRemove);
          console.log(
            "Cleared old attendance statuses for:",
            lastAttendanceDate,
            keysToRemove
          );
        }
      }
      // Update the last date for which attendance was loaded/checked to the current date
      await AsyncStorage.setItem("lastAttendanceDate", currentDateString);

      console.log(
        "timetableData loaded in loadTodayLectures:",
        timetableData ? "Yes" : "No"
      );
      if (timetableData) {
        const timetable = JSON.parse(timetableData);
        const today = getToday();
        const todayEntry = timetable.days?.find((d) => d.day === today);

        if (
          todayEntry &&
          todayEntry.subjects &&
          todayEntry.subjects.length > 0
        ) {
          console.log(
            `Found ${todayEntry.subjects.length} lectures for ${today}`
          );
          // Asynchronously fetch markedStatus for each lecture of the current day
          const lecturesForToday = await Promise.all(
            todayEntry.subjects.map(async (subject) => {
              // Consistent key: DATE_lecture_status_SUBJECTNAME_STARTTIME
              const lectureStatusKey = `${currentDateString}_lecture_status_${subject.name}_${subject.startTime}`;
              const markedStatus = await AsyncStorage.getItem(lectureStatusKey);
              // console.log(`Status for ${subject.name} at ${subject.startTime} (Key: ${lectureStatusKey}): ${markedStatus}`);
              return {
                ...subject,
                day: today, // Ensure 'day' property is present, it's used in handleMarkAttendance
                markedStatus: markedStatus || null, // Load status or default to null if not found
              };
            })
          );
          setLectures(lecturesForToday);
          setHasTimetable(true);
          // console.log("Processed lectures for today with statuses:", lecturesForToday);
        } else {
          console.log(
            `No lectures found for ${today} in timetable or timetable structure issue.`
          );
          setLectures([]);
          setHasTimetable(false);
        }
      } else {
        console.log("No timetable data found in AsyncStorage.");
        setLectures([]);
        setHasTimetable(false);
      }
    } catch (error) {
      setLectures([]);
      setHasTimetable(false);
      console.error("Error in loadTodayLectures:", error);
      Alert.alert(
        "Error",
        "Failed to load lecture data. Please check console for details."
      );
    }
  };

  const getInitials = (nameString) => {
    if (!nameString) return "";
    const words = nameString.split(" ");
    if (words.length > 1) {
      return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
    } else if (words.length === 1 && words[0].length > 0) {
      return words[0][0].toUpperCase();
    }
    return "";
  };

  const handleMarkAttendance = async (lectureItem, isPresent) => {
    if (
      !lectureItem ||
      !lectureItem.day ||
      !lectureItem.name ||
      !lectureItem.startTime
    ) {
      Alert.alert(
        "Error",
        "Lecture information is incomplete to mark attendance."
      );
      return;
    }

    try {
      const timetableString = await AsyncStorage.getItem("timetable");
      if (!timetableString) {
        Alert.alert(
          "Error",
          "Timetable data not found. Please set up your timetable."
        );
        return;
      }

      let timetable = JSON.parse(timetableString);
      let subjectUpdatedInTimetable = false;
      const currentDateString = getCurrentDateString(); // For storing status with current date

      timetable.days = timetable.days.map((dayObject) => {
        if (dayObject.day === lectureItem.day) {
          dayObject.subjects = dayObject.subjects.map((subject) => {
            if (
              subject.name === lectureItem.name &&
              subject.startTime === lectureItem.startTime
            ) {
              // Only update attended/total if they haven't been marked for the day yet OR if you allow re-marking
              // Current logic always increments totalClasses and conditionally attendedClasses
              if (isPresent) {
                subject.attendedClasses = (subject.attendedClasses || 0) + 1;
              }
              subject.totalClasses = (subject.totalClasses || 0) + 1;
              subjectUpdatedInTimetable = true;
              console.log(
                `Updated timetable counts for ${subject.name} on ${lectureItem.day}: Attended ${subject.attendedClasses}, Total ${subject.totalClasses}`
              );
            }
            return subject;
          });
        }
        return dayObject;
      });

      if (subjectUpdatedInTimetable) {
        await AsyncStorage.setItem("timetable", JSON.stringify(timetable));
        const newMarkedStatus = isPresent ? "present" : "absent";

        // Consistent key for storing status: DATE_lecture_status_SUBJECTNAME_STARTTIME
        const lectureStatusKey = `${currentDateString}_lecture_status_${lectureItem.name}_${lectureItem.startTime}`;
        await AsyncStorage.setItem(lectureStatusKey, newMarkedStatus);
        console.log(
          `Saved status for ${lectureItem.name} at ${lectureItem.startTime} as ${newMarkedStatus} (Key: ${lectureStatusKey})`
        );

        Alert.alert(
          "Success",
          `${lectureItem.name} marked as ${
            isPresent ? "Present" : "Attended (Class Counted)"
          }.
Attendance will update on the Attendance Screen.`
        );
        // Update local state to reflect the change immediately
        setLectures((prevLectures) =>
          prevLectures.map((lec) => {
            // Ensure all parts of the unique lecture identifier match
            if (
              lec.name === lectureItem.name &&
              lec.startTime === lectureItem.startTime &&
              lec.day === lectureItem.day
            ) {
              return { ...lec, markedStatus: newMarkedStatus };
            }
            return lec;
          })
        );
      } else {
        // This case should ideally not be reached if lectureItem comes from the loaded lectures list
        Alert.alert(
          "Error",
          `Could not find ${lectureItem.name} at ${lectureItem.startTime} for ${lectureItem.day} in timetable to update counts.`
        );
      }
    } catch (error) {
      console.error("Failed to update attendance or save status:", error);
      Alert.alert(
        "Error",
        "An error occurred while updating attendance. Check console."
      );
    }
  };

  // Logout and onboarding reset logic
  // const deleteOnboardingData = async () => {
  //   try {
  //     await AsyncStorage.removeItem("onboardingDone");
  //     await AsyncStorage.removeItem("percentage");
  //     router.replace("/onboarding/Welcome");
  //   } catch (error) {
  //     console.error("Error deleting onboarding data:", error);
  //   }
  // };

  useEffect(() => {
    AsyncStorage.getItem("userName").then((name) => {
      if (name) {
        setName(name);
      }
    });
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor="#121212" />
      {showAttendanceFinder && (
        <AttendancePercentageFinder
          onClose={() => setShowAttendanceFinder(false)}
        />
      )}
      <View style={styles.headerRow}>
        <View style={styles.profileGroup}>
          <TouchableOpacity
            onPress={() => router.push("/Profile")} // Assuming this is for a profile/menu action
            style={styles.profileTouchable}
          >
            <View style={styles.profileIconContainer}>
              <Text style={styles.profileIconText}>{getInitials(name)}</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.title}>{name}</Text>
        </View>
        <TouchableOpacity onPress={() => router.push("/Notifications")}>
          <Ionicons name="notifications-outline" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
      <FlatList
        ListHeaderComponent={
          <>
            {/* Welcome Box */}

            <Pressable style={styles.topBox}>
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
          // <View style={styles.lectureCard}>
          //   <View style={{ flex: 1 }}>
          //     <Text style={styles.lectureName}>{item.name}</Text>
          //     {item.professor && (
          //       <Text style={styles.profName}>{item.professor}</Text>
          //     )}
          //     {item.startTime && item.endTime && (
          //       <Text style={styles.profName}>
          //         {item.startTime} - {item.endTime}
          //       </Text>
          //     )}
          //   </View>
          //   <View style={styles.attendanceBtns}>
          //     <TouchableOpacity style={styles.attendanceBtnRed}>
          //       <MaterialIcons name="close" size={32} color="#fff" />
          //     </TouchableOpacity>
          //     <TouchableOpacity style={styles.attendanceBtnGreen}>
          //       <MaterialIcons name="check" size={32} color="#fff" />
          //     </TouchableOpacity>
          //   </View>
          // </View>
          <View style={styles.lectureCard}>
            {/* Lecture Info Section */}
            <View style={styles.lectureInfoContainer}>
              <Text style={styles.lectureName}>{item.name}</Text>
              {/* {item.professor && (
                <View style={styles.lectureDetailRow}>
                  <MaterialIcons name="person-outline" size={16} color={styles.lectureDetailIcon.color} style={styles.lectureDetailIcon} />
                  <Text style={styles.lectureDetailText}>{item.professor}</Text>
                </View>
              )} */}
              {item.startTime && item.endTime && (
                <View style={styles.lectureDetailRow}>
                  <MaterialIcons
                    name="schedule"
                    size={12}
                    color={styles.lectureDetailIcon.color}
                    style={styles.lectureDetailIcon}
                  />
                  <Text style={styles.lectureDetailText}>
                    {item.startTime} - {item.endTime}
                  </Text>
                </View>
              )}
            </View>

            {/* Attendance Actions Section */}
            <View style={styles.attendanceActionsContainer}>
              {item.markedStatus === "present" ? (
                <Text style={styles.attendanceStatusTextPresent}>Present</Text>
              ) : item.markedStatus === "absent" ? (
                <Text style={styles.attendanceStatusTextAbsent}>Absent</Text>
              ) : (
                <>
                  <TouchableOpacity
                    style={[styles.attendanceButton, styles.absentButton]}
                    onPress={() => handleMarkAttendance(item, false)}
                    disabled={item.markedStatus != null} // Disable if already marked
                  >
                    <MaterialIcons name="close" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.attendanceButton, styles.presentButton]}
                    onPress={() => handleMarkAttendance(item, true)}
                    disabled={item.markedStatus != null} // Disable if already marked
                  >
                    <MaterialIcons name="check" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        )}
        ListEmptyComponent={
          !hasTimetable && (
            <View style={styles.ttPlaceholderBox}>
              <Ionicons
                name="calendar-outline"
                size={80}
                color="#555"
                style={styles.ttPlaceholderIcon}
              />
              <Text style={styles.ttPlaceholderText}>
                Please add your Timetable first.
              </Text>
              {/* <TouchableOpacity style={styles.addTimetableButton} onPress={() => router.push("/Timetable")}>
                <Text style={styles.addTimetableButtonText}>Add Timetable</Text>
              </TouchableOpacity> */}
            </View>
          )
        }
        contentContainerStyle={{ width: "95%", alignSelf: "center" }}
        style={{ flex: 1 }}
      />
      {/* Logout Button */}
      {/* <TouchableOpacity
        style={styles.logoutButton}
        onPress={deleteOnboardingData}
      >
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity> */}

      <View style={styles.bottomNav} />
    </SafeAreaView>
  );
};

export default Home;

// const styles = StyleSheet.create({
//   container: {
//     backgroundColor: "#181818",
//     flex: 1,
//   },
//   headerRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between", // Distributes space
//     paddingHorizontal: 16, // Added horizontal padding
//     paddingTop: 10, // Adjusted for status bar and notch
//     paddingBottom: 10, // Added bottom padding
//     marginTop: 30, // Adjusted from 48
//     // marginBottom: 18, // Removed, spacing handled by padding
//     // marginLeft: 8, // Removed, using paddingHorizontal
//   },
//   profileGroup: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 8, // Space between profile and name
//   },
//   profileTouchable: {
//     width: 40,
//     height: 40,
//     borderRadius: 28,
//     backgroundColor: "green",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   profileIconContainer: {
//     width: 40,
//     height: 40,
//     borderRadius: 28,
//     backgroundColor: "green",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   profileIconText: {
//     color: "#fff",
//     fontSize: 24,
//     fontWeight: "bold",
//     marginBottom: 3,
//   },
//   header: {
//     color: "#fff",
//     fontSize: 22,
//     fontWeight: "bold",
//     flex: 1,
//   },

//   headerTitle: {
//     fontSize: 16,
//     fontWeight: "bold",
//     color: "green",
//   },
//   title: {
//     fontSize: 26,
//     fontWeight: "bold",
//     color: "white",
//     marginLeft: 0,
//   },
//   logoutButton: {
//     backgroundColor: "#FF0000",
//     padding: 15,
//     borderRadius: 10,
//     alignItems: "center",
//     marginTop: 20,
//     marginHorizontal: 20,
//     marginBottom: 100,
//   },
//   logoutButtonText: {
//     color: "#FFFFFF",
//     fontSize: 16,
//     fontWeight: "bold",
//   },
//   headerText: {
//     color: "#fff",
//     fontSize: 28,
//     fontWeight: "bold",
//   },
//   topBox: {
//     borderRadius: 10,
//     borderWidth: 1,
//     borderColor: "#3fa4ff",
//     height: 200,
//     width: "95%",
//     padding: 20,
//     margin: 10,
//     display: "flex",
//     flexDirection: "column",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   topBoxText: {
//     color: "#3fa4ff",
//     fontSize: 22,
//     fontWeight: "bold",
//     textAlign: "center",
//   },
//   topBoxTextName: {
//     color: "#fff",
//     fontSize: 32,
//     fontWeight: "bold",
//     letterSpacing: 4,
//     textAlign: "center",
//     marginTop: 4,
//   },
//   bottomBoxTittle: {
//     backgroundColor: "transparent",
//     width: "100%",
//     height: 40,
//     display: "flex",
//     justifyContent: "center",
//     alignItems: "center",
//     marginTop: 10,
//   },
//   bottomBoxTittleText: {
//     color: "#fff",
//     fontSize: 20,
//     fontWeight: "bold",
//   },
//   ttPlaceholderBox: {
//     backgroundColor: "#222",
//     borderRadius: 10,
//     margin: 10,
//     padding: 16,
//     width: "95%",
//     alignSelf: "center",
//   },
//   ttPlaceholderText: {
//     color: "#aaa",
//     fontSize: 16,
//     textAlign: "center",
//   },
//   lectureCard: {
//     backgroundColor: "#222",
//     borderRadius: 10,
//     flexDirection: "row",
//     alignItems: "center",
//     padding: 16,
//     marginBottom: 12,
//     marginTop: 6,
//   },
//   lectureName: {
//     color: "#fff",
//     fontSize: 20,
//     fontWeight: "bold",
//   },
//   profName: {
//     color: "#ccc",
//     fontSize: 14,
//     marginTop: 4,
//   },
//   attendanceBtns: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginLeft: 12,
//   },
//   attendanceBtnRed: {
//     backgroundColor: "#e53935",
//     borderRadius: 8,
//     padding: 4,
//     marginRight: 8,
//   },
//   attendanceBtnGreen: {
//     backgroundColor: "#43a047",
//     borderRadius: 8,
//     padding: 4,
//   },
//   // New styles for the redesigned timetable button
//   timetableButtonContainer: {
//     marginTop: 20,
//     marginHorizontal: 16,
//     marginBottom: 30,
//   },
//   timetableButton: {
//     borderRadius: 16,
//     elevation: 4,
//     shadowColor: "#3fa4ff",
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.2,
//     shadowRadius: 8,
//   },
//   buttonGradient: {
//     flexDirection: "row",
//     alignItems: "center",
//     borderRadius: 16,
//     paddingVertical: 16,
//     paddingHorizontal: 20,
//   },
//   buttonIconContainer: {
//     backgroundColor: "rgba(255,255,255,0.2)",
//     borderRadius: 12,
//     width: 50,
//     height: 50,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   buttonTextContainer: {
//     flex: 1,
//     marginLeft: 16,
//   },
//   buttonTitle: {
//     color: "#fff",
//     fontSize: 18,
//     fontWeight: "bold",
//   },
//   buttonSubtitle: {
//     color: "rgba(255,255,255,0.8)",
//     fontSize: 14,
//     marginTop: 2,
//   },
//   buttonArrow: {
//     backgroundColor: "rgba(255,255,255,0.15)",
//     borderRadius: 50,
//     width: 32,
//     height: 32,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   // Existing legacy styles
//   scrolle: {},
//   header: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#222",
//     marginTop: 10,
//     marginBottom: 10,
//     padding: 10,
//     borderRadius: 10,
//     width: "90%",
//     alignSelf: "center",
//   },
//   addTTBtn: {
//     backgroundColor: "#3fa4ff",
//     borderRadius: 10,
//     paddingVertical: 16,
//     paddingHorizontal: 16,
//     marginTop: 24,
//     marginBottom: 100,
//     width: "90%",
//     alignSelf: "center",
//   },
//   addTTBtnText: {
//     color: "#fff",
//     fontWeight: "bold",
//     fontSize: 18,
//     textAlign: "center",
//   },
//   bottomNav: {
//     flexDirection: "row",
//     justifyContent: "space-around",
//     alignItems: "center",
//     backgroundColor: "#181818",
//     borderTopWidth: 1,
//     borderTopColor: "#222",
//     height: 56,
//     width: "100%",
//     position: "absolute",
//     bottom: 0,
//     left: 0,
//   },
//   navIcon: {
//     flex: 1,
//     alignItems: "center",
//   },
//   attendanceContainer: {
//     position: "absolute",
//     flex: 1,
//     backgroundColor: "transparent",
//     padding: 16,
//     alignSelf: "center",
//     justifyContent: "center",
//     alignItems: "center",
//     zIndex: 9999,
//   },
// });
const styles = StyleSheet.create({
  container: {
    // backgroundColor: "#181818",
    flex: 1,
    backgroundColor: "#121212",
  },
  attendanceStatusTextPresent: {
    color: "#22dd22",
    fontSize: 16,
    fontWeight: "bold",
  },
  attendanceStatusTextAbsent: {
    color: "#dd2222",
    fontSize: 16,
    fontWeight: "bold",
  },
  attendanceButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  absentButton: {
    backgroundColor: "#dd2222",
  },
  presentButton: {
    backgroundColor: "#22dd22",
  },
  attendanceActionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    // gap: 8,
    minWidth: 100, // Give some minimum width to prevent layout shifts
    justifyContent: "flex-end",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    marginTop: 40,
  },
  profileGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12, // Increased gap for better spacing
  },
  profileTouchable: {
    // Styles for the touchable area are now part of profileIconContainer for simplicity
  },
  profileIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    // backgroundColor: "green",
    // justifyContent: "center",
    // alignItems: "center",
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
    // marginBottom: 15,
    borderWidth: 2,
    borderColor: "#4A4A4A",
  },
  profileIconText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
    marginLeft: 0,
  },
  logoutButton: {
    backgroundColor: "#D32F2F", // Slightly less intense red
    paddingVertical: 14, // Adjusted padding
    paddingHorizontal: 20,
    borderRadius: 12, // Softer corners
    alignItems: "center",
    marginTop: 25, // Increased margin
    marginHorizontal: 20,
    marginBottom: 40, // More space at the bottom, adjust if overlapping with tab bar
    elevation: 2, // Subtle shadow for Android
    shadowColor: "#000", // Shadow for iOS
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  logoutButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600", // Semi-bold
  },
  // Removed headerText as it was unused
  topBox: {
    borderRadius: 12, // Softer corners
    borderWidth: 1,
    borderColor: "#3fa4ff",
    // height: 180, // Slightly reduced height
    width: "99%", // Adjusted width to align with other content
    alignSelf: "center", // Center the box
    padding: 50,
    marginTop: 20, // Added margin top
    marginBottom: 20, // Added margin bottom
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    // backgroundColor: "#1C1C1E", // Slightly different dark shade
    backgroundColor: "#121212",
  },
  topBoxText: {
    color: "#3fa4ff",
    fontSize: 20, // Slightly reduced size
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 5, // Space between the two lines
  },
  topBoxTextName: {
    color: "#fff",
    fontSize: 28, // Slightly reduced size
    fontWeight: "bold",
    letterSpacing: 3, // Reduced letter spacing
    textAlign: "center",
  },
  bottomBoxTittle: {
    // backgroundColor: "transparent", // Already transparent
    width: "99%", // Align with other content
    alignSelf: "center",
    // height: 40, // Height can be dynamic
    justifyContent: "flex-start", // Align text to the left
    alignItems: "flex-start",
    marginTop: 10, // Reduced margin
    marginBottom: 15, // Increased margin for spacing before cards
  },
  bottomBoxTittleText: {
    color: "#E0E0E0", // Lighter grey for less emphasis than main titles
    fontSize: 22, // Increased size
    fontWeight: "600", // Semi-bold
  },
  ttPlaceholderBox: {
    backgroundColor: "#2C2C2E", // Darker placeholder background
    borderRadius: 10,
    marginVertical: 20, // Vertical margin
    padding: 25, // Increased padding
    width: "99%",
    alignSelf: "center",
    alignItems: "center", // Center content inside
  },
  ttPlaceholderText: {
    color: "#A0A0A0", // Lighter placeholder text
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22, // Improved readability
  },
  lectureCard: {
    backgroundColor: "#2C2C2E", // A slightly lighter dark shade for the card
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 2, // Or adjust as needed for your screen layout
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3, // For Android shadow
  },
  lectureInfoContainer: {
    flex: 1, // Allows this container to take up available space
    marginRight: 12, // Space between info and action buttons
  },
  lectureName: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 6,
  },
  lectureDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  lectureDetailIcon: {
    marginRight: 3,
    color: "#AEAEB2", // A muted color for icons
  },
  lectureDetailText: {
    color: "#AEAEB2", // A slightly muted white for details
    fontSize: 12,
  },
  attendanceActionsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  attendanceButton: {
    width: 44, // Circular or rounded square buttons
    height: 44,
    borderRadius: 22, // Make it circular
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8, // Space between buttons
    // borderWidth: 1, // Optional: if you want a border
    // borderColor: '#555', // Optional: border color
  },
  absentButton: {
    backgroundColor: "#FF3B30", // A standard red for absent
  },
  presentButton: {
    backgroundColor: "#34C759", // A standard green for present
  },
  timetableButtonContainer: {
    marginTop: 10, // Reduced margin
    marginHorizontal: "4%", // Use percentage for consistent alignment (92% width)
    marginBottom: 25, // Increased margin
  },
  timetableButton: {
    borderRadius: 16,
    elevation: 4,
    shadowColor: "#3fa4ff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, // Slightly more prominent shadow
    shadowRadius: 8,
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingVertical: 18, // Increased padding
    paddingHorizontal: 20,
  },
  buttonIconContainer: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
    width: 48, // Adjusted size
    height: 48, // Adjusted size
    alignItems: "center",
    justifyContent: "center",
    marginRight: 5, // Space between icon and text
  },
  buttonTextContainer: {
    flex: 1,
    marginLeft: 12, // Adjusted margin
  },
  buttonTitle: {
    color: "#fff",
    fontSize: 17, // Slightly adjusted size
    fontWeight: "bold",
  },
  buttonSubtitle: {
    color: "rgba(255,255,255,0.85)", // Slightly more opaque
    fontSize: 13, // Slightly adjusted size
    marginTop: 3, // Adjusted spacing
  },
  buttonArrow: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 16, // Match button border radius
    width: 36, // Adjusted size
    height: 36, // Adjusted size
    alignItems: "center",
    justifyContent: "center",
  },
  bottomNav: {
    height: 75,
  },
  // Removed unused styles: scrolle, header, addTTBtn, addTTBtnText, bottomNav, navIcon, attendanceContainer, headerTitle, headerText
  // The following styles seem to be remnants or duplicates and are not directly used by the main content structure visible:
  // header, headerTitle, headerText were removed as they appear unused or superseded by headerRow group.
  // Ensure styles like 'scrolle', 'addTTBtn', etc. are truly not needed elsewhere before full removal if this were a real project.
});
