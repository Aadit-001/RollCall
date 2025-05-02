import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  RichEditor,
  RichToolbar,
  actions,
} from "react-native-pell-rich-editor";
import { Ionicons } from "@expo/vector-icons";

export default function TopicNotes() {
  const params = useLocalSearchParams();
  const subjectId = params.subjectId?.toString();
  const topicId = params.topicId?.toString();
  const router = useRouter();
  const richText = useRef();
  const [note, setNote] = useState("");
  const [topicName, setTopicName] = useState("");

  useEffect(() => {
    loadNote();
  }, []);

  const loadNote = async () => {
    try {
      const data = await AsyncStorage.getItem("subjects");
      console.log("Loaded subjects:", data);
      if (data) {
        const subjects = JSON.parse(data);
        const subject = subjects.find((s) => s.id.toString() === subjectId);
        if (subject) {
          const topic = (subject.topics || []).find(
            (t) => t.id.toString() === topicId
          );
          if (topic) {
            setNote(topic.notes || "");
            setTopicName(topic.name || "");
          }
        }
      }
    } catch (error) {
      console.error("Error loading note:", error);
    }
  };

  const saveNote = async (text) => {
    if (text === null || text === undefined) text = "";
    setNote(text);

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
            subjects[subjectIdx].topics[topicIdx].notes = text;

            // Update the modifiedAt timestamp with current date/time
            subjects[subjectIdx].topics[topicIdx].modifiedAt =
              new Date().toISOString();

            await AsyncStorage.setItem("subjects", JSON.stringify(subjects));
          }
        }
      }
    } catch (error) {
      console.error("Error saving note:", error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginRight: 10 }}
        >
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.header}>{topicName}</Text>
      </View>

      <ScrollView style={{ flex: 1 }}>
        <RichEditor
          ref={richText}
          initialContentHTML={note || ""}
          onChange={saveNote}
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
        ]}
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
    backgroundColor: "#181818",
    paddingTop: 18,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    marginLeft: 8,
  },
  header: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    flex: 1,
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
