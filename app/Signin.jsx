import React, { useState } from "react";
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

const { width } = Dimensions.get("window");

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisibility, setPasswordVisibility] = useState(true);
  const [focused, setFocused] = useState(null);

  const handlePasswordVisibility = () => {
    setPasswordVisibility(!passwordVisibility);
  };

  return (
    <>
      <StatusBar hidden />
      <ImageBackground
        source={images.onboarding2}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay} />

        <SafeAreaView style={styles.contentContainer}>
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollViewContent}
          >
            <View style={styles.headerContainer}>
              <Text style={styles.headerText}>Welcome Back</Text>
              <Text style={styles.subHeaderText}>
                Sign in to track your attendance
              </Text>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>
                  <Ionicons name="mail-outline" size={16} color="#555" /> Email
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
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>
                  <Ionicons name="lock-closed-outline" size={16} color="#555" />{" "}
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

              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.button}
                activeOpacity={0.8}
                onPress={() => {
                  console.log("Sign In data:", { email, password });
                  router.replace("/Home/HomePage");
                }}
              >
                <Text style={styles.buttonText}>Sign In</Text>
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

              <View style={styles.registerLinkContainer}>
                <Text style={styles.registerText}>Don't have an account? </Text>
                <Link href="/Register" style={styles.registerLink}>
                  <Text style={styles.registerLinkText}>Register</Text>
                </Link>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </ImageBackground>
    </>
  );
}
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
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "android" ? 40 : 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 30,
  },
  headerContainer: {
    marginBottom: 40,
    marginTop: 60,
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
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    borderRadius: 24,
    padding: 30,
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
    marginHorizontal: 2,
  },
  inputContainer: {
    marginBottom: 22,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#444",
    marginBottom: 10,
    marginLeft: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    backgroundColor: "#F9F9F9",
    height: 55,
    borderRadius: 16,
    paddingHorizontal: 18,
    fontSize: 16,
    borderColor: "#E8E8E8",
    borderWidth: 1.5,
    color: "#333",
    shadowColor: "#BBB",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
  inputFocused: {
    borderColor: "#1E90FF",
    backgroundColor: "#FFF",
    borderWidth: 2,
    shadowOpacity: 0.2,
  },
  passwordContainer: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
  },
  passwordInput: {
    backgroundColor: "#F9F9F9",
    height: 55,
    borderRadius: 16,
    paddingHorizontal: 18,
    fontSize: 16,
    borderColor: "#E8E8E8",
    borderWidth: 1.5,
    color: "#333",
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
    width: "100%",
    alignItems: "center",
  },
  button: {
    backgroundColor: "#1E90FF",
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#1E90FF",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
    width: width - 60,
    flexDirection: "row",
    justifyContent: "center",
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
    marginVertical: 15,
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
    marginTop: 10,
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
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  // New styles for Sign In page and Google button
  googleButton: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
    width: width - 60,
    flexDirection: "row",
    justifyContent: "center",
  },
  googleButtonText: {
    color: "#444",
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
