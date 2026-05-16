import { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Slider,
  Typography,
} from '@mui/material';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../../utils/cropImage';

const ImageCropModal = ({ open, imageFile, onClose, onSave }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [loading, setLoading] = useState(false);

  const onCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    
    setLoading(true);
    try {
      const croppedImage = await getCroppedImg(
        URL.createObjectURL(imageFile),
        croppedAreaPixels,
        rotation
      );
      onSave(croppedImage);
    } catch (error) {
      console.error('Crop error:', error);
    } finally {
      setLoading(false);
    }
  };

  const imageUrl = imageFile ? URL.createObjectURL(imageFile) : '';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h6">Crop Profile Photo</Typography>
        <Typography variant="caption" color="text.secondary">
          Drag and zoom to adjust your photo
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ position: 'relative', height: 400, mt: 2 }}>
          {imageUrl && (
            <Cropper
              image={imageUrl}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={1}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
              onCropComplete={onCropComplete}
              cropShape="round"
              showGrid={false}
            />
          )}
        </Box>
        
        <Box sx={{ mt: 3 }}>
          <Typography variant="body2" gutterBottom>
            Zoom: {Math.round(zoom * 100)}%
          </Typography>
          <Slider
            value={zoom}
            min={1}
            max={3}
            step={0.01}
            onChange={(e, val) => setZoom(val)}
            aria-labelledby="Zoom"
          />
        </Box>
        
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" gutterBottom>
            Rotate: {rotation}°
          </Typography>
          <Slider
            value={rotation}
            min={0}
            max={360}
            step={1}
            onChange={(e, val) => setRotation(val)}
            aria-labelledby="Rotation"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Upload Photo'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImageCropModal;