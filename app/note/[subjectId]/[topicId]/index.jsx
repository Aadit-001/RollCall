import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";

export default function TopicNotes() {
  const params = useLocalSearchParams();
  const subjectId = params.subjectId?.toString();
  const topicId = params.topicId?.toString();
  const router = useRouter();
  const textInputRef = useRef();

  const [note, setNote] = useState("");
  const [topicName, setTopicName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [wordCount, setWordCount] = useState(0);

  const saveOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadNote();
  }, []);

  useEffect(() => {
    // Update word count
    const words = note
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0);
    setWordCount(words.length);
  }, [note]);

  const loadNote = async () => {
    try {
      const data = await AsyncStorage.getItem("subjects");
      if (data) {
        const subjects = JSON.parse(data);
        const subject = subjects.find((s) => s.id.toString() === subjectId);

        if (subject) {
          const topic = (subject.topics || []).find(
            (t) => t.id.toString() === topicId
          );

          if (topic) {
            const noteContent = topic.notes || "";
            setNote(noteContent);
            setTopicName(topic.name || "");
          }
        }
      }
    } catch (error) {
      console.error("Error loading note:", error);
    }
  };

  const saveNote = async (text) => {
    setIsSaving(true);

    try {
      const data = await AsyncStorage.getItem("subjects");
      if (data) {
        const subjects = JSON.parse(data);
        const subjectIdx = subjects.findIndex(
          (s) => s.id.toString() === subjectId
        );

        if (subjectIdx !== -1) {
          const topicIdx = (subjects[subjectIdx].topics || []).findIndex(
            (t) => t.id.toString() === topicId
          );

          if (topicIdx !== -1) {
            subjects[subjectIdx].topics[topicIdx].notes = text;
            subjects[subjectIdx].topics[topicIdx].modifiedAt =
              new Date().toISOString();

            await AsyncStorage.setItem("subjects", JSON.stringify(subjects));
            showSavedFeedback();
          }
        }
      }
    } catch (error) {
      console.error("Error saving note:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const showSavedFeedback = () => {
    Animated.sequence([
      Animated.timing(saveOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(1500),
      Animated.timing(saveOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleTextChange = (text) => {
    setNote(text);

    // Auto-save after 2 seconds of no typing
    clearTimeout(textInputRef.saveTimeout);
    textInputRef.saveTimeout = setTimeout(() => {
      saveNote(text);
    }, 100);
  };

  const clearNote = () => {
    setNote("");
    saveNote("");
    textInputRef.current?.focus();
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="#121212" />

      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.header} numberOfLines={1}>
          {topicName}
        </Text>

        <View style={styles.headerActions}>
          {/* Clear button */}

          {/* Save indicator */}
          <View style={styles.saveIndicator}>
            {isSaving ? (
              <ActivityIndicator size="small" color="#3fa4ff" />
            ) : (
              <Animated.View style={{ opacity: saveOpacity }}>
                <View style={styles.savedBadge}>
                  <Ionicons name="checkmark-circle" size={16} color="#fff" />
                  <Text style={styles.savedText}>Saved</Text>
                </View>
              </Animated.View>
            )}
          </View>
            {note.length > 0 && (
              <TouchableOpacity onPress={clearNote} style={styles.clearButton}>
                <Ionicons name="trash-outline" size={20} color="#ff6b6b" />
              </TouchableOpacity>
            )}
        </View>
      </View>

      {/* Simple Text Editor */}
      <View style={styles.editorContainer}>
        <TextInput
          ref={textInputRef}
          style={styles.textEditor}
          value={note}
          onChangeText={handleTextChange}
          placeholder="Start writing your notes here..."
          placeholderTextColor="#666"
          multiline
          textAlignVertical="top"
          autoCorrect={true}
          spellCheck={true}
          selectionColor="#3fa4ff"
        />
      </View>

      {/* Footer with word count */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {note.length > 0
            ? `${wordCount} words • ${note.length} characters`
            : "Start typing to see word count"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    paddingTop: 18,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    marginLeft: 8,
    paddingHorizontal: 8,
    marginTop: 36,
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
    fontSize: 20,
    fontWeight: "600",
    flex: 1,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  clearButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,107,107,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  saveIndicator: {
    width: 70,
    alignItems: "flex-end",
  },
  savedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#43a047",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  savedText: {
    color: "#fff",
    fontSize: 12,
    marginLeft: 3,
    fontWeight: "600",
  },
  editorContainer: {
    flex: 1,
    margin: 12,
    backgroundColor: "#232323",
    borderRadius: 12,
    padding: 20,
  },
  textEditor: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    lineHeight: 24,
    textAlignVertical: "top",
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#1a1a1a",
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  footerText: {
    color: "#888",
    fontSize: 12,
  },
});