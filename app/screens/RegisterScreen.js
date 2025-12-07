import { MaterialIcons } from "@expo/vector-icons";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { ref as dbRef, set } from "firebase/database";
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
import { auth, db } from '../../firebase/config';

export default function RegisterScreen({ navigation }) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    pseudo: "",
    phone: "",
    profileImage: "",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [secureTextEntry2, setSecureTextEntry2] = useState(true);

  const handleSignup = () => {
    if (!formData.email || !formData.password || !formData.name || !formData.pseudo || !formData.phone) {
      Alert.alert("Missing Information", "Please fill out all fields.");
      return;
    }

    if (formData.password !== confirmPassword) {
      Alert.alert("Password Mismatch", "Passwords do not match.");
      return;
    }

    createUserWithEmailAndPassword(auth, formData.email, formData.password)
      .then((userCredential) => {
        const userId = userCredential.user.uid;

        set(dbRef(db, `users/${userId}`), {
          name: formData.name,
          email: formData.email,
          pseudo: formData.pseudo,
          phone: formData.phone,
          profileImage: formData.profileImage || "",
          isActive: true
        })
        .then(() => {
          Alert.alert("Account Created", "Your account has been created successfully.");
          navigation.navigate("Login");
        })
        .catch((error) => {
          console.error("Error saving user data:", error);
          Alert.alert("Error", "Could not save user data. Please try again.");
        });
      })
      .catch((error) => {
        console.error("Error signing up:", error);
        Alert.alert("Error", error.message);
      });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={require("../../assets/bg.jpg")}
        blurRadius={3}
        style={styles.image}
        resizeMode="cover"
      >
        <View style={styles.formContainer}>
          <Text style={styles.title}>Create an Account</Text>

          <View style={styles.inputContainer}>
            <MaterialIcons name="person" size={24} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Name"
              placeholderTextColor="#666"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />
          </View>

          <View style={styles.inputContainer}>
            <MaterialIcons name="account-circle" size={24} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Pseudo"
              placeholderTextColor="#666"
              value={formData.pseudo}
              onChangeText={(text) => setFormData({ ...formData, pseudo: text })}
            />
          </View>

          <View style={styles.inputContainer}>
            <MaterialIcons name="email" size={24} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#666"
              keyboardType="email-address"
              autoCapitalize="none"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
            />
          </View>

          <View style={styles.inputContainer}>
            <MaterialIcons name="phone" size={24} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              placeholderTextColor="#666"
              keyboardType="phone-pad"
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
            />
          </View>

          <View style={styles.inputContainer}>
            <MaterialIcons name="lock" size={24} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#666"
              secureTextEntry={secureTextEntry}
              value={formData.password}
              onChangeText={(text) => setFormData({ ...formData, password: text })}
            />
            <TouchableOpacity
              onPress={() => setSecureTextEntry(!secureTextEntry)}
              style={styles.eyeIcon}
            >
              <MaterialIcons
                name={secureTextEntry ? "visibility-off" : "visibility"}
                size={24}
                color="#666"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <MaterialIcons name="lock" size={24} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor="#666"
              secureTextEntry={secureTextEntry2}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            <TouchableOpacity
              onPress={() => setSecureTextEntry2(!secureTextEntry2)}
              style={styles.eyeIcon}
            >
              <MaterialIcons
                name={secureTextEntry2 ? "visibility-off" : "visibility"}
                size={24}
                color="#666"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.loginButton} onPress={handleSignup}>
            <Text style={styles.loginButtonText}>Sign Up</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.goBackButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.goBackButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1 },
  image: { justifyContent: 'center', flex: 1, width: '100%', height: '100%' },
  formContainer: {
    marginHorizontal: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.98)', 
    borderRadius: 24,
    padding: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  title: { 
    fontSize: 32, 
    fontWeight: '800', 
    color: '#1A1A2E', 
    marginBottom: 8, 
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  inputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F8FAFC', 
    borderRadius: 16, 
    marginBottom: 16, 
    paddingHorizontal: 18, 
    borderWidth: 1.5, 
    borderColor: '#E2E8F0',
    height: 56,
  },
  inputIcon: { 
    marginRight: 12,
    color: '#6366F1',
  },
  input: { 
    flex: 1, 
    height: 56, 
    color: '#1E293B', 
    fontSize: 16,
    fontWeight: '500',
  },
  eyeIcon: { 
    padding: 8,
  },
  loginButton: { 
    backgroundColor: '#6366F1', 
    borderRadius: 16, 
    height: 56, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: 20,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  loginButtonText: { 
    color: '#FFF', 
    fontSize: 17, 
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  goBackButton: { 
    backgroundColor: '#F1F5F9', 
    borderRadius: 16, 
    height: 56, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  goBackButtonText: { 
    color: '#475569', 
    fontSize: 16, 
    fontWeight: '700',
  },
});