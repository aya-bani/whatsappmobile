import { MaterialIcons } from "@expo/vector-icons";
import { off, onValue, push, ref, set } from "firebase/database";
import React, { useEffect, useState } from "react";
import {
    Alert,
    FlatList,
    Image,
    ImageBackground,
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
    <ImageBackground 
      source={require('../../assets/bg.jpg')} 
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
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
              placeholderTextColor="#B19BC8"
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
              <MaterialIcons name="close" size={28} color="#6B4C7A" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    paddingTop: 60,
    paddingHorizontal: 16,
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

  groupCard: {
    padding: 20,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    marginBottom: 12,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "rgba(212, 181, 232, 0.5)",
    shadowColor: "#C8A2C8",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
    zIndex: 1,
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
    borderColor: "rgba(212, 181, 232, 0.6)",
  },
  groupName: {
    marginLeft: 16,
    fontSize: 18,
    fontWeight: "700",
    color: "#6B4C7A",
    letterSpacing: -0.3,
  },
  subText: { 
    fontSize: 13, 
    color: "#B19BC8",
    marginTop: 4,
  },

  fab: {
    position: "absolute",
    bottom: 30,
    right: 20,
    width: 64,
    height: 64,
    backgroundColor: "#C8A2C8",
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#C8A2C8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    zIndex: 10,
  },

  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(107, 76, 122, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalContainer: {
    width: "90%",
    backgroundColor: "rgba(255, 255, 255, 0.98)",
    borderRadius: 28,
    padding: 24,
    maxHeight: "80%",
    borderWidth: 2,
    borderColor: "rgba(212, 181, 232, 0.5)",
    shadowColor: "#C8A2C8",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 12,
  },

  modalTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#6B4C7A",
    marginBottom: 20,
    textAlign: "center",
    letterSpacing: -0.5,
  },

  modalSubtitle: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "700",
    color: "#6B4C7A",
    marginBottom: 12,
  },

  input: {
    borderWidth: 2,
    borderColor: "rgba(212, 181, 232, 0.5)",
    borderRadius: 20,
    padding: 16,
    marginTop: 12,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    color: "#6B4C7A",
    fontSize: 16,
    fontWeight: "500",
  },

  userCard: {
    padding: 16,
    borderRadius: 20,
    marginBottom: 8,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderWidth: 2,
    borderColor: "rgba(212, 181, 232, 0.5)",
  },
  selectedUser: { 
    backgroundColor: "rgba(232, 213, 242, 0.6)",
    borderColor: "#C8A2C8",
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
    borderColor: "rgba(212, 181, 232, 0.6)",
  },
  userName: { 
    marginLeft: 12, 
    fontSize: 16, 
    color: "#6B4C7A",
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
    backgroundColor: "rgba(232, 213, 242, 0.6)",
    borderRadius: 20,
  },
});
