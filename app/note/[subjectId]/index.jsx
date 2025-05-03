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
  Animated,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import uuid from "react-native-uuid";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { RichEditor, RichToolbar, actions } from "react-native-pell-rich-editor";

export default function SubjectTopics() {
  const params = useLocalSearchParams();
  const subjectId = params.subjectId?.toString();
  const router = useRouter();
  const [topics, setTopics] = useState([]);
  const [subjectName, setSubjectName] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [newTopic, setNewTopic] = useState("");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  // Use animation when component mounts
  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

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

  const getCardColors = (index) => {
    const colorSets = [
      ["#4361ee", "#3a0ca3"],
      ["#7209b7", "#3f37c9"],
      ["#f72585", "#b5179e"],
      ["#4cc9f0", "#4895ef"],
      ["#3a86ff", "#0096c7"],
      ["#ffb703", "#fb8500"],
    ];
    return colorSets[index % colorSets.length];
  };

  const renderTopicCard = ({ item, index }) => {
    const colorSet = getCardColors(index);

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
          onPress={() => router.push(`/note/${subjectId}/${item.id}`)}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={colorSet}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          >
            <View style={styles.iconDot}>
              <FontAwesome5 name="book" size={14} color="#fff" />
            </View>

            <View style={styles.textContainer}>
              <Text
                style={styles.cardText}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {item.name}
              </Text>
              {item.modifiedAt && (
                <View style={styles.dateContainer}>
                  <Ionicons
                    name="time-outline"
                    size={14}
                    color="rgba(255,255,255,0.7)"
                  />
                  <Text style={styles.dateText}>
                    {formatDate(item.modifiedAt)}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.iconContainer}>
              <TouchableOpacity
                style={[
                  styles.actionIcon,
                  styles.favoriteIcon,
                  item.isFavorite && styles.favoriteActive,
                ]}
                onPress={() => toggleFavorite(item.id)}
              >
                <Ionicons
                  name={item.isFavorite ? "star" : "star-outline"}
                  size={18}
                  color={item.isFavorite ? "#ffcc00" : "#fff"}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionIcon, styles.deleteIcon]}
                onPress={() => handleDeleteTopic(item.id)}
              >
                <Ionicons name="trash-outline" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#1a1a1a", "#121212"]}
        style={styles.backgroundGradient}
      >
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.header}>{subjectName}</Text>
            <Text style={styles.subHeader}>
              {filteredTopics.length}{" "}
              {filteredTopics.length === 1 ? "topic" : "topics"}
            </Text>
          </View>
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
              <MaterialIcons name="folder-open" size={80} color="#333" />
              <Text style={styles.emptyTitle}>
                {showFavoritesOnly ? "No favorites yet" : "No topics yet"}
              </Text>
              <Text style={styles.emptyText}>
                {showFavoritesOnly
                  ? "Star a topic to add it to your favorites"
                  : "Add a topic to get started with your notes"}
              </Text>
              {showFavoritesOnly && (
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={() => setShowFavoritesOnly(false)}
                >
                  <Text style={styles.emptyButtonText}>View All Topics</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />

        {/* Floating Add Button */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={["#4361ee", "#3a0ca3"]}
            style={styles.fabGradient}
          >
            <Ionicons name="add" size={32} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>

        {/* Add Topic Modal */}
        <Modal visible={modalVisible} animationType="slide" transparent>
          <View style={styles.modalBg}>
            <Animated.View
              style={[
                styles.modalBox,
                {
                  transform: [
                    {
                      translateY: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [100, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add New Topic</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close-circle" size={26} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <Ionicons
                  name="document-text-outline"
                  size={20}
                  color="#3fa4ff"
                  style={styles.inputIcon}
                />
                <TextInput
                  value={newTopic}
                  onChangeText={setNewTopic}
                  placeholder="Topic Name"
                  style={styles.input}
                  placeholderTextColor="#888"
                  autoFocus
                />
              </View>

              <TouchableOpacity
                onPress={addTopic}
                style={styles.addBtn}
                disabled={!newTopic.trim()}
              >
                <LinearGradient
                  colors={["#4361ee", "#3a0ca3"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    styles.addBtnGradient,
                    !newTopic.trim() && styles.addBtnDisabled,
                  ]}
                >
                  <Text style={styles.addBtnText}>Create Topic</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Modal>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  backgroundGradient: {
    flex: 1,
    // paddingTop: 18,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 16,
    paddingBottom: 10,
    backgroundColor: "black",
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  headerTextContainer: {
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  header: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
  },
  subHeader: {
    color: "#999",
    fontSize: 12,
    marginTop: 1,
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterButtonActive: {
    backgroundColor: "rgba(255, 204, 0, 0.2)",
  },
  filterText: {
    color: "#fff",
    marginLeft: 6,
    fontSize: 14,
    fontWeight: "500",
  },
  grid: {
    paddingBottom: 90,
    paddingHorizontal: 16,
  },
  cardContainer: {
    marginBottom: 16,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  card: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
  },
  cardGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
  },
  iconDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    paddingRight: 50, // Space for the icons
  },
  cardText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    marginLeft: 4,
  },
  iconContainer: {
    position: "absolute",
    right: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  actionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 6,
  },
  favoriteIcon: {
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  favoriteActive: {
    backgroundColor: "rgba(255,204,0,0.3)",
  },
  deleteIcon: {
    backgroundColor: "rgba(255,0,0,0.2)",
  },
  fab: {
    position: "absolute",
    right: 24,
    bottom: 80,
    borderRadius: 28,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
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
    width: 56,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 60,
    padding: 20,
  },
  emptyTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 8,
  },
  emptyText: {
    color: "#999",
    textAlign: "center",
    fontSize: 16,
    marginBottom: 24,
    maxWidth: 260,
  },
  emptyButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 8,
  },
  emptyButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: "#222",
    borderRadius: 24,
    width: "85%",
    maxWidth: 360,
    paddingVertical: 24,
    paddingHorizontal: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
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
    backgroundColor: "#333",
    borderRadius: 12,
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    padding: 14,
  },
  addBtn: {
    borderRadius: 12,
    overflow: "hidden",
  },
  addBtnGradient: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
  },
  addBtnDisabled: {
    opacity: 0.5,
  },
  addBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
