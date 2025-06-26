import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  AppState,
} from "react-native";
import React, { useState, useCallback, useEffect } from "react";
import notifee, { EventType } from "@notifee/react-native";
import { FlatList, Pressable } from "react-native-gesture-handler";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter, useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import AttendancePercentageFinder from "@/components/AttendancePercentageFinder";
import { StatusBar } from "expo-status-bar";
import { Alert } from "react-native";
// import { getFirestore, doc, getDoc } from "firebase/firestore";
import { Modal } from "react-native";
// import { BarChart } from "react-native-chart-kit";
import { SafeAreaProvider } from "react-native-safe-area-context";
// import { WEEK_DAYS } from "@/constants/timetable";

import {
  initNotifications,
  scheduleWeeklyLectures,
  scheduleTomorrowBunkNotification,
  scheduleOrAlertBunkStatus,
  // scheduleOrAlertBunkStatusForImmediateTest,
} from "@/services/Notifications/notificationService";

const getToday = () => {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return days[new Date().getDay()];
};

const getCurrentDateString = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0"); // Months are 0-indexed
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const canBunkAllLectures = async (lectures) => {
  if (!lectures || lectures.length === 0) return false;

  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  // Sort lectures by start time to find the first lecture
  const sortedLectures = [...lectures].sort((a, b) => {
    const [aHours, aMins] = a.startTime.split(":").map(Number);
    const [bHours, bMins] = b.startTime.split(":").map(Number);
    return aHours * 60 + aMins - (bHours * 60 + bMins);
  });

  const firstLecture = sortedLectures[0];
  const [firstStartHour, firstStartMin] = firstLecture.startTime
    .split(":")
    .map(Number);
  const firstStartTime = firstStartHour * 60 + firstStartMin;

  // Check if current time is before first lecture
  if (currentTime >= firstStartTime) {
    return false;
  }

  // Get the required attendance percentage
  const today = getToday(); // You'll need to implement getToday() similar to getTomorrow()
    const timetableString = await AsyncStorage.getItem("timetable");
    const criteriaString = await AsyncStorage.getItem("percentage");

    if (!timetableString) {
        return false;
    }
    if (!criteriaString) {
        return false;
    }

    const timetable = JSON.parse(timetableString);
    const attendanceCriteria = parseInt(criteriaString, 10);

    const todaysLectures = 
        timetable.days?.find(d => d.day === today)?.subjects || [];

    if (todaysLectures.length === 0) {
        return false;
    }

    // Check if skipping any of today's lectures would drop attendance below criteria
    for (const lecture of todaysLectures) {
        const attended = lecture.attendedClasses || 0;
        const total = lecture.totalClasses || 0;

        // Calculate what the percentage would be AFTER skipping this class
        const newTotal = total + 1;
        const futurePercentage = (attended / newTotal) * 100;

        if (futurePercentage < attendanceCriteria) {
            return false;
        }
    }

    // If all checks pass, the user can bunk
    return true;
};

const BunkModal = ({ visible, lectures, onClose }) => {
  if (!lectures || lectures.length === 0) return null;

  const calculateBunkStats = () => {
    const stats = {
      totalLectures: lectures.length,
      totalHours: 0,
      bySubject: {},
    };

    lectures.forEach((lecture) => {
      const [startH, startM] = lecture.startTime.split(":").map(Number);
      const [endH, endM] = lecture.endTime.split(":").map(Number);
      const duration = endH * 60 + endM - (startH * 60 + startM);
      const hours = duration / 60;

      stats.totalHours += hours;
      stats.bySubject[lecture.name] =
        (stats.bySubject[lecture.name] || 0) + hours;
    });

    return stats;
  };

  const stats = calculateBunkStats();
  const chartData = {
    labels: Object.keys(stats.bySubject),
    datasets: [
      {
        data: Object.values(stats.bySubject).map(
          (hours) => Math.round(hours * 10) / 10
        ),
      },
    ],
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>🎉 Good News!</Text>
          <Text style={styles.modalSubtitle}>
            You can bunk all {stats.totalLectures} lectures today and save{" "}
            {stats.totalHours.toFixed(1)} hours!
          </Text>

          {/* <View style={{ width: '100%', marginVertical: 15 }}>
            <Text style={styles.chartTitle}>Time Saved by Subject</Text>
            <BarChart
              data={chartData}
              width={280}
              height={220}
              yAxisSuffix="h"
              chartConfig={{
                backgroundColor: '#1e1e1e',
                backgroundGradientFrom: '#1e1e1e',
                backgroundGradientTo: '#1e1e1e',
                decimalPlaces: 1,
                color: (opacity = 1) => `rgba(63, 164, 255, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                style: {
                  borderRadius: 16
                },
                barPercentage: 0.5,
              }}
              style={{
                marginVertical: 8,
                borderRadius: 16,
                paddingRight: 30
              }}
              verticalLabelRotation={30}
            />
          </View> */}

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.totalLectures}</Text>
              <Text style={styles.statLabel}>Lectures</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {stats.totalHours.toFixed(1)}h
              </Text>
              <Text style={styles.statLabel}>Total Time</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>🎯</Text>
              <Text style={styles.statLabel}>All Clear</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Got it!</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const Home = () => {
  const [lectures, setLectures] = useState([]);
  const [hasTimetable, setHasTimetable] = useState(false);
  const [timetable, setTimetable] = useState([]);
  const [showAttendanceFinder, setShowAttendanceFinder] = useState(false);
  const [name, setName] = useState("");
  const [todayy, setTodayy] = useState("");

  const [showBunkModal, setShowBunkModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkBunkStatus = async () => {
      try {
        const today = getToday();
        const timetableData = await AsyncStorage.getItem("timetable");

        if (timetableData) {
          const timetable = JSON.parse(timetableData);
          const todayLectures =
            timetable.days?.find((d) => d.day === today)?.subjects || [];

          if (
            todayLectures.length > 0 &&
            (await canBunkAllLectures(todayLectures))
          ) {
            // Check if we've shown the modal today
            const lastShown = await AsyncStorage.getItem("lastBunkModalShown");
            const todayStr = new Date().toDateString();

            if (lastShown !== todayStr) {
              setShowBunkModal(true);
              await AsyncStorage.setItem("lastBunkModalShown", todayStr);
            }
          }
        }
      } catch (error) {
        // console.error("Error checking bunk status:", error);
      }
    };

    checkBunkStatus();
  }, []);

  useEffect(() => {
    const todayDate = getToday();
    // console.log(todayDate);
    setTodayy(todayDate.toString());
    (async () => {
      await loadName();
      await initNotifications();
      await loadTimetable();
    })();
  }, []);

  useEffect(() => {
    // CORRECT: Use an Immediately Invoked Function Expression (IIFE)
    (async () => {
      try {
        console.log("Initial check for bunk status...");
        await scheduleOrAlertBunkStatus();
      } catch (error) {
        // console.error("Error during initial bunk status check:", error);
      }
    })();

    // Optional: Re-run the check when the app returns to the foreground
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        (async () => {
          try {
            // console.log("App is active, re-checking bunk status for tomorrow.");
            await scheduleOrAlertBunkStatus();
          } catch (error) {
            // console.error("Error during foreground bunk status check:", error);
          }
        })();
      }
    });

    // The cleanup function for the AppState listener
    return () => {
      subscription.remove();
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  const getCurrentDateString = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  useEffect(() => {
    const unsubscribe = notifee.onForegroundEvent(async ({ type, detail }) => {
      const { notification, pressAction } = detail;

      // Handle attendance marking for Yes/No actions
      if (type === EventType.ACTION_PRESS && notification?.data) {
        try {
          const { lectureName, lectureStartTime, lectureDay } =
            notification.data;
          const isPresent = pressAction.id === "yes";
          const currentDateString = getCurrentDateString();

          // console.log(
          //   `Processing ${isPresent ? "Present" : "Absent"} for ${lectureName}`
          // );

          // Check if attendance has already been marked for this lecture
          const lectureStatusKey = `${currentDateString}_lecture_status_${lectureName}_${lectureStartTime}`;
          const existingStatus = await AsyncStorage.getItem(lectureStatusKey);

          if (existingStatus) {
            // console.log(
            //   `Attendance already marked for ${lectureName} as ${existingStatus}`
            // );
            await notifee.cancelNotification(notification.id);

            // Still refresh UI even if already marked
            loadTodayLectures();
            return;
          }

          // Save the attendance status
          const newMarkedStatus = isPresent ? "present" : "absent";
          await AsyncStorage.setItem(lectureStatusKey, newMarkedStatus);

          // Update the timetable attendance counts
          const timetableString = await AsyncStorage.getItem("timetable");
          if (timetableString) {
            let timetable = JSON.parse(timetableString);
            let subjectUpdated = false;

            timetable.days = timetable.days.map((dayObject) => {
              if (dayObject.day === lectureDay) {
                dayObject.subjects = dayObject.subjects.map((subject) => {
                  if (subject.name === lectureName) {
                    if (isPresent) {
                      subject.attendedClasses =
                        (subject.attendedClasses || 0) + 1;
                    }
                    subject.totalClasses = (subject.totalClasses || 0) + 1;
                    subjectUpdated = true;
                    // console.log(
                    //   `Updated timetable counts for ${subject.name} on ${lectureDay}: Attended ${subject.attendedClasses}, Total ${subject.totalClasses}`
                    // );
                  }
                  return subject;
                });
              }
              return dayObject;
            });

            if (subjectUpdated) {
              await AsyncStorage.setItem(
                "timetable",
                JSON.stringify(timetable)
              );
              // console.log(
              //   `Timetable updated for ${lectureName} at ${lectureStartTime}`
              // );

              // Show confirmation toast or alert
              Alert.alert(
                "Attendance Marked",
                `${lectureName} marked as ${isPresent ? "Present" : "Absent"}`
              );
            }
          }

          // Cancel the notification once handled
          await notifee.cancelNotification(notification.id);

          // Refresh UI after updating attendance
          loadTodayLectures();
        } catch (error) {
          // console.error(
          //   "Error handling foreground notification response:",
          //   error
          // );
        }
      }
    });

    // Check for app state changes (background to foreground)
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        // App came back to foreground - refresh data
        loadTodayLectures();
      }
    });

    return () => {
      unsubscribe();
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    // Check for notification data when app starts or resumes
    const handleInitialNotification = async () => {
      try {
        // This gets notification data that opened the app
        const initialNotification = await notifee.getInitialNotification();

        if (initialNotification) {
          const { notification, pressAction } = initialNotification;
          // console.log(
          //   "App opened from recents by notification:",
          //   pressAction.id
          // );

          // Process yes/no actions
          if (
            (pressAction?.id === "yes" || pressAction?.id === "no") &&
            notification?.data
          ) {
            const isPresent = pressAction.id === "yes";
            const { lectureName, lectureStartTime, lectureDay } =
              notification.data;

            // Mark attendance
            await markAttendanceFromNotification(
              lectureName,
              lectureStartTime,
              lectureDay,
              isPresent
            );

            // Cancel the notification since it's been handled
            await notifee.cancelNotification(notification.id);
          }
        }
      } catch (error) {
        console.error("Error handling initial notification:", error);
      }
    };

    // Function to mark attendance from notification
    const markAttendanceFromNotification = async (
      lectureName,
      lectureStartTime,
      lectureDay,
      isPresent
    ) => {
      try {
        const currentDateString = getCurrentDateString();

        // Check if already marked
        const lectureStatusKey = `${currentDateString}_lecture_status_${lectureName}_${lectureStartTime}`;
        const existingStatus = await AsyncStorage.getItem(lectureStatusKey);

        if (existingStatus) {
          // console.log(
          //   `Attendance already marked for ${lectureName} as ${existingStatus}`
          // );
          Alert.alert(
            "Already Marked",
            `Attendance for ${lectureName} was already marked as ${existingStatus}.`
          );
          return;
        }

        // Save attendance status
        const newMarkedStatus = isPresent ? "present" : "absent";
        await AsyncStorage.setItem(lectureStatusKey, newMarkedStatus);

        // Update timetable counts
        const timetableString = await AsyncStorage.getItem("timetable");
        if (timetableString) {
          let timetable = JSON.parse(timetableString);
          let subjectUpdated = false;

          timetable.days = timetable.days.map((dayObject) => {
            if (dayObject.day === lectureDay) {
              dayObject.subjects = dayObject.subjects.map((subject) => {
                if (
                  subject.name === lectureName &&
                  subject.startTime === lectureStartTime
                ) {
                  if (isPresent) {
                    subject.attendedClasses =
                      (subject.attendedClasses || 0) + 1;
                  }
                  subject.totalClasses = (subject.totalClasses || 0) + 1;
                  subjectUpdated = true;
                }
                return subject;
              });
            }
            return dayObject;
          });

          if (subjectUpdated) {
            await AsyncStorage.setItem("timetable", JSON.stringify(timetable));
            Alert.alert(
              "Attendance Marked",
              `${lectureName} marked as ${isPresent ? "Present" : "Absent"}`
            );

            // Refresh UI
            loadTodayLectures();
          }
        }
      } catch (error) {
        // console.error("Error marking attendance from notification:", error);
      }
    };

    // Check for initial notifications on mount
    handleInitialNotification();

    // Also listen to app state changes to check when app comes from background
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        // App came from background to active
        // console.log("App came to foreground, checking for notifications");
        handleInitialNotification();
        loadTodayLectures();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      const checkAttendancePercentage = async () => {
        try {
          const percentage = await AsyncStorage.getItem("percentage");
          if (!percentage) {
            setShowAttendanceFinder(true);
          }
        } catch (error) {
          // console.error("Error checking attendance percentage:", error);
        }
      };

      const refreshData = async () => {
        try {
          const timetableString = await AsyncStorage.getItem("timetable");
          if (timetableString) {
            const timetable = JSON.parse(timetableString);
            setTimetable(timetable.days);
            await loadTodayLectures(); // Refresh today's lectures
          }
        } catch (error) {
          // console.error("Error refreshing data:", error);
        }
      };

      checkAttendancePercentage();
      refreshData();
    }, [])
  );

  const loadName = useCallback(async () => {
    try {
      // 1) Try to load from cache
      const cachedName = await AsyncStorage.getItem("userName");
      if (cachedName) {
        setName(cachedName);
        return;
      }

      // 2) No cached name → get the user ID
      // const userId = await AsyncStorage.getItem("userToken");
      // if (!userId) {
      //   console.warn("No userToken in AsyncStorage");
      //   return;
      // }

      // 3) Fetch Firestore doc
      // const db = getFirestore();
      // const snap = await getDoc(doc(db, "users", userId));
      // if (!snap.exists()) {
      //   console.warn(`No user document for ID ${userId}`);
      //   return;
      // }

      // console.log("User document data:", snap.data().name);

      // 4) Read & validate the `name` field
      // const nameFromDb = snap.data().name;
      // if (!nameFromDb) {
      //   console.warn("User document has no `name` field");
      //   return;
      // }

      // 5) Set state and cache it

      setName(cachedName);
      await AsyncStorage.setItem("userName", cachedName);
    } catch (error) {
      // console.error("Error in loadName:", error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadName();
      return () => {};
    }, [loadName])
  );

  const handleAttendanceFinderClose = useCallback(async () => {
    setShowAttendanceFinder(false);
    await loadName();
  }, [loadName]);

  const loadTimetable = async () => {
    try {
      // First try to get data from AsyncStorage (prioritize local data)
      const data = await AsyncStorage.getItem("timetable");
      // console.log(data);

      if (data) {
        // If data exists in AsyncStorage, use it
        setTimetable(JSON.parse(data).days);
      // } else {
      //   // If no data in AsyncStorage, try Firebase
      //   const useruid = await AsyncStorage.getItem("userToken"); // Assuming you store user ID here
      //   console.log("User ID:", useruid);

      //   if (useruid) {
      //     const db = getFirestore();
      //     const docRef = doc(db, "users", useruid);
      //     // console.log("Firebase doc ref:", docRef);
      //     const docSnap = await getDoc(docRef);
      //     // console.log("Firebase data:", docSnap.data());

      //     if (docSnap.exists() && docSnap.data().timetable) {
      //       // If Firebase has data, use it and save to AsyncStorage for future use
      //       const firebaseData = docSnap.data().timetable;
      //       setTimetable(firebaseData.days);

      //       // Save to AsyncStorage to avoid Firebase queries next time
      //       await AsyncStorage.setItem(
      //         "timetable",
      //         JSON.stringify(firebaseData)
      //       );
      //     } else {
      //       // If neither source has data, initialize empty structure
      //       setTimetable(WEEK_DAYS.map((day) => ({ day, subjects: [] })));
      //     }
        } else {
          // If no user ID available, use default empty structure
          setTimetable(WEEK_DAYS.map((day) => ({ day, subjects: [] })));
        }
    } catch (error) {
      // console.error("Error loading timetable:", error);
      // Fallback to empty structure on any errors
      setTimetable(WEEK_DAYS.map((day) => ({ day, subjects: [] })));
    }
  };

  // Load today's lectures from timetable in AsyncStorage
  const loadTodayLectures = async () => {
    try {
      const timetableData = await AsyncStorage.getItem("timetable");
      const currentDateString = getCurrentDateString();
      const lastAttendanceDate = await AsyncStorage.getItem(
        "lastAttendanceDate"
      );

      if (lastAttendanceDate && lastAttendanceDate !== currentDateString) {
        // Day change handling code (unchanged)
        // console.log(
        //   `Day changed from ${lastAttendanceDate} to ${currentDateString}. Clearing old statuses.`
        // );
        const allKeys = await AsyncStorage.getAllKeys();
        const keysToRemove = allKeys.filter((key) =>
          key.startsWith(`${lastAttendanceDate}_lecture_status_`)
        );
        if (keysToRemove.length > 0) {
          await AsyncStorage.multiRemove(keysToRemove);
          // console.log(
          //   "Cleared old attendance statuses for:",
          //   lastAttendanceDate,
          //   keysToRemove
          // );
        }
      }

      await AsyncStorage.setItem("lastAttendanceDate", currentDateString);

      console.log(
        "timetableData loaded in loadTodayLectures:",
        timetableData ? "Yes" : "No"
      );
      if (timetableData) {
        const timetable = JSON.parse(timetableData);
        const today = getToday();
        const todayEntry = timetable.days?.find((d) => d.day === today);

        if (
          todayEntry &&
          todayEntry.subjects &&
          todayEntry.subjects.length > 0
        ) {
          // console.log(
          //   `Found ${todayEntry.subjects.length} lectures for ${today}`
          // );

          // Asynchronously fetch markedStatus for each lecture of the current day
          const lecturesForToday = await Promise.all(
            todayEntry.subjects.map(async (subject) => {
              const lectureStatusKey = `${currentDateString}_lecture_status_${subject.name}_${subject.startTime}`;
              const markedStatus = await AsyncStorage.getItem(lectureStatusKey);
              return {
                ...subject,
                day: today,
                markedStatus: markedStatus || null,
              };
            })
          );

          // Sort lectures by start time
          const sortedLectures = lecturesForToday.sort((a, b) => {
            // Convert "HH:MM" strings to comparable values
            const [aHours, aMinutes] = a.startTime.split(":").map(Number);
            const [bHours, bMinutes] = b.startTime.split(":").map(Number);

            // Compare hours first
            if (aHours !== bHours) {
              return aHours - bHours;
            }
            // If hours are equal, compare minutes
            return aMinutes - bMinutes;
          });

          setLectures(sortedLectures);
          setHasTimetable(true);
        } else {
          // console.log(
          //   `No lectures found for ${today} in timetable or timetable structure issue.`
          // );
          setLectures([]);
          setHasTimetable(false);
        }
      } else {
        // console.log("No timetable data found in AsyncStorage.");
        setLectures([]);
        setHasTimetable(false);
      }
    } catch (error) {
      setLectures([]);
      setHasTimetable(false);
      // console.error("Error in loadTodayLectures:", error);
      Alert.alert(
        "Error",
        "Failed to load lecture data. Please check console for details."
      );
    }
  };

  const getInitials = (nameString) => {
    if (!nameString) return "";
    const words = nameString.split(" ");
    if (words.length > 1) {
      return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
    } else if (words.length === 1 && words[0].length > 0) {
      return words[0][0].toUpperCase();
    }
    return "";
  };

  const handleMarkAttendance = async (lectureItem, isPresent) => {
    if (
      !lectureItem ||
      !lectureItem.day ||
      !lectureItem.name ||
      !lectureItem.startTime
    ) {
      Alert.alert(
        "Error",
        "Lecture information is incomplete to mark attendance."
      );
      return;
    }

    try {
      const timetableString = await AsyncStorage.getItem("timetable");
      if (!timetableString) {
        Alert.alert(
          "Error",
          "Timetable data not found. Please set up your timetable."
        );
        return;
      }

      let timetable = JSON.parse(timetableString);
      let subjectUpdatedInTimetable = false;
      const currentDateString = getCurrentDateString(); // For storing status with current date

      timetable.days = timetable.days.map((dayObject) => {
        if (dayObject.day === lectureItem.day) {
          dayObject.subjects = dayObject.subjects.map((subject) => {
            if (subject.name === lectureItem.name) {
              // Only update attended/total if they haven't been marked for the day yet OR if you allow re-marking
              // Current logic always increments totalClasses and conditionally attendedClasses
              if (isPresent) {
                subject.attendedClasses = (subject.attendedClasses || 0) + 1;
              }
              subject.totalClasses = (subject.totalClasses || 0) + 1;
              subjectUpdatedInTimetable = true;
              // console.log(
              //   `Updated timetable counts for ${subject.name} on ${lectureItem.day}: Attended ${subject.attendedClasses}, Total ${subject.totalClasses}`
              // );
            }
            return subject;
          });
        }
        return dayObject;
      });

      if (subjectUpdatedInTimetable) {
        await AsyncStorage.setItem("timetable", JSON.stringify(timetable));
        const newMarkedStatus = isPresent ? "present" : "absent";

        // Consistent key for storing status: DATE_lecture_status_SUBJECTNAME_STARTTIME
        const lectureStatusKey = `${currentDateString}_lecture_status_${lectureItem.name}_${lectureItem.startTime}`;
        await AsyncStorage.setItem(lectureStatusKey, newMarkedStatus);
        // console.log(
        //   `Saved status for ${lectureItem.name} at ${lectureItem.startTime} as ${newMarkedStatus} (Key: ${lectureStatusKey})`
        // );

        Alert.alert(
          "Success",
          `${lectureItem.name} marked as ${isPresent ? "Present" : "Absent"}.
Attendance will update on the Attendance Screen.`
        );
        // Update local state to reflect the change immediately
        setLectures((prevLectures) =>
          prevLectures.map((lec) => {
            // Ensure all parts of the unique lecture identifier match
            if (
              lec.name === lectureItem.name &&
              lec.startTime === lectureItem.startTime &&
              lec.day === lectureItem.day
            ) {
              return { ...lec, markedStatus: newMarkedStatus };
            }
            return lec;
          })
        );
      } else {
        // This case should ideally not be reached if lectureItem comes from the loaded lectures list
        Alert.alert(
          "Error",
          `Could not find ${lectureItem.name} at ${lectureItem.startTime} for ${lectureItem.day} in timetable to update counts.`
        );
      }
    } catch (error) {
      // console.error("Failed to update attendance or save status:", error);
      Alert.alert(
        "Error",
        "An error occurred while updating attendance. Check console."
      );
    }
  };

  // Logout and onboarding reset logic
  // const deleteOnboardingData = async () => {
  //   try {
  //     await AsyncStorage.removeItem("onboardingDone");
  //     // await AsyncStorage.removeItem("showBunkModal");
  //     await AsyncStorage.removeItem("lastBunkModalShown");
  //     await AsyncStorage.removeItem("userToken");
  //     await AsyncStorage.removeItem("timetable");
  //     await AsyncStorage.removeItem("lastAttendanceDate");
  //     await AsyncStorage.removeItem("lectures");
  //     await AsyncStorage.removeItem("showBunkModal");
  //     await AsyncStorage.removeItem("percentage");
  //     await AsyncStorage.removeItem("userName");
  //     // await AsyncStorage.removeItem("percentage");
  //     router.replace("/onboarding/Welcome");

  //   } catch (error) {
  //     // console.error("Error deleting onboarding data:", error);
  //   }
  // };

  return (
    <SafeAreaProvider>
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor="#121212" />
      {showAttendanceFinder && (
        <AttendancePercentageFinder onClose={handleAttendanceFinderClose} />
      )}

      <View style={styles.headerRow}>
        <View style={styles.profileGroup}>
          <TouchableOpacity
            onPress={() => router.push("/Profile")} // Assuming this is for a profile/menu action
            style={styles.profileTouchable}
          >
            <View style={styles.profileIconContainer}>
              <Text style={styles.profileIconText}>{getInitials(name)}</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.title}>{name}</Text>
        </View>
        <View>
          {/* <Ionicons name="notifications-outline" size={28} color="#fff" /> */}
          <Text style={styles.headerText}>{todayy}</Text>
          <Text style={styles.headerTex}>
            {new Date().toLocaleDateString()}
          </Text>
        </View>
      </View>
      <FlatList
        ListHeaderComponent={
          <>
            {/* Welcome Box */}

            <View style={styles.topBox}>
              <Text style={styles.topBoxText}>Welcome To</Text>
              <Text style={styles.topBoxTextName}>R O L L C A L L</Text>
            </View>

            {/* Creative Timetable Button - MOVED UP */}
            <View style={styles.timetableButtonContainer}>
              <TouchableOpacity
                style={styles.timetableButton}
                onPress={() => router.push("/timetable")}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={["#4f6cff", "#3fa4ff"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  <View style={styles.buttonIconContainer}>
                    <Ionicons name="calendar" size={28} color="#fff" />
                  </View>
                  <View style={styles.buttonTextContainer}>
                    <Text style={styles.buttonTitle}>Manage Timetable</Text>
                    <Text style={styles.buttonSubtitle}>
                      Add or edit your schedule
                    </Text>
                  </View>
                  <View style={styles.buttonArrow}>
                    <Ionicons name="chevron-forward" size={24} color="#fff" />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Today's Lectures Title - MOVED DOWN */}
            <View style={styles.bottomBoxTittle}>
              <Text style={styles.bottomBoxTittleText}>Today's Lectures</Text>
            </View>
          </>
        }
        data={hasTimetable ? lectures : []}
        keyExtractor={(item, idx) => (item.id ? item.id : idx.toString())}
        renderItem={({ item }) => (
          // <View style={styles.lectureCard}>
          //   <View style={{ flex: 1 }}>
          //     <Text style={styles.lectureName}>{item.name}</Text>
          //     {item.professor && (
          //       <Text style={styles.profName}>{item.professor}</Text>
          //     )}
          //     {item.startTime && item.endTime && (
          //       <Text style={styles.profName}>
          //         {item.startTime} - {item.endTime}
          //       </Text>
          //     )}
          //   </View>
          //   <View style={styles.attendanceBtns}>
          //     <TouchableOpacity style={styles.attendanceBtnRed}>
          //       <MaterialIcons name="close" size={32} color="#fff" />
          //     </TouchableOpacity>
          //     <TouchableOpacity style={styles.attendanceBtnGreen}>
          //       <MaterialIcons name="check" size={32} color="#fff" />
          //     </TouchableOpacity>
          //   </View>
          // </View>
          <View style={styles.lectureCard}>
            {/* Lecture Info Section */}
            <View style={styles.lectureInfoContainer}>
              <Text style={styles.lectureName}>{item.name}</Text>
              {/* {item.professor && (
                <View style={styles.lectureDetailRow}>
                  <MaterialIcons name="person-outline" size={16} color={styles.lectureDetailIcon.color} style={styles.lectureDetailIcon} />
                  <Text style={styles.lectureDetailText}>{item.professor}</Text>
                </View>
              )} */}
              {item.startTime && item.endTime && (
                <View style={styles.lectureDetailRow}>
                  <MaterialIcons
                    name="schedule"
                    size={12}
                    color={styles.lectureDetailIcon.color}
                    style={styles.lectureDetailIcon}
                  />
                  <Text style={styles.lectureDetailText}>
                    {item.startTime} - {item.endTime}
                  </Text>
                </View>
              )}
            </View>

            {/* Attendance Actions Section */}
            <View style={styles.attendanceActionsContainer}>
              {item.markedStatus === "present" ? (
                <Text style={styles.attendanceStatusTextPresent}>Present</Text>
              ) : item.markedStatus === "absent" ? (
                <Text style={styles.attendanceStatusTextAbsent}>Absent</Text>
              ) : (
                <>
                  <TouchableOpacity
                    style={[styles.attendanceButton, styles.absentButton]}
                    onPress={() => handleMarkAttendance(item, false)}
                    disabled={item.markedStatus != null} // Disable if already marked
                  >
                    <MaterialIcons name="close" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.attendanceButton, styles.presentButton]}
                    onPress={() => handleMarkAttendance(item, true)}
                    disabled={item.markedStatus != null} // Disable if already marked
                  >
                    <MaterialIcons name="check" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        )}
        ListEmptyComponent={
          !hasTimetable && (
            <View style={styles.ttPlaceholderBox}>
              <Ionicons
                name="calendar-outline"
                size={80}
                color="#555"
                style={styles.ttPlaceholderIcon}
              />
              <Text style={styles.ttPlaceholderText}>
                Please add your Timetable first.
              </Text>
              {/* <TouchableOpacity style={styles.addTimetableButton} onPress={() => router.push("/Timetable")}>
                <Text style={styles.addTimetableButtonText}>Add Timetable</Text>
              </TouchableOpacity> */}
            </View>
          )
        }
        contentContainerStyle={{ width: "95%", alignSelf: "center" }}
        ListFooterComponent={<View style={styles.scrollContent} />}
        style={{ flex: 1 }}
      />
      {/* Logout Button */}
      {/* <TouchableOpacity
        style={styles.logoutButton}
        onPress={deleteOnboardingData}
      >
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity> */}

      {/* <View style={styles.bottomNav} /> */}
      <BunkModal
        visible={showBunkModal}
        lectures={lectures}
        onClose={() => setShowBunkModal(false)}
      />
    </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    // backgroundColor: "#181818",
    flex: 1,
    backgroundColor: "#121212",
  },
  headerText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  headerTex: {
    color: "#AEAEB2",
    fontSize: 10,
    fontWeight: "bold",
    alignSelf: "center",
    // marginRight: 3,
    textAlign: "center",
  },
  attendanceStatusTextPresent: {
    color: "#22dd22",
    fontSize: 16,
    fontWeight: "bold",
  },
  attendanceStatusTextAbsent: {
    color: "#dd2222",
    fontSize: 16,
    fontWeight: "bold",
  },
  attendanceButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  absentButton: {
    backgroundColor: "#dd2222",
  },
  presentButton: {
    backgroundColor: "#22dd22",
  },
  attendanceActionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    // gap: 8,
    minWidth: 100, // Give some minimum width to prevent layout shifts
    justifyContent: "flex-end",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    marginTop: 40,
  },
  // headerTextContainer: {
  //   flexDirection: "column",
  //   alignItems: "end",
  //   borderWidth: 2,
  //   borderColor: "#3fa4ff",
  //   padding:5,
  //   borderRadius: 12,
  //   // gap: 2,
  // },
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
    // backgroundColor: "green",
    // justifyContent: "center",
    // alignItems: "center",
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
    // marginBottom: 15,
    borderWidth: 2,
    // borderColor: "#4A4A4A",
    borderColor: "#3fa4ff",
  },
  profileIconText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
    marginLeft: 0,
  },
  logoutButton: {
    backgroundColor: "#D32F2F", // Slightly less intense red
    paddingVertical: 14, // Adjusted padding
    paddingHorizontal: 20,
    borderRadius: 12, // Softer corners
    alignItems: "center",
    marginTop: 25, // Increased margin
    marginHorizontal: 20,
    marginBottom: 40, // More space at the bottom, adjust if overlapping with tab bar
    elevation: 2, // Subtle shadow for Android
    shadowColor: "#000", // Shadow for iOS
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  logoutButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600", // Semi-bold
  },
  // Removed headerText as it was unused
  topBox: {
    borderRadius: 12, // Softer corners
    borderWidth: 1,
    borderColor: "#3fa4ff",
    // height: 180, // Slightly reduced height
    width: "99%", // Adjusted width to align with other content
    alignSelf: "center", // Center the box
    padding: 50,
    marginTop: 20, // Added margin top
    marginBottom: 20, // Added margin bottom
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    // backgroundColor: "#1C1C1E", // Slightly different dark shade
    backgroundColor: "#121212",
  },
  topBoxText: {
    color: "#3fa4ff",
    fontSize: 20, // Slightly reduced size
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 5, // Space between the two lines
  },
  topBoxTextName: {
    color: "#fff",
    fontSize: 28, // Default size
    fontWeight: "bold",
    letterSpacing: 3, // Reduced letter spacing
    textAlign: "center",
    // Responsive font size based on screen width
    ...(Dimensions.get('window').width < 375 && { // For smaller screens (e.g., iPhone SE)
      fontSize: 24,
      letterSpacing: 2,
    }),
    ...(Dimensions.get('window').width < 320 && { // For very small screens
      fontSize: 20,
      letterSpacing: 1,
    }),
  },
  bottomBoxTittle: {
    // backgroundColor: "transparent", // Already transparent
    width: "99%", // Align with other content
    alignSelf: "center",
    // height: 40, // Height can be dynamic
    justifyContent: "flex-start", // Align text to the left
    alignItems: "flex-start",
    marginTop: 10, // Reduced margin
    marginBottom: 15, // Increased margin for spacing before cards
  },
  bottomBoxTittleText: {
    color: "#E0E0E0", // Lighter grey for less emphasis than main titles
    fontSize: 22, // Increased size
    fontWeight: "600", // Semi-bold
  },
  ttPlaceholderBox: {
    backgroundColor: "#2C2C2E", // Darker placeholder background
    borderRadius: 10,
    marginVertical: 20, // Vertical margin
    padding: 25, // Increased padding
    width: "99%",
    alignSelf: "center",
    alignItems: "center", // Center content inside
  },
  ttPlaceholderText: {
    color: "#A0A0A0", // Lighter placeholder text
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22, // Improved readability
  },
  lectureCard: {
    backgroundColor: "#2C2C2E", // A slightly lighter dark shade for the card
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 2, // Or adjust as needed for your screen layout
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3, // For Android shadow
    borderLeftWidth: 3,
    borderLeftColor: "#3fa4ff",
  },
  lectureInfoContainer: {
    flex: 1, // Allows this container to take up available space
    marginRight: 12, // Space between info and action buttons
  },
  lectureName: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 6,
  },
  lectureDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  lectureDetailIcon: {
    marginRight: 3,
    color: "#AEAEB2", // A muted color for icons
  },
  lectureDetailText: {
    color: "#AEAEB2", // A slightly muted white for details
    fontSize: 12,
  },
  attendanceActionsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  attendanceButton: {
    width: 44, // Circular or rounded square buttons
    height: 44,
    borderRadius: 22, // Make it circular
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8, // Space between buttons
    // borderWidth: 1, // Optional: if you want a border
    // borderColor: '#555', // Optional: border color
  },
  absentButton: {
    backgroundColor: "#FF3B30", // A standard red for absent
  },
  presentButton: {
    backgroundColor: "#34C759", // A standard green for present
  },
  timetableButtonContainer: {
    marginTop: 10, // Reduced margin
    marginHorizontal: "4%", // Use percentage for consistent alignment (92% width)
    marginBottom: 25, // Increased margin
  },
  timetableButton: {
    borderRadius: 16,
    elevation: 4,
    shadowColor: "#3fa4ff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, // Slightly more prominent shadow
    shadowRadius: 8,
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingVertical: 18, // Increased padding
    paddingHorizontal: 20,
  },
  buttonIconContainer: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
    width: 48, // Adjusted size
    height: 48, // Adjusted size
    alignItems: "center",
    justifyContent: "center",
    marginRight: 5, // Space between icon and text
  },
  buttonTextContainer: {
    flex: 1,
    marginLeft: 12, // Adjusted margin
  },
  buttonTitle: {
    color: "#fff",
    fontSize: 17, // Slightly adjusted size
    fontWeight: "bold",
  },
  buttonSubtitle: {
    color: "rgba(255,255,255,0.85)", // Slightly more opaque
    fontSize: 13, // Slightly adjusted size
    marginTop: 3, // Adjusted spacing
  },
  buttonArrow: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 16, // Match button border radius
    width: 36, // Adjusted size
    height: 36, // Adjusted size
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingBottom: 32,
    flex: 1,
    backgroundColor: "#121212",
    paddingTop: 56,
    paddingHorizontal: 8,
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  modalView: {
    margin: 20,
    backgroundColor: "#1e1e1e",
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: "90%",
    maxWidth: 350,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#fff",
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 16,
    marginBottom: 15,
    color: "#ccc",
    textAlign: "center",
  },
  chartTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
    textAlign: "center",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginVertical: 15,
    padding: 10,
    backgroundColor: "#2c2c2e",
    borderRadius: 12,
  },
  statItem: {
    alignItems: "center",
    padding: 10,
  },
  statValue: {
    color: "#3fa4ff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  statLabel: {
    color: "#aaa",
    fontSize: 12,
  },
  closeButton: {
    backgroundColor: "#3fa4ff",
    borderRadius: 12,
    padding: 12,
    width: "100%",
    alignItems: "center",
    marginTop: 10,
  },
  closeButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  // Removed unused styles: scrolle, header, addTTBtn, addTTBtnText, bottomNav, navIcon, attendanceContainer, headerTitle, headerText
  // The following styles seem to be remnants or duplicates and are not directly used by the main content structure visible:
  // header, headerTitle, headerText were removed as they appear unused or superseded by headerRow group.
  // Ensure styles like 'scrolle', 'addTTBtn', etc. are truly not needed elsewhere before full removal if this were a real project.
});
