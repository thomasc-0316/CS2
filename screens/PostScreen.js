import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';

export default function PostScreen({ navigation, route }) {
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [side, setSide] = useState('');
  const [site, setSite] = useState('');
  const [nadeType, setNadeType] = useState('');
  const [throwInstructions, setThrowInstructions] = useState('');

  // Image state
  const [standImage, setStandImage] = useState(null);
  const [aimImage, setAimImage] = useState(null);
  const [landImage, setLandImage] = useState(null);
  const [thirdPersonImage, setThirdPersonImage] = useState(null);

  // Function to reset all fields
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setSide('');
    setSite('');
    setNadeType('');
    setThrowInstructions('');
    setStandImage(null);
    setAimImage(null);
    setLandImage(null);
    setThirdPersonImage(null);
    setActiveImageSlot(null);
    setSelectedPhoto(null);
  };

  // Check if we should reset after posting
  useEffect(() => {
    if (route.params?.shouldReset) {
      resetForm();
      // Clear the param
      navigation.setParams({ shouldReset: undefined });
    }
  }, [route.params?.shouldReset]);

  // Set up header right button
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={handleReset}
          style={{ marginRight: 10 }}
        >
          <Ionicons name="refresh-outline" size={24} color="#fff" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  // Reset all form fields and images with confirmation
  const handleReset = () => {
    Alert.alert(
      'Reset Post',
      'Are you sure you want to clear everything?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: resetForm,
        },
      ]
    );
  };

  // Gallery state
  const [photos, setPhotos] = useState([]);
  const [hasPermission, setHasPermission] = useState(false);
  const [loadingPhotos, setLoadingPhotos] = useState(true);

  // Selection state
  const [activeImageSlot, setActiveImageSlot] = useState(null); // 'stand', 'aim', 'land', 'thirdPerson'
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  // Load photos from gallery
  useEffect(() => {
    (async () => {
      try {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        console.log('Permission status:', status);
        setHasPermission(status === 'granted');

        if (status === 'granted') {
          const album = await MediaLibrary.getAssetsAsync({
            first: 100,
            mediaType: 'photo',
            sortBy: ['creationTime'],
          });
          console.log('Photos loaded:', album.assets.length);
          setPhotos(album.assets);
        }
      } catch (error) {
        console.error('Error loading photos:', error);
        Alert.alert('Error', 'Failed to load photos from library');
      } finally {
        setLoadingPhotos(false);
      }
    })();
  }, []);

  const handleImageSlotTap = (slot) => {
    setActiveImageSlot(slot);
    setSelectedPhoto(null); // Clear any previous selection
    Keyboard.dismiss();
  };

  const handlePhotoTap = async (photo) => {
    if (activeImageSlot) {
      setSelectedPhoto(photo);
    }
  };

  const confirmImageSelection = async () => {
    if (selectedPhoto && activeImageSlot) {
      // Get the actual file URI (handles iOS ph:// URLs)
      const assetInfo = await MediaLibrary.getAssetInfoAsync(selectedPhoto.id);
      const imageUri = assetInfo.localUri || assetInfo.uri;
      
      switch (activeImageSlot) {
        case 'stand':
          setStandImage(imageUri);
          break;
        case 'aim':
          setAimImage(imageUri);
          break;
        case 'land':
          setLandImage(imageUri);
          break;
        case 'thirdPerson':
          setThirdPersonImage(imageUri);
          break;
      }

      // Clear selection state
      setActiveImageSlot(null);
      setSelectedPhoto(null);
    }
  };

  const cancelSelection = () => {
    setActiveImageSlot(null);
    setSelectedPhoto(null);
  };

  const handlePreview = () => {
    // Validation
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please enter a title for your lineup.');
      return;
    }
    if (!side) {
      Alert.alert('Missing Side', 'Please select T or CT side.');
      return;
    }
    if (!site) {
      Alert.alert('Missing Site', 'Please select a site (A, Mid, or B).');
      return;
    }
    if (!nadeType) {
      Alert.alert('Missing Nade Type', 'Please select the grenade type.');
      return;
    }
    if (!standImage || !aimImage || !landImage) {
      Alert.alert('Missing Images', 'Please add all three required images (Stand, Aim, Land).');
      return;
    }

    // Navigate to preview
    navigation.navigate('PreviewPost', {
      postData: {
        title,
        description,
        side,
        site,
        nadeType,
        throwInstructions,
        standImage,
        aimImage,
        landImage,
        thirdPersonImage,
      },
    });
  };

  const renderImagePlaceholder = (slot, label, imageUri, isOptional = false) => {
    const isActive = activeImageSlot === slot;
    
    return (
      <View style={styles.imageSection}>
        <View style={styles.imageLabelRow}>
          <Text style={styles.imageLabel}>{label}</Text>
          {isOptional && <Text style={styles.optionalLabel}>(Optional)</Text>}
        </View>
        <TouchableOpacity
          style={[
            styles.imagePlaceholder,
            isActive && styles.imagePlaceholderActive,
            imageUri && styles.imagePlaceholderFilled,
          ]}
          onPress={() => handleImageSlotTap(slot)}
          activeOpacity={0.7}
        >
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.placeholderImage} />
          ) : (
            <View style={styles.placeholderContent}>
              <Ionicons
                name="image-outline"
                size={40}
                color={isActive ? '#FF6800' : '#666'}
              />
              <Text style={[styles.placeholderText, isActive && styles.placeholderTextActive]}>
                {isActive ? 'Select from gallery below' : 'Tap to add image'}
              </Text>
            </View>
          )}
          
          {imageUri && (
            <View style={styles.changeImageIndicator}>
              <Ionicons name="pencil" size={16} color="#fff" />
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const renderPickerOption = (value, label, selectedValue, onSelect) => (
    <TouchableOpacity
      style={[
        styles.pickerOption,
        selectedValue === value && styles.pickerOptionActive,
      ]}
      onPress={() => onSelect(value)}
    >
      <Text
        style={[
          styles.pickerOptionText,
          selectedValue === value && styles.pickerOptionTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (!hasPermission) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="images-outline" size={80} color="#666" />
        <Text style={styles.permissionText}>
          Photo library access is required to post lineups
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={async () => {
            const { status } = await MediaLibrary.requestPermissionsAsync();
            setHasPermission(status === 'granted');
          }}
        >
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Top Half - Scrollable Form */}
      <ScrollView
        style={styles.topHalf}
        contentContainerStyle={styles.formContainer}
        keyboardShouldPersistTaps="handled"
      >

        {/* Title Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Title</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g., Mirage A Site CT Smoke"
            placeholderTextColor="#666"
            value={title}
            onChangeText={setTitle}
            maxLength={50}
          />
          <Text style={styles.charCount}>{title.length}/50</Text>
        </View>

        {/* Description Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Description</Text>
          <TextInput
            style={[styles.textInput, styles.textInputMultiline]}
            placeholder="Describe your lineup..."
            placeholderTextColor="#666"
            value={description}
            onChangeText={setDescription}
            maxLength={200}
            multiline
            numberOfLines={3}
          />
          <Text style={styles.charCount}>{description.length}/200</Text>
        </View>

        {/* Side Picker */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Side</Text>
          <View style={styles.pickerRow}>
            {renderPickerOption('T', 'T Side', side, setSide)}
            {renderPickerOption('CT', 'CT Side', side, setSide)}
          </View>
        </View>

        {/* Site Picker */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Site</Text>
          <View style={styles.pickerRow}>
            {renderPickerOption('A', 'A Site', site, setSite)}
            {renderPickerOption('Mid', 'Mid', site, setSite)}
            {renderPickerOption('B', 'B Site', site, setSite)}
          </View>
        </View>

        {/* Nade Type Picker */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Grenade Type</Text>
          <View style={styles.pickerRow}>
            {renderPickerOption('Smoke', 'Smoke', nadeType, setNadeType)}
            {renderPickerOption('Flash', 'Flash', nadeType, setNadeType)}
            {renderPickerOption('Molotov', 'Molotov', nadeType, setNadeType)}
            {renderPickerOption('HE', 'HE Grenade', nadeType, setNadeType)}
          </View>
        </View>

        {/* Throw Instructions */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Throw Instructions</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g., Jump throw, aim at corner"
            placeholderTextColor="#666"
            value={throwInstructions}
            onChangeText={setThrowInstructions}
            maxLength={100}
          />
          <Text style={styles.charCount}>{throwInstructions.length}/100</Text>
        </View>

        {/* Image Placeholders */}
        <Text style={styles.imagesTitle}>Lineup Images</Text>
        {renderImagePlaceholder('stand', '1. Where to Stand', standImage)}
        {renderImagePlaceholder('aim', '2. Where to Aim', aimImage)}
        {renderImagePlaceholder('land', '3. Where It Lands', landImage)}
        {renderImagePlaceholder('thirdPerson', '4. Third Person View', thirdPersonImage, true)}

        {/* Preview Button */}
        <TouchableOpacity style={styles.previewButton} onPress={handlePreview}>
          <Text style={styles.previewButtonText}>Preview Post</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Half - Photo Gallery */}
      <View style={styles.bottomHalf}>
        <View style={styles.galleryHeader}>
          <Ionicons name="images" size={20} color="#fff" />
          <Text style={styles.galleryTitle}>Photo Library</Text>
          {loadingPhotos && <Text style={styles.loadingText}>Loading...</Text>}
        </View>

        {loadingPhotos ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF6800" />
            <Text style={styles.loadingText}>Loading your photos...</Text>
          </View>
        ) : photos.length === 0 ? (
          <View style={styles.emptyGallery}>
            <Ionicons name="images-outline" size={60} color="#666" />
            <Text style={styles.emptyGalleryText}>No photos found</Text>
          </View>
        ) : (
          <FlatList
            data={photos}
            keyExtractor={(item) => item.id}
            numColumns={4}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.photoThumbnail,
                  selectedPhoto?.id === item.id && styles.photoThumbnailSelected,
                ]}
                onPress={() => handlePhotoTap(item)}
                disabled={!activeImageSlot}
              >
                <Image source={{ uri: item.uri }} style={styles.thumbnailImage} />
                {selectedPhoto?.id === item.id && (
                  <View style={styles.selectedOverlay}>
                    <Ionicons name="checkmark-circle" size={24} color="#FF6800" />
                  </View>
                )}
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.galleryGrid}
          />
        )}

        {/* Confirm/Cancel Buttons */}
        {selectedPhoto && (
          <View style={styles.confirmBar}>
            <TouchableOpacity style={styles.cancelButton} onPress={cancelSelection}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmButton} onPress={confirmImageSelection}>
              <Ionicons name="checkmark" size={20} color="#fff" />
              <Text style={styles.confirmButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  topHalf: {
    flex: 1,
  },
  formContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: '#fff',
  },
  textInputMultiline: {
    height: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 5,
  },
  pickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  pickerOption: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  pickerOptionActive: {
    backgroundColor: '#FF6800',
    borderColor: '#FF6800',
  },
  pickerOptionText: {
    fontSize: 15,
    color: '#fff',
  },
  pickerOptionTextActive: {
    fontWeight: '600',
  },
  imagesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 10,
    marginBottom: 15,
  },
  imageSection: {
    marginBottom: 20,
  },
  imageLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  imageLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  optionalLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    fontStyle: 'italic',
  },
  imagePlaceholder: {
    height: 200,
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#333',
    borderRadius: 12,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  imagePlaceholderActive: {
    borderColor: '#FF6800',
    borderStyle: 'solid',
    backgroundColor: '#1a1a1a',
  },
  imagePlaceholderFilled: {
    borderStyle: 'solid',
    borderColor: '#FF6800',
  },
  placeholderContent: {
    alignItems: 'center',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
  },
  placeholderText: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
  },
  placeholderTextActive: {
    color: '#FF6800',
  },
  changeImageIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 20,
    padding: 8,
  },
  previewButton: {
    backgroundColor: '#FF6800',
    borderRadius: 12,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    gap: 10,
  },
  previewButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bottomHalf: {
    height: 280,
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  galleryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    gap: 10,
  },
  galleryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 15,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
  },
  emptyGallery: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 15,
  },
  emptyGalleryText: {
    fontSize: 16,
    color: '#666',
  },
  galleryGrid: {
    padding: 5,
  },
  photoThumbnail: {
    width: '24%',
    aspectRatio: 1,
    margin: '0.5%',
    borderRadius: 8,
    overflow: 'hidden',
  },
  photoThumbnailSelected: {
    borderWidth: 3,
    borderColor: '#FF6800',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  selectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 104, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBar: {
    flexDirection: 'row',
    padding: 15,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 2,
    backgroundColor: '#FF6800',
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  permissionText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginVertical: 20,
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: '#FF6800',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});