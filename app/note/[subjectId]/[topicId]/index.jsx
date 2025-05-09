import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  RichEditor,
  RichToolbar,
  actions,
} from "react-native-pell-rich-editor";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";

export default function TopicNotes() {
  const params = useLocalSearchParams();
  const subjectId = params.subjectId?.toString();
  const topicId = params.topicId?.toString();
  const router = useRouter();
  const richText = useRef();
  const [note, setNote] = useState("");
  const [topicName, setTopicName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const saveOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadNote();
  }, []);

  const loadNote = async () => {
    try {
      const data = await AsyncStorage.getItem("subjects");
      console.log("Loaded subjects (type):", typeof data);
      console.log("Loaded subjects (value):", data);
      
      if (data) {
        const subjects = JSON.parse(data);
        console.log("Subjects (type):", typeof subjects);
        console.log("Subjects (value):", subjects);
        
        const subject = subjects.find((s) => s.id.toString() === subjectId);
        console.log("Subject (type):", typeof subject);
        console.log("Subject (value):", subject);
        
        if (subject) {
          const topic = (subject.topics || []).find(
            (t) => t.id.toString() === topicId
          );
          console.log("Topic (type):", typeof topic);
          console.log("Topic (value):", topic);
          
          if (topic) {
            // Ensure notes is a string
            const noteContent = topic.notes && typeof topic.notes === 'string' 
              ? topic.notes 
              : (topic.notes && topic.notes.toString ? topic.notes.toString() : '');
            
            console.log("Note Content (type):", typeof noteContent);
            console.log("Note Content (value):", noteContent);
            
            setNote(noteContent);
            setTopicName(topic.name || '');
          }
        }
      }
    } catch (error) {
      console.error("Error loading note:", error);
    }
  };

  const saveNote = async (text) => {
    console.log('saveNote input type:', typeof text);
    console.log('saveNote input value:', text);

    // Normalize text to a string
    const normalizedText = text === null || text === undefined 
      ? '' 
      : (Array.isArray(text) ? text.join('') : text.toString());

    console.log('Normalized text type:', typeof normalizedText);
    console.log('Normalized text value:', normalizedText);

    setNote(normalizedText);
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
            // Update the note content
            subjects[subjectIdx].topics[topicIdx].notes = normalizedText;

            // Update the modifiedAt timestamp with current date/time
            subjects[subjectIdx].topics[topicIdx].modifiedAt =
              new Date().toISOString();

            await AsyncStorage.setItem("subjects", JSON.stringify(subjects));

            // Show saved animation
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
    setSavedFeedback(true);
    Animated.sequence([
      Animated.timing(saveOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(1000),
      Animated.timing(saveOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => setSavedFeedback(false));
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="#121212"/>
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.header}>{topicName}</Text>

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
      </View>

      <ScrollView style={{ flex: 1 }}>
        <RichEditor
          ref={richText}
          initialContentHTML={typeof note === 'string' ? note : (Array.isArray(note) ? note.join('') : '')}
          onChange={(text) => {
            console.log('RichEditor onChange type:', typeof text);
            console.log('RichEditor onChange value:', text);
            saveNote(text);
          }}
          style={styles.richEditor}
          placeholder="Write your notes here..."
          editorStyle={{ backgroundColor: "#232323", color: "#fff" }}
          androidHardwareAccelerationDisabled={true}
          androidLayerType="software"
        />
      </ScrollView>

      <RichToolbar
  editor={richText}
  actions={[
    actions.setBold,
    actions.setItalic,
    actions.setUnderline,
    actions.insertBulletsList,
    actions.insertOrderedList,
    actions.insertLink,
    actions.setStrikethrough,
    actions.setSuperscript,
    actions.setSubscript,
    actions.removeFormat,
  ].filter(Boolean)}  // Add this .filter(Boolean)
  style={styles.richToolbar}
  iconTint="#fff"
  selectedIconTint="#3fa4ff"
  selectedButtonStyle={{ backgroundColor: "#232323" }}
/>
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
    fontSize: 22,
    fontWeight: "bold",
    flex: 1,
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
  richEditor: {
    minHeight: 300,
    borderRadius: 12,
    margin: 12,
    backgroundColor: "#232323",
    color: "#fff",
  },
  richToolbar: {
    backgroundColor: "#232323",
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
});
