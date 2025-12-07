import { MaterialIcons } from "@expo/vector-icons";
import { off, onValue, push, ref, set } from "firebase/database";
import React, { useEffect, useState } from "react";
import {
    Alert,
    FlatList,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { auth, db } from "../../firebase/config";

export default function GroupsScreen({ navigation }) {
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupName, setGroupName] = useState("");

  const currentUserID = auth.currentUser?.uid;

  useEffect(() => {
    if (!currentUserID) return;

    const groupsRef = ref(db, "groups");
    const usersRef = ref(db, "users");

    onValue(groupsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data)
          .filter(([_, group]) => group.members?.includes(currentUserID))
          .map(([id, info]) => ({ id, ...info }));
        setGroups(list);
      }
    });

    onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data)
          .filter(([id]) => id !== currentUserID)
          .map(([id, info]) => ({ id, ...info }));
        setUsers(list);
      }
    });

    return () => {
      off(groupsRef);
      off(usersRef);
    };
  }, []);

  const toggleSelectUser = (user) => {
    if (selectedUsers.find((u) => u.id === user.id)) {
      setSelectedUsers(selectedUsers.filter((u) => u.id !== user.id));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const createGroup = async () => {
    if (!groupName.trim()) {
      return Alert.alert("Error", "Please enter a group name");
    }
    if (selectedUsers.length === 0) {
      return Alert.alert("Error", "Select at least one member");
    }

    try {
      const groupMembers = [
        ...selectedUsers.map((u) => u.id),
        currentUserID,
      ];

      const newGroupRef = push(ref(db, "groups"));
      await set(newGroupRef, {
        name: groupName,
        members: groupMembers,
        createdAt: new Date().toISOString(),
        createdBy: currentUserID,
      });

      setGroupName("");
      setSelectedUsers([]);
      setModalVisible(false);

      Alert.alert("Success", "Group created!");
    } catch (e) {
      console.log(e);
      Alert.alert("Error", "Failed to create group");
    }
  };

  const renderGroup = ({ item }) => (
    <TouchableOpacity
      style={styles.groupCard}
      onPress={() => navigation.navigate("ChatScreen", { chatId: item.id })}
    >
      <View style={styles.groupInfo}>
        <Image
          source={{
            uri: "https://cdn-icons-png.flaticon.com/512/194/194938.png",
          }}
          style={styles.groupIcon}
        />
        <View>
          <Text style={styles.groupName}>{item.name}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mes Groupes</Text>

      <FlatList
        data={groups}
        renderItem={renderGroup}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 120 }}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <MaterialIcons name="group-add" size={28} color="#fff" />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Créer un nouveau groupe</Text>

            <TextInput
              placeholder="Nom du groupe"
              value={groupName}
              onChangeText={setGroupName}
              style={styles.input}
              placeholderTextColor="#2E7D32"
            />

            <Text style={styles.modalSubtitle}>Sélectionner les membres :</Text>

            <ScrollView style={{ marginTop: 10, maxHeight: 300 }}>
              {users.map((user) => (
                <TouchableOpacity
                  key={user.id}
                  style={[
                    styles.userCard,
                    selectedUsers.find((u) => u.id === user.id) &&
                      styles.selectedUser,
                  ]}
                  onPress={() => toggleSelectUser(user)}
                >
                  <View style={styles.userInfo}>
                    <Image
                      source={{
                        uri:
                          user.profileImage ||
                          "https://cdn-icons-png.flaticon.com/512/149/149071.png",
                      }}
                      style={styles.profileImage}
                    />
                    <Text style={styles.userName}>{user.name}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={[styles.fab, styles.confirmBtn]}
              onPress={createGroup}
            >
              <MaterialIcons name="check" size={28} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.closeModal}
            >
              <MaterialIcons name="close" size={28} color="#2E7D32" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#F8FAFC", 
    paddingTop: 60,
    paddingHorizontal: 16,
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

  groupCard: {
    padding: 20,
    backgroundColor: "#FFFFFF",
    marginBottom: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  groupInfo: { 
    flexDirection: "row", 
    alignItems: "center",
  },
  groupIcon: { 
    width: 56, 
    height: 56, 
    borderRadius: 28,
    borderWidth: 2,
    borderColor: "#E2E8F0",
  },
  groupName: {
    marginLeft: 16,
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
    letterSpacing: -0.3,
  },
  subText: { 
    fontSize: 13, 
    color: "#64748B",
    marginTop: 4,
  },

  fab: {
    position: "absolute",
    bottom: 30,
    right: 20,
    width: 64,
    height: 64,
    backgroundColor: "#6366F1",
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },

  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalContainer: {
    width: "90%",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    maxHeight: "80%",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },

  modalTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1A1A2E",
    marginBottom: 20,
    textAlign: "center",
    letterSpacing: -0.5,
  },

  modalSubtitle: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 12,
  },

  input: {
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    backgroundColor: "#F8FAFC",
    color: "#1E293B",
    fontSize: 16,
    fontWeight: "500",
  },

  userCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 8,
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  selectedUser: { 
    backgroundColor: "#EEF2FF",
    borderColor: "#6366F1",
    borderWidth: 2,
  },

  userInfo: { 
    flexDirection: "row", 
    alignItems: "center",
  },
  profileImage: { 
    width: 48, 
    height: 48, 
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#E2E8F0",
  },
  userName: { 
    marginLeft: 12, 
    fontSize: 16, 
    color: "#1E293B",
    fontWeight: "600",
  },

  confirmBtn: { 
    bottom: -10, 
    alignSelf: "center",
    marginTop: 16,
  },
  closeModal: { 
    position: "absolute", 
    top: 20, 
    right: 20,
    padding: 8,
    backgroundColor: "#F1F5F9",
    borderRadius: 20,
  },
});
