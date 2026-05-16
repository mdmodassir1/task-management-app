import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Container,
  Paper,
  Typography,
  Avatar,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  IconButton,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  Edit,
  Save,
  Cancel,
  PhotoCamera,
  Email,
  Person,
  Description,
} from '@mui/icons-material';
import { authService } from '../services/authService';
import ImageCropModal from '../components/common/ImageCropModal';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, login } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [cropOpen, setCropOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
  });
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await authService.updateProfile(formData);
      if (response.success) {
        toast.success('Profile updated successfully');
        setIsEditing(false);
        const userData = await authService.getMe();
        localStorage.setItem('user', JSON.stringify(userData.data));
        window.location.reload();
      }
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size should be less than 5MB');
      return;
    }
    
    if (!file.type.startsWith('image/')) {
      toast.error('Only images are allowed');
      return;
    }
    
    setSelectedFile(file);
    setCropOpen(true);
    event.target.value = '';
  };

  const handleCropSave = async (croppedFile) => {
    setCropOpen(false);
    setUploading(true);
    
    try {
      const response = await authService.uploadAvatar(croppedFile);
      if (response.success) {
        toast.success('Avatar updated successfully');
        const userData = await authService.getMe();
        localStorage.setItem('user', JSON.stringify(userData.data));
        window.location.reload();
      }
    } catch (error) {
      toast.error('Failed to upload avatar');
    } finally {
      setUploading(false);
      setSelectedFile(null);
    }
  };

  const avatarUrl = user?.avatar?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=1976d2&color=fff&size=128`;

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <Box sx={{ position: 'relative' }}>
            <Avatar
              src={avatarUrl}
              sx={{
                width: 120,
                height: 120,
                bgcolor: '#1976d2',
                fontSize: 48,
                mr: 3,
                cursor: 'pointer',
              }}
              onClick={() => fileInputRef.current?.click()}
            />
            {uploading && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  bgcolor: 'rgba(0,0,0,0.5)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CircularProgress sx={{ color: 'white' }} />
              </Box>
            )}
            <IconButton
              sx={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                bgcolor: 'white',
                '&:hover': { bgcolor: '#f5f5f5' },
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <PhotoCamera />
            </IconButton>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept="image/*"
              onChange={handleFileSelect}
            />
          </Box>
          <Box>
            <Typography variant="h4" gutterBottom>
              {user?.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {user?.role === 'admin' ? 'Administrator' : 'Team Member'}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Profile Information */}
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">
                Profile Information
              </Typography>
              {!isEditing ? (
                <Button
                  startIcon={<Edit />}
                  onClick={() => setIsEditing(true)}
                >
                  Edit Profile
                </Button>
              ) : (
                <Box>
                  <Button
                    startIcon={<Cancel />}
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        name: user?.name || '',
                        bio: user?.bio || '',
                      });
                    }}
                    sx={{ mr: 1 }}
                  >
                    Cancel
                  </Button>
                  <Button
                    startIcon={<Save />}
                    variant="contained"
                    onClick={handleSave}
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </Box>
              )}
            </Box>

            <Box sx={{ mt: 2 }}>
              {/* Name */}
              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 3 }}>
                <Person sx={{ mr: 2, color: '#1976d2', mt: 1 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Full Name
                  </Typography>
                  {isEditing ? (
                    <TextField
                      fullWidth
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      size="small"
                      sx={{ mt: 1 }}
                    />
                  ) : (
                    <Typography variant="body1" sx={{ mt: 1 }}>
                      {user?.name}
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* Email */}
              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 3 }}>
                <Email sx={{ mr: 2, color: '#1976d2', mt: 1 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Email Address
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 1 }}>
                    {user?.email}
                  </Typography>
                </Box>
              </Box>

              {/* Bio */}
              <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                <Description sx={{ mr: 2, color: '#1976d2', mt: 1 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Bio
                  </Typography>
                  {isEditing ? (
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      placeholder="Tell us about yourself..."
                      sx={{ mt: 1 }}
                    />
                  ) : (
                    <Typography variant="body1" sx={{ mt: 1 }}>
                      {user?.bio || 'No bio added yet'}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Account Stats */}
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Account Information
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Member since
              </Typography>
              <Typography variant="body1">
                {new Date(user?.createdAt).toLocaleDateString()}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Paper>

      {/* Crop Modal */}
      <ImageCropModal
        open={cropOpen}
        imageFile={selectedFile}
        onClose={() => {
          setCropOpen(false);
          setSelectedFile(null);
        }}
        onSave={handleCropSave}
      />
    </Container>
  );
};

export default Profile;