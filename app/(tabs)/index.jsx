import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
} from "react-native";
import React, { useState, useEffect } from "react";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, FlatList, Pressable } from "react-native-gesture-handler";
import { Ionicons, MaterialIcons, FontAwesome } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAuth, signOut } from "firebase/auth";
import Welcome from "../onboarding/Welcome";
import { useRouter } from "expo-router";
import AttendancePercentageFinder from "@/components/AttendancePercentageFinder";

const lecturesSample = [
  {
    id: "1",
    name: "DBMS",
    professor: "Prof. Rupali Sawant",
  },
  {
    id: "2",
    name: "DBMS",
    professor: "Prof. Rupali Sawant",
  },
  {
    id: "3",
    name: "DBMS",
    professor: "Prof. Rupali Sawant",
  },
  {
    id: "4",
    name: "DBMS",
    professor: "Prof. Rupali Sawant",
  },
  {
    id: "5",
    name: "DBMS",
    professor: "Prof. Rupali Sawant",
  },
  {
    id: "6",
    name: "DBMS",
    professor: "Prof. Rupali Sawant",
  },
  {
    id: "7",
    name: "DBMS",
    professor: "Prof. Rupali Sawant",
  },
  {
    id: "8",
    name: "DBMS",
    professor: "Prof. Rupali Sawant",
  },
];

const Home = () => {
  const [lectures, setLectures] = useState(lecturesSample); // Replace with real data
  const [hasTimetable, setHasTimetable] = useState(true); // Set to false to show 'add TT' message
  const [showAttendanceFinder, setShowAttendanceFinder] = useState(false);

  useEffect(() => {
    const checkAttendancePercentage = async () => {
      try {
        const percentage = await AsyncStorage.getItem("percentage");
        if (!percentage) {
          setShowAttendanceFinder(true);
        }
      } catch (error) {
        console.error("Error checking attendance percentage:", error);
      }
    };

    checkAttendancePercentage();
  }, []);

  const deleteOnboardingData = async () => {
    try {
      await AsyncStorage.removeItem("onboardingDone");
      await AsyncStorage.removeItem("percentage");
      router.replace("/onboarding/Welcome");
    } catch (error) {
      console.error("Error deleting onboarding data:", error);
    }
  };

  const router = useRouter();
  const auth = getAuth();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Optional: Clear any stored user data
      await AsyncStorage.removeItem("userToken");
      console.log("User logged out successfully");
      // console.log(user)
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        {showAttendanceFinder && (
          <AttendancePercentageFinder
            onClose={() => setShowAttendanceFinder(false)}
          />
        )}
        <FlatList
          ListHeaderComponent={
            <>
              {/* Welcome Box */}
              <Pressable style={styles.topBox} onPress={deleteOnboardingData}>
                <Text style={styles.topBoxText}>Welcome To</Text>
                <Text style={styles.topBoxTextName}>R O L L C A L L</Text>
              </Pressable>
              {/* Today's Lectures Title */}
              <View style={styles.bottomBoxTittle}>
                <Text style={styles.bottomBoxTittleText}>Today's Lectures</Text>
              </View>
            </>
          }
          data={hasTimetable ? lectures : []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.lectureCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.lectureName}>{item.name}</Text>
                <Text style={styles.profName}>{item.professor}</Text>
              </View>
              <View style={styles.attendanceBtns}>
                <TouchableOpacity style={styles.attendanceBtnRed}>
                  <MaterialIcons name="close" size={32} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.attendanceBtnGreen}>
                  <MaterialIcons name="check" size={32} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            !hasTimetable && (
              <View style={styles.ttPlaceholderBox}>
                <Text style={styles.ttPlaceholderText}>
                  Please add your TT first ……
                </Text>
              </View>
            )
          }
          contentContainerStyle={{ width: "95%", alignSelf: "center" }}
          style={{ flex: 1 }}
        />
        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
        {/* <View style={styles.scrolle}></View> */}
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default Home;

const styles = StyleSheet.create({
  logoutButton: {
    backgroundColor: "#FF0000",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
    marginHorizontal: 20,
    marginBottom: 100, //ye chnage karne pe niche ka margin change higa
  },
  scrolle: {
    // paddingBottom: 10,
    // flex: 1,
    backgroundColor: "#181818",
    // paddingTop: 5,
    // paddingHorizontal: 8,
  },
  logoutButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  container: {
    backgroundColor: "#181818",
    flex: 1,
    // paddingBottom: 88, // Add padding to bottom
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#222",
    marginTop: 10,
    marginBottom: 10,
    padding: 10,
    borderRadius: 10,
    width: "90%",
    alignSelf: "center",
  },
  headerText: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
  },
  topBox: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#3fa4ff",
    height: 200,
    width: "95%",
    padding: 20,
    margin: 10,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
  topBoxText: {
    color: "#3fa4ff",
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
  },
  topBoxTextName: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "bold",
    letterSpacing: 4,
    textAlign: "center",
    marginTop: 4,
  },
  bottomBoxTittle: {
    backgroundColor: "transparent",
    width: "100%",
    height: 40,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  bottomBoxTittleText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  ttPlaceholderBox: {
    backgroundColor: "#222",
    borderRadius: 10,
    margin: 10,
    padding: 16,
    width: "95%",
    alignSelf: "center",
  },
  ttPlaceholderText: {
    color: "#aaa",
    fontSize: 16,
    textAlign: "center",
  },
  lectureCard: {
    backgroundColor: "#222",
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginBottom: 12,
    marginTop: 6,
  },
  lectureName: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  profName: {
    color: "#ccc",
    fontSize: 14,
    marginTop: 4,
  },
  attendanceBtns: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
  },
  attendanceBtnRed: {
    backgroundColor: "#e53935",
    borderRadius: 8,
    padding: 4,
    marginRight: 8,
  },
  attendanceBtnGreen: {
    backgroundColor: "#43a047",
    borderRadius: 8,
    padding: 4,
  },
  addTTBtn: {
    backgroundColor: "#3fa4ff",
    borderRadius: 10,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 100,
    width: "90%",
    alignSelf: "center",
  },
  addTTBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
    textAlign: "center",
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#181818",
    borderTopWidth: 1,
    borderTopColor: "#222",
    height: 56,
    width: "100%",
    position: "absolute",
    bottom: 0,
    left: 0,
  },
  navIcon: {
    flex: 1,
    alignItems: "center",
  },
  attendanceContainer: {
    // display: 'absolute',
    position: "absolute",
    flex: 1,
    backgroundColor: "transparent",
    // borderRadius: 10,
    padding: 16,
    // width: '100%',
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    // height: '100%',
    // marginBottom: 12,
    // marginTop: 6,
    zIndex: 9999,
  },
});
