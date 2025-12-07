import { onValue, ref } from "firebase/database";
import React, { useEffect, useState } from "react";
import {
    FlatList,
    Image,
    ImageBackground,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { auth, db } from "../../firebase/config";

export default function UsersListScreen({ navigation }) {
  const [users, setUsers] = useState([]);
  const currentUser = auth.currentUser;

  useEffect(() => {
    const usersRef = ref(db, "users");

    const unsubscribe = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data)
          .filter((key) => key !== currentUser.uid)
          .map((key) => ({ id: key, ...data[key] }));
        setUsers(list);
      } else {
        setUsers([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleChatPress = (user) => {
    const chatId = [currentUser.uid, user.id].sort().join("_");

    navigation.navigate("ChatScreen", {
      chatId,
      user, 
    });
  };

  return (
    <ImageBackground 
      source={require('../../assets/bg.jpg')} 
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <Text style={styles.title}>Liste des utilisateurs</Text>

      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={styles.empty}>Aucun utilisateur trouvé.</Text>
        }
        renderItem={({ item }) => (
  <View style={styles.userItem}>
    {item.profileImage ? (
      <Image source={{ uri: item.profileImage }} style={styles.avatar} />
    ) : (
      <View style={styles.avatarPlaceholder}>
        <Text style={styles.avatarText}>
          {item.name?.[0] ?? "?"}
        </Text>
      </View>
    )}

    <Text style={styles.userText}>
      {item.name ?? item.pseudo}
    </Text>

    <TouchableOpacity
      style={styles.chatButton}
      onPress={() => handleChatPress(item)}
    >
      <Text style={styles.chatButtonText}>💬</Text>
    </TouchableOpacity>
  </View>
)}

      />
    </ImageBackground>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 60,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(232, 213, 242, 0.85)',
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#6B4C7A",
    marginBottom: 24,
    textAlign: "left",
    paddingHorizontal: 4,
    letterSpacing: -0.5,
    zIndex: 1,
  },
  userItem: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    padding: 16,
    borderRadius: 24,
    marginBottom: 12,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(212, 181, 232, 0.5)",
    shadowColor: "#C8A2C8",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
    zIndex: 1,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 16,
    borderWidth: 2,
    borderColor: "rgba(212, 181, 232, 0.6)",
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#C8A2C8",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  avatarText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 20,
    letterSpacing: 0.5,
  },
  userText: {
    flex: 1,
    fontSize: 17,
    fontWeight: "600",
    color: "#6B4C7A",
    letterSpacing: -0.2,
  },
  chatButton: {
    backgroundColor: "#C8A2C8",
    width: 48,
    height: 48,
    borderRadius: 24,
    marginLeft: "auto",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#C8A2C8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  chatButtonText: {
    color: "white",
    fontSize: 22,
  },
  empty: {
    textAlign: "center",
    marginTop: 80,
    color: "#B19BC8",
    fontSize: 16,
    fontWeight: "500",
    zIndex: 1,
  },
});
