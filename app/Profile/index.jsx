import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Dimensions,
  Linking,
  Image
} from "react-native";
// import Svg from "react-native-svg";
// import * as StoreReview from 'expo-store-review';
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
// Using require for local images in React Native
const x = require('../../assets/images/x.png');
const threads = require('../../assets/images/threads.png');


const ProfileScreen = () => {
  const router = useRouter();
  const [name, setName] = useState("");
  // const [email, setEmail] = useState("user@example.com");
  const [attendanceCriteria, setAttendanceCriteria] = useState(null);
  const [showAttendanceFinder, setShowAttendanceFinder] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [rating, setRating] = useState(0);
  const [hasRated, setHasRated] = useState(false);

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
    setShowResetModal(true);
  };

  const confirmReset = async () => {
    setIsResetting(true);
    try {
      await AsyncStorage.multiRemove([
        "userTimetable", "timetable", "percentage", 
        "timetableData", "subjects", "appRating",
      ]);
      setAttendanceCriteria(null);
      // Close the reset modal and show success
      setShowResetModal(false);
      // Show success message in a new modal
      setTimeout(() => {
        setShowResetSuccessModal(true);
      }, 300);
    } catch (e) {
      console.error("Error resetting data:", e);
    } finally {
      setIsResetting(false);
    }
  };

  const [showResetSuccessModal, setShowResetSuccessModal] = useState(false);

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

  const loadRating = useCallback(async () => {
    try {
      const savedRating = await AsyncStorage.getItem('appRating');
      if (savedRating) {
        setRating(parseInt(savedRating, 10));
        setHasRated(true);
      }
    } catch (error) {
      console.error('Failed to load rating:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRating();
    }, [loadRating])
  );

  const handleRatePress = useCallback(() => {
    setShowRateModal(true);
    // Load the latest rating when opening the modal
    loadRating();
  }, [loadRating]);

  const handleRating = useCallback(async (selectedRating) => {
    try {
      setRating(selectedRating);
      await AsyncStorage.setItem('appRating', selectedRating.toString());
      setHasRated(true);
    } catch (error) {
      console.error('Failed to save rating:', error);
    }
  }, []);

  const renderStars = useCallback(() => {
    return [1, 2, 3, 4, 5].map((star) => (
      <TouchableOpacity 
        key={star} 
        onPress={() => handleRating(star)}
        activeOpacity={0.7}
        disabled={hasRated}
      >
        <Ionicons 
          name={star <= rating ? 'star' : 'star-outline'} 
          size={32} 
          color={star <= rating ? '#FFD700' : hasRated ? '#444' : '#555'} 
          style={styles.starIcon}
        />
      </TouchableOpacity>
    ));
  }, [rating, hasRated, handleRating]);

  // const requestInAppReview = async () => {
  //   if (StoreReview.isAvailableAsync()) {
  //     await StoreReview.requestReview();
  //   }
  // };  

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
            style={{ borderBottomColor: '#FF3B30' }} 
          />
          <MenuItem 
            iconName="document-text-outline" 
            text="Privacy Policy" 
            onPress={() => {router.push("/PrivacyPolicy")}} 
          />
          <MenuItem 
            iconName="star-outline" 
            text={hasRated ? 'Rate on Play Store' : 'Rate Us'} 
            onPress={handleRatePress} 
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
          <Text style={styles.bottomTabBarText}>Version <Text style={styles.bottomTabBarTextnew}>1.0.1</Text></Text>
          <Text style={styles.bottomTabBarText}> @ 2025 RollCall. All rights reserved.</Text>
          <Text style={styles.bottomTabBarText}>~ Powered by PixelVolt</Text>
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
              <Text style={styles.modalTitle}>PixelVolt</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowAboutModal(false)}
              >
                <Ionicons name="close-outline" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.modalText}>At PixelVolt, we believe in Building Apps that Matter, from productivity tools that streamline daily life to immersive games that spark joy, we create experiences that are both impactful and delightful.</Text>
              
              <Text style={styles.followUsText}>Follow Us</Text>
              <View style={styles.socialContainer}>
                <TouchableOpacity 
                  style={styles.socialButton}
                  onPress={() => Linking.openURL('https://x.com/pixelvoltapps')}
                >
                  <Image source={x} style={styles.socialIcon} />
                  <Text style={styles.socialText}>X</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.socialButton}
                  onPress={() => Linking.openURL('https://www.linkedin.com/in/pixelvoltapps')}
                >
                  <Ionicons name="logo-linkedin" size={24} color="#0A66C2" />
                  <Text style={styles.socialText}>LinkedIn</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.socialButton}
                  onPress={() => Linking.openURL('https://threads.net/pixelvolt_')}
                >
                  {/* <Ionicons name="logo-threads" size={24} color="#FFFFFF" /> */}
                  <Image source={threads} style={styles.socialIcon} />
                  <Text style={styles.socialText}>Threads</Text>
                </TouchableOpacity>

              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Rate Us Modal */}
      <Modal
        visible={showRateModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowRateModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.rateModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{hasRated ? 'Thank You!' : 'Rate Our App'}</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowRateModal(false)}
              >
                <Ionicons name="close-outline" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.rateModalBody}>
              {hasRated && (
                <View style={styles.thankYouContainer}>
                  <Ionicons name="checkmark-circle" size={60} color="#4CAF50" />
                  <Text style={styles.thankYouText}>
                    {rating > 0 ? `You rated us ${rating} star${rating > 1 ? 's' : ''}` : 'Thanks for your feedback!'}
                  </Text>
                  <Text style={styles.rateModalText}>
                    {rating >= 4 
                      ? 'We\'re glad you\'re enjoying the app! Would you like to leave a review on the Play Store?' 
                      : 'We appreciate your feedback! Would you like to share more on the Play Store?'}
                  </Text>
                  <View style={styles.starsContainer}>
                    {renderStars()}
                  </View>
                  <TouchableOpacity 
                    style={styles.playStoreButton}
                    onPress={() => {
                      setShowRateModal(false);
                      Linking.openURL('https://play.google.com/store/apps/details?id=com.pixelvolt.RollCall');
                    }}
                  >
                    <Ionicons name="logo-google-playstore" size={20} color="#000" />
                    <Text style={styles.playStoreButtonText}>
                      {rating >= 4 ? 'Rate on Play Store' : 'Share Feedback'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
              
              {!hasRated && (
                <>
                  <Text style={styles.rateModalText}>How would you rate your experience?</Text>
                  <View style={styles.starsContainer}>
                    {renderStars()}
                  </View>
                  <Text style={styles.ratingText}>
                    {rating > 0 ? `You rated us ${rating} star${rating > 1 ? 's' : ''}` : 'Tap a star to rate'}
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Reset Confirmation Modal */}
      <Modal
        visible={showResetModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => !isResetting && setShowResetModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.rateModalContent}>
            <Text style={styles.modalTitle}>Reset All Data</Text>
            <Text style={[styles.rateModalText, { marginBottom: 5 }]}>
              This will delete all your timetables, notes, attendance, and settings.
            </Text>
            <Text style={[styles.rateModalText, { color: '#FF3B30', fontWeight: '600', marginBottom: 20 }]}>
              This action cannot be undone.
            </Text>
            
            <View style={styles.resetButtonContainer}>
              <TouchableOpacity 
                style={[styles.resetButton, styles.cancelButton]}
                onPress={() => setShowResetModal(false)}
                disabled={isResetting}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.resetButton, styles.confirmButton]}
                onPress={confirmReset}
                disabled={isResetting}
              >
                {isResetting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.confirmButtonText}>Reset</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reset Success Modal */}
      <Modal
        visible={showResetSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowResetSuccessModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.rateModalContent}>
            <Ionicons name="checkmark-circle" size={60} color="#4CAF50" />
            <Text style={styles.thankYouText}>Data Reset Complete</Text>
            <Text style={[styles.rateModalText, { marginBottom: 25 }]}>
              All app data has been cleared successfully.
            </Text>
            <TouchableOpacity 
              style={styles.doneButton}
              onPress={() => setShowResetSuccessModal(false)}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
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
    backgroundColor: '#1E1E1E',
    width: '90%',
    borderRadius: 15,
    padding: 20,
    maxHeight: '80%',
  },
  socialIcon: {
    padding: 5,
    margin: 2,
    width: 20,
    height: 20,
  },
  rateModalContent: {
    backgroundColor: '#1E1E1E',
    width: '90%',
    borderRadius: 15,
    padding: 20,
    maxHeight: '60%',
  },
  rateModalBody: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  rateModalText: {
    color: '#E0E0E0',
    fontSize: 16,
    // textAlign: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  starsContainer: {
    flexDirection: 'row',
    marginVertical: 15,
  },
  starIcon: {
    marginHorizontal: 5,
  },
  ratingText: {
    color: '#A0A0A0',
    fontSize: 14,
    marginTop: 5,
    minHeight: 20,
  },
  thankYouContainer: {
    alignItems: 'center',
    padding: 10,
  },
  thankYouText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 15,
  },
  playStoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    // marginTop: 15,
    
  },
  playStoreButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  resetButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    width: '100%',
  },
  resetButton: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  confirmButton: {
    backgroundColor: '#FF3B30',
  },
  cancelButtonText: {
    color: '#E0E0E0',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  doneButton: {
    backgroundColor: '#3fa4ff',
    paddingVertical: 12,
    paddingHorizontal: 35,
    borderRadius: 8,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalTitleImage: {
    width: 20,
    height: 20,
    marginRight: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalText: {
    fontSize: 16,
    color: '#A0A0A0',
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
  modalTitlenew: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3fa4ff',
  },
  modalBody: {
    marginBottom: 20,
  },
  developerCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 15,
    borderRadius: 15,
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
    borderColor: "#3fa4ff",
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
    paddingVertical: 12,
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
  followUsText: {
    color: '#E0E0E0',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 25,
    marginBottom: 15,
    textAlign: 'center',
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  socialButton: {
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    width: '30%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  socialText: {
    color: '#E0E0E0',
    marginTop: 8,
    fontSize: 12,
    fontWeight: '500',
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
  bottomTabBarTextnew: {
    color: "#3fa4ff",
    fontSize: 12,
    fontWeight: "500",
    
  },
});

export default ProfileScreen;