import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
} from "react-native";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { FlatList } from "react-native-gesture-handler";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AttendanceCard from "@/components/AttendanceCard";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// const attendanceData = [
//   {
//     id: "1",
//     subject: "DBMS",
//     professor: "Prof. Rupali Sawant",
//     percentage: 100,
//   },
// ];

const Attendance = () => {
  const router = useRouter();
  const [subjectAttendanceData, setSubjectAttendanceData] = useState({});
  const [timetable, setTimetable] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [attendanceCriteria, setAttendanceCriteria] = useState(75); // Default criteria
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [searchText, setSearchText] = useState(""); // Added for search
  const [filteredData, setFilteredData] = useState([]); // Added for search
  const [initializing, setInitializing] = useState(true);

  const loadAttendanceDataFromTimetable = async () => {
    const timetableString = await AsyncStorage.getItem("timetable");
    if (timetableString) {
      try {
        const timetable = JSON.parse(timetableString);
        // Ensure timetable and timetable.days are valid
        if (timetable && Array.isArray(timetable.days)) {
          const subjectsData = timetable.days.reduce((acc, day) => {
            // Ensure day and day.subjects are valid
            if (day && Array.isArray(day.subjects)) {
              day.subjects.forEach((subject) => {
                if (subject && subject.name && !acc[subject.name]) {
                  // Check subject, name, and if not already added
                  acc[subject.name] = {
                    professor: subject.professor || "", // Handle missing professor
                    attended: subject.attendedClasses || 0, // Default to 0
                    total: subject.totalClasses || 0, // Default to 0
                  };
                }
              });
            }
            return acc;
          }, {});
          // console.log("Subjects data loaded from timetable:", subjectsData);
          return subjectsData;
        }
      } catch (e) {
        // console.error("Failed to parse timetable data:", e);
        return {}; // Return empty on parsing error
      }
    }
    return {}; // Return empty if no data
  };
  const loadTimetable = async () => {
    try {
      // First try to get data from AsyncStorage (prioritize local data)
      const data = await AsyncStorage.getItem("timetable");
      // console.log(data);

      if (data) {
        // If data exists in AsyncStorage, use it
        setTimetable(JSON.parse(data).days);
      } else{
        setTimetable(null);
      }
    } catch (error) {
      // console.error("Error loading timetable:", error);
      // Fallback to empty structure on any errors
      setTimetable(null);
    }
  };

  const fetchAllData = useCallback(async () => {
    // setIsLoading(true);
    try {
      const loadedData = await loadAttendanceDataFromTimetable();
      setSubjectAttendanceData(loadedData);

      const criteriaStr = await AsyncStorage.getItem("percentage");
      if (criteriaStr) {
        setAttendanceCriteria(parseInt(criteriaStr, 10));
      } else {
        setAttendanceCriteria(75); // Default
      }
    } catch (error) {
      // console.error("Error fetching data for Attendance screen:", error);
    } finally {
      // setIsLoading(false);
      setRefreshTrigger((prev) => prev + 1); // Trigger card refresh
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      // setInitializing(true);
      fetchAllData();
      // setInitializing(false);
      // return () => {
      //   setInitializing(false);
      // }; // Optional cleanup
    }, [fetchAllData])
  );

  const handleAttendanceChange = async (subjectName, newAttended, newTotal) => {
    const updatedData = {
      ...subjectAttendanceData,
      [subjectName]: {
        ...subjectAttendanceData[subjectName], // Preserve professor
        attended: newAttended,
        total: newTotal,
      },
    };
    setSubjectAttendanceData(updatedData);
    // console.log(`${subjectName} updated: ${newAttended}/${newTotal}`);

    // Now, persist this change back to AsyncStorage by updating the timetable
    try {
      const timetableString = await AsyncStorage.getItem("timetable");
      if (timetableString) {
        let timetable = JSON.parse(timetableString);
        let subjectUpdated = false;
        if (timetable && timetable.days) {
          timetable.days = timetable.days.map((dayObject) => {
            if (dayObject.subjects) {
              dayObject.subjects = dayObject.subjects.map((subject) => {
                if (subject.name === subjectName) {
                  subjectUpdated = true;
                  return {
                    ...subject,
                    attendedClasses: newAttended,
                    totalClasses: newTotal,
                  };
                }
                return subject;
              });
            }
            return dayObject;
          });

          if (subjectUpdated) {
            await AsyncStorage.setItem("timetable", JSON.stringify(timetable));
            // console.log(
            //   `Timetable in AsyncStorage updated for ${subjectName}.`
            // );
          } else {
            // console.warn(
            //   `Subject ${subjectName} not found in timetable to update counts.`
            // );
          }
        }
      }
    } catch (error) {
      // console.error("Failed to save updated attendance to timetable:", error);
    }
  };

  // if (isLoading) {
  //   return (
  //     <View style={styles.loadingScreen}>
  //       <StatusBar style="light" backgroundColor="#121212"/>
  //       <ActivityIndicator size="large" color="#FFFFFF" />
  //     </View>
  //   );
  // }

  // Create a flat list from subjectAttendanceData for rendering
  const displayData = useMemo(() => {
    return Object.keys(subjectAttendanceData).map((name) => ({
      subject: name,
      professor: subjectAttendanceData[name].professor,
      attended: subjectAttendanceData[name].attended,
      total: subjectAttendanceData[name].total,
    }));
  }, [subjectAttendanceData]);

  // 1. Filter whenever searchText or displayData change
  useEffect(() => {
    if (searchText.trim() === "") {
      setFilteredData(displayData);
    } else {
      setFilteredData(
        displayData.filter(
          (item) =>
            item.subject.toLowerCase().includes(searchText.toLowerCase()) ||
            (item.professor &&
              item.professor.toLowerCase().includes(searchText.toLowerCase()))
        )
      );
    }
  }, [searchText, displayData]);

  // 2. Load timetable once (or when `useruid` changes, etc.)
  useEffect(() => {
    async function init() {
      try {
        await loadTimetable();
      } catch (err) {
        // console.error("Failed to load timetable:", err);
      }
    }
    init();
  }, []); // or [useruid] if you reload per user

  // if (initializing) {
  //     return (
  //       <View style={styles.loadingContainer}>
  //         <Text style={styles.loadingText}>Loading...</Text>
  //         <ActivityIndicator size="large" color="#40E0D0" />
  //       </View>
  //     );
  //   }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" backgroundColor="#121212" />
        <View style={styles.headerRow}>
          <View style={styles.profileGroup}>
            <MaterialCommunityIcons
              name="view-agenda"
              size={28}
              color="white"
            />
            <Text style={styles.title}>Attendance</Text>
          </View>
          {/* <TouchableOpacity onPress={() => router.push("/Notifications")}>
          <Ionicons name="notifications-outline" size={28} color="#fff" />
        </TouchableOpacity> */}
        </View>
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color="#aaa"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search subjects or professors..."
            placeholderTextColor="#888"
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText("")}>
              <Ionicons name="close-circle" size={20} color="#888" />
            </TouchableOpacity>
          )}
        </View>
        <FlatList
          data={filteredData || []}
          keyExtractor={(item) => item.subject}
          renderItem={({ item }) => (
            <AttendanceCard
              subject={item.subject}
              professor={item.professor}
              // percentage={item.percentage}
              initialAttended={item.attended}
              initialTotal={item.total}
              attendanceThreshold={attendanceCriteria}
              onCountsChange={handleAttendanceChange}
            />
          )}
          // ScrollBar={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              {searchText.length > 0 ? (
                <>
                  <Ionicons name="search-outline" size={60} color="#555" />
                  <Text style={styles.emptyText}>
                    No matching subjects found.
                  </Text>
                  <Text style={styles.emptySubText}>
                    Try a different search term.
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons name="list-circle-outline" size={60} color="#555" />
                  <Text style={styles.emptyText}>
                    No subjects found in timetable.
                  </Text>
                  <Text style={styles.emptySubText}>
                    Add subjects via the Timetable screen.
                  </Text>
                </>
              )}
            </View>
          }
          contentContainerStyle={styles.listContentContainer}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={<View style={styles.scrollContent} />}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default Attendance;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    // paddingTop: 18,
    // paddingHorizontal: 10,
    // paddingBottom: 88,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 17, // Consolidated from 7
    paddingVertical: 13,
    // marginTop: 10,
    // marginBottom:5,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 10 : 0, // Adjust padding for Android
    marginHorizontal: 17,
    marginBottom: 15,
    marginTop: 5,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    height: 40, // Ensure consistent height
    paddingVertical: 0, // Reset padding for TextInput
  },
  profileGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
  },
  profileIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "green",
    justifyContent: "center",
    alignItems: "center",
  },
  profileIconText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  scrollContent: {
    paddingBottom: 32,
    flex: 1,
    backgroundColor: "#121212",
    paddingTop: 56,
    paddingHorizontal: 8,
  },
  // Old card style not used in new design
  modernCard: {
    backgroundColor: "#232323",
    borderRadius: 16,
    paddingVertical: 22,
    paddingHorizontal: 18,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    width: "100%",
    alignSelf: "center",
  },
  cardHeader: {
    marginBottom: 12,
  },
  cardCenterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 8,
  },
  cardFooter: {
    marginTop: 10,
    alignItems: "center",
  },
  cardGreen: {
    backgroundColor: "#24c46b",
  },
  cardRed: {
    backgroundColor: "#e53935",
  },
  cardGray: {
    backgroundColor: "#333",
  },
  subject: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 2,
    textAlign: "left",
  },
  circleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
  },
  circle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 6,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#181818",
    marginRight: 18,
  },
  circleText: {
    fontWeight: "bold",
    fontSize: 20,
  },
  badge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginLeft: 6,
  },
  badgeText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  attendanceDetail: {
    color: "#aaa",
    fontSize: 15,
    marginTop: 8,
  },
  barContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 2,
    width: "100%",
  },
  barBackground: {
    backgroundColor: "#333",
    borderRadius: 8,
    height: 22,
    flex: 1,
    overflow: "hidden",
    marginRight: 12,
  },
  barFill: {
    height: "100%",
    borderRadius: 8,
  },
  percentTextBar: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
    minWidth: 45,
    textAlign: "right",
  },
  prof: {
    color: "#f5f5f5",
    fontSize: 13,
    textAlign: "left",
    marginTop: 2,
  },
  // progressBarWrapper removed since we no longer need the inner bar

  percentText: {
    fontWeight: "bold",
    fontSize: 22,
    marginLeft: 16,
  },
  percentTextGreen: {
    color: "#fff",
  },
  percentTextRed: {
    color: "#fff",
  },
  percentTextGray: {
    color: "#fff",
  },
  detailBox: {
    backgroundColor: "#222",
    borderRadius: 10,
    padding: 12,
    marginTop: -10,
    marginBottom: 15,
    marginHorizontal: 2,
  },
  detailText: {
    color: "#fff",
    fontSize: 18,
  },
  detailTextBold: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginHorizontal: 4,
  },
  iconBtn: {
    marginHorizontal: 2,
    padding: 2,
    borderRadius: 4,
  },
  bunkNum: {
    color: "#3fa4ff",
    fontWeight: "bold",
    fontSize: 18,
  },
  // loadingOverlay: {
  //   position: 'absolute',
  //   left: 0,
  //   right: 0,
  //   top: 0,
  //   bottom: 0,
  //   backgroundColor: 'rgba(0,0,0,0.7)',
  //   alignItems: 'center',
  //   justifyContent: 'center',
  //   zIndex: 10,
  // },
  // loadingScreen: { // New style for the initial loading screen
  //   flex: 1,
  //   backgroundColor: '#121212', // Match the screen's final background
  //   alignItems: 'center',
  //   justifyContent: 'center',
  // },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    color: "#aaa",
    marginTop: 10,
    textAlign: "center",
  },
  emptySubText: {
    fontSize: 14,
    color: "#888",
    marginTop: 5,
    textAlign: "center",
  },
  listContentContainer: {
    paddingHorizontal: 17,
    paddingBottom: 20, // Ensure space for last card
    flexGrow: 1, // Ensures ListEmptyComponent can center if list is short
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000', // Match your app's background
  },
  loadingText: {
    color: '#40E0D0',
    fontSize: 18,
    marginBottom: 20,
  }
  // ... (your existing styles from Attendance.jsx)
  // Ensure you have headerRow, profileGroup, title, container, etc.s
});
