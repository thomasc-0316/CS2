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
import { useAutoSave } from '../hooks/useAutoSave';
import { useUndoRedo } from '../hooks/useUndoRedo';
import AutoSaveIndicator from '../components/AutoSaveIndicator';
import ImageCropModal from '../components/ImageCropModal';
import DraftSelectionModal from '../components/DraftSelectionModal';
import { useDrafts } from '../context/DraftsContext';

export default function PostScreen({ navigation, route }) {
  const { createNewDraft, deleteDraftAfterPost, currentDraftId, loadDraft } = useDrafts();
  
  // Track if we're working with a loaded draft
  const [loadedDraftId, setLoadedDraftId] = useState(null);
  // Undo/Redo state management for form
  const {
    state: formState,
    setState: setFormState,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
  } = useUndoRedo({
    title: '',
    description: '',
    side: '',
    site: '',
    nadeType: '',
    throwInstructions: '',
    standImage: null,
    aimImage: null,
    landImage: null,
    moreDetailsImage: null,
  });

  // Destructure form state
  const {
    title,
    description,
    side,
    site,
    nadeType,
    throwInstructions,
    standImage,
    aimImage,
    landImage,
    moreDetailsImage,
  } = formState;

  // Helper to update form state
  const updateFormState = (updates) => {
    setFormState({ ...formState, ...updates });
  };

  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingLineupId, setEditingLineupId] = useState(null);

  // Image crop modal state
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropImageUri, setCropImageUri] = useState(null);
  const [cropImageSlot, setCropImageSlot] = useState(null);

  // Draft selection modal state
  const [showDraftModal, setShowDraftModal] = useState(false);

  // Auto-save (enabled only when not editing)
  const { saveStatus, lastSaved } = useAutoSave(formState, !isEditMode);

  // Load draft or lineup for editing
  useEffect(() => {
    if (route.params?.loadDraft) {
      const draft = route.params.loadDraft;
      setLoadedDraftId(draft.id); // Track which draft we loaded
      setFormState({
        title: draft.title || '',
        description: draft.description || '',
        side: draft.side || '',
        site: draft.site || '',
        nadeType: draft.nadeType || '',
        throwInstructions: draft.throwInstructions || '',
        standImage: draft.standImage || null,
        aimImage: draft.aimImage || null,
        landImage: draft.landImage || null,
        moreDetailsImage: draft.moreDetailsImage || draft.thirdPersonImage || null,
      });
      clearHistory();

      // Clear the param
      navigation.setParams({ loadDraft: undefined });
    } else if (route.params?.editLineup) {
      const lineup = route.params.editLineup;
      setIsEditMode(true);
      setEditingLineupId(lineup.id);
      setFormState({
        title: lineup.title || '',
        description: lineup.description || '',
        side: lineup.side || '',
        site: lineup.site || '',
        nadeType: lineup.nadeType || '',
        throwInstructions: lineup.throwInstructions || '',
        standImage: lineup.standImage || null,
        aimImage: lineup.aimImage || null,
        landImage: lineup.landImage || null,
        moreDetailsImage: lineup.moreDetailsImage || lineup.thirdPersonImage || null,
      });
      clearHistory();

      // Update header title
      navigation.setOptions({
        title: 'Edit Lineup',
      });

      // Clear the param
      navigation.setParams({ editLineup: undefined });
    }
  }, [route.params?.loadDraft, route.params?.editLineup]);

  // Show draft selection modal on tab focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Always show modal when navigating to Post tab (unless editing)
      if (!isEditMode && !route.params?.loadDraft && !route.params?.editLineup) {
        // Small delay to let navigation finish
        setTimeout(() => {
          setShowDraftModal(true);
        }, 100);
      }
    });

    return unsubscribe;
  }, [navigation, isEditMode]);

  // Function to reset all fields
  const resetForm = () => {
    setFormState({
      title: '',
      description: '',
      side: '',
      site: '',
      nadeType: '',
      throwInstructions: '',
      standImage: null,
      aimImage: null,
      landImage: null,
      moreDetailsImage: null,
    });
    setActiveImageSlot(null);
    setSelectedPhoto(null);
    setIsEditMode(false);
    setEditingLineupId(null);
    setLoadedDraftId(null); // Clear loaded draft
    clearHistory();

    // Reset header title
    navigation.setOptions({
      title: 'Create Lineup',
    });
  };

  // Set up header buttons (Reset + Undo/Redo)
  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={undo}
            disabled={!canUndo}
            style={[styles.undoRedoButton, !canUndo && styles.undoRedoButtonDisabled]}
          >
            <Ionicons
              name="arrow-undo"
              size={22}
              color={canUndo ? '#FF6800' : '#666'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={redo}
            disabled={!canRedo}
            style={[styles.undoRedoButton, !canRedo && styles.undoRedoButtonDisabled]}
          >
            <Ionicons
              name="arrow-redo"
              size={22}
              color={canRedo ? '#FF6800' : '#666'}
            />
          </TouchableOpacity>
        </View>
      ),
      headerRight: () => (
        <TouchableOpacity onPress={handleReset} style={{ marginRight: 10 }}>
          <Ionicons name="refresh-outline" size={24} color="#fff" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, canUndo, canRedo]);

  // Reset with confirmation
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
  const [activeImageSlot, setActiveImageSlot] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  // Load photos from gallery
  useEffect(() => {
    (async () => {
      try {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        setHasPermission(status === 'granted');

        if (status === 'granted') {
          const album = await MediaLibrary.getAssetsAsync({
            first: 100,
            mediaType: 'photo',
            sortBy: ['creationTime'],
          });
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
    setSelectedPhoto(null);
    Keyboard.dismiss();
  };

  const handlePhotoTap = async (photo) => {
    if (activeImageSlot) {
      setSelectedPhoto(photo);
    }
  };

  const confirmImageSelection = async () => {
    if (selectedPhoto && activeImageSlot) {
      // Get the actual file URI
      const assetInfo = await MediaLibrary.getAssetInfoAsync(selectedPhoto.id);
      const imageUri = assetInfo.localUri || assetInfo.uri;

      // Store which slot this image is for
      setCropImageSlot(activeImageSlot);
      setCropImageUri(imageUri);

      // Clear selection state
      setActiveImageSlot(null);
      setSelectedPhoto(null);

      // Open crop modal
      setShowCropModal(true);
    }
  };

  // Handle cropped image confirmation
  const handleCroppedImage = (croppedUri) => {
    // Set the cropped image to the appropriate slot
    const updates = {};
    updates[`${cropImageSlot}Image`] = croppedUri;
    updateFormState(updates);

    // Close modal and clear state
    setShowCropModal(false);
    setCropImageUri(null);
    setCropImageSlot(null);
  };

  // Handle crop modal cancel
  const handleCropCancel = () => {
    setShowCropModal(false);
    setCropImageUri(null);
    setCropImageSlot(null);
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
        moreDetailsImage,
        mapId: 'dust2', // Default for now
      },
      isEditing: isEditMode,
      lineupId: editingLineupId,
    });
  };

  const renderPickerOption = (value, label, currentValue, setValue) => {
    const isSelected = currentValue === value;
    return (
      <TouchableOpacity
        key={value}
        style={[styles.pickerOption, isSelected && styles.pickerOptionSelected]}
        onPress={() => updateFormState({ [setValue.name.replace('set', '').toLowerCase()]: value })}
      >
        <Text style={[styles.pickerText, isSelected && styles.pickerTextSelected]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderPickerOptionSimple = (value, label, currentValue, stateKey) => {
    const isSelected = currentValue === value;
    return (
      <TouchableOpacity
        key={value}
        style={[styles.pickerOption, isSelected && styles.pickerOptionSelected]}
        onPress={() => updateFormState({ [stateKey]: value })}
      >
        <Text style={[styles.pickerText, isSelected && styles.pickerTextSelected]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderImagePlaceholder = (slot, label, image, optional = false) => {
    const isActive = activeImageSlot === slot;
    const hasImage = !!image;

    const handleDelete = () => {
      const updates = {};
      updates[`${slot}Image`] = null;
      updateFormState(updates);
    };

    return (
      <TouchableOpacity
        key={slot}
        style={[
          styles.imagePlaceholder,
          isActive && styles.imagePlaceholderActive,
          hasImage && styles.imagePlaceholderFilled,
        ]}
        onPress={() => handleImageSlotTap(slot)}
      >
        {hasImage ? (
          <>
            <Image source={{ uri: image }} style={styles.placeholderImage} contentFit="cover" />
            {/* Delete button */}
            <TouchableOpacity
              style={styles.deleteImageButton}
              onPress={handleDelete}
            >
              <Ionicons name="close-circle" size={28} color="#FF6800" />
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.placeholderEmpty}>
            <Ionicons name="image-outline" size={40} color="#666" />
          </View>
        )}
        <View style={styles.placeholderLabel}>
          <Text style={styles.placeholderLabelText}>
            {label}
            {!optional && <Text style={styles.requiredAsterisk}> *</Text>}
            {optional && <Text style={styles.optionalLabel}> (Optional)</Text>}
          </Text>
          {hasImage && (
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderPhotoItem = ({ item }) => {
    const isSelected = selectedPhoto?.id === item.id;
    return (
      <TouchableOpacity
        style={[styles.photoItem, isSelected && styles.photoItemSelected]}
        onPress={() => handlePhotoTap(item)}
      >
        <Image source={{ uri: item.uri }} style={styles.photoThumbnail} contentFit="cover" />
        {isSelected && (
          <View style={styles.photoSelectedOverlay}>
            <Ionicons name="checkmark-circle" size={30} color="#FF6800" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Auto-save indicator */}
      <AutoSaveIndicator status={saveStatus} lastSaved={lastSaved} />

      {/* Top Half - Form */}
      <ScrollView style={styles.topHalf} contentContainerStyle={styles.formContainer}>
        {/* Title Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>
            Title<Text style={styles.requiredAsterisk}> *</Text>
          </Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g., CT Smoke from Spawn"
            placeholderTextColor="#666"
            value={title}
            onChangeText={(text) => updateFormState({ title: text })}
            maxLength={50}
          />
          <Text style={styles.charCount}>{title.length}/50</Text>
        </View>

        {/* Description Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Description</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder="Add details about this lineup..."
            placeholderTextColor="#666"
            value={description}
            onChangeText={(text) => updateFormState({ description: text })}
            maxLength={200}
            multiline
            numberOfLines={3}
          />
          <Text style={styles.charCount}>{description.length}/200</Text>
        </View>

        {/* Side Picker */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>
            Side<Text style={styles.requiredAsterisk}> *</Text>
          </Text>
          <View style={styles.pickerRow}>
            {renderPickerOptionSimple('T', 'T Side', side, 'side')}
            {renderPickerOptionSimple('CT', 'CT Side', side, 'side')}
          </View>
        </View>

        {/* Site Picker */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>
            Site<Text style={styles.requiredAsterisk}> *</Text>
          </Text>
          <View style={styles.pickerRow}>
            {renderPickerOptionSimple('A', 'A Site', site, 'site')}
            {renderPickerOptionSimple('Mid', 'Mid', site, 'site')}
            {renderPickerOptionSimple('B', 'B Site', site, 'site')}
          </View>
        </View>

        {/* Nade Type Picker */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>
            Grenade Type<Text style={styles.requiredAsterisk}> *</Text>
          </Text>
          <View style={styles.pickerRow}>
            {renderPickerOptionSimple('Smoke', 'Smoke', nadeType, 'nadeType')}
            {renderPickerOptionSimple('Flash', 'Flash', nadeType, 'nadeType')}
            {renderPickerOptionSimple('Molotov', 'Molotov', nadeType, 'nadeType')}
            {renderPickerOptionSimple('HE', 'HE Grenade', nadeType, 'nadeType')}
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
            onChangeText={(text) => updateFormState({ throwInstructions: text })}
            maxLength={100}
          />
          <Text style={styles.charCount}>{throwInstructions.length}/100</Text>
        </View>

        {/* Image Placeholders */}
        <Text style={styles.imagesTitle}>Lineup Images</Text>
        {renderImagePlaceholder('stand', '1. Where to Stand', standImage)}
        {renderImagePlaceholder('aim', '2. Where to Aim', aimImage)}
        {renderImagePlaceholder('land', '3. Where It Lands', landImage)}
        {renderImagePlaceholder('moreDetails', '4. More Details', moreDetailsImage, true)}

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
            <Text style={styles.emptyText}>No photos found</Text>
          </View>
        ) : (
          <FlatList
            data={photos}
            renderItem={renderPhotoItem}
            keyExtractor={(item) => item.id}
            numColumns={3}
            contentContainerStyle={styles.galleryGrid}
          />
        )}

        {/* Confirm/Cancel buttons for selection */}
        {selectedPhoto && (
          <View style={styles.selectionActions}>
            <TouchableOpacity style={styles.cancelButton} onPress={cancelSelection}>
              <Ionicons name="close" size={20} color="#fff" />
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmButton} onPress={confirmImageSelection}>
              <Ionicons name="checkmark" size={20} color="#fff" />
              <Text style={styles.confirmButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Image Crop Modal */}
      <ImageCropModal
        visible={showCropModal}
        imageUri={cropImageUri}
        onConfirm={handleCroppedImage}
        onCancel={handleCropCancel}
      />

      {/* Draft Selection Modal */}
      <DraftSelectionModal
        visible={showDraftModal}
        onSelectDraft={(draft) => {
          loadDraft(draft.id); // This sets currentDraftId
          navigation.setParams({ loadDraft: draft });
          setShowDraftModal(false);
        }}
        onCreateNew={() => {
          // Clear form and create new draft
          resetForm();
          createNewDraft(); // This creates and sets new currentDraftId
          setShowDraftModal(false);
        }}
        onClose={() => setShowDraftModal(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  headerLeft: {
    flexDirection: 'row',
    marginLeft: 10,
    gap: 8,
  },
  undoRedoButton: {
    padding: 6,
  },
  undoRedoButtonDisabled: {
    opacity: 0.3,
  },
  topHalf: {
    flex: 1,
  },
  formContainer: {
    padding: 20,
    paddingBottom: 40,
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
  requiredAsterisk: {
    color: '#FF6800',
    fontSize: 16,
  },
  optionalLabel: {
    color: '#666',
    fontSize: 14,
    fontWeight: 'normal',
  },
  textInput: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
  },
  pickerRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pickerOption: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  pickerOptionSelected: {
    backgroundColor: '#FF6800',
    borderColor: '#FF6800',
  },
  pickerText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '600',
  },
  pickerTextSelected: {
    color: '#fff',
  },
  imagesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 10,
    marginBottom: 15,
  },
  imagePlaceholder: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginBottom: 15,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#333',
  },
  imagePlaceholderActive: {
    borderColor: '#FF6800',
    borderWidth: 3,
  },
  imagePlaceholderFilled: {
    borderColor: '#FF6800',
    borderWidth: 3,
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
  },
  deleteImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 14,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmpty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderLabel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  placeholderLabelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  previewButton: {
    backgroundColor: '#FF6800',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  previewButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  bottomHalf: {
    height: 300,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  galleryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#1a1a1a',
    gap: 8,
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
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
  },
  emptyGallery: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  galleryGrid: {
    padding: 2,
  },
  photoItem: {
    flex: 1 / 3,
    aspectRatio: 1,
    padding: 2,
  },
  photoItemSelected: {
    opacity: 0.7,
  },
  photoThumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  photoSelectedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
    borderRadius: 4,
  },
  selectionActions: {
    flexDirection: 'row',
    padding: 15,
    gap: 10,
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#FF6800',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});