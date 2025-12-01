// components/ImageCropModal.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
  PanResponder,
  Animated,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as ImageManipulator from 'expo-image-manipulator';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

const CROP_FRAME_WIDTH = SCREEN_WIDTH - 40;
const CROP_FRAME_HEIGHT = CROP_FRAME_WIDTH / (16 / 9);

export default function ImageCropModal({ visible, imageUri, onConfirm, onCancel }) {
  const [processing, setProcessing] = useState(false);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [minScale, setMinScale] = useState(1);

  // Use Animated values
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  // Load image
  useEffect(() => {
    if (visible && imageUri) {
      const RNImage = require('react-native').Image;
      
      RNImage.getSize(
        imageUri,
        (width, height) => {
          console.log('Image loaded:', width, 'x', height);
          setImageSize({ width, height });
          
          // Calculate minimum scale to cover the crop frame
          const scaleX = CROP_FRAME_WIDTH / width;
          const scaleY = CROP_FRAME_HEIGHT / height;
          const initialScale = Math.max(scaleX, scaleY);
          
          console.log('Initial scale:', initialScale);
          
          setMinScale(initialScale);
          scale.setValue(initialScale);
          
          // Center
          translateX.setValue(0);
          translateY.setValue(0);
        },
        (error) => {
          console.error('Failed to load image:', error);
          Alert.alert('Error', 'Failed to load image');
        }
      );
    }
  }, [visible, imageUri]);

  // Pan responder - SIMPLE, no boundaries
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      
      onPanResponderGrant: () => {
        // @ts-ignore
        translateX.setOffset(translateX._value);
        // @ts-ignore
        translateY.setOffset(translateY._value);
        translateX.setValue(0);
        translateY.setValue(0);
      },
      
      onPanResponderMove: Animated.event(
        [null, { dx: translateX, dy: translateY }],
        { useNativeDriver: false }
      ),
      
      onPanResponderRelease: () => {
        translateX.flattenOffset();
        translateY.flattenOffset();
      },
    })
  ).current;

  const handleZoomIn = () => {
    // @ts-ignore
    const currentScale = scale._value;
    const newScale = Math.min(currentScale * 1.3, 5);
    
    Animated.spring(scale, {
      toValue: newScale,
      friction: 7,
      useNativeDriver: true,
    }).start();
  };

  const handleZoomOut = () => {
    // @ts-ignore
    const currentScale = scale._value;
    const newScale = Math.max(currentScale * 0.7, minScale);
    
    Animated.spring(scale, {
      toValue: newScale,
      friction: 7,
      useNativeDriver: true,
    }).start();
  };

  const handleReset = () => {
    scale.setValue(minScale);
    translateX.setValue(0);
    translateY.setValue(0);
  };

  const handleCrop = async () => {
    if (!imageUri || !imageSize.width) return;
    setProcessing(true);

    try {
      // Get current values
      // @ts-ignore
      const currentX = translateX._value;
      // @ts-ignore
      const currentY = translateY._value;
      // @ts-ignore
      const currentScale = scale._value;
      
      console.log('Crop with:', currentX, currentY, currentScale);
      
      // Calculate the crop area
      const scaledImageWidth = imageSize.width * currentScale;
      const scaledImageHeight = imageSize.height * currentScale;
      
      // Position of image center on screen
      const imageCenterX = SCREEN_WIDTH / 2 + currentX;
      const imageCenterY = SCREEN_HEIGHT / 2 + currentY;
      
      // Position of crop frame center
      const frameCenterX = SCREEN_WIDTH / 2;
      const frameCenterY = SCREEN_HEIGHT / 2;
      
      // Offset from image center to frame center
      const offsetX = frameCenterX - imageCenterX;
      const offsetY = frameCenterY - imageCenterY;
      
      // Position of frame top-left relative to image top-left (in scaled coordinates)
      const frameLeftInImage = (scaledImageWidth / 2) + offsetX - (CROP_FRAME_WIDTH / 2);
      const frameTopInImage = (scaledImageHeight / 2) + offsetY - (CROP_FRAME_HEIGHT / 2);
      
      // Convert to original image coordinates
      const cropX = frameLeftInImage / currentScale;
      const cropY = frameTopInImage / currentScale;
      const cropWidth = CROP_FRAME_WIDTH / currentScale;
      const cropHeight = CROP_FRAME_HEIGHT / currentScale;
      
      // Ensure crop is within image bounds
      const finalX = Math.max(0, Math.min(imageSize.width - cropWidth, Math.floor(cropX)));
      const finalY = Math.max(0, Math.min(imageSize.height - cropHeight, Math.floor(cropY)));
      const finalWidth = Math.min(imageSize.width - finalX, Math.floor(cropWidth));
      const finalHeight = Math.min(imageSize.height - finalY, Math.floor(cropHeight));

      console.log('Crop params:', {
        originX: finalX,
        originY: finalY,
        width: finalWidth,
        height: finalHeight,
      });

      // Perform the crop
      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          {
            crop: {
              originX: finalX,
              originY: finalY,
              width: finalWidth,
              height: finalHeight,
            },
          },
          {
            resize: {
              width: 1920,
              height: 1080,
            },
          },
        ],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      setProcessing(false);
      onConfirm(result.uri);
    } catch (error) {
      console.error('Crop error:', error);
      setProcessing(false);
      Alert.alert('Crop Failed', error.message || 'Please try again');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onCancel}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} disabled={processing}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Crop to 16:9</Text>
          <TouchableOpacity onPress={handleReset} disabled={processing}>
            <Ionicons name="refresh" size={24} color="#FF6800" />
          </TouchableOpacity>
        </View>

        {/* Crop area */}
        <View style={styles.cropContainer}>
          <View style={styles.imageArea} {...panResponder.panHandlers}>
            <Animated.View
              style={{
                transform: [
                  { translateX: translateX },
                  { translateY: translateY },
                  { scale: scale },
                ],
              }}
            >
              <Image
                source={{ uri: imageUri }}
                style={{
                  width: imageSize.width,
                  height: imageSize.height,
                }}
                contentFit="contain"
              />
            </Animated.View>
          </View>

          {/* Overlay */}
          <View style={styles.overlay} pointerEvents="none">
            <View style={styles.overlayTop} />
            <View style={styles.overlayMiddle}>
              <View style={styles.overlaySide} />
              <View style={styles.cropFrameArea} />
              <View style={styles.overlaySide} />
            </View>
            <View style={styles.overlayBottom} />
          </View>

          {/* Crop frame */}
          <View style={styles.cropFrame} pointerEvents="none">
            <View style={styles.frameBorder} />
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
            <View style={[styles.gridLine, styles.gridV1]} />
            <View style={[styles.gridLine, styles.gridV2]} />
            <View style={[styles.gridLine, styles.gridH1]} />
            <View style={[styles.gridLine, styles.gridH2]} />
          </View>
        </View>

        <Text style={styles.instructions}>Drag to reposition • Pinch or use buttons to zoom</Text>

        {/* Zoom controls */}
        <View style={styles.controls}>
          <TouchableOpacity style={styles.zoomButton} onPress={handleZoomOut} disabled={processing}>
            <Ionicons name="remove" size={24} color="#fff" />
          </TouchableOpacity>
          
          <View style={styles.zoomIndicator}>
            <Ionicons name="scan-outline" size={20} color="#999" />
          </View>
          
          <TouchableOpacity style={styles.zoomButton} onPress={handleZoomIn} disabled={processing}>
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Confirm button */}
        <TouchableOpacity
          style={[styles.confirmButton, processing && styles.confirmButtonDisabled]}
          onPress={handleCrop}
          disabled={processing}
        >
          {processing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark" size={24} color="#fff" />
              <Text style={styles.confirmText}>Confirm Crop</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  cropContainer: {
    flex: 1,
    position: 'relative',
  },
  imageArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTop: {
    flex: 1,
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  overlayBottom: {
    flex: 1,
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  overlayMiddle: {
    flexDirection: 'row',
    width: '100%',
    height: CROP_FRAME_HEIGHT,
  },
  overlaySide: {
    width: 20,
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  cropFrameArea: {
    flex: 1,
    height: '100%',
  },
  cropFrame: {
    position: 'absolute',
    top: '50%',
    left: 20,
    width: CROP_FRAME_WIDTH,
    height: CROP_FRAME_HEIGHT,
    marginTop: -CROP_FRAME_HEIGHT / 2,
  },
  frameBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 2,
    borderColor: '#FF6800',
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#fff',
  },
  cornerTL: {
    top: -2,
    left: -2,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  cornerTR: {
    top: -2,
    right: -2,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  cornerBL: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  cornerBR: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  gridV1: {
    left: '33.33%',
    top: 0,
    bottom: 0,
    width: 1,
  },
  gridV2: {
    left: '66.66%',
    top: 0,
    bottom: 0,
    width: 1,
  },
  gridH1: {
    top: '33.33%',
    left: 0,
    right: 0,
    height: 1,
  },
  gridH2: {
    top: '66.66%',
    left: 0,
    right: 0,
    height: 1,
  },
  instructions: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginVertical: 16,
    paddingHorizontal: 20,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginBottom: 20,
    gap: 20,
  },
  zoomButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomIndicator: {
    flex: 1,
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: '#FF6800',
    marginHorizontal: 20,
    marginBottom: 40,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
});