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
const CROP_ASPECT_RATIO = 16 / 9;

// Calculate crop frame dimensions (16:9)
const CROP_FRAME_WIDTH = SCREEN_WIDTH - 40;
const CROP_FRAME_HEIGHT = CROP_FRAME_WIDTH / CROP_ASPECT_RATIO;

export default function ImageCropModal({ visible, imageUri, onConfirm, onCancel }) {
  const [processing, setProcessing] = useState(false);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  
  // Use simple state instead of Animated values
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [zoomScale, setZoomScale] = useState(1);
  
  // Track gesture state
  const gestureState = useRef({ x: 0, y: 0 });
  const initialScale = useRef(1);

  // Get image dimensions
  useEffect(() => {
    if (visible && imageUri) {
      const RNImage = require('react-native').Image;
      
      RNImage.getSize(
        imageUri,
        (width, height) => {
          setImageSize({ width, height });
          
          // Calculate scale to fit image in crop frame
          const scaleX = CROP_FRAME_WIDTH / width;
          const scaleY = CROP_FRAME_HEIGHT / height;
          const fitScale = Math.max(scaleX, scaleY);
          
          initialScale.current = fitScale;
          setZoomScale(fitScale);
          setPanX(0);
          setPanY(0);
          gestureState.current = { x: 0, y: 0 };
        },
        (error) => {
          console.error('Failed to get image size:', error);
          setImageSize({ width: 1920, height: 1080 });
        }
      );
    }
  }, [visible, imageUri]);

  // Calculate bounds for panning
  const getBounds = (scale) => {
    const scaledWidth = imageSize.width * scale;
    const scaledHeight = imageSize.height * scale;
    
    const maxX = Math.max(0, (scaledWidth - CROP_FRAME_WIDTH) / 2);
    const maxY = Math.max(0, (scaledHeight - CROP_FRAME_HEIGHT) / 2);
    
    return { maxX, maxY };
  };

  // Pan responder
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        // Store starting position
        gestureState.current = { x: panX, y: panY };
      },
      onPanResponderMove: (_, gesture) => {
        // Update position directly (no animation)
        const newX = gestureState.current.x + gesture.dx;
        const newY = gestureState.current.y + gesture.dy;
        
        // Apply bounds
        const bounds = getBounds(zoomScale);
        const clampedX = Math.max(-bounds.maxX, Math.min(bounds.maxX, newX));
        const clampedY = Math.max(-bounds.maxY, Math.min(bounds.maxY, newY));
        
        setPanX(clampedX);
        setPanY(clampedY);
      },
      onPanResponderRelease: () => {
        // Position is already set, nothing more to do
      },
    })
  ).current;

  const handleZoomIn = () => {
    const newScale = Math.min(zoomScale * 1.3, 5);
    setZoomScale(newScale);
    
    // Adjust pan to stay in bounds
    const bounds = getBounds(newScale);
    setPanX(Math.max(-bounds.maxX, Math.min(bounds.maxX, panX)));
    setPanY(Math.max(-bounds.maxY, Math.min(bounds.maxY, panY)));
  };

  const handleZoomOut = () => {
    const newScale = Math.max(zoomScale * 0.7, initialScale.current);
    setZoomScale(newScale);
    
    // Adjust pan to stay in bounds
    const bounds = getBounds(newScale);
    setPanX(Math.max(-bounds.maxX, Math.min(bounds.maxX, panX)));
    setPanY(Math.max(-bounds.maxY, Math.min(bounds.maxY, panY)));
  };

  const handleReset = () => {
    setZoomScale(initialScale.current);
    setPanX(0);
    setPanY(0);
    gestureState.current = { x: 0, y: 0 };
  };

  const handleCrop = async () => {
    if (!imageUri || !imageSize.width) return;

    setProcessing(true);

    try {
      // Screen positions
      const screenCenterX = SCREEN_WIDTH / 2;
      const screenCenterY = SCREEN_HEIGHT / 2;
      
      // Image center on screen (including pan)
      const imageCenterX = screenCenterX + panX;
      const imageCenterY = screenCenterY + panY;
      
      // Crop frame position
      const frameLeft = screenCenterX - (CROP_FRAME_WIDTH / 2);
      const frameTop = screenCenterY - (CROP_FRAME_HEIGHT / 2);
      
      // Offset from image center to frame top-left
      const offsetX = frameLeft - imageCenterX;
      const offsetY = frameTop - imageCenterY;
      
      // Convert to image coordinates
      const imageHalfWidth = (imageSize.width * zoomScale) / 2;
      const imageHalfHeight = (imageSize.height * zoomScale) / 2;
      
      // Calculate crop origin in scaled image space
      const scaledOriginX = imageHalfWidth + offsetX;
      const scaledOriginY = imageHalfHeight + offsetY;
      
      // Convert to original image coordinates (remove scale)
      const originX = scaledOriginX / zoomScale;
      const originY = scaledOriginY / zoomScale;
      const cropWidth = CROP_FRAME_WIDTH / zoomScale;
      const cropHeight = CROP_FRAME_HEIGHT / zoomScale;
      
      // Ensure crop is within bounds
      const finalOriginX = Math.max(0, Math.min(imageSize.width - cropWidth, Math.floor(originX)));
      const finalOriginY = Math.max(0, Math.min(imageSize.height - cropHeight, Math.floor(originY)));
      const finalWidth = Math.min(imageSize.width - finalOriginX, Math.floor(cropWidth));
      const finalHeight = Math.min(imageSize.height - finalOriginY, Math.floor(cropHeight));

      console.log('Crop calculation:', {
        pan: { x: panX, y: panY },
        scale: zoomScale,
        crop: {
          originX: finalOriginX,
          originY: finalOriginY,
          width: finalWidth,
          height: finalHeight,
        },
        imageSize,
      });

      // Validate
      if (finalOriginX < 0 || finalOriginY < 0 || 
          finalOriginX + finalWidth > imageSize.width ||
          finalOriginY + finalHeight > imageSize.height) {
        throw new Error('Crop rectangle is outside image bounds');
      }

      // Perform crop
      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          {
            crop: {
              originX: finalOriginX,
              originY: finalOriginY,
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
      console.error('Image crop error:', error);
      setProcessing(false);
      Alert.alert('Crop Failed', error.message || 'Please try again.');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onCancel}
    >
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

        {/* Crop Area */}
        <View style={styles.cropArea}>
          <View
            style={[
              styles.imageContainer,
              {
                transform: [
                  { translateX: panX },
                  { translateY: panY },
                  { scale: zoomScale },
                ],
              },
            ]}
            {...panResponder.panHandlers}
          >
            <Image
              source={{ uri: imageUri }}
              style={{
                width: imageSize.width,
                height: imageSize.height,
              }}
              contentFit="contain"
            />
          </View>

          {/* Dark overlay with transparent crop frame */}
          <View style={styles.overlay} pointerEvents="none">
            {/* Top overlay */}
            <View style={styles.overlaySection} />
            
            {/* Middle row */}
            <View style={styles.overlayMiddle}>
              <View style={styles.overlaySection} />
              
              {/* Crop frame (transparent) */}
              <View style={styles.cropFrame}>
                {/* Frame border */}
                <View style={styles.frameBorder} />
                
                {/* Corners */}
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
                
                {/* Grid lines */}
                <View style={[styles.gridLine, { left: '33.33%' }]} />
                <View style={[styles.gridLine, { left: '66.66%' }]} />
                <View style={[styles.gridLineH, { top: '33.33%' }]} />
                <View style={[styles.gridLineH, { top: '66.66%' }]} />
              </View>
              
              <View style={styles.overlaySection} />
            </View>
            
            {/* Bottom overlay */}
            <View style={styles.overlaySection} />
          </View>
        </View>

        {/* Instructions */}
        <Text style={styles.instructions}>
          Drag to position • Tap buttons to zoom
        </Text>

        {/* Zoom Controls */}
        <View style={styles.controls}>
          <TouchableOpacity style={styles.zoomBtn} onPress={handleZoomOut} disabled={processing}>
            <Ionicons name="remove" size={24} color="#fff" />
          </TouchableOpacity>
          
          <View style={styles.zoomIndicator}>
            <Ionicons name="scan-outline" size={20} color="#999" />
          </View>
          
          <TouchableOpacity style={styles.zoomBtn} onPress={handleZoomIn} disabled={processing}>
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Confirm Button */}
        <TouchableOpacity
          style={[styles.confirmBtn, processing && styles.confirmBtnDisabled]}
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
    paddingBottom: 15,
    backgroundColor: '#0a0a0a',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  cropArea: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  imageContainer: {
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
  overlaySection: {
    flex: 1,
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  overlayMiddle: {
    flexDirection: 'row',
    height: CROP_FRAME_HEIGHT,
  },
  cropFrame: {
    width: CROP_FRAME_WIDTH,
    height: CROP_FRAME_HEIGHT,
    position: 'relative',
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
  topLeft: {
    top: -2,
    left: -2,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  topRight: {
    top: -2,
    right: -2,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  gridLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  gridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  instructions: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginVertical: 15,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginBottom: 20,
    gap: 20,
  },
  zoomBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomIndicator: {
    flex: 1,
    alignItems: 'center',
  },
  confirmBtn: {
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
  confirmBtnDisabled: {
    opacity: 0.6,
  },
  confirmText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
});