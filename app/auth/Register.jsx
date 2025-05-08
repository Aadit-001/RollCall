import React, { useState } from "react";
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, collection, addDoc, getFirestore, Timestamp } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from './firebaseConfig';
import { Alert } from 'react-native';
import {
  SafeAreaView,
  StyleSheet,
  View,
  ImageBackground,
  Text,
  TextInput,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Platform,
  Dimensions,
} from "react-native";
import { Link, router } from "expo-router";
import { images } from "@/constants/images";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";


const { width } = Dimensions.get("window");

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisibility, setPasswordVisibility] = useState(true);
  const [focused, setFocused] = useState(null);

  const handlePasswordVisibility = () => {
    setPasswordVisibility(!passwordVisibility);
  };

  const handleRegister = async () => {
    try {
      if (!name || !email || !password) {
        Alert.alert('Error', 'Please fill in all fields');
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userDoc = doc(db, 'users', user.uid);
      await setDoc(userDoc, {
        uid: user.uid,
        name: name,
        email: email,
        createdAt: Timestamp.now()
      });

      await AsyncStorage.setItem('userName', name);
      await AsyncStorage.setItem('userEmail', email);
      router.replace('./Signin');
    } catch (error) {
      let errorMessage = 'Registration failed';

      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Email is already in use';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password is too weak';
          break;
        default:
          errorMessage = error.message || 'An unexpected error occurred';
      }

      Alert.alert('Registration Error', errorMessage);
      console.error("Error registering user:", error);
    }
  };


  

  return (
    <>
      <StatusBar hidden />
      <ImageBackground
        source={images.reg}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {/*make the bakcground image or background colour darken so taht the above thing is clearly visible */}
        {/* <View style={styles.overlay} />     */}


        <SafeAreaView style={styles.contentContainer}>
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollViewContent}

          >
            <View style={styles.headerContainer}>
              <Text style={styles.headerText}>Create Account</Text>
              <Text style={styles.subHeaderText}>
                Register to track your attendance
              </Text>
            </View>

            <BlurView intensity={90} tint="dark" style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>
                  <Ionicons name="mail-outline" size={16} color="white" /> Name
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    focused === "name" && styles.inputFocused,
                  ]}
                  placeholder="Enter your name"
                  placeholderTextColor="#AAA"
                  keyboardType="default"
                  autoCapitalize="none"
                  value={name}
                  onChangeText={setName}
                  onFocus={() => setFocused("name")}
                  onBlur={() => setFocused(null)}
                // backgroundColor="transparent"

                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>
                  <Ionicons name="mail-outline" size={16} color="white" /> Email
                  Address
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    focused === "email" && styles.inputFocused,
                  ]}
                  placeholder="Enter your email"
                  placeholderTextColor="#AAA"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setFocused("email")}
                  onBlur={() => setFocused(null)}
                // backgroundColor="transparent"

                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>
                  <Ionicons name="lock-closed-outline" size={16} color="white" />{" "}
                  Password
                </Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[
                      styles.passwordInput,
                      focused === "password" && styles.inputFocused,
                    ]}
                    placeholder="Enter your password"
                    placeholderTextColor="#AAA"
                    secureTextEntry={passwordVisibility}
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setFocused("password")}
                    onBlur={() => setFocused(null)}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={handlePasswordVisibility}
                  >
                    <Ionicons
                      name={
                        passwordVisibility ? "eye-outline" : "eye-off-outline"
                      }
                      size={22}
                      color={passwordVisibility ? "#1E90FF" : "#888"}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </BlurView>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.button}
                activeOpacity={0.8}
                onPress={handleRegister}
              >
                <Text style={styles.buttonText}>Register Now</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFF" />
              </TouchableOpacity>

              <View style={styles.dividerContainer}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.divider} />
              </View>

              {/* Google Sign In Button */}
              <TouchableOpacity
                style={styles.googleButton}
                activeOpacity={0.8}
                onPress={() => console.log("Google Sign In")}
              >
                <Ionicons name="logo-google" size={20} color="#444" />
                <Text style={styles.googleButtonText}>Sign in with Google</Text>
              </TouchableOpacity>

              <View style={styles.loginLinkContainer}>
                <Text style={styles.loginText}>Already have an account? </Text>
                <Link href="/auth/Signin" style={styles.loginLink}>
                  <Text style={styles.loginLinkText}>Sign In</Text>
                </Link>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </ImageBackground>
    </>
  );
}

export default Register;
const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingTop: Platform.OS === "android" ? 40 : 20,
    // backgroundColor: "#030c15",
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 30,
    padding: 30,
  },
  headerContainer: {
    marginBottom: 40,
    marginTop: 30,
    alignItems: "center",
  },
  headerText: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#FFF",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
    marginBottom: 12,
    textAlign: "center",
  },
  subHeaderText: {
    fontSize: 16,
    color: "#F0F0F0",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
    textAlign: "center",
    width: "80%",
    lineHeight: 22,
  },
  formContainer: {
    backgroundColor: "transparent",
    borderRadius: 15,
    padding: 20,
    // marginTop: 30,
    marginBottom: 20,
    overflow: "hidden",
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    gap: 18,
    borderColor: 'white',
    borderWidth: 1.5,
    
  },
  inputContainer: {
    marginBottom: 10,
    width: '100%',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
    opacity: 0.6,
    marginBottom: 10,
    marginLeft: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    // backgroundColor: "#F9F9F9",
    backgroundColor: "transparent",
    height: 55,
    borderRadius: 16,
    paddingHorizontal: 18,
    fontSize: 16,
    borderColor: "#E8E8E8",
    borderWidth: 1.5,
    color: "white",
    shadowColor: "#BBB",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
  inputFocused: {
    borderColor: "#1E90FF",
    // backgroundColor: "#FFF",
    borderWidth: 2,
    shadowOpacity: 0.2,
  },
  passwordContainer: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
  },
  passwordInput: {
    // backgroundColor: "#F9F9F9",
    backgroundColor: "transparent",
    height: 55,
    borderRadius: 16,
    paddingHorizontal: 18,
    fontSize: 16,
    borderColor: "#E8E8E8",
    borderWidth: 1.5,
    color: "white",
    shadowColor: "#BBB",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
    flex: 1,
  },
  eyeIcon: {
    position: "absolute",
    right: 15,
    padding: 5,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 18,
    marginTop: 4,
    marginBottom: 10,
    maxWidth: 400,
    alignSelf: 'center',
  },
  buttonContainerGoogle: {
    width: '100%',
    alignItems: 'center',
    gap: 18,
    marginTop: 4,
    marginBottom: 10,
    maxWidth: 400,
    alignSelf: 'center',
  },
  button: {
    backgroundColor: "#1E90FF",
    paddingVertical: 16,
    // paddingHorizontal: 40,
    borderRadius: 30,
    alignItems: "center",
    marginBottom: 0,
    shadowColor: "#1E90FF",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 6,
    width: '100%',
    maxWidth: 400,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "700",
    marginRight: 8,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 2,
    width: "90%",
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
  dividerText: {
    color: "rgba(255, 255, 255, 0.8)",
    paddingHorizontal: 15,
    fontSize: 14,
  },
  loginLinkContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: -6,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
  },
  loginText: {
    color: "#FFF",
    fontSize: 15,
  },
  loginLinkText: {
    color: "#1E90FF",
    fontSize: 16,
    fontWeight: "bold",
    backgroundColor: "rgba(18, 18, 18, 0.9)", // Charcoal black (#121212) with opacity

    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  // New styles for Sign In page and Google button
  googleButton: {
    backgroundColor: "#FFFFFF",
    opacity: 0.8,
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: "center",
    marginBottom: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
    width: '100%',
    maxWidth: 400,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  googleButtonText: {
    color: "#000",
    fontSize: 17,
    fontWeight: "600",
    marginLeft: 8,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginTop: 0,
  },
  forgotPasswordText: {
    color: "#1E90FF",
    fontSize: 14,
    fontWeight: "600",
  },
  registerLinkContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
  },
  registerText: {
    color: "#FFF",
    fontSize: 15,
  },
  registerLinkText: {
    color: "#1E90FF",
    fontSize: 16,
    fontWeight: "bold",
    backgroundColor: "rgba(18, 18, 18, 0.9)", // Charcoal black (#121212) with opacity
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
});
