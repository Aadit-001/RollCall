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
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import uuid from "react-native-uuid";
import { LinearGradient } from "expo-linear-gradient";

const STORAGE_KEY = "subjects";

const Notes = () => {
  const router = useRouter();
  const [subjects, setSubjects] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newSubject, setNewSubject] = useState("");

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
      console.log("Loaded subjects:", data);
      if (data) {
        setSubjects(JSON.parse(data));
      } else {
        setSubjects([]);
      }
    } catch (error) {
      console.error("Error loading subjects:", error);
    }
  };

  const addSubject = async () => {
    if (!newSubject.trim()) return;
    try {
      const newSubjectObj = {
        id: uuid.v4(),
        name: newSubject.trim(),
        topics: [],
      };
      const updatedSubjects = [...subjects, newSubjectObj];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSubjects));
      setSubjects(updatedSubjects);
      setNewSubject("");
      setModalVisible(false);
    } catch (error) {
      console.error("Error adding subject:", error);
    }
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
            },
            style: "destructive",
          },
        ]
      );
    } catch (error) {
      console.error("Error deleting subject:", error);
    }
  };

  const renderSubjectCard = ({ item }) => (
    <View style={styles.cardContainer}>
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/note/${item.id}`)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={["#2a2a2a", "#232323"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.cardContent}>
            <Text style={styles.cardText}>{item.name}</Text>
            <Text style={styles.topicsCount}>
              {item.topics?.length || 0}{" "}
              {item.topics?.length === 1 ? "topic" : "topics"}
            </Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.deleteIcon}
        onPress={() => handleDeleteSubject(item.id)}
      >
        <Ionicons name="trash-outline" size={22} color="#ff4d4d" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>Subjects</Text>
      </View>

      <FlatList
        data={subjects}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        renderItem={renderSubjectCard}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="menu-book" size={70} color="#555" />
            <Text style={styles.emptyText}>
              No subjects yet. Add your first subject!
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Floating Add Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Add Subject Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Add Subject</Text>
            <TextInput
              value={newSubject}
              onChangeText={setNewSubject}
              placeholder="Subject Name"
              style={styles.input}
              placeholderTextColor="#888"
              autoFocus
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.cancelBtn}
              >
                <Text style={{ color: "#fff" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={addSubject} style={styles.addBtn}>
                <Text style={{ color: "#fff", fontWeight: "bold" }}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Notes;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#181818",
    paddingTop: 18,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  headerText: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  addButtonText: {
    color: "#3fa4ff",
    fontSize: 16,
    marginRight: 5,
  },
  grid: {
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 90,
    paddingHorizontal: 5,
  },
  cardContainer: {
    position: "relative",
    margin: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#3fa4ff",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  card: {
    width: 180,
    height: 140,
    borderRadius: 16,
    overflow: "hidden",
  },
  gradient: {
    flex: 1,
    padding: 15,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#3fa4ff",
    borderRadius: 16,
  },
  cardContent: {
    flex: 1,
    justifyContent: "space-between",
  },
  cardText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
  },
  topicsCount: {
    color: "#aaa",
    fontSize: 14,
    textAlign: "center",
    marginTop: 5,
  },
  deleteIcon: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(35, 35, 35, 0.8)",
    borderRadius: 12,
    padding: 5,
    zIndex: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 77, 77, 0.5)",
  },
  fab: {
    position: "absolute",
    right: 24,
    bottom: 80,
    backgroundColor: "#3fa4ff",
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 80,
  },
  emptyText: {
    color: "#888",
    textAlign: "center",
    marginTop: 16,
    fontSize: 16,
    maxWidth: 250,
  },
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: "#232323",
    borderRadius: 16,
    padding: 24,
    width: 320,
    borderWidth: 1,
    borderColor: "#3fa4ff",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  modalTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16,
  },
  input: {
    backgroundColor: "#181818",
    color: "#fff",
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#3fa4ff",
    marginBottom: 20,
  },
  modalBtns: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  cancelBtn: {
    backgroundColor: "#555",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 18,
    marginRight: 12,
  },
  addBtn: {
    backgroundColor: "#3fa4ff",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
});
