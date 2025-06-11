import React, { useState, useEffect } from "react";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import uuid from "react-native-uuid";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import DateTimePicker from "@react-native-community/datetimepicker";
// import {
//   getFirestore,
//   doc,
//   updateDoc,
//   setDoc,
//   getDoc,
// } from "firebase/firestore";
import {
  initNotifications,
  scheduleWeeklyLectures,
} from "@/services/Notifications/notificationService";

const WEEK_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

// Day color themes
const DAY_THEMES = {
  Monday: ["#4361ee", "#3a0ca3"],
  Tuesday: ["#7209b7", "#560bad"],
  Wednesday: ["#f72585", "#b5179e"],
  Thursday: ["#4cc9f0", "#4895ef"],
  Friday: ["#4361ee", "#3f37c9"],
  Saturday: ["#fb8500", "#ffb703"],
  Sunday: ["#8ac926", "#55a630"],
};

export default function Timetable() {
  const router = useRouter();
  const [timetable, setTimetable] = useState([]);
  const [editDay, setEditDay] = useState(null);
  const [newSubject, setNewSubject] = useState({
    name: "",
    professor: "",
    startTime: "",
    endTime: "",
    totalClasses: 0,
    attendedClasses: 0,
  });
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // On mount: init notifications & load data
  useEffect(() => {
    (async () => {
      await initNotifications();
      await loadTimetable();
    })();
  }, []);

  const loadTimetable = async () => {
    try {
      // First try to get data from AsyncStorage (prioritize local data)
      // setIsLoading(true);
      const data = await AsyncStorage.getItem("timetable");
      // console.log(data);
      const parsedData = data ? JSON.parse(data) : null;

      // Use requestAnimationFrame to batch the state updates
    requestAnimationFrame(() => {
      if (parsedData) {
        setTimetable(parsedData.days);
      } else {
        setTimetable(WEEK_DAYS.map((day) => ({ day, subjects: [] })));
      }
      setIsLoading(false);
    });
  } catch (error) {
    console.error("Error loading timetable:", error);
    requestAnimationFrame(() => {
      setTimetable(WEEK_DAYS.map((day) => ({ day, subjects: [] })));
      setIsLoading(false);
    });
  }
  };

  if (isLoading) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.loadingContainer}>
          <StatusBar style="light" backgroundColor="#121212" />
          <ActivityIndicator size="large" color="#40E0D0" />
          <Text style={styles.loadingText}>Loading...</Text>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  const handleStartTimeChange = (event, selectedTime) => {
    setShowStartTimePicker(Platform.OS === "ios");
    if (selectedTime) {
      const hours = selectedTime.getHours().toString().padStart(2, "0");
      const minutes = selectedTime.getMinutes().toString().padStart(2, "0");
      const timeString = `${hours}:${minutes}`;
      setNewSubject((s) => ({ ...s, startTime: timeString }));
    }
  };

  const handleEndTimeChange = (event, selectedTime) => {
    setShowEndTimePicker(Platform.OS === "ios");
    if (selectedTime) {
      const hours = selectedTime.getHours().toString().padStart(2, "0");
      const minutes = selectedTime.getMinutes().toString().padStart(2, "0");
      const timeString = `${hours}:${minutes}`;
      setNewSubject((s) => ({ ...s, endTime: timeString }));
    }
  };

  const getRandomGradient = () => {
    const gradients = [
      ["#1FD141", "#1FD141"],
      ["#007BFF", "green"],
      ["#ff5f6d", "pink"],
      ["#F9D142", "blue"],
      ["#E94A87", "indigo"],
      ["#FF6D00", "blue"],
    ];
    return gradients[Math.floor(Math.random() * gradients.length)];
  };

  const getSubjectIcon = (name) => {
    if (name.includes("math")) return "calculator";
    if (
      name.includes("science") ||
      name.includes("chemistry") ||
      name.includes("physics")
    )
      return "flask";
    if (name.includes("history")) return "scroll";
    if (name.includes("language") || name.includes("english"))
      return "language";
    if (name.includes("art")) return "palette";
    if (name.includes("music")) return "music";
    if (name.includes("computer") || name.includes("programming"))
      return "laptop-code";
    return "book";
  };

  // Update local state without saving to AsyncStorage
  const updateTimetableLocally = (updatedTimetable) => {
    setTimetable(updatedTimetable);
    setHasUnsavedChanges(true);
  };

  // Save all changes to AsyncStorage at once
  const saveToStorage = async () => {
    setIsSaving(true);
    const data = await AsyncStorage.getItem("timetable");
    console.log("Loaded timetable data:", data);
    const username = await AsyncStorage.getItem("userName");
    console.log("Username:", username);
    const useruid = await AsyncStorage.getItem("userToken");
    console.log("User ID:", useruid);

    try {
      // Save timetable data

      // const useruid = await AsyncStorage.getItem("userToken");
      // console.log("User ID:", useruid);

      // if (!useruid) {
      //   throw new Error("User ID not found in AsyncStorage");
      // }
      await AsyncStorage.setItem(
        "timetable",
        JSON.stringify({ days: timetable })
      );

      // Process subjects
      let existingSubjectObjects = [];
      const existingSubjectsString = await AsyncStorage.getItem("subjects");
      if (existingSubjectsString) {
        try {
          existingSubjectObjects = JSON.parse(existingSubjectsString);
        } catch (e) {
          console.error("Failed to parse existing subjects:", e);
          existingSubjectObjects = [];
        }
      }

      const existingSubjectNames = new Set(
        existingSubjectObjects.map((s) => s.name)
      );
      const newSubjectObjectsFromThisUpdate = [];
      const processedNamesInThisUpdate = new Set();

      timetable.forEach((day) => {
        day.subjects.forEach((subject) => {
          if (subject.name) {
            const subjectName = subject.name.trim();
            if (
              subjectName &&
              !existingSubjectNames.has(subjectName) &&
              !processedNamesInThisUpdate.has(subjectName)
            ) {
              const newSubjectObj = {
                id: uuid.v4(),
                name: subjectName,
                topics: [],
                color: getRandomGradient(),
                icon: getSubjectIcon(subjectName.toLowerCase()),
              };
              newSubjectObjectsFromThisUpdate.push(newSubjectObj);
              processedNamesInThisUpdate.add(subjectName);
            }
          }
        });
      });

      const finalSubjectObjects = [
        ...existingSubjectObjects,
        ...newSubjectObjectsFromThisUpdate,
      ];

      await AsyncStorage.setItem(
        "subjects",
        JSON.stringify(finalSubjectObjects)
      );

      // console.log("Subjects saved successfully:", finalSubjectObjects);

      // Show success feedback
      // const db = getFirestore();
      // const userDocRef = doc(db, "users", useruid);

      // Update the user document with timetable data
      // await updateDoc(userDocRef, {
      //   timetable: { days: timetable },
      // });

      // Flatten lectures and schedule weekly
      const allLectures = timetable.flatMap((day) =>
        day.subjects.map((s) => ({
          id: s.id,
          title: s.name,
          day: day.day,
          startTime: s.startTime,
        }))
      );
      await scheduleWeeklyLectures(allLectures);

      // Show success feedback
      Alert.alert(
        "Success",
        "Your timetable has been saved sucessfully & weekly reminders set"
      );
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Error saving data:", error);
      Alert.alert("Error", "Failed to save your timetable. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSubject = (dayIdx) => {
    if (
      !newSubject.name.trim() ||
      !newSubject.startTime.trim() ||
      !newSubject.endTime.trim()
    ) {
      Alert.alert("Please fill all required fields (name, start & end time)");
      return;
    }
    const updated = [...timetable];
    updated[dayIdx].subjects.push({
      ...newSubject,
      id: uuid.v4(),
    });
    updateTimetableLocally(updated); // Only update locally
    setNewSubject({
      name: "",
      professor: "",
      startTime: "",
      endTime: "",
      totalClasses: 0,
      attendedClasses: 0,
    });
  };

  const handleDeleteSubject = (dayIdx, subjectId) => {
    Alert.alert(
      "Delete Subject",
      "Are you sure you want to remove this subject?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            const updated = [...timetable];
            updated[dayIdx].subjects = updated[dayIdx].subjects.filter(
              (s) => s.id !== subjectId
            );
            updateTimetableLocally(updated); // Only update locally
            saveToStorage();
          },
        },
      ]
    );
  };

  const renderSubject = ({ item, dayIdx, dayName }) => {
    const dayColors = DAY_THEMES[dayName] || ["#4361ee", "#3a0ca3"];

    return (
      <View style={styles.subjectCardContainer} key={item.id}>
        <LinearGradient
          colors={["#232323", "#1e1e1e"]}
          style={styles.subjectCard}
        >
          <View style={styles.subjectTimeColumn}>
            <View style={[styles.timeBadge, { backgroundColor: dayColors[0] }]}>
              <Text style={styles.startTimeText}>{item.startTime}</Text>
            </View>
            <View style={styles.timeConnector} />
            <View style={[styles.timeBadge, { backgroundColor: dayColors[1] }]}>
              <Text style={styles.endTimeText}>{item.endTime}</Text>
            </View>
          </View>

          <View style={styles.subjectDetailsColumn}>
            <Text style={styles.subjectName}>{item.name}</Text>
            {item.professor ? (
              <View style={styles.professorRow}>
                <Ionicons name="person" size={14} color="#aaa" />
                <Text style={styles.profName}>{item.professor}</Text>
              </View>
            ) : null}
          </View>

          <TouchableOpacity
            onPress={() => handleDeleteSubject(dayIdx, item.id)}
            style={styles.deleteIcon}
          >
            <Ionicons name="trash-outline" size={18} color="#ff4d4d" />
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  };

  // This will render at the end of our FlatList as footer
  const renderSaveButton = () => {
    if (!hasUnsavedChanges) return null;

    return (
      <View style={styles.saveButtonSection}>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={saveToStorage}
          disabled={isSaving}
        >
          <LinearGradient
            colors={["#4cc9f0", "#3a0ca3"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.saveBtnGradient}
          >
            {isSaving ? (
              <View style={styles.savingContainer}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.saveBtnText}>Saving changes...</Text>
              </View>
            ) : (
              <>
                <Ionicons name="save-outline" size={22} color="#fff" />
                <Text style={styles.saveBtnText}>Save All Changes</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor="#121212" />
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={["#121212", "#121212"]}
          style={styles.gradientBackground}
        >
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={26} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.header}>My Timetable</Text>
          </View>

          <FlatList
            data={timetable}
            keyExtractor={(item) => item.day}
            contentContainerStyle={styles.listContainer}
            ListFooterComponent={renderSaveButton}
            renderItem={({ item: day, index: dayIdx }) => {
              const dayColors = DAY_THEMES[day.day] || ["#4361ee", "#3a0ca3"];

              return (
                <View style={styles.daySection}>
                  <LinearGradient
                    colors={dayColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.dayHeaderGradient}
                  >
                    <View style={styles.dayHeaderRow}>
                      <Text style={styles.dayHeader}>{day.day}</Text>
                      <TouchableOpacity
                        onPress={() =>
                          setEditDay(editDay === dayIdx ? null : dayIdx)
                        }
                        style={styles.dayActionButton}
                      >
                        <Ionicons
                          name={
                            editDay === dayIdx ? "close-circle" : "add-circle"
                          }
                          size={28}
                          color="#fff"
                        />
                      </TouchableOpacity>
                    </View>
                  </LinearGradient>

                  <View style={styles.dayContent}>
                    {day.subjects.length === 0 ? (
                      <View style={styles.emptyDayContainer}>
                        <MaterialIcons
                          name="event-busy"
                          size={40}
                          color="#555"
                        />
                        <Text style={styles.noSubjectText}>
                          No classes scheduled
                        </Text>
                      </View>
                    ) : (
                      day.subjects.map((item, idx) =>
                        renderSubject({
                          item,
                          index: idx,
                          dayIdx,
                          dayName: day.day,
                        })
                      )
                    )}

                    {editDay === dayIdx && (
                      <View style={styles.addForm}>
                        <Text style={styles.addFormTitle}>Add New Subject</Text>

                        <TextInput
                          style={styles.input}
                          placeholder="Subject Name *"
                          placeholderTextColor="#888"
                          value={newSubject.name}
                          onChangeText={(text) =>
                            setNewSubject((s) => ({ ...s, name: text }))
                          }
                        />

                        <TextInput
                          style={styles.input}
                          placeholder="Professor (optional)"
                          placeholderTextColor="#888"
                          value={newSubject.professor}
                          onChangeText={(text) =>
                            setNewSubject((s) => ({ ...s, professor: text }))
                          }
                        />

                        <View style={styles.timeInputRow}>
                          <View style={styles.timeInputContainer}>
                            <Text style={styles.timeInputLabel}>Start</Text>
                            <TouchableOpacity
                              onPress={() => setShowStartTimePicker(true)}
                              style={styles.timeInput}
                            >
                              <Text
                                style={{
                                  color: newSubject.startTime ? "#fff" : "#888",
                                }}
                              >
                                {newSubject.startTime || "09:00"}
                              </Text>
                            </TouchableOpacity>
                            {showStartTimePicker && (
                              <DateTimePicker
                                value={new Date()}
                                mode="time"
                                is24Hour={true}
                                display="default"
                                onChange={handleStartTimeChange}
                              />
                            )}
                          </View>

                          <View style={styles.timeSeparator}>
                            <MaterialIcons
                              name="arrow-forward"
                              size={20}
                              color="#666"
                            />
                          </View>

                          <View style={styles.timeInputContainer}>
                            <Text style={styles.timeInputLabel}>End</Text>
                            <TouchableOpacity
                              onPress={() => setShowEndTimePicker(true)}
                              style={styles.timeInput}
                            >
                              <Text
                                style={{
                                  color: newSubject.endTime ? "#fff" : "#888",
                                }}
                              >
                                {newSubject.endTime || "10:00"}
                              </Text>
                            </TouchableOpacity>
                            {showEndTimePicker && (
                              <DateTimePicker
                                value={new Date()}
                                mode="time"
                                is24Hour={true}
                                display="default"
                                onChange={handleEndTimeChange}
                              />
                            )}
                          </View>
                        </View>

                        <TouchableOpacity
                          style={styles.addBtn}
                          onPress={() => handleAddSubject(dayIdx)}
                        >
                          <LinearGradient
                            colors={dayColors}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.addBtnGradient}
                          >
                            <Ionicons name="add" size={20} color="#fff" />
                            <Text style={styles.addBtnText}>
                              Add to Schedule
                            </Text>
                          </LinearGradient>
                        </TouchableOpacity>
                        <View>
                          {renderSaveButton(dayIdx)}
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              );
            }}

          />

        </LinearGradient>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#40E0D0',
    marginTop: 20,
    fontSize: 16,
    textAlign: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  gradientBackground: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 2,
    // marginTop: 40,
    paddingVertical: 12,
  },
  backButton: {
    marginRight: 15,
    backgroundColor: "rgba(255,255,255,0.1)",
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  listContainer: {
    // paddingBottom: 80,
    paddingHorizontal: 12,
  },
  daySection: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  dayHeaderGradient: {
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  dayHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dayHeader: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  dayActionButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  dayContent: {
    backgroundColor: "#232323",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  emptyDayContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 30,
  },
  noSubjectText: {
    color: "#888",
    fontSize: 15,
    fontStyle: "italic",
    marginTop: 10,
  },
  subjectCardContainer: {
    marginVertical: 6,
    marginHorizontal: 4,
    borderRadius: 10,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  subjectCard: {
    flexDirection: "row",
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
  },
  subjectTimeColumn: {
    alignItems: "center",
    width: 60,
  },
  timeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: "center",
    minWidth: 50,
  },
  timeConnector: {
    height: 20,
    width: 1,
    backgroundColor: "#555",
    marginVertical: 2,
  },
  startTimeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  endTimeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  subjectDetailsColumn: {
    flex: 1,
    marginLeft: 12,
  },
  subjectName: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  professorRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  profName: {
    color: "#aaa",
    fontSize: 14,
    marginLeft: 4,
  },
  deleteIcon: {
    backgroundColor: "rgba(255, 77, 77, 0.1)",
    borderRadius: 20,
    padding: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 77, 77, 0.3)",
  },
  addForm: {
    marginTop: 16,
    backgroundColor: "#1a1a1a",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
  },
  addFormTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#232323",
    color: "#fff",
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: "#333",
    marginBottom: 12,
    fontSize: 16,
  },
  timeInputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  timeInputContainer: {
    flex: 1,
  },
  timeInputLabel: {
    color: "#aaa",
    fontSize: 12,
    marginBottom: 4,
    marginLeft: 2,
  },
  timeInput: {
    backgroundColor: "#232323",
    color: "#fff",
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: "#333",
    fontSize: 16,
    justifyContent: "center",
  },
  timeSeparator: {
    width: 40,
    alignItems: "center",
  },
  addBtn: {
    borderRadius: 8,
    overflow: "hidden",
    marginTop: 8,
  },
  addBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
  },
  addBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 8,
  },
  // New styles for save button section at the bottom
  saveButtonSection: {
    marginTop: 20,
    marginBottom: 10,
    borderRadius: 12,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  saveButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  saveBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  saveBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
    marginLeft: 10,
  },
  savingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});
