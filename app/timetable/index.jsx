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
import { Modal } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

// import {
//   getFirestore,
//   doc,
//   updateDoc,
//   setDoc,
//   getDoc,
// } from "firebase/firestore";
import {
  initNotifications,
  // initNotificationsPermissions,
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
    room: "",
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
  const [showSubjectSetup, setShowSubjectSetup] = useState(false);
  const [subjectsInput, setSubjectsInput] = useState("");
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState(null);
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);

  // Check if it's first time user
  const checkFirstTime = async () => {
    try {
      const hasSeenSubjectSetup = await AsyncStorage.getItem('hasSeenSubjectSetup');
      if (!hasSeenSubjectSetup) {
        await AsyncStorage.setItem('hasSeenSubjectSetup', 'true');
        setIsFirstTime(true);
        setShowSubjectSetup(true);
      }
    } catch (error) {
      console.error("Error checking first time:", error);
    }
  };

  // Load subjects from storage
  const loadSubjects = async () => {
    try {
      const subjectsData = await AsyncStorage.getItem('subjects');
      if (subjectsData) {
        const parsedSubjects = JSON.parse(subjectsData);
        setSubjects(parsedSubjects);
      }
    } catch (error) {
      console.error('Error loading subjects:', error);
    }
  };

  // On mount: init notifications & load data
  useEffect(() => {
    (async () => {
      await initNotifications();
      await loadTimetable();
      await checkFirstTime();
      await loadSubjects();
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
          <ActivityIndicator size="large" color="#3fa4ff" />
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

  const handleSaveNewSubject = async () => {
    if (!subjectsInput.trim()) {
      Alert.alert("Error", "Please enter a subject name");
      return;
    }

    try {
      const newSubjectItem = {
        id: uuid.v4(),
        name: subjectsInput.trim(),
        topics: [],
        color: getRandomGradient(),
        icon: getSubjectIcon(subjectsInput.trim().toLowerCase())
      };

      const updatedSubjects = [...subjects, newSubjectItem];
      await AsyncStorage.setItem('subjects', JSON.stringify(updatedSubjects));
      
      setSubjects(updatedSubjects);
      setSubjectsInput("");
      setShowAddSubject(false);
    } catch (error) {
      console.error("Error saving subject:", error);
      Alert.alert("Error", "Failed to save subject. Please try again.");
    }
  };

  const handleDeleteSubject = async (subjectId) => {
    try {
      const updatedSubjects = subjects.filter(subject => subject.id !== subjectId);
      await AsyncStorage.setItem('subjects', JSON.stringify(updatedSubjects));
      setSubjects(updatedSubjects);
      setSubjectToDelete(null);
    } catch (error) {
      console.error("Error deleting subject:", error);
      Alert.alert("Error", "Failed to delete subject. Please try again.");
    }
  };

  const confirmDeleteSubject = (subject) => {
    setSubjectToDelete(subject);
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
      room: "",
      startTime: "",
      endTime: "",
      totalClasses: 0,
      attendedClasses: 0,
    });
  };

  const handleDeleteTimetableSubject = (dayIdx, subjectId) => {
    Alert.alert(
      "Delete Subject",
      "Are you sure you want to remove this subject from your timetable?",
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

  const renderTimetableSubject = ({ item, dayIdx, dayName }) => {
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
            <View style={{ marginTop: 4 }}>
              {item.professor ? (
                <View style={styles.professorRow}>
                  <Ionicons name="person" size={14} color="#aaa" />
                  <Text style={styles.profName}>{item.professor}</Text>
                </View>
              ) : null}
              {item.room ? (
                <View style={styles.roomRow}>
                  <Ionicons name="location" size={14} color="#aaa" />
                  <Text style={styles.profName}>{item.room}</Text>
                </View>
              ) : null}
            </View>
          </View>

          <TouchableOpacity
            onPress={() => handleDeleteTimetableSubject(dayIdx, item.id)}
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
            <View style={styles.headerLeft}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.backButton}
              >
                <Ionicons name="arrow-back" size={26} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.header}>My Timetable</Text>
            </View>
          </View>
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.subjectsButton]}
              onPress={() => setShowSubjectSetup(true)}
            >
              <Ionicons name="book-outline" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>All Subjects</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.shareButton]}
              onPress={() => {
                router.push('/ShareTT');
              }}
            >
              <Ionicons name="share-social-outline" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Share TT</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={timetable}
            keyExtractor={(item) => item.day}
            contentContainerStyle={styles.listContainer}
            // ListHeaderComponent={
            //     <View style={styles.buttonRow}>
            //       <TouchableOpacity 
            //         style={[styles.actionButton, styles.subjectsButton]}
            //         onPress={() => setShowSubjectSetup(true)}
            //       >
            //         <Ionicons name="book-outline" size={20} color="#fff" />
            //         <Text style={styles.actionButtonText}>All Subjects</Text>
            //       </TouchableOpacity>
            //       <TouchableOpacity 
            //         style={[styles.actionButton, styles.shareButton]}
            //         onPress={() => {
            //           // TODO: Implement share functionality
            //           Alert.alert('Share Timetable', 'Share functionality will be implemented here');
            //         }}
            //       >
            //         <Ionicons name="share-social-outline" size={20} color="#fff" />
            //         <Text style={styles.actionButtonText}>Share TT</Text>
            //       </TouchableOpacity>
            //   </View>
            // }
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
                        renderTimetableSubject({
                          item,
                          index: idx,
                          dayIdx,
                          dayName: day.day,
                        })
                      )
                    )}

                    {editDay === dayIdx && (
                      <View style={styles.addForm}>
                        <Text style={styles.addFormTitle}>Add New Slot</Text>

                        <View style={{ marginBottom: 12 }}>
                          <TouchableOpacity
                            style={[styles.input, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}
                            onPress={() => setShowSubjectDropdown(!showSubjectDropdown)}
                          >
                            <Text style={{ color: newSubject.name ? '#fff' : '#888' }}>
                              {newSubject.name || 'Select Subject *'}
                            </Text>
                            <Ionicons 
                              name={showSubjectDropdown ? 'chevron-up' : 'chevron-down'} 
                              size={20} 
                              color="#888" 
                            />
                          </TouchableOpacity>
                          
                          {showSubjectDropdown && (
                            <View 
                              style={styles.dropdownContainer}
                              onStartShouldSetResponder={() => true}
                              onTouchEnd={(e) => e.stopPropagation()}
                            >
                              <View style={styles.dropdown}>
                                <FlatList
                                  data={subjects}
                                  keyExtractor={(item) => item.id}
                                  renderItem={({ item }) => (
                                    <TouchableOpacity
                                      style={styles.dropdownItem}
                                      onPress={() => {
                                        setNewSubject(s => ({ ...s, name: item.name }));
                                        setShowSubjectDropdown(false);
                                      }}
                                      activeOpacity={0.7}
                                    >
                                      <Text style={styles.dropdownItemText} numberOfLines={1} ellipsizeMode="tail">{item.name}</Text>
                                    </TouchableOpacity>
                                  )}
                                  ItemSeparatorComponent={() => (
                                    <View style={styles.dropdownSeparator} />
                                  )}
                                  ListEmptyComponent={
                                    <Text style={styles.dropdownEmptyText}>No subjects added yet</Text>
                                  }
                                  keyboardShouldPersistTaps="always"
                                  showsVerticalScrollIndicator={true}
                                  style={{ maxHeight: 192 }}
                                  contentContainerStyle={{ flexGrow: 1 }}
                                  nestedScrollEnabled={true}
                                />
                                <TouchableOpacity
                                  style={[styles.dropdownItem, { borderTopWidth: 1, borderTopColor: '#333' }]}
                                  onPress={() => {
                                    setShowSubjectDropdown(false);
                                    setShowSubjectSetup(true);
                                  }}
                                >
                                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Ionicons name="add-circle-outline" size={18} color="#3fa4ff" style={{ marginRight: 8 }} />
                                    <Text style={[styles.dropdownItemText, { color: '#3fa4ff' }]}>Add New Subject</Text>
                                  </View>
                                </TouchableOpacity>
                              </View>
                            </View>
                          )}
                        </View>

                        <TextInput
                          style={styles.input}
                          placeholder="Professor (optional)"
                          placeholderTextColor="#888"
                          value={newSubject.professor}
                          onChangeText={(text) =>
                            setNewSubject((s) => ({ ...s, professor: text }))
                          }
                        />

                        <TextInput
                          style={styles.input}
                          placeholder="Room Number (optional)"
                          placeholderTextColor="#888"
                          value={newSubject.room}
                          onChangeText={(text) =>
                            setNewSubject((s) => ({ ...s, room: text }))
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

        {/* Subject Management Modal */}
        <Modal
          visible={showSubjectSetup}
          transparent={true}
          animationType="slide"
          onRequestClose={() => !isFirstTime && setShowSubjectSetup(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {isFirstTime ? 'Welcome to RollCall!' : 'Manage Subjects'}
                </Text>
                {!isFirstTime && (
                  <TouchableOpacity 
                    style={styles.closeButton}
                    onPress={() => setShowSubjectSetup(false)}
                  >
                    <Ionicons name="close" size={24} color="#fff" />
                  </TouchableOpacity>
                )}
              </View>
              
              <View style={styles.modalBody}>
                {isFirstTime && (
                  <Text style={styles.modalText}>
                    Let's get started by adding your subjects.
                  </Text>
                )}

                <FlatList
                  data={subjects}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.subjectsList}
                  ListHeaderComponent={
                    <View style={styles.subjectsHeader}>
                      <Text style={styles.subjectsTitle}>Your Subjects</Text>
                      <TouchableOpacity 
                        style={styles.addSubjectButton}
                        onPress={() => setShowAddSubject(true)}
                      >
                        <Ionicons name="add" size={20} color="#3fa4ff" />
                        <Text style={styles.addSubjectText}>Add Subject</Text>
                      </TouchableOpacity>
                    </View>
                  }
                  ListEmptyComponent={
                    <View style={styles.emptySubjects}>
                      <Ionicons name="book-outline" size={40} color="#555" />
                      <Text style={styles.emptySubjectsText}>No subjects added yet</Text>
                    </View>
                  }
                  renderItem={({ item }) => (
                    <View style={styles.subjectItem}>
                      <View style={styles.subjectInfo}>
                        <View 
                          style={[
                            styles.subjectColor, 
                            { backgroundColor: item.color ? item.color[0] : '#3fa4ff' }
                          ]} 
                        />
                        <Text style={styles.subjectNameText} numberOfLines={1}>
                          {item.name}
                        </Text>
                      </View>
                      <TouchableOpacity 
                        style={styles.deleteSubjectButton}
                        onPress={() => confirmDeleteSubject(item)}
                      >
                        <Ionicons name="trash-outline" size={20} color="#ff4d4d" />
                      </TouchableOpacity>
                    </View>
                  )}
                />

                {showAddSubject && (
                  <View style={styles.addSubjectContainer}>
                    <Text style={styles.addSubjectTitle}>Add New Subject</Text>
                    <TextInput
                      style={styles.subjectInput}
                      placeholder="Enter subject name"
                      placeholderTextColor="#888"
                      value={subjectsInput}
                      onChangeText={setSubjectsInput}
                      autoFocus
                    />
                    <View style={styles.addSubjectActions}>
                      <TouchableOpacity 
                        style={[styles.modalButton, styles.cancelButton]}
                        onPress={() => {
                          setShowAddSubject(false);
                          setSubjectsInput('');
                        }}
                      >
                        <Text style={[styles.buttonText, {color: '#fff'}]}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.modalSaveButton, styles.saveButton]}
                        onPress={handleSaveNewSubject}
                      >
                        <Text style={[styles.buttonText, {color: '#fff'}]}>Add</Text>
                      </TouchableOpacity>
                      {/* <TouchableOpacity 
                        style={styles.doneButton}
                        onPress={handleSaveNewSubject}
                      >
                        <Text style={styles.buttonText}>Add Subject</Text>
                      </TouchableOpacity> */}
                    </View>
                  </View>
                )}

                {!showAddSubject && (
                  <View style={styles.modalButtonContainer}>
                    <TouchableOpacity 
                      style={styles.doneButton}
                      onPress={() => setShowSubjectSetup(false)}
                    >
                       <LinearGradient
                                                  colors={["#3fa4ff", "#2389da"]}
                                                  start={{ x: 0, y: 0 }}
                                                  end={{ x: 1, y: 0 }}
                                                  style={styles.doneBtnGradient}
                                                >
                                                <Text style={styles.buttonText}>Done</Text>
                      
                                                </LinearGradient>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          </View>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          visible={!!subjectToDelete}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setSubjectToDelete(null)}
        >
          <View style={styles.confirmModalContainer}>
            <View style={styles.confirmModalContent}>
              <Text style={styles.confirmModalTitle}>Delete Subject</Text>
              <Text style={styles.confirmModalText}>
                Are you sure you want to delete "{subjectToDelete?.name}"?
                This will remove it from your subjects list.
              </Text>
              <View style={styles.confirmModalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton, {flex: 1}]}
                  onPress={() => setSubjectToDelete(null)}
                >
                  <Text style={[styles.buttonText, {color: '#fff'}]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.deleteButton, {flex: 1}]}
                  onPress={() => handleDeleteSubject(subjectToDelete.id)}
                >
                  <Text style={styles.buttonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  // Dropdown Styles
  dropdownContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 1000,
    marginTop: 4,
    maxHeight: 240, // Set max height for the entire dropdown
  },
  dropdown: {
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    maxHeight: 240, // Match container height
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  dropdownItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 48, // Ensure consistent height for touch targets
    justifyContent: 'center',
  },
  dropdownItemText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 24, // Better text vertical alignment
  },
  dropdownSeparator: {
    height: 1,
    backgroundColor: '#333',
    marginHorizontal: 8,
  },
  dropdownEmptyText: {
    color: '#888',
    textAlign: 'center',
    padding: 16,
    fontStyle: 'italic',
    minHeight: 48, // Match item height for consistency
  },

  // Subject List Styles
  subjectsList: {
    flexGrow: 1,
    width: '100%',
  },
  subjectsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  subjectsTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  addSubjectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(63, 164, 255, 0.3)',
    backgroundColor: 'rgba(63, 164, 255, 0.1)',
  },
  addSubjectText: {
    color: '#3fa4ff',
    marginLeft: 6,
    fontWeight: '500',
    fontSize: 14,
  },
  emptySubjects: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptySubjectsText: {
    color: '#888',
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
  },
  subjectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#232323',
    borderRadius: 10,
    marginBottom: 8,
  },
  subjectInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  subjectColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  subjectNameText: {
    color: '#fff',
    fontSize: 16,
    flex: 1,
  },
  deleteSubjectButton: {
    padding: 6,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 77, 77, 0.1)',
  },
  addSubjectContainer: {
    marginTop: 20,
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    padding: 16,
  },
  addSubjectTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  subjectInput: {
    backgroundColor: '#232323',
    color: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 16,
    fontSize: 16,
  },
  addSubjectActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // marginLeft: -20,
    // gap: 2,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  // Confirmation Modal
  confirmModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  confirmModalContent: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  confirmModalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  confirmModalText: {
    color: '#e0e0e0',
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 24,
  },
  confirmModalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  deleteButton: {
    backgroundColor: '#ff4d4d',
  },
  modalContent: {
    backgroundColor: '#1E1E1E',
    width: '100%',
    borderRadius: 15,
    overflow: 'hidden',
    // borderWidth: 1,
    borderColor: '#333',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  modalHeader: {
    backgroundColor: '#121212',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  closeButton: {
    padding: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    padding: 20,
    backgroundColor: '#1A1A1A',
  },
  modalText: {
    color: '#E0E0E0',
    fontSize: 16,
    marginBottom: 20,
    lineHeight: 22,
  },
  subjectsInput: {
    backgroundColor: '#232323',
    color: '#fff',
    borderRadius: 10,
    padding: 15,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 20,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  modalButtonContainer: {
    borderRadius: 16,
    overflow: "hidden",
    height: 56,
    marginTop: 20,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    // marginLeft: 10,
    minWidth: 120,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  modalSaveButton: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    // backgroundColor: '#3fa4ff',
    borderRadius: 8,
    // marginLeft: 10,
    minWidth: 120,
    alignItems: 'center',
    // ...Platform.select({
    //   ios: {
    //     shadowColor: '#000',
    //     shadowOffset: { width: 0, height: 2 },
    //     shadowOpacity: 0.2,
    //     shadowRadius: 3,
    //   },
    //   android: {
    //     elevation: 3,
    //   },
    // }),
  },
  cancelButton: {
    backgroundColor: '#333',
  },
  saveButton: {
    backgroundColor: '#3fa4ff',
  },
  buttonText: {
    
    color: "#FFF",
    fontSize: 18,
    fontWeight: "600",
  },
  doneBtnGradient: {
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subjectsButton: {
    backgroundColor: 'rgba(63, 164, 255, 0.15)',
    borderColor: 'rgba(63, 164, 255, 0.3)',
  },
  shareButton: {
    backgroundColor: 'rgba(108, 99, 255, 0.15)',
    borderColor: 'rgba(108, 99, 255, 0.3)',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#3fa4ff', 
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
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
    marginBottom: 8,
    marginTop: 4,
    position: 'fixed'
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 25,
    borderWidth: 1,
    flex: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  actionButtonText: {
    color: '#fff',
    marginLeft: 6,
    fontWeight: '500',
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
  addBtn: {
    marginTop: 15,
    borderRadius: 12,
    overflow: "hidden",
    height: 52,
  },
  addBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  addBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
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
    paddingLeft: 12,
  },
  roomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  subjectName: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
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
  // saveButton: {
    // borderRadius: 12,
    // overflow: "hidden",
  // },
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
