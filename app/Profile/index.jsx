import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
  RefreshControl,
  Platform
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
// import { auth } from "../auth/firebaseConfig";
// import { signOut } from "firebase/auth";
// import { useRouter } from "expo-router";
import { Modal } from "react-native";
import AttendancePercentageChanger from "@/components/AttendancePercentageChanger";

const ProfileScreen = () => {
  const router = useRouter();
  const [name, setName] = useState("");
  // const [email, setEmail] = useState("user@example.com");
  const [attendanceCriteria, setAttendanceCriteria] = useState(null);
  const [showAttendanceFinder, setShowAttendanceFinder] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);

  const fetchUserData = useCallback(async () => {
    setIsLoading(true);
    try {
      const storedName = await AsyncStorage.getItem("userName");
      // const storedEmail = await AsyncStorage.getItem("userEmail");
      const storedAttendanceCriteria = await AsyncStorage.getItem("percentage");
      if (storedName) setName(storedName);
      // if (storedEmail) setEmail(storedEmail);
      if (storedAttendanceCriteria) setAttendanceCriteria(storedAttendanceCriteria);
      else setAttendanceCriteria(null);
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      Alert.alert("Error", "Failed to load user data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchUserData();
      return () => {};
    }, [fetchUserData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchUserData();
    setRefreshing(false);
  }, [fetchUserData]);

  // const handleLogout = async () => {
  //   Alert.alert("Logout", "Are you sure you want to logout?", [
  //     { text: "Cancel", style: "cancel" },
  //     {
  //       text: "Logout",
  //       onPress: async () => {
  //         setIsLoading(true);
  //         try {
  //           await signOut(auth);
  //           await AsyncStorage.multiRemove([
  //             "userToken", 
  //             "userTimetable", "timetable", "percentage", 
  //             "timetableData", "subjects"
  //           ]);
  //           router.replace("/auth/Signin");
  //         } catch (error) {
  //           console.error("Error logging out:", error);
  //           Alert.alert("Logout Failed", "An error occurred. Please try again.");
  //         } finally {
  //           setIsLoading(false);
  //         }
  //       },
  //       style: "destructive",
  //     },
  //   ]);
  // };

  const handleResetAllData = () => {
    Alert.alert(
      "Reset All App Data",
      "Are you sure? This will delete all your timetables, notes, attendance, and settings. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          onPress: async () => {
            setIsLoading(true);
            try {
              await AsyncStorage.multiRemove([
                "userTimetable", "timetable", "percentage", 
                "timetableData", "subjects",
              ]);
              setAttendanceCriteria(null);
              Alert.alert("Data Reset", "All app data has been cleared.");
            } catch (e) {
              Alert.alert("Error", "Could not reset app data.");
            } finally {
              setIsLoading(false);
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  const getInitials = (nameString) => {
    if (!nameString) return "-";
    const words = nameString.trim().split(" ").filter(Boolean);
    if (words.length > 1 && words[0] && words[words.length - 1]) {
      return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
    } else if (words.length === 1 && words[0] && words[0].length > 0) {
      return words[0][0].toUpperCase();
    }
    return "-";
  };

  const changeAttendanceCriteria = () => {
    setShowAttendanceFinder(true);
  };

  const handleAttendanceFinderClose = useCallback(async () => {
    setShowAttendanceFinder(false);
    await fetchUserData();
  }, [fetchUserData]);

  const handleAboutModalOpen = useCallback(() => {
    setShowAboutModal(true);
  }, []);

  const handleAboutModalClose = useCallback(() => {
    setShowAboutModal(false);
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" backgroundColor="#121212" />
      {isLoading && !refreshing && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size={20} color="#000" />
        </View>
      )}
      {showAttendanceFinder && (
        <AttendancePercentageChanger onClose={handleAttendanceFinderClose} />
      )}
      <ScrollView 
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={["#000"]} 
            tintColor={"#000"} 
          />
        }
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.profileInfoContainer}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{getInitials(name)}</Text>
          </View>
          <Text style={styles.userName}>{name || "User Name"}</Text>
          {/* <Text style={styles.userEmail}>{email}</Text> */}
          <View style={styles.attendanceDisplayContainer}>
            <Text style={styles.attendanceCriteriaText}>
              Attendance Criteria: {attendanceCriteria ? `${attendanceCriteria}%` : "Not Set"}
            </Text>
          </View>
        </View>

        <View style={styles.menuContainer}>
          <MenuItem 
            iconName="calculator-outline" 
            text="Set Attendance Criteria" 
            onPress={changeAttendanceCriteria} 
          />
          <MenuItem 
            iconName="trash-outline" 
            text="Reset All App Data" 
            onPress={handleResetAllData} 
          />
          <MenuItem 
            iconName="document-text-outline" 
            text="Privacy Policy" 
            onPress={() => {router.push("/PrivacyPolicy")}} 
          />
          {/* <MenuItem 
            iconName="person-outline" 
            text="About Us" 
            onPress={() => {router.push("/AboutUs")}} 
          /> */}
          <MenuItem 
            iconName="information-circle-outline" 
            text="About Us" 
            onPress={() => {setShowAboutModal(true)}} 
          />
        </View>
        

        {/* <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#fff" style={styles.logoutIcon} />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity> */}
      <View style={styles.bottomTabBarContainer}>
          <Text style={styles.bottomTabBarText}>Version 1.0.0</Text>
          <Text style={styles.bottomTabBarText}>© 2025 RollCall. All rights reserved.</Text>
      </View>
      </ScrollView>
      <Modal
        visible={showAboutModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAboutModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowAboutModal(false)}
              >
                <Ionicons name="close-outline" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>About RollCall</Text>
            </View>
            <View style={styles.modalBody}>
              <View style={styles.developerCard}>
                <Text style={styles.developerName}>Aadit Jha</Text>
                <Text style={styles.developerRole}>Developer</Text>
              </View>
              <View style={styles.developerCard}>
                <Text style={styles.developerName}>Tejas Billava</Text>
                <Text style={styles.developerRole}>Developer</Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const MenuItem = ({ iconName, text, onPress }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <Ionicons name={iconName} size={24} color="#A0A0A0" style={styles.menuIcon} />
    <Text style={styles.menuItemText}>{text}</Text>
    <Ionicons name="chevron-forward-outline" size={22} color="#555" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#121212',
    width: '90%',
    borderRadius: 15,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalCloseButton: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalBody: {
    marginBottom: 20,
  },
  developerCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  developerName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  developerRole: {
    fontSize: 16,
    color: '#A0A0A0',
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#121212",
  },
  container: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 15,
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
  headerTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
    flex: 1,
    textAlign: 'left',
  },
  profileInfoContainer: {
    alignItems: "center",
    paddingVertical: 25,
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A2A",
    // marginBottom: 20,
  },
  avatarContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#4A4A4A",
  },
  avatarText: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "bold",
  },
  userName: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 4,
  },
  userEmail: {
    color: "#A0A0A0",
    fontSize: 15,
    marginBottom: 15,
  },
  attendanceDisplayContainer: {
    marginTop: 5,
    paddingVertical: 8,
    paddingHorizontal: 15,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
  },
  attendanceCriteriaText: {
    color: "#E0E0E0",
    fontSize: 16,
  },
  menuContainer: {
    marginHorizontal: 15,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A2A",
  },
  menuIcon: {
    marginRight: 18,
  },
  menuItemText: {
    flex: 1,
    color: "#E0E0E0",
    fontSize: 16,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#D32F2F",
    marginHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 25,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  logoutIcon: {
    marginRight: 10,
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
  bottomTabBarContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    // paddingBottom: 20,
    // marginBottom: 20,
    flexDirection: "column",
    paddingTop: 100,
    paddingHorizontal: 20,
    backgroundColor: "#121212",
    borderTopWidth: 1,
    borderTopColor: "#2A2A2A",
    // flexDirection: "row",
    // justifyContent: "space-between",
    alignItems: "center",
  },
  bottomTabBarText: {
    color: "grey",
    fontSize: 12,
    fontWeight: "500",
  },
});

export default ProfileScreen;