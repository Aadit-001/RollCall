import React, { useEffect, useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Alert,
  Platform,
  Image,
  Animated,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import uuid from "react-native-uuid";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";

const STORAGE_KEY = "subjects";
const SUBJECT_ICONS = {
  default: "book",
  math: "calculator",
  science: "flask",
  history: "scroll",
  language: "language",
  art: "palette",
  music: "music",
  computer: "laptop-code",
};

const Notes = () => {
  const router = useRouter();
  const [subjects, setSubjects] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [fadeAnim] = useState(new Animated.Value(0));

  // Animated entry effect
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  // Filter subjects when search text changes
  useEffect(() => {
    if (searchText.trim() === "") {
      setFilteredSubjects(subjects);
    } else {
      const filtered = subjects.filter((subject) =>
        subject.name.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredSubjects(filtered);
    }
  }, [searchText, subjects]);

  // This will reload subjects data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadSubjects();
      return () => {};
    }, [])
  );

  // Initial load
  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        const loadedSubjects = JSON.parse(data);
        setSubjects(loadedSubjects);
        setFilteredSubjects(loadedSubjects);
      } else {
        setSubjects([]);
        setFilteredSubjects([]);
      }
    } catch (error) {
      console.error("Error loading subjects:", error);
      setSubjects([]);
      setFilteredSubjects([]);
    }
  };

  const addSubject = async () => {
    if (!newSubject.trim()) return;
    try {
      const newSubjectObj = {
        id: uuid.v4(),
        name: newSubject.trim(),
        topics: [],
        color: getRandomGradient(),
        icon: getSubjectIcon(newSubject.trim().toLowerCase()),
      };
      const updatedSubjects = [...subjects, newSubjectObj];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSubjects));
      setSubjects(updatedSubjects);
      setFilteredSubjects(updatedSubjects);
      setNewSubject("");
      setSearchText(""); // Reset search after adding
      setModalVisible(false);
    } catch (error) {
      console.error("Error adding subject:", error);
    }
  };

  const getRandomGradient = () => {
    const gradients = [
      ["#3a7bd5", "#3a6073"],
      ["#ff5f6d", "#ffc371"],
      ["#11998e", "#38ef7d"],
      ["#fc5c7d", "#6a82fb"],
      ["#c94b4b", "#4b134f"],
      ["#23074d", "#cc5333"],
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

  const handleDeleteSubject = async (id) => {
    try {
      Alert.alert(
        "Delete Subject",
        "Are you sure you want to delete this subject? All topics and notes within it will be deleted.",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Delete",
            onPress: async () => {
              const filteredSubjects = subjects.filter(
                (subject) => subject.id !== id
              );
              await AsyncStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(filteredSubjects)
              );
              setSubjects(filteredSubjects);
              setFilteredSubjects(filteredSubjects);
              setSearchText(""); // Reset search after deleting
            },
            style: "destructive",
          },
        ]
      );
    } catch (error) {
      console.error("Error deleting subject:", error);
    }
  };

  const renderSubjectCard = ({ item, index }) => {
    const colorPair = item.color || ["#3a7bd5", "#3a6073"];
    const icon = item.icon || "book";
    const delay = index * 100;

    return (
      <Animated.View
        style={[
          styles.cardContainer,
          {
            opacity: fadeAnim,
            transform: [
              {
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push(`/note/${item.id}`)}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={colorPair}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            <View style={styles.iconCircle}>
              <FontAwesome5 name={icon} size={20} color="#fff" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardText}>{item.name}</Text>
              <View style={styles.topicsContainer}>
                <Text style={styles.topicsCount}>
                  {item.topics?.length || 0}{" "}
                  {item.topics?.length === 1 ? "topic" : "topics"}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteIcon}
          onPress={() => handleDeleteSubject(item.id)}
        >
          <Ionicons name="trash-outline" size={14} color="orange" />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const clearSearch = () => {
    setSearchText("");
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="#121212"/>
      <LinearGradient
        colors={["#121212", "#121212"]}
        style={styles.headerGradient}
      >
        <View style={styles.headerContainer}>
          <View style={styles.titleContainer}>
            <View style={styles.headerIconContainer}>
              <Ionicons name="calendar-clear" size={28} color="white"/>
              <Text style={styles.headerText}>My Notes</Text>
            </View>
            <TouchableOpacity onPress={() => router.push("/Notifications")}>
                      <Ionicons name="notifications-outline" size={28} color="#fff" />
                    </TouchableOpacity>
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
              placeholder="Search subjects..."
              placeholderTextColor="#888"
              value={searchText}
              onChangeText={setSearchText}
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={clearSearch}>
                <Ionicons name="close-circle" size={20} color="#888" />
              </TouchableOpacity>
            )}
          </View>
        </View>
        
      </LinearGradient>

      <FlatList
        data={filteredSubjects}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        renderItem={renderSubjectCard}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            {searchText.length > 0 ? (
              <>
                <Ionicons name="search" size={80} color="#555" />
                <Text style={styles.emptyTitle}>No matching subjects</Text>
                <Text style={styles.emptyText}>
                  Try searching with a different term
                </Text>
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={clearSearch}
                >
                  <Text style={styles.emptyButtonText}>Clear Search</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Image
                  source={{
                    uri: "https://img.icons8.com/clouds/400/000000/book.png",
                  }}
                  style={styles.emptyImage}
                />
                <Text style={styles.emptyTitle}>No subjects yet</Text>
                <Text style={styles.emptyText}>
                  Start adding your subjects to create notes!
                </Text>
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={() => setModalVisible(true)}
                >
                  <Text style={styles.emptyButtonText}>
                    Add Your First Subject
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Floating Add Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <LinearGradient
          colors={["#3fa4ff", "#2389da"]}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Add Subject Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <Animated.View
            style={[
              styles.modalBox,
              {
                transform: [
                  {
                    scale: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.9, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Subject</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color="#555" />
              </TouchableOpacity>
            </View>
            <View style={styles.inputContainer}>
              <Ionicons
                name="book-outline"
                size={22}
                color="#3fa4ff"
                style={styles.inputIcon}
              />
              <TextInput
                value={newSubject}
                onChangeText={setNewSubject}
                placeholder="Subject Name"
                style={styles.input}
                placeholderTextColor="#888"
                autoFocus
              />
            </View>
            <TouchableOpacity onPress={addSubject} style={styles.addBtn}>
              <LinearGradient
                colors={["#3fa4ff", "#2389da"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.addBtnGradient}
              >
                <Text style={styles.addBtnText}>Add Subject</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

export default Notes;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,

    
  },
  headerIconContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerContainer: {
    flexDirection: "column",
    justifyContent: "space-between",
  },
  titleContainer: {
    marginBottom: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerText: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "bold",
  },
  subHeaderText: {
    color: "#aaa",
    fontSize: 16,
    marginTop: 4,
    marginLeft: 40,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 4,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    height: 40,
    padding: 0,
  },
  grid: {
    alignItems: "left",
    justifyContent: "center",
    paddingVertical: 20,
    paddingHorizontal: 4,
    paddingBottom: 100,
  },
  cardContainer: {
    position: "relative",
    margin: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  card: {
    width: 160,
    height: 160,
    borderRadius: 12,
    overflow: "hidden",
  },
  gradient: {
    flex: 1,
    padding: 16,
    justifyContent: "space-between",
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    // marginBottom: 8,
  },
  cardContent: {
    flex: 1,
    justifyContent: "space-between",
  },
  cardText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    marginVertical: 10,
  },
  topicsContainer: {
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 12,
    padding: 8,
    alignSelf: "flex-start",
    marginTop: 10,
  },
  topicsCount: {
    color: "#fff",
    fontSize: 14,
  },
  deleteIcon: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 16,
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  fab: {
    position: "absolute",
    right: 24,
    bottom: 100, // Increased to avoid tab bar overlap
    overflow: "hidden",
    borderRadius: 30,
    ...Platform.select({
      ios: {
        shadowColor: "#3fa4ff",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    paddingHorizontal: 20,
  },
  emptyImage: {
    width: 180,
    height: 180,
    marginBottom: 20,
  },
  emptyTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  emptyText: {
    color: "#888",
    textAlign: "center",
    marginBottom: 30,
    fontSize: 16,
    lineHeight: 24,
  },
  emptyButton: {
    backgroundColor: "#3fa4ff",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: "#232323",
    borderRadius: 24,
    padding: 24,
    width: "85%",
    maxWidth: 360,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 24,
      },
    }),
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#181818",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#333",
    marginBottom: 24,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    height: 56,
  },
  addBtn: {
    borderRadius: 16,
    overflow: "hidden",
    height: 56,
  },
  addBtnGradient: {
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  },
  addBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },
});
