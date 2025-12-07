import { onValue, ref } from "firebase/database";
import React, { useEffect, useState } from "react";
import {
    FlatList,
    Image,
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
    <View style={styles.container}>
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
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    padding: 16,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#1A1A2E",
    marginBottom: 24,
    textAlign: "left",
    paddingHorizontal: 4,
    letterSpacing: -0.5,
  },
  userItem: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 16,
    borderWidth: 2,
    borderColor: "#E2E8F0",
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#6366F1",
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
    color: "#1E293B",
    letterSpacing: -0.2,
  },
  chatButton: {
    backgroundColor: "#6366F1",
    width: 48,
    height: 48,
    borderRadius: 24,
    marginLeft: "auto",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
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
    color: "#94A3B8",
    fontSize: 16,
    fontWeight: "500",
  },
});
