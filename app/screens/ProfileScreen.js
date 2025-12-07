import * as ImagePicker from 'expo-image-picker';
import { signOut } from 'firebase/auth';
import { ref as dbRef, get, remove, update } from 'firebase/database';
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Button,
    Image,
    ImageBackground,
    Modal,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { auth, db } from '../../firebase/config';

export default function ProfileScreen({ navigation }) {
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    pseudo: '',
    phone: '',
    profileImage: '',
  });
  const [uploading, setUploading] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [image,setImage]=useState();

  const uploadimageToSupabase = async (localURL)=> {
    const reponse = await fetch(localURL);
    const blob = await reponse.blob();
    const arraybuffer =  await new Response(blob).arrayBuffer();
    supabase.storage.from('les_images_de_profil').upload(currentUser.uid+ 'jpg',arraybuffer, {
      upsert: true,
    });
    const {data} = supabase.storage.from('les_images_de_profil').getPublicUrl(currentUser.uid+'jpg');
    return data.publicUrl;
  }


  useEffect(() => {
    const userRef = dbRef(db, `users/${auth.currentUser.uid}`);
    get(userRef).then(snapshot => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setUserData({
          name: data.name || '',
          email: data.email || '',
          pseudo: data.pseudo || '',
          phone: data.phone || '',
          profileImage: data.profileImage || '',
        });
        setIsActive(data.isActive || false);
      }
    });
  }, []);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Permission to access gallery is required!');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled) {
      const imageUri = result.assets[0].uri;
      uploadProfilePicture(imageUri);
    }
  };

  const uploadProfilePicture = async (imageUri) => {
    setUploading(true);
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const fileRef = storageRef(db, `profile-pictures/profile-${auth.currentUser.uid}.jpg`);
      await uploadBytes(fileRef, blob);
      const imageUrl = await getDownloadURL(fileRef);
      await update(dbRef(db, `users/${auth.currentUser.uid}`), { profileImage: imageUrl });
      setUserData({ ...userData, profileImage: imageUrl });
    } catch (error) {
      Alert.alert('Upload Error', error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await update(dbRef(db, `users/${auth.currentUser.uid}`), { isActive: false });
      await signOut(auth);
      navigation.reset({ routes: [{ name: 'Login' }] });
    } catch (error) {
      Alert.alert('Error', 'Failed to logout. Please try again.');
    }
  };

  const handleEditProfile = async () => {
    try {
      await update(dbRef(db, `users/${auth.currentUser.uid}`), {
        name: userData.name,
        
        pseudo: userData.pseudo,
        phone: userData.phone,
      });
      Alert.alert('Success', 'Profile updated successfully!');
      setIsEditModalVisible(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  };

  const handleDeleteProfile = () => {
    Alert.alert(
      "Delete Profile",
      "Are you sure you want to delete your profile? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await remove(dbRef(db, `users/${auth.currentUser.uid}`));
              await auth.currentUser.delete();
              navigation.reset({ routes: [{ name: 'Login' }] });
            } catch (error) {
              Alert.alert("Error", "Failed to delete profile: " + error.message);
            }
          }
        }
      ]
    );
  };

 

  return (
    <ImageBackground 
      source={require('../../assets/bg.jpg')} 
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.profileContainer}>
        <TouchableOpacity onPress={pickImage}>
          {userData.profileImage ? (
            <Image source={{ uri: userData.profileImage }} style={styles.profileImage} />
          ) : (
            <View style={styles.uploadButton}>
              <Text style={styles.uploadText}>Upload</Text>
            </View>
          )}
        </TouchableOpacity>
        {uploading && <Text style={styles.uploadingText}>Uploading...</Text>}

        <Text style={styles.profileText}>Name: {userData.name}</Text>
        <Text style={styles.profileText}>Email: {userData.email}</Text>
        <Text style={styles.profileText}>Phone: {userData.phone}</Text>
        <Text style={styles.profileText}>Pseudo: {userData.pseudo}</Text>

        <View style={styles.buttonRow}>
  <TouchableOpacity style={styles.editButton} onPress={() => setIsEditModalVisible(true)}>
    <Text style={styles.buttonText}>Edit</Text>
  </TouchableOpacity>
  
  <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteProfile}>
    <Text style={styles.buttonText}>Delete</Text>
  </TouchableOpacity>
  
  <TouchableOpacity style={styles.logoutButtonInline} onPress={handleLogout}>
    <Text style={styles.buttonText}>Logout</Text>
  </TouchableOpacity>
</View>


       
      </View>

      <Modal visible={isEditModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TextInput style={styles.input} placeholder="Name" value={userData.name} onChangeText={(text) => setUserData({ ...userData, name: text })}/>
            <TextInput style={styles.input} placeholder="Phone" value={userData.phone} onChangeText={(text) => setUserData({ ...userData, phone: text })}/>
            <TextInput style={styles.input} placeholder="Pseudo" value={userData.pseudo} onChangeText={(text) => setUserData({ ...userData, pseudo: text })}/>
            <View style={styles.modalButtonRow}>
              <Button title="Save" color="#C8A2C8" onPress={handleEditProfile}/>
              <Button title="Cancel" color="#B19BC8" onPress={() => setIsEditModalVisible(false)}/>
            </View>
          </View>
        </View>
      </Modal>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(232, 213, 242, 0.85)',
  },
  safeArea: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 20,
  },
  profileContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    width: '90%',
    padding: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 28,
    marginTop: 20,
    shadowColor: '#C8A2C8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 2,
    borderColor: 'rgba(212, 181, 232, 0.5)',
  },

  profileImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
    marginBottom: 20,
    borderWidth: 4,
    borderColor: 'rgba(212, 181, 232, 0.6)',
  },

  uploadButton: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#C8A2C8',
    borderRadius: 70,
    marginBottom: 20,
    borderWidth: 4,
    borderColor: 'rgba(212, 181, 232, 0.6)',
  },

  uploadText: {
    color: '#FFFFFF',
    fontWeight: '700',
    textAlign: 'center',
    fontSize: 16,
    letterSpacing: 0.5,
  },

  uploadingText: {
    color: '#C8A2C8',
    fontWeight: '600',
    marginBottom: 12,
    fontSize: 14,
  },

  profileText: {
    fontSize: 16,
    marginBottom: 12,
    color: '#6B4C7A',
    fontWeight: '500',
    width: '100%',
    textAlign: 'left',
    paddingHorizontal: 4,
  },

  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 24,
    gap: 8,
  },

  editButton: {
    flex: 1,
    backgroundColor: '#C8A2C8',
    padding: 14,
    borderRadius: 16,
    shadowColor: '#C8A2C8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },

  deleteButton: {
    flex: 1,
    backgroundColor: '#E8A5C8',
    padding: 14,
    borderRadius: 16,
    shadowColor: '#E8A5C8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },

  logoutButtonInline: {
    flex: 1,
    backgroundColor: '#B19BC8',
    padding: 14,
    borderRadius: 16,
    shadowColor: '#B19BC8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  buttonText: {
    color: '#fff',
    fontWeight: '700',
    textAlign: 'center',
    fontSize: 14,
    letterSpacing: 0.3,
  },

  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: 25,
    padding: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(212, 181, 232, 0.5)',
  },

  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B4C7A',
  },

  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(107, 76, 122, 0.5)',
  },

  modalContainer: {
    width: '85%',
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 28,
    padding: 24,
    shadowColor: '#C8A2C8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 12,
    borderWidth: 2,
    borderColor: 'rgba(212, 181, 232, 0.5)',
  },

  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 20,
    color: '#6B4C7A',
    textAlign: 'center',
    letterSpacing: -0.5,
  },

  input: {
    width: '100%',
    height: 52,
    borderWidth: 2,
    borderColor: 'rgba(212, 181, 232, 0.5)',
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    color: '#6B4C7A',
    fontWeight: '500',
  },

  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 12,
  },

  logoutButton: {
    backgroundColor: '#B19BC8',
    padding: 14,
    borderRadius: 16,
    width: '100%',
    marginTop: 16,
  },

  logoutText: {
    color: '#fff',
    fontWeight: '700',
    textAlign: 'center',
    fontSize: 16,
  },
});
