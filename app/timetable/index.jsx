import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
  Platform,
  Animated,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import uuid from "react-native-uuid";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

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
  });

  useEffect(() => {
    loadTimetable();
  }, []);

  const loadTimetable = async () => {
    const data = await AsyncStorage.getItem("timetable");
    if (data) {
      setTimetable(JSON.parse(data).days);
    } else {
      setTimetable(WEEK_DAYS.map((day) => ({ day, subjects: [] })));
    }
  };

  const saveTimetable = async (updatedTimetable) => {
    setTimetable(updatedTimetable);
    await AsyncStorage.setItem(
      "timetable",
      JSON.stringify({ days: updatedTimetable })
    );
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
    saveTimetable(updated);
    setNewSubject({
      name: "",
      professor: "",
      startTime: "",
      endTime: "",
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
            saveTimetable(updated);
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

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#181818", "#121212"]}
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
                      <MaterialIcons name="event-busy" size={40} color="#555" />
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
                          <TextInput
                            style={styles.timeInput}
                            placeholder="09:00"
                            placeholderTextColor="#888"
                            value={newSubject.startTime}
                            onChangeText={(text) =>
                              setNewSubject((s) => ({ ...s, startTime: text }))
                            }
                          />
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
                          <TextInput
                            style={styles.timeInput}
                            placeholder="10:00"
                            placeholderTextColor="#888"
                            value={newSubject.endTime}
                            onChangeText={(text) =>
                              setNewSubject((s) => ({ ...s, endTime: text }))
                            }
                          />
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
                          <Text style={styles.addBtnText}>Add to Schedule</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            );
          }}
        />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
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
    marginBottom: 20,
    paddingHorizontal: 18,
    paddingTop: 20,
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
    paddingBottom: 80,
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
});
