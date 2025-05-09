import { StyleSheet, View, Text } from "react-native";
import React, { useState } from "react";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { FlatList } from "react-native-gesture-handler";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { TouchableOpacity } from "react-native";
import AttendanceCard from "@/components/AttendanceCard";
import { StatusBar } from "expo-status-bar";


const attendanceData = [
  {
    id: "1",
    subject: "DBMS",
    professor: "Prof. Rupali Sawant",
    percentage: 100,
  },
  {
    id: "2",
    subject: "DBMS",
    professor: "Prof. Rupali Sawant",
    percentage: 78,
  },
  {
    id: "3",
    subject: "DBMS",
    professor: "Rupali Sawant",
    percentage: 45,
  },
  {
    id: "4",
    subject: "DBMS",
    professor: "Rupali Sawant",
    percentage: 45,
  },
  {
    id: "5",
    subject: "DBMS",
    professor: "Rupali Sawant",
    percentage: 45,
  },
  {
    id: "6",
    subject: "DBMS",
    professor: "Rupali Sawant",
    percentage: 45,
  },
  {
    id: "7",
    subject: "DBMS",
    professor: "Rupali Sawant",
    percentage: 45,
  },
  {
    id: "8",
    subject: "DBMS",
    professor: "Rupali Sawant",
    percentage: 45,
  },
  {
    id: "9",
    subject: "DBMS",
    professor: "Rupali Sawant",
    percentage: 45,
  },
  {
    id: "10",
    subject: "DBMS",
    professor: "Rupali Sawant",
    percentage: 45,
  },
  {
    id: "11",
    subject: "DBMS",
    professor: "Rupali Sawant",
    percentage: 45,
  },
  {
    id: "12",
    subject: "DBMS",
    professor: "Rupali Sawant",
    percentage: 45,
  },
];

const Attendance = () => {
  // For the last card's attendance count and bunk calculation
  const [attended, setAttended] = useState(23);
  const [total, setTotal] = useState(23);
  const bunkable = 5; // This can be calculated based on business logic

  // const hasTimetable = true;

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor="#121212"/>
      <View style={styles.headerRow}>
        <View>
          {/* <Text style={styles.profileIconText}>A</Text> */}
          {/* <View style={{ marginLeft: 10, marginRight: 10 }}> */}
            <MaterialCommunityIcons name="view-agenda" size={28} color="white"/>
          {/* </View> */}
        </View>
        <View style={styles.profileGroup}>
          <Text style={styles.title}>Attendance</Text>
        </View>
      </View>
        <FlatList
          data={attendanceData}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <AttendanceCard
              subject={item.subject}
              professor={item.professor}
              percentage={item.percentage}
              // status={item.status}
            />
          )}
          // ScrollBar={false}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={<View style={styles.scrollContent} />}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default Attendance;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    // paddingTop: 18,
    paddingHorizontal: 10,
    // paddingBottom: 88,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    // justifyContent: "space-between",
    paddingHorizontal: 7,
    paddingVertical: 13,
    // paddingTop: 30,
    // paddingHorizontal: 20,
    // elevation: 4,
    // backgroundColor: "red",
    // marginTop: 40,
  },
  profileGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12, // Increased gap for better spacing
  },
  profileTouchable: {
    // Styles for the touchable area are now part of profileIconContainer for simplicity
  },
  profileIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "green",
    justifyContent: "center",
    alignItems: "center",
  },
  profileIconText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  title: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "bold", 
  },
  scrollContent: {
    paddingBottom: 32,
    flex: 1,
    backgroundColor: "#121212",
    paddingTop: 56,
    paddingHorizontal: 8,
  },
  // Old card style not used in new design
  modernCard: {
    backgroundColor: "#232323",
    borderRadius: 16,
    paddingVertical: 22,
    paddingHorizontal: 18,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    width: "100%",
    alignSelf: "center",
  },
  cardHeader: {
    marginBottom: 12,
  },
  cardCenterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 8,
  },
  cardFooter: {
    marginTop: 10,
    alignItems: "center",
  },
  cardGreen: {
    backgroundColor: "#24c46b",
  },
  cardRed: {
    backgroundColor: "#e53935",
  },
  cardGray: {
    backgroundColor: "#333",
  },
  subject: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 2,
    textAlign: "left",
  },
  circleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
  },
  circle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 6,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#181818",
    marginRight: 18,
  },
  circleText: {
    fontWeight: "bold",
    fontSize: 20,
  },
  badge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginLeft: 6,
  },
  badgeText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  attendanceDetail: {
    color: "#aaa",
    fontSize: 15,
    marginTop: 8,
  },
  barContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 2,
    width: "100%",
  },
  barBackground: {
    backgroundColor: "#333",
    borderRadius: 8,
    height: 22,
    flex: 1,
    overflow: "hidden",
    marginRight: 12,
  },
  barFill: {
    height: "100%",
    borderRadius: 8,
  },
  percentTextBar: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
    minWidth: 45,
    textAlign: "right",
  },
  prof: {
    color: "#f5f5f5",
    fontSize: 13,
    textAlign: "left",
    marginTop: 2,
  },
  // progressBarWrapper removed since we no longer need the inner bar

  percentText: {
    fontWeight: "bold",
    fontSize: 22,
    marginLeft: 16,
  },
  percentTextGreen: {
    color: "#fff",
  },
  percentTextRed: {
    color: "#fff",
  },
  percentTextGray: {
    color: "#fff",
  },
  detailBox: {
    backgroundColor: "#222",
    borderRadius: 10,
    padding: 12,
    marginTop: -10,
    marginBottom: 15,
    marginHorizontal: 2,
  },
  detailText: {
    color: "#fff",
    fontSize: 18,
  },
  detailTextBold: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginHorizontal: 4,
  },
  iconBtn: {
    marginHorizontal: 2,
    padding: 2,
    borderRadius: 4,
  },
  bunkNum: {
    color: "#3fa4ff",
    fontWeight: "bold",
    fontSize: 18,
  },
});
