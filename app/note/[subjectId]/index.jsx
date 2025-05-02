import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import uuid from "react-native-uuid";
import { LinearGradient } from "expo-linear-gradient";

export default function SubjectTopics() {
  const params = useLocalSearchParams();
  const subjectId = params.subjectId?.toString();
  const router = useRouter();
  const [topics, setTopics] = useState([]);
  const [subjectName, setSubjectName] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [newTopic, setNewTopic] = useState("");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Use useFocusEffect to reload data whenever screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadTopics();
      return () => {};
    }, [])
  );

  const loadTopics = async () => {
    try {
      const data = await AsyncStorage.getItem("subjects");
      if (data) {
        const subjects = JSON.parse(data);
        const subject = subjects.find((s) => s.id.toString() === subjectId);
        if (subject) {
          setTopics(subject.topics || []);
          setSubjectName(subject.name);
        }
      }
    } catch (error) {
      console.error("Error loading topics:", error);
    }
  };

  const addTopic = async () => {
    if (!newTopic.trim()) return;
    try {
      const data = await AsyncStorage.getItem("subjects");
      if (data) {
        const subjects = JSON.parse(data);
        const subjectIdx = subjects.findIndex(
          (s) => s.id.toString() === subjectId
        );
        if (subjectIdx !== -1) {
          const now = new Date().toISOString();
          const newTopicObj = {
            id: uuid.v4(),
            name: newTopic.trim(),
            notes: "",
            createdAt: now,
            modifiedAt: now,
            isFavorite: false,
          };
          subjects[subjectIdx].topics = [
            ...(subjects[subjectIdx].topics || []),
            newTopicObj,
          ];

          await AsyncStorage.setItem("subjects", JSON.stringify(subjects));
          setTopics(subjects[subjectIdx].topics);
          setNewTopic("");
          setModalVisible(false);
        }
      }
    } catch (error) {
      console.error("Error adding topic:", error);
    }
  };

  const toggleFavorite = async (topicId) => {
    try {
      const data = await AsyncStorage.getItem("subjects");
      if (data) {
        const subjects = JSON.parse(data);
        const subjectIdx = subjects.findIndex(
          (s) => s.id.toString() === subjectId
        );
        if (subjectIdx !== -1) {
          const topicIdx = subjects[subjectIdx].topics.findIndex(
            (t) => t.id.toString() === topicId
          );
          if (topicIdx !== -1) {
            // Toggle favorite status without changing modification time
            subjects[subjectIdx].topics[topicIdx].isFavorite =
              !subjects[subjectIdx].topics[topicIdx].isFavorite;

            await AsyncStorage.setItem("subjects", JSON.stringify(subjects));
            setTopics(subjects[subjectIdx].topics);
          }
        }
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const handleDeleteTopic = async (topicId) => {
    try {
      Alert.alert(
        "Delete Topic",
        "Are you sure you want to delete this topic? All notes will be permanently lost.",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Delete",
            onPress: async () => {
              const data = await AsyncStorage.getItem("subjects");
              if (data) {
                const subjects = JSON.parse(data);
                const subjectIdx = subjects.findIndex(
                  (s) => s.id.toString() === subjectId
                );
                if (subjectIdx !== -1) {
                  subjects[subjectIdx].topics = subjects[
                    subjectIdx
                  ].topics.filter((t) => t.id.toString() !== topicId);
                  await AsyncStorage.setItem(
                    "subjects",
                    JSON.stringify(subjects)
                  );
                  setTopics(subjects[subjectIdx].topics);
                }
              }
            },
            style: "destructive",
          },
        ]
      );
    } catch (error) {
      console.error("Error deleting topic:", error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "No date";
    const date = new Date(dateString);
    return (
      date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }) +
      " • " +
      date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  };

  const filteredTopics = showFavoritesOnly
    ? topics.filter((topic) => topic.isFavorite)
    : topics;

  const renderTopicCard = ({ item }) => (
    <View style={styles.cardContainer}>
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/note/${subjectId}/${item.id}`)}
      >
        <LinearGradient
          colors={["#2a2a2a", "#232323"]}
          style={styles.cardGradient}
        >
          <View style={styles.textContainer}>
            <Text
              style={styles.cardText}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {item.name}
            </Text>
            {item.modifiedAt && (
              <Text style={styles.dateText}>{formatDate(item.modifiedAt)}</Text>
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>

      <View style={styles.iconContainer}>
        <TouchableOpacity
          style={styles.favoriteIcon}
          onPress={() => toggleFavorite(item.id)}
        >
          <Ionicons
            name={item.isFavorite ? "star" : "star-outline"}
            size={22}
            color={item.isFavorite ? "#ffcc00" : "#aaa"}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteIcon}
          onPress={() => handleDeleteTopic(item.id)}
        >
          <Ionicons name="trash-outline" size={22} color="#ff4d4d" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.header}>{subjectName}</Text>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            showFavoritesOnly && styles.filterButtonActive,
          ]}
          onPress={() => setShowFavoritesOnly(!showFavoritesOnly)}
        >
          <Ionicons
            name="star"
            size={16}
            color={showFavoritesOnly ? "#ffcc00" : "#fff"}
          />
          <Text style={styles.filterText}>
            {showFavoritesOnly ? "All Topics" : "Favorites"}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredTopics}
        keyExtractor={(item) => item.id}
        numColumns={1}
        contentContainerStyle={styles.grid}
        renderItem={renderTopicCard}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="folder-open" size={60} color="#555" />
            <Text style={styles.emptyText}>
              {showFavoritesOnly
                ? "No favorite topics yet. Star a topic to add it to favorites!"
                : "No topics yet. Tap + to add one!"}
            </Text>
          </View>
        }
      />

      {/* Floating Add Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>

      {/* Add Topic Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Add Topic</Text>
            <TextInput
              value={newTopic}
              onChangeText={setNewTopic}
              placeholder="Topic Name"
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
              <TouchableOpacity onPress={addTopic} style={styles.addBtn}>
                <Text style={{ color: "#fff", fontWeight: "bold" }}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#181818",
    paddingTop: 18,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  backButton: {
    marginRight: 15,
  },
  header: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
    flex: 1,
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 15,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2a2a2a",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#333",
  },
  filterButtonActive: {
    backgroundColor: "#333",
    borderColor: "#ffcc00",
  },
  filterText: {
    color: "#fff",
    marginLeft: 5,
    fontSize: 14,
  },
  grid: {
    paddingBottom: 90,
    paddingHorizontal: 16,
  },
  cardContainer: {
    position: "relative",
    width: "100%",
    marginVertical: 8,
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
    width: "100%",
    height: 80,
    borderRadius: 16,
    overflow: "hidden",
  },
  cardGradient: {
    flex: 1,
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#3fa4ff",
    borderRadius: 16,
    padding: 16,
    paddingRight: 70,
  },
  textContainer: {
    flexDirection: "column",
    justifyContent: "center",
    flex: 1,
  },
  cardText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  dateText: {
    color: "#888",
    fontSize: 14,
    marginTop: 4,
  },
  iconContainer: {
    position: "absolute",
    top: "50%",
    right: 12,
    flexDirection: "row",
    transform: [{ translateY: -16 }],
    zIndex: 10,
  },
  favoriteIcon: {
    backgroundColor: "rgba(35, 35, 35, 0.9)",
    borderRadius: 12,
    padding: 5,
    marginRight: 5,
    borderWidth: 1,
    borderColor: "rgba(255, 204, 0, 0.3)",
  },
  deleteIcon: {
    backgroundColor: "rgba(35, 35, 35, 0.9)",
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
    maxWidth: 280,
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
