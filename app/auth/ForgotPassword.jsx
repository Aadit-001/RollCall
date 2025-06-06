import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from './firebaseConfig';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleResetPassword = async () => {
    // Validate email
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    try {
      setIsLoading(true);
      
      // Send password reset email
      await sendPasswordResetEmail(auth, email);
      
      // Show success message
      Alert.alert(
        'Password Reset', 
        'A password reset link has been sent to your email. Please check your inbox.',
        [{ 
          text: 'OK', 
          onPress: () => router.replace('/auth/Signin') 
        }]
      );
    } catch (error) {
      // Handle specific Firebase auth errors
      let errorMessage = 'Failed to send password reset email';
      
      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/user-not-found':
          errorMessage = 'No user found with this email address';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many requests. Please try again later.';
          break;
        default:
          errorMessage = error.message || 'An unexpected error occurred';
      }
      
      Alert.alert('Error', errorMessage);
      console.error('Password Reset Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.replace('/auth/Signin');
  };

  return (
    <SafeAreaProvider>
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor="#121212"/>
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <Ionicons name="arrow-back" size={24} color="white" />
        <Text style={styles.backTitle}>Forgot Password</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Forgot Password</Text>
      <TextInput
        style={styles.input}
        placeholder='Enter your email'
        placeholderTextColor='#888'
        value={email}
        onChangeText={setEmail}
        keyboardType='email-address'
        autoCapitalize='none'
      />
      <TouchableOpacity 
        style={[
          styles.button, 
          isLoading && styles.buttonDisabled
        ]} 
        onPress={handleResetPassword}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Sending...' : 'Reset Password'}
        </Text>
      </TouchableOpacity>

    </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#181818',
  },
  backButton: {
    flexDirection: 'row',
    // alignItems: 'center',
    position: 'absolute',
    top: 60,
    left: 12,
    gap:10,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',

  },
  backTitle: {
    fontSize: 24,
    color: '#fff',
    // marginBottom: 20,
    textAlign: 'center',
  },
  title: {
    fontSize: 24,
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#222',
    color: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#3fa4ff',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});