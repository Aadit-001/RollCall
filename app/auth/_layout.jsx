import { Stack } from "expo-router";
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen 
        name="ForgotPassword" 
        options={({ navigation }) => ({
          headerShown: true,
          headerStyle: { 
            backgroundColor: '#121212', // Dark background to match app theme
          },
          headerTitleStyle: {
            color: 'white',
          },
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => navigation.navigate('Signin')}
              style={{ marginLeft: 10 }}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
          ),
          title: 'Reset Password',
        })} 
      />
      <Stack.Screen name="Register" options={{ headerShown: false }} />
      <Stack.Screen name="Signin" options={{ headerShown: false }} />
    </Stack>
  );
}
