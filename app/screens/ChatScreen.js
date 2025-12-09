import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';
import { set as dbSet, off, onValue, push, ref, serverTimestamp } from "firebase/database";
import { getDownloadURL, ref as storageRef, uploadBytes } from "firebase/storage";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    ImageBackground,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { auth, db, storage } from "../../firebase/config";

export default function ChatScreen({ route, navigation }) {
  const { chatId, chatUser } = route.params || {};
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [uploading, setUploading] = useState(false);
  const flatListRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const user = auth.currentUser;

  useEffect(() => {
    if (!chatId) return;
    const messagesRef = ref(db, `chats/${chatId}/messages`);
    const typingRef = ref(db, `chats/${chatId}/typing`);

    const unsubscribeMessages = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val() || {};
      const parsed = Object.entries(data).map(([id, value]) => ({ id, ...value }));
      parsed.sort((a, b) => a.createdAt - b.createdAt);
      setMessages(parsed);

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 200);
    });

    const unsubscribeTyping = onValue(typingRef, (snapshot) => {
      const data = snapshot.val() || {};
      const otherUserId = Object.keys(data).find(uid => uid !== user.uid);
      if (otherUserId && data[otherUserId]) {
        setOtherUserTyping(true);
        setTimeout(() => setOtherUserTyping(false), 3000);
      }
    });

    return () => {
      off(messagesRef);
      off(typingRef);
    };
  }, [chatId]);

  useEffect(() => {
    if (!chatId || !newMessage) {
      if (isTyping) {
        dbSet(ref(db, `chats/${chatId}/typing/${user.uid}`), false);
        setIsTyping(false);
      }
      return;
    }

    dbSet(ref(db, `chats/${chatId}/typing/${user.uid}`), true);
    setIsTyping(true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      dbSet(ref(db, `chats/${chatId}/typing/${user.uid}`), false);
      setIsTyping(false);
    }, 1000);

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [newMessage]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    const messagesRef = ref(db, `chats/${chatId}/messages`);

    await push(messagesRef, {
      text: newMessage,
      sender: user.uid,
      createdAt: serverTimestamp(),
    });

    dbSet(ref(db, `chats/${chatId}/typing/${user.uid}`), false);
    setIsTyping(false);
    setNewMessage("");
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Permission to access gallery is required!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const uploadImage = async (imageUri) => {
    setUploading(true);
    try {
      // Fetch the image as a blob
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      // Create a unique filename
      const filename = `chat-images/${chatId}/${Date.now()}.jpg`;
      const fileRef = storageRef(storage, filename);
      
      // Upload the blob
      await uploadBytes(fileRef, blob);
      
      // Get the download URL
      const imageUrl = await getDownloadURL(fileRef);
      
      // Save message with image URL to database
      const messagesRef = ref(db, `chats/${chatId}/messages`);
      await push(messagesRef, {
        imageUrl: imageUrl,
        sender: user.uid,
        createdAt: serverTimestamp(),
      });
      
      Alert.alert('Success', 'Image sent successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Upload Error', error.message || 'Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <ImageBackground 
      source={require('../../assets/bg.jpg')} 
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={28} color="#1A1A2E" />
        </TouchableOpacity>
        <View style={styles.headerAvatar}>
          {chatUser?.profileImage ? (
            <Image source={{ uri: chatUser.profileImage }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {(chatUser?.name ?? chatUser?.pseudo ?? "?")[0].toUpperCase()}
              </Text>
            </View>
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
                {item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} style={styles.messageImage} />
                ) : null}
                {item.text ? (
                  <Text style={[styles.messageText, isMe && styles.myMessageText]}>
                    {item.text}
                  </Text>
                ) : null}
              </View>
            </View>
          );
        }}
      />

      {otherUserTyping && (
        <View style={styles.typingIndicator}>
          <View style={styles.typingBubble}>
            <Text style={styles.typingText}>
              {chatUser?.name ?? chatUser?.pseudo ?? "Someone"} is typing...
            </Text>
          </View>
        </View>
      )}

      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TouchableOpacity 
            style={styles.photoButton}
            onPress={pickImage}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator size="small" color="#C8A2C8" />
            ) : (
              <Ionicons name="camera" size={24} color="#C8A2C8" />
            )}
          </TouchableOpacity>
          <TextInput
            placeholder="Type a message..."
            placeholderTextColor="#D4B5E8"
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
              color={newMessage.trim() ? "#FFFFFF" : "#E8D5F2"} 
            />
          </TouchableOpacity>
        </View>
      </View>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingVertical: 16,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(200, 162, 200, 0.3)",
    shadowColor: "#C8A2C8",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
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
    backgroundColor: "#C8A2C8",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImage: {
    width: 42,
    height: 42,
    borderRadius: 21,
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
    color: "#6B4C7A", 
    fontSize: 18, 
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    color: "#B19BC8",
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
    marginVertical: 6,
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
    backgroundColor: "#D4B5E8",
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
    borderRadius: 24,
    ...Platform.select({
      ios: {
        shadowColor: "#C8A2C8",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  myBubble: { 
    backgroundColor: "#C8A2C8",
    borderBottomRightRadius: 8,
  },
  theirBubble: { 
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderBottomLeftRadius: 8,
    borderWidth: 1.5,
    borderColor: "rgba(212, 181, 232, 0.5)",
  },
  messageText: { 
    fontSize: 15, 
    color: "#6B4C7A",
    lineHeight: 20,
    fontWeight: "400",
  },
  myMessageText: {
    color: "#FFFFFF",
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 16,
    marginBottom: 8,
  },
  typingIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  typingBubble: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: "flex-start",
    borderWidth: 1.5,
    borderColor: "rgba(212, 181, 232, 0.5)",
  },
  typingText: {
    color: "#B19BC8",
    fontSize: 13,
    fontStyle: "italic",
  },
  inputContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderTopWidth: 1,
    borderTopColor: "rgba(200, 162, 200, 0.3)",
    paddingVertical: 12,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 30 : 12,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 28,
    paddingHorizontal: 4,
    paddingVertical: 4,
    borderWidth: 1.5,
    borderColor: "rgba(212, 181, 232, 0.5)",
  },
  photoButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 4,
    backgroundColor: "rgba(232, 213, 242, 0.5)",
  },
  input: { 
    flex: 1, 
    backgroundColor: "transparent",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    fontSize: 15,
    color: "#6B4C7A",
    maxHeight: 100,
    ...Platform.select({
      ios: {
        paddingTop: 10,
      },
    }),
  },
  sendButton: { 
    backgroundColor: "#C8A2C8",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 4,
    shadowColor: "#C8A2C8",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  sendButtonDisabled: {
    backgroundColor: "#E8D5F2",
  },
});