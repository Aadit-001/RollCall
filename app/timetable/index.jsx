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
  Pressable, // ADDED for Modal overlay
  KeyboardAvoidingView, // ADDED for keyboard avoidance
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import uuid from "react-native-uuid";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Modal } from "react-native";

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
  const inputRef = React.useRef(null);
  const editInputRef = React.useRef(null); // ADDED: Ref for the edit form's dropdown trigger

  const [timetable, setTimetable] = useState([]);
  const [editingSubject, setEditingSubject] = useState(null);
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
  
  // ADDED: State for Edit form's time pickers
  const [showEditStartTimePicker, setShowEditStartTimePicker] = useState(false);
  const [showEditEndTimePicker, setShowEditEndTimePicker] = useState(false);

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showSubjectSetup, setShowSubjectSetup] = useState(false);
  const [subjectsInput, setSubjectsInput] = useState("");
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState(null);
  
  // Tracks if the Add Slot Form should be visible for the currently editing day
  const [showAddSlotForm, setShowAddSlotForm] = useState(true);

  // State for Modal Dropdown
  // UPDATED: context will hold { type: 'add', dayIdx } or { type: 'edit', dayIdx, subjectId }
  const [dropdownProps, setDropdownProps] = useState({
    visible: false,
    x: 0,
    y: 0,
    width: 0,
    context: null, 
  });

  // --- NEW DROPDOWN HANDLERS ---
  const handleSelectSubject = (subjectName) => {
    const { context } = dropdownProps;

    if (context?.type === 'add') {
        setNewSubject(s => ({ ...s, name: subjectName }));
    } else if (context?.type === 'edit') {
        // Use the handleEditChange function to update the timetable state
        handleEditChange(context.dayIdx, context.subjectId, 'name', subjectName);
    }
    
    closeSubjectDropdown();
  };

  const closeSubjectDropdown = () => {
    setDropdownProps(prev => ({ ...prev, visible: false, context: null }));
  };
  
  const openSubjectDropdown = (dayIdx) => {
    if (inputRef.current) {
      requestAnimationFrame(() => {
        // Measure the position of the input trigger
        inputRef.current.measure((fx, fy, width, height, px, py) => {
          setDropdownProps({
            visible: true,
            x: px, 
            y: py + height + 2, // 2 pixels below the input
            width: width,
            context: { type: 'add', dayIdx }, // UPDATED: Set context for 'add'
          });
        });
      });
    }
  };

  // ADDED: Handler to open dropdown for the EDIT form
  const openEditSubjectDropdown = (dayIdx, subjectId) => {
    if (editInputRef.current) {
      requestAnimationFrame(() => {
        editInputRef.current.measure((fx, fy, width, height, px, py) => {
          setDropdownProps({
            visible: true,
            x: px,
            y: py + height + 2, 
            width: width,
            context: { type: 'edit', dayIdx, subjectId }, // UPDATED: Set context for 'edit'
          });
        });
      });
    }
  };
  // --- END NEW DROPDOWN HANDLERS ---


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
  
  // Effect to reset form visibility when changing editDay
  useEffect(() => {
    // Reset form visibility when a different day is opened or when the edit mode is closed (setEditDay(null))
    setShowAddSlotForm(true); 
  }, [editDay]);


  const loadTimetable = async () => {
    try {
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

  // ADDED: Handlers for the EDIT form's time pickers
  const handleEditStartTimeChange = (event, selectedTime, dayIdx, subjectId) => {
    setShowEditStartTimePicker(Platform.OS === "ios");
    if (selectedTime) {
      const hours = selectedTime.getHours().toString().padStart(2, "0");
      const minutes = selectedTime.getMinutes().toString().padStart(2, "0");
      const timeString = `${hours}:${minutes}`;
      handleEditChange(dayIdx, subjectId, 'startTime', timeString);
    }
  };

  const handleEditEndTimeChange = (event, selectedTime, dayIdx, subjectId) => {
    setShowEditEndTimePicker(Platform.OS === "ios");
    if (selectedTime) {
      const hours = selectedTime.getHours().toString().padStart(2, "0");
      const minutes = selectedTime.getMinutes().toString().padStart(2, "0");
      const timeString = `${hours}:${minutes}`;
      handleEditChange(dayIdx, subjectId, 'endTime', timeString);
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

  /**
   * Saves all changes to AsyncStorage and Firebase (if configured).
   * @param {function | null} onSuccessCallback - Optional function to run on successful save.
   */
  const saveToStorage = async (onSuccessCallback = null) => {
    setIsSaving(true);
    // Removed console logs for brevity in production code
    // const data = await AsyncStorage.getItem("timetable");
    // console.log("Loaded timetable data:", data);
    // const username = await AsyncStorage.getItem("userName");
    // console.log("Username:", username);
    // const useruid = await AsyncStorage.getItem("userToken");
    // console.log("User ID:", useruid);

    try {
      // Save timetable data
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

      // Run the callback if provided
      if (onSuccessCallback) {
        onSuccessCallback();
      }
    } catch (error) {
      console.error("Error saving data:", error);
      Alert.alert("Error", "Failed to save your timetable. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };
  
  /**
   * Handler for the Save All Changes button inside the day section.
   * Resets the editing state upon successful save.
   */
  const handleSaveAndClose = async () => {
    // Pass a callback to run after the saveToStorage logic succeeds
    await saveToStorage(() => {
        setEditDay(null); // Close the edit section
        setShowAddSlotForm(true); // Reset the form visibility for the next time
    });
  };

  // const handleSaveNewSubject = async () => {
  //   if (!subjectsInput.trim()) {
  //     Alert.alert("Error", "Please enter a subject name");
  //     return;
  //   }

  //   try {
  //     const newSubjectItem = {
  //       id: uuid.v4(),
  //       name: subjectsInput.trim(),
  //       topics: [],
  //       color: getRandomGradient(),
  //       icon: getSubjectIcon(subjectsInput.trim().toLowerCase())
  //     };

  //     const updatedSubjects = [...subjects, newSubjectItem];
  //     await AsyncStorage.setItem('subjects', JSON.stringify(updatedSubjects));
      
  //     setSubjects(updatedSubjects);
  //     setSubjectsInput("");
  //     setShowAddSubject(false);
  //   } catch (error) {
  //     console.error("Error saving subject:", error);
  //     Alert.alert("Error", "Failed to save subject. Please try again.");
  //   }
  // };

  // const handleDeleteSubject = async (subjectId) => {
  //   try {
  //     const updatedSubjects = subjects.filter(subject => subject.id !== subjectId);
  //     await AsyncStorage.setItem('subjects', JSON.stringify(updatedSubjects));
  //     setSubjects(updatedSubjects);
  //     setSubjectToDelete(null);
  //   } catch (error) {
  //     console.error("Error deleting subject:", error);
  //     Alert.alert("Error", "Failed to delete subject. Please try again.");
  //   }
  // };

  // const confirmDeleteSubject = (subject) => {
  //   setSubjectToDelete(subject);
  // };

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
    setNewSubject({ // Reset form inputs
      name: "",
      professor: "",
      room: "",
      startTime: "",
      endTime: "",
      totalClasses: 0,
      attendedClasses: 0,
    });
    // Hide the form after successful addition
    setShowAddSlotForm(false); 
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
            saveToStorage(); // Save after deleting
          },
        },
      ]
    );
  };

  const handleEditChange = (dayIdx, subjectId, field, value) => {
    const updated = [...timetable];
    const subjectIndex = updated[dayIdx].subjects.findIndex(s => s.id === subjectId);
    if (subjectIndex !== -1) {
      updated[dayIdx].subjects[subjectIndex][field] = value;
      updateTimetableLocally(updated);
    }
  };

  const saveEditedLecture = async (dayIdx, subjectId) => {
    await saveToStorage();
    setEditingSubject(null);
    Alert.alert("Updated", "Lecture updated successfully!");
  };


  // const renderTimetableSubject = ({ item, dayIdx, dayName }) => {
  //   const dayColors = DAY_THEMES[dayName] || ["#4361ee", "#3a0ca3"];

  //   return (
  //     <View style={styles.subjectCardContainer} key={item.id}>
  //       <LinearGradient
  //         colors={["#232323", "#1e1e1e"]}
  //         style={styles.subjectCard}
  //       >
  //         <View style={styles.subjectTimeColumn}>
  //           <View style={[styles.timeBadge, { backgroundColor: dayColors[0] }]}>
  //             <Text style={styles.startTimeText}>{item.startTime}</Text>
  //           </View>
  //           <View style={styles.timeConnector} />
  //           <View style={[styles.timeBadge, { backgroundColor: dayColors[1] }]}>
  //             <Text style={styles.endTimeText}>{item.endTime}</Text>
  //           </View>
  //         </View>

  //         <View style={styles.subjectDetailsColumn}>
  //           <Text style={styles.subjectName}>{item.name}</Text>
  //           <View style={{ marginTop: 4 }}>
  //             {item.professor ? (
  //               <View style={styles.professorRow}>
  //                 <Ionicons name="person" size={14} color="#aaa" />
  //                 <Text style={styles.profName}>{item.professor}</Text>
  //               </View>
  //             ) : null}
  //             {item.room ? (
  //               <View style={styles.roomRow}>
  //                 <Ionicons name="location" size={14} color="#aaa" />
  //                 <Text style={styles.profName}>{item.room}</Text>
  //               </View>
  //             ) : null}
  //           </View>
  //         </View>

  //         <TouchableOpacity
  //           onPress={() => handleDeleteTimetableSubject(dayIdx, item.id)}
  //           style={styles.deleteIcon}
  //         >
  //           <Ionicons name="trash-outline" size={18} color="#ff4d4d" />
  //         </TouchableOpacity>
  //       </LinearGradient>
  //     </View>
  //   );
  // };

  
  const renderTimetableSubject = ({ item, dayIdx, dayName }) => {
  const dayColors = DAY_THEMES[dayName] || ["#4361ee", "#3a0ca3"];
  const isEditing = editingSubject?.dayIdx === dayIdx && editingSubject?.subjectId === item.id;

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

        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity
            onPress={() => setEditingSubject({ dayIdx, subjectId: item.id })}
            style={styles.editIcon}
          >
            <Ionicons name="pencil-outline" size={18} color="#3fa4ff" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDeleteTimetableSubject(dayIdx, item.id)}
            style={styles.deleteIcon}
          >
            <Ionicons name="trash-outline" size={18} color="#ff4d4d" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* // -------------------------------------------
      // --- MODIFIED EDIT FORM
      // -------------------------------------------
      */}
      {isEditing && (
        <View style={styles.addForm}>
          <Text style={styles.addFormTitle}>Edit Lecture</Text>

          {/* UPDATED: Subject Name Dropdown Trigger */}
          <View style={styles.relativeContainer}>
            <TouchableOpacity
              ref={editInputRef} // Attach the ref for the edit form
              style={[styles.input, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}
              onPress={() => openEditSubjectDropdown(dayIdx, item.id)} // Use the new handler
            >
              <Text style={{ color: item.name ? '#fff' : '#888' }}>
                {item.name || 'Select Subject *'}
              </Text>
              <Ionicons 
                name={'chevron-down'} 
                size={20} 
                color="#888" 
              />
            </TouchableOpacity>
          </View>
          
          <TextInput
            style={styles.input}
            placeholder="Professor (optional)"
            placeholderTextColor="#888"
            value={item.professor}
            onChangeText={(text) => handleEditChange(dayIdx, item.id, 'professor', text)}
          />

          <TextInput
            style={styles.input}
            placeholder="Room (optional)"
            placeholderTextColor="#888"
            value={item.room}
            onChangeText={(text) => handleEditChange(dayIdx, item.id, 'room', text)}
          />

          {/* ADDED: Time Pickers for Edit Form */}
          <View style={styles.timeInputRow}>
            <View style={styles.timeInputContainer}>
              <Text style={styles.timeInputLabel}>Start</Text>
              <TouchableOpacity
                onPress={() => setShowEditStartTimePicker(true)} // Use edit state
                style={styles.timeInput}
              >
                <Text
                  style={{
                    color: item.startTime ? "#fff" : "#888",
                  }}
                >
                  {item.startTime || "09:00"}
                </Text>
              </TouchableOpacity>
              {showEditStartTimePicker && ( // Use edit state
                <DateTimePicker
                  value={new Date()} // You might want to parse item.startTime to set a default
                  mode="time"
                  is24Hour={true}
                  display="default"
                  onChange={(e, t) => handleEditStartTimeChange(e, t, dayIdx, item.id)} // Use edit handler
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
                onPress={() => setShowEditEndTimePicker(true)} // Use edit state
                style={styles.timeInput}
              >
                <Text
                  style={{
                    color: item.endTime ? "#fff" : "#888",
                  }}
                >
                  {item.endTime || "10:00"}
                </Text>
              </TouchableOpacity>
              {showEditEndTimePicker && ( // Use edit state
                <DateTimePicker
                  value={new Date()} // You might want to parse item.endTime to set a default
                  mode="time"
                  is24Hour={true}
                  display="default"
                  onChange={(e, t) => handleEditEndTimeChange(e, t, dayIdx, item.id)} // Use edit handler
                />
              )}
            </View>
          </View>
          {/* --- END OF ADDED TIME PICKERS --- */}


          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 10 }}>
            <TouchableOpacity
              style={[styles.addBtn, { flex: 1, marginRight: 8 }]}
              onPress={() => saveEditedLecture(dayIdx, item.id)}
            >
              <LinearGradient
                colors={dayColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.addBtnGradient}
              >
                <Ionicons name="save-outline" size={20} color="#fff" />
                <Text style={styles.addBtnText}>Save</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.addBtn, { flex: 1, marginLeft: 8, backgroundColor: '#333', borderRadius: 8, alignItems: 'center', justifyContent: 'center' }]}
              onPress={() => setEditingSubject(null)}
            >
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

  
  // This will render at the end of our FlatList as footer (if not editing)
  const renderSaveButton = () => {
    // Hide if currently editing a day or no changes
    if (!hasUnsavedChanges || editDay !== null) return null; 

    return (
      <View style={styles.saveButtonSection}>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={() => saveToStorage()} // Calls the base save function
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
      {/* <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}> */}
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
              <Text style={styles.actionButtonText}>Subjects</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.sendButton]}
              onPress={() => {
                router.push('/SendTimetable');
              }}
            >
              <Ionicons name="send-outline" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Send TT</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.receiveButton]}
              onPress={() => {
                router.push('/ReceiveTimetable');
              }}
            >
              <Ionicons name="download-outline" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Receive TT</Text>
            </TouchableOpacity>
          </View>

          {/* <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}> */}
          <FlatList
            data={timetable}
            keyExtractor={(item) => item.day}
            contentContainerStyle={styles.listContainer}
            nestedScrollEnabled={true}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            // ListFooterComponent={renderSaveButton} // Render footer save button
            renderItem={({ item: day, index: dayIdx }) => {
              const dayColors = DAY_THEMES[day.day] || ["#4361ee", "#3a0ca3"];

              return (
                // <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
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

                    {/* Conditional render: SHOW FORM */}
                    {editDay === dayIdx && showAddSlotForm && (
                      <View style={styles.addForm}>
                        <Text style={styles.addFormTitle}>Add New Slot</Text>

                        <View style={styles.relativeContainer}>
                          <TouchableOpacity
                            ref={inputRef}
                            style={[styles.input, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}
                            onPress={() => openSubjectDropdown(dayIdx)}
                          >
                            <Text style={{ color: newSubject.name ? '#fff' : '#888' }}>
                              {newSubject.name || 'Select Subject *'}
                            </Text>
                            <Ionicons 
                              name={'chevron-down'} 
                              size={20} 
                              color="#888" 
                            />
                          </TouchableOpacity>
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
                      </View>
                    )}
                    
                    {/* Conditional render: SHOW ADD BUTTON & SAVE BUTTON */}
                    {editDay === dayIdx && !showAddSlotForm && (
                      <View>
                        <TouchableOpacity
                            style={[styles.addBtn, { marginTop: 16 }]}
                            onPress={() => setShowAddSlotForm(true)}
                        >
                            <LinearGradient
                                colors={dayColors}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={[styles.addBtnGradient, {borderRadius: 8}]}
                            >
                                <Ionicons name="add" size={20} color="#fff" />
                                <Text style={styles.addBtnText}>Add Another Slot</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                        
                        {/* THIS IS THE SAVE BUTTON INSIDE THE DAY SECTION */}
                        {hasUnsavedChanges && (
                            // <View style={styles.saveButtonSection}> 
                                <TouchableOpacity
                                    style={styles.saveChangesButton}
                                    onPress={handleSaveAndClose} // CALLS THE NEW HANDLER
                                    disabled={isSaving}
                                >
                                    <View
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
                                    </View>
                                </TouchableOpacity>
                            // </View>
                        )}
                      </View>
                    )}
                  </View>
                </View>
                // </KeyboardAvoidingView>
              );
            }}
          />
          {/* </KeyboardAvoidingView> */}

        </LinearGradient>

        {/* ------------------------------------------- */}
        {/* ROOT-LEVEL DROPDOWN MODAL FOR SUBJECTS */}
        {/* ------------------------------------------- */}
        <Modal
          visible={dropdownProps.visible}
          transparent={true}
          animationType="fade"
          onRequestClose={closeSubjectDropdown}
        >
          <Pressable style={styles.dropdownModalOverlay} onPress={closeSubjectDropdown}>
            <View
              style={[
                styles.dropdownContainerModal, 
                {
                  top: dropdownProps.y,
                  left: dropdownProps.x,
                  width: dropdownProps.width,
                },
              ]}
              onStartShouldSetResponder={() => true} 
            >
              <View style={styles.dropdown}>
                <FlatList
                  data={subjects}
                  keyExtractor={(item) => item.id}
                  nestedScrollEnabled={true} 
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.dropdownItem}
                      onPress={() => {
                        handleSelectSubject(item.name);
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
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={true}
                  style={{ maxHeight: 192 }}
                  contentContainerStyle={{ flexGrow: 1 }}
                />
                <TouchableOpacity
                  style={[styles.dropdownItem, { borderTopWidth: 1, borderTopColor: '#333' }]}
                  onPress={() => {
                    closeSubjectDropdown();
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
          </Pressable>
        </Modal>

        {/* Subject Management Modal (UPDATED) */}
        <Modal
          visible={showSubjectSetup}
          transparent={true}
          animationType="slide"
          onRequestClose={() => !isFirstTime && setShowSubjectSetup(false)}
        >
          {/* WRAPPED ENTIRE MODAL CONTENT IN KEYBOARD AVOIDING VIEW */}
          <KeyboardAvoidingView 
            style={styles.modalContainer}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            enabled
          >
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

              <View style={styles.modalsubHeader}>
                    {/* <Text style={styles.subjectsTitle}></Text> */}
                    <TouchableOpacity 
                        style={styles.addSubjectButton}
                        onPress={() => setShowAddSubject(true)}
                      >
                        <Ionicons name="add" size={20} color="#3fa4ff" />
                        <Text style={styles.addSubjectText}>Add Subject</Text>
                      </TouchableOpacity>
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
                  style={{ flex: 1 }}
                  // ListHeaderComponent={
                    // <View style={styles.subjectsHeader}>
                    //   <Text style={styles.subjectsTitle}>Your Subjects</Text>
                    //   <TouchableOpacity 
                    //     style={styles.addSubjectButton}
                    //     onPress={() => setShowAddSubject(true)}
                    //   >
                    //     <Ionicons name="add" size={20} color="#3fa4ff" />
                    //     <Text style={styles.addSubjectText}>Add Subject</Text>
                    //   </TouchableOpacity>
                    // </View>
                  // }
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
                  keyboardShouldPersistTaps="handled" // Keep taps working with keyboard
                />

                {/* This part will be pushed up by KeyboardAvoidingView */}
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
                    </View>
                  </View>
                )}

                {/* This button stays at the bottom */}
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
          </KeyboardAvoidingView>
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
      {/* </KeyboardAvoidingView> */}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  // --- DROPDOWN STYLES ---
  dropdownContainerModal: { // NEW: For the absolutely positioned dropdown content in the Modal
    position: 'absolute',
    zIndex: 1000,
  },
  dropdownModalOverlay: { // NEW: For the transparent background covering the whole screen
    flex: 1,
    backgroundColor: 'transparent',
  },
  dropdown: {
    backgroundColor: '#000',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    maxHeight: 240, 
    ...Platform.select({
      ios: {
        shadowColor: '#fff',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
    zIndex: 1000,
  },
  dropdownItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 48,
    justifyContent: 'center',
  },
  dropdownItemText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
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
    minHeight: 48,
  },
  relativeContainer: { // Keeps the input anchored for measurement purposes
    position: 'relative',
  },
  // --- END DROPDOWN STYLES ---

  // --- SUBJECT MANAGEMENT MODAL STYLES (UPDATED) ---
  modalContainer: { // For KAV wrapper
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center', // Center vertically
    alignItems: 'center', // Center horizontally
    paddingHorizontal: 20, // Keep horizontal padding
    paddingVertical: Platform.OS === 'ios' ? 40 : 20, // Add vertical padding
  },
  modalContent: {
    backgroundColor: '#1E1E1E',
    width: '100%',
    borderRadius: 15,
    overflow: 'hidden',
    borderColor: '#333',
    flex: 1, // Allow content to grow within KAV
    maxHeight: '70%', // Limit height
    ...Platform.select({
      ios: {
        shadowColor: "#000",
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
    backgroundColor: '#1A1A1A',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // borderBottomWidth: 1,
    // borderBottomColor: '#333',
  },
  modalsubHeader: {
    backgroundColor: '#1A1A1A',
    // paddingTop: -8,
    marginTop: -8,
    paddingBottom: 8,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  

  modalTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  closeButton: {
    padding: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    paddingVertical: 20,
    // marginTop: -5s,
    paddingTop: 10,
    padding: 20,
    backgroundColor: '#1A1A1A',
    flex: 1, // Crucial for FlatList scrolling
    // minHeight: 200, // Helps flex calculation
  },
  modalText: {
    color: '#E0E0E0',
    fontSize: 16,
    marginBottom: 20,
    lineHeight: 22,
  },
  subjectsList: {
    // Removed specific flexGrow, let FlatList's own style handle it
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
  subjectInput: { // Renamed from subjectsInput to avoid confusion
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
  },
  modalButtonContainer: {
    borderRadius: 16,
    overflow: "hidden",
    height: 56,
    marginTop: 20, // Add margin to separate from list/input
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
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
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#333',
  },
  saveButton: { // Style for the individual save button
    backgroundColor: '#3fa4ff',
  },
  saveChangesButton: {
    // backgroundColor: '#3f  a4ff',
    borderColor: '#3fa4ff',
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 10,

  },
  doneButton: { // Style specifically for the Done button at the bottom
    // No specific background needed as LinearGradient provides it
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
  // --- END SUBJECT MANAGEMENT MODAL STYLES ---

  // --- OTHER STYLES (UNCHANGED) ---
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
  sendButton: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  receiveButton: {
    backgroundColor: 'rgba(255, 193, 7, 0.15)',
    borderColor: 'rgba(255, 193, 7, 0.3)',
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
    paddingHorizontal: 6,
    paddingBottom: 12,
    overflow: 'scroll',
    gap: 8,
    marginBottom: 8,
    marginTop: 4,
    justifyContent: 'space-evenly',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 25,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
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
    fontSize: 24,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  listContainer: {
    paddingHorizontal: 12,
    // paddingBottom: 80, // Added padding to ensure last item isn't hidden by footer save button
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
    borderRadius: 8, // Ensure gradient also has border radius if needed
  },
  addBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
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
    borderRadius: 10,
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
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
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
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  emptyDayContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  noSubjectText: {
    color: "#888",
    fontSize: 15,
    fontStyle: "italic",
    marginTop: 1,
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
    justifyContent: 'center', // Added to center text vertically in TouchableOpacity
    minHeight: 50, // Added to ensure consistent height with TextInput
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
    minHeight: 50, // Added to ensure consistent height
  },
  timeSeparator: {
    width: 40,
    alignItems: "center",
  },
  saveButtonSection: { // Style for the main Save button in footer and the section-specific one
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
  editIcon: {
  backgroundColor: "rgba(63, 164, 255, 0.1)",
  borderRadius: 20,
  padding: 8,
  borderWidth: 1,
  borderColor: "rgba(63, 164, 255, 0.3)",
  marginRight: 8,
},

});