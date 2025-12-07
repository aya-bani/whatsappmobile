import { Ionicons } from "@expo/vector-icons";
import { off, onValue, push, ref, serverTimestamp } from "firebase/database";
import React, { useEffect, useRef, useState } from "react";
import {
    FlatList,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { auth, db } from "../../firebase/config";

export default function ChatScreen({ route, navigation }) {
  const { chatId, chatUser } = route.params || {};
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const flatListRef = useRef(null);
  const user = auth.currentUser;

  useEffect(() => {
    if (!chatId) return;
    const messagesRef = ref(db, `chats/${chatId}/messages`);

    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val() || {};
      const parsed = Object.entries(data).map(([id, value]) => ({ id, ...value }));
      parsed.sort((a, b) => a.createdAt - b.createdAt);
      setMessages(parsed);

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 200);
    });

    return () => off(messagesRef);
  }, [chatId]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    const messagesRef = ref(db, `chats/${chatId}/messages`);

    await push(messagesRef, {
      text: newMessage,
      sender: user.uid,
      createdAt: serverTimestamp(),
    });

    setNewMessage("");
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={28} color="#1A1A2E" />
        </TouchableOpacity>
        <View style={styles.headerAvatar}>
          {chatUser?.profileImage ? (
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {(chatUser?.name ?? chatUser?.pseudo ?? "?")[0].toUpperCase()}
              </Text>
            </View>
          ) : (
            <Ionicons name="person-circle" size={42} color="#6366F1" />
          )}
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>
            {chatUser?.name ?? chatUser?.pseudo ?? "Chat"}
          </Text>
          <Text style={styles.headerSubtitle}>Online</Text>
        </View>
        <TouchableOpacity style={styles.headerAction}>
          <Ionicons name="ellipsis-vertical" size={24} color="#64748B" />
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const isMe = item.sender === user.uid;
          return (
            <View
              style={[
                styles.messageWrapper,
                isMe ? styles.myMessageWrapper : styles.theirMessageWrapper,
              ]}
            >
              {!isMe && (
                <View style={styles.avatarSmall}>
                  <Text style={styles.avatarSmallText}>
                    {(chatUser?.name ?? chatUser?.pseudo ?? "?")[0].toUpperCase()}
                  </Text>
                </View>
              )}
              <View
                style={[
                  styles.messageBubble,
                  isMe ? styles.myBubble : styles.theirBubble,
                ]}
              >
                <Text style={[styles.messageText, isMe && styles.myMessageText]}>
                  {item.text}
                </Text>
              </View>
            </View>
          );
        }}
      />

      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            placeholder="Type a message..."
            placeholderTextColor="#94A3B8"
            value={newMessage}
            onChangeText={setNewMessage}
            style={styles.input}
            multiline
            maxLength={500}
          />
          <TouchableOpacity 
            style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]} 
            onPress={sendMessage}
            disabled={!newMessage.trim()}
          >
            <Ionicons 
              name="send" 
              size={20} 
              color={newMessage.trim() ? "#FFFFFF" : "#CBD5E1"} 
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 16,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerAvatar: {
    marginRight: 12,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#6366F1",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: { 
    color: "#1A1A2E", 
    fontSize: 18, 
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    color: "#64748B",
    fontSize: 13,
    marginTop: 2,
    fontWeight: "500",
  },
  headerAction: {
    padding: 4,
  },
  messagesList: { 
    padding: 16, 
    paddingBottom: 100,
  },
  messageWrapper: { 
    flexDirection: "row", 
    alignItems: "flex-end", 
    marginVertical: 4,
  },
  myMessageWrapper: { 
    justifyContent: "flex-end",
  },
  theirMessageWrapper: { 
    justifyContent: "flex-start",
  },
  avatarSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#818CF8",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    marginBottom: 2,
  },
  avatarSmallText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  messageBubble: { 
    maxWidth: "75%", 
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  myBubble: { 
    backgroundColor: "#6366F1",
    borderBottomRightRadius: 6,
  },
  theirBubble: { 
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  messageText: { 
    fontSize: 15, 
    color: "#1E293B",
    lineHeight: 20,
    fontWeight: "400",
  },
  myMessageText: {
    color: "#FFFFFF",
  },
  inputContainer: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingVertical: 12,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 30 : 12,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#F1F5F9",
    borderRadius: 24,
    paddingHorizontal: 4,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  input: { 
    flex: 1, 
    backgroundColor: "transparent",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    fontSize: 15,
    color: "#1E293B",
    maxHeight: 100,
    ...Platform.select({
      ios: {
        paddingTop: 10,
      },
    }),
  },
  sendButton: { 
    backgroundColor: "#6366F1",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 4,
  },
  sendButtonDisabled: {
    backgroundColor: "#E2E8F0",
  },
});
 