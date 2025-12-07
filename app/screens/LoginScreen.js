import { signInWithEmailAndPassword } from 'firebase/auth';
import React, { useState } from "react";
import {
    Alert,
    ImageBackground,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { auth } from '../../firebase/config';

export default function LoginScreen() {
  const navigation = useNavigation();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [secureTextEntry, setSecureTextEntry] = useState(true);

  const handleLogin = () => {
    if (!formData.email || !formData.password) {
      Alert.alert('Missing Information', 'Please enter both email and password.');
      return;
    }

  signInWithEmailAndPassword(auth, formData.email, formData.password)
      .then((userCredential) => {
        const user = userCredential.user;
        console.log(user);
        navigation.navigate('Home'); 
      })
      .catch((error) => {
        Alert.alert('Error', error.message);
      });
  };

  const handleCreateAccount = () => {
    navigation.navigate('RegisterScreen');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={require('../../assets/bg.jpg')}
        blurRadius={2}
        style={styles.image}
        resizeMode="cover"
      >
        <View style={styles.overlay} />
        <View style={styles.formContainer}>
          <Text style={styles.title}>Welcome Back</Text>

          <View style={styles.inputContainer}>
            <MaterialIcons name="email" size={24} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
            />
          </View>

          <View style={styles.inputContainer}>
            <MaterialIcons name="lock" size={24} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              secureTextEntry={secureTextEntry}
              value={formData.password}
              onChangeText={(text) => setFormData({ ...formData, password: text })}
            />
            <TouchableOpacity onPress={() => setSecureTextEntry(!secureTextEntry)} style={styles.eyeIcon}>
              <MaterialIcons name={secureTextEntry ? "visibility-off" : "visibility"} size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>Sign In</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleCreateAccount} style={styles.createAccountButton}>
            <Text style={styles.createAccountText}>Dont have an account? <Text style={styles.createAccountTextBold}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  image: {
    justifyContent: 'center',
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(232, 213, 242, 0.75)',
  },
  formContainer: {
    marginHorizontal: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
    padding: 32,
    borderRadius: 28,
    shadowColor: "#C8A2C8",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
    borderWidth: 2,
    borderColor: 'rgba(212, 181, 232, 0.4)',
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#6B4C7A', 
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)', 
    borderRadius: 20,
    marginBottom: 16,
    paddingHorizontal: 18,
    borderWidth: 2,
    borderColor: 'rgba(212, 181, 232, 0.5)',
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
    color: '#C8A2C8',
  },
  input: {
    flex: 1,
    height: 56,
    color: '#6B4C7A',
    fontSize: 16,
    fontWeight: '500',
  },
  eyeIcon: {
    padding: 8,
  },
  loginButton: {
    backgroundColor: '#C8A2C8',
    borderRadius: 20,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#C8A2C8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  createAccountButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  createAccountText: {
    color: '#B19BC8',
    fontSize: 15,
    fontWeight: '500',
  },
  createAccountTextBold: {
    color: '#C8A2C8',
    fontWeight: '700',
  },
});