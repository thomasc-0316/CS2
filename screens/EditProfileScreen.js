import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useProfile } from '../context/ProfileContext';
import { useAuth } from '../context/AuthContext';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '../firebaseConfig';

export default function EditProfileScreen({ navigation }) {
  const { profile, updateProfile } = useProfile();
  const { updateUserProfile, currentUser } = useAuth();
  
  // Local state for editing
  const [username, setUsername] = useState(profile.username);
  const [bio, setBio] = useState(profile.bio);
  const [pronouns, setPronouns] = useState(profile.pronouns);
  const [links, setLinks] = useState(profile.links);
  const [profilePicture, setProfilePicture] = useState(profile.profilePicture);
  const [saving, setSaving] = useState(false);

  const handleCancel = () => {
    navigation.goBack();
  };

  const handleDone = async () => {
    if (saving) return;
    setSaving(true);

    const uploadProfilePicture = async () => {
      if (!profilePicture || profilePicture.startsWith('http')) {
        return profilePicture || null;
      }
      if (!currentUser?.uid) return null;

      try {
        const response = await fetch(profilePicture);
        const blob = await response.blob();
        const fileRef = ref(storage, `profilePictures/${currentUser.uid}-${Date.now()}.jpg`);
        await uploadBytes(fileRef, blob);
        blob.close?.();
        return await getDownloadURL(fileRef);
      } catch (error) {
        console.error('Failed to upload profile picture', error);
        return null;
      }
    };

    const uploadedProfileUrl = await uploadProfilePicture();
    const removingPicture = profilePicture === null;

    const updates = {
      username,
      displayName: username,
      bio,
      pronouns,
      links,
      profilePicture: removingPicture
        ? null
        : uploadedProfileUrl || profile.profilePicture || null,
    };

    try {
      await updateUserProfile(updates);
      updateProfile({
        ...profile,
        ...updates,
        playerID: profile.playerID,
      });
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to save profile changes.');
    } finally {
      setSaving(false);
    }
  };

  const showImagePickerOptions = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Choose from Library', 'Take Photo', 'Remove Current Picture'],
          destructiveButtonIndex: 3,
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            pickImageFromLibrary();
          } else if (buttonIndex === 2) {
            takePhoto();
          } else if (buttonIndex === 3) {
            removeProfilePicture();
          }
        }
      );
    } else {
      // Android - use Alert
      Alert.alert(
        'Edit Profile Picture',
        'Choose an option',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Choose from Library', onPress: pickImageFromLibrary },
          { text: 'Take Photo', onPress: takePhoto },
          { text: 'Remove Current Picture', onPress: removeProfilePicture, style: 'destructive' },
        ]
      );
    }
  };

  const pickImageFromLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant photo library access to change your profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfilePicture(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera access to take a photo.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfilePicture(result.assets[0].uri);
    }
  };

  const removeProfilePicture = () => {
    setProfilePicture(null);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color="#FF6800" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Edit Profile</Text>
        
        <TouchableOpacity onPress={handleDone}>
          <Text style={styles.doneButton}>{saving ? 'Saving...' : 'Done'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Profile Picture Section */}
        <View style={styles.profilePictureSection}>
          {profilePicture ? (
            <Image source={{ uri: profilePicture }} style={styles.profilePicture} />
          ) : (
            <View style={styles.defaultProfilePicture}>
              <Ionicons name="person-circle" size={100} color="#FF6800" />
            </View>
          )}
          
          <TouchableOpacity onPress={showImagePickerOptions}>
            <Text style={styles.editPictureText}>Edit profile picture</Text>
          </TouchableOpacity>
        </View>

        {/* Form Fields */}
        <View style={styles.formSection}>
          {/* Username */}
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Username</Text>
            <TextInput
              style={styles.fieldInput}
              value={username}
              onChangeText={setUsername}
              placeholder="Username"
              placeholderTextColor="#666"
              maxLength={30}
            />
          </View>

          {/* Bio */}
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Bio</Text>
            <TextInput
              style={[styles.fieldInput, styles.bioInput]}
              value={bio}
              onChangeText={setBio}
              placeholder="Bio"
              placeholderTextColor="#666"
              multiline
              maxLength={150}
            />
          </View>

          {/* Pronouns */}
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Pronouns</Text>
            <TextInput
              style={styles.fieldInput}
              value={pronouns}
              onChangeText={setPronouns}
              placeholder="Pronouns"
              placeholderTextColor="#666"
              maxLength={30}
            />
          </View>

          {/* Links */}
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Links</Text>
            <TextInput
              style={styles.fieldInput}
              value={links}
              onChangeText={setLinks}
              placeholder="Add link"
              placeholderTextColor="#666"
              maxLength={100}
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 60,
    paddingBottom: 15,
    backgroundColor: '#0a0a0a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  doneButton: {
    fontSize: 16,
    color: '#0095f6',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  profilePictureSection: {
    alignItems: 'center',
    paddingVertical: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#3a3a3a',
  },
  defaultProfilePicture: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editPictureText: {
    marginTop: 15,
    fontSize: 15,
    color: '#0095f6',
    fontWeight: '600',
  },
  formSection: {
    paddingTop: 20,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  fieldLabel: {
    width: 100,
    fontSize: 16,
    color: '#fff',
    paddingTop: 10,
  },
  fieldInput: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    paddingVertical: 10,
  },
  bioInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
});
