'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Camera, Upload, X, Trash2, AlertCircle, Check } from 'lucide-react';
import toast from 'react-hot-toast';

interface MultiImageUploadFieldProps {
  onImagesSelect: (images: string[]) => void;
  currentImages?: string[] | null;
  disabled?: boolean;
}

export const MultiImageUploadField: React.FC<MultiImageUploadFieldProps> = ({
  onImagesSelect,
  currentImages = [],
  disabled = false,
}) => {
  const [images, setImages] = useState<string[]>(currentImages || []);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_IMAGES = 5;
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  // Sync with parent's currentImages prop
  useEffect(() => {
    setImages(currentImages || []);
  }, [currentImages]);

  const validateImage = (file: File): boolean => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Image size must be less than 5MB');
      return false;
    }
    if (images.length >= MAX_IMAGES) {
      toast.error(`Maximum ${MAX_IMAGES} images allowed`);
      return false;
    }
    return true;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsLoading(true);
    try {
      const validFiles: File[] = [];
      
      // Validate all files first
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} is not an image file`);
          continue;
        }
        if (file.size > MAX_FILE_SIZE) {
          toast.error(`${file.name} exceeds 5MB limit`);
          continue;
        }
        if (images.length + validFiles.length >= MAX_IMAGES) {
          toast.error(`Maximum ${MAX_IMAGES} images allowed`);
          break;
        }
        validFiles.push(file);
      }

      if (validFiles.length === 0) {
        setIsLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      // Process all valid files
      const newImagesPromises = validFiles.map((file) => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            resolve(event.target?.result as string);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });

      const newImageUrls = await Promise.all(newImagesPromises);
      const updatedImages = [...images, ...newImageUrls];
      setImages(updatedImages);
      onImagesSelect(updatedImages);
      toast.success(`${validFiles.length} image(s) added successfully`);
    } catch (error) {
      toast.error('Failed to process images');
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const startCamera = async () => {
    if (images.length >= MAX_IMAGES) {
      toast.error(`Maximum ${MAX_IMAGES} images allowed`);
      return;
    }

    setIsLoading(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsCapturing(true);
        toast.success('Camera started');
      }
    } catch (error: any) {
      console.error('Camera error:', error);
      if (error.name === 'NotAllowedError') {
        toast.error('Camera permission denied. Please allow camera access.');
      } else if (error.name === 'NotFoundError') {
        toast.error('No camera found on this device.');
      } else {
        toast.error('Failed to access camera. Please check permissions.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) {
      toast.error('Camera not ready');
      return;
    }
    
    if (images.length >= MAX_IMAGES) {
      toast.error(`Maximum ${MAX_IMAGES} images allowed`);
      return;
    }

    // Check if video is playing and has dimensions
    if (videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) {
      toast.error('Camera is still loading, please wait...');
      return;
    }

    const context = canvasRef.current.getContext('2d');
    if (!context) {
      toast.error('Failed to capture image');
      return;
    }

    // Set canvas dimensions to match video
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    
    // Draw the current video frame to canvas
    context.drawImage(videoRef.current, 0, 0);

    // Convert canvas to base64 image
    const base64 = canvasRef.current.toDataURL('image/jpeg', 0.8);
    
    // Store captured image for preview
    setCapturedImage(base64);
    toast.success('Photo captured! Review and confirm to add.');
  };

  const confirmCapture = () => {
    if (!capturedImage) return;
    
    // Add to images array
    const newImages = [...images, capturedImage];
    setImages(newImages);
    onImagesSelect(newImages);
    
    toast.success('Photo added successfully');
    setCapturedImage(null);
    stopCamera();
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    toast.success('Ready to capture again');
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
    }
    setIsCapturing(false);
    setCapturedImage(null);
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    onImagesSelect(newImages);
    toast.success('Image removed');
  };

  const canAddMore = images.length < MAX_IMAGES;

  return (
    <div className="w-full space-y-4">
      {/* Header with counter */}
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Product Images
          <span className="text-red-500">*</span>
          <span className="ml-2 text-xs text-slate-500">
            ({images.length}/{MAX_IMAGES})
          </span>
        </label>
      </div>

      {/* Image Grid Preview */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-4">
          {images.map((image, index) => (
            <div
              key={index}
              className="relative aspect-square rounded-lg overflow-hidden border-2 border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-700"
            >
              <img
                src={image}
                alt={`Product ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors shadow-lg"
                type="button"
              >
                <Trash2 size={14} />
              </button>
              <div className="absolute bottom-1 left-1 bg-slate-900 bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Area */}
      {canAddMore && !isCapturing && (
        <div className="space-y-3">
          {/* Upload Buttons */}
          <div className="flex gap-3 flex-wrap">
            <label
              className="flex-1 min-w-40 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-medium transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
            >
              <Upload size={20} />
              Upload Images
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                disabled={disabled || isLoading}
                className="hidden"
              />
            </label>
            <button
              onClick={startCamera}
              disabled={disabled || isLoading}
              className="flex-1 min-w-40 px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
              type="button"
            >
              <Camera size={20} />
              Capture Photo
            </button>
          </div>

          {/* Info Message */}
          <div className="flex gap-2 text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <span>
              You can upload up to {MAX_IMAGES} images. Maximum file size: 5MB per image.
            </span>
          </div>
        </div>
      )}

      {/* Camera Modal Popup */}
      {isCapturing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
          <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
              <div className="flex items-center gap-3">
                <Camera className="h-6 w-6 text-white" />
                <h3 className="text-xl font-semibold text-white">
                  {capturedImage ? 'Review Photo' : 'Capture Photo'}
                </h3>
              </div>
              <button
                onClick={stopCamera}
                className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                type="button"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {capturedImage ? (
                // Preview captured image
                <div className="space-y-4">
                  <div className="relative bg-black rounded-lg overflow-hidden">
                    <img
                      src={capturedImage}
                      alt="Captured"
                      className="w-full max-h-96 object-contain"
                    />
                  </div>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={retakePhoto}
                      className="px-6 py-3 bg-slate-500 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2 shadow-md"
                      type="button"
                    >
                      <Camera size={20} />
                      Retake Photo
                    </button>
                    <button
                      onClick={confirmCapture}
                      className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2 shadow-md"
                      type="button"
                    >
                      <Check size={20} />
                      Confirm & Upload
                    </button>
                  </div>
                </div>
              ) : (
                // Live camera preview
                <div className="space-y-4">
                  <div className="relative bg-black rounded-lg overflow-hidden">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full max-h-96 object-contain"
                      onLoadedMetadata={() => {
                        console.log('Video loaded:', videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight);
                      }}
                    />
                    <div className="absolute top-4 left-4 bg-red-500 text-white text-sm px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      LIVE
                    </div>
                  </div>
                  <canvas ref={canvasRef} className="hidden" />
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={stopCamera}
                      disabled={disabled}
                      className="px-6 py-3 bg-slate-500 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2 shadow-md"
                      type="button"
                    >
                      <X size={20} />
                      Cancel
                    </button>
                    <button
                      onClick={capturePhoto}
                      disabled={disabled || isLoading}
                      className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center gap-2 shadow-md text-lg"
                      type="button"
                    >
                      <Camera size={24} />
                      Capture Photo
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Max Images Reached Message */}
      {!canAddMore && (
        <div className="flex gap-2 text-sm text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <span>Maximum {MAX_IMAGES} images reached. Remove an image to add more.</span>
        </div>
      )}
    </div>
  );
};
