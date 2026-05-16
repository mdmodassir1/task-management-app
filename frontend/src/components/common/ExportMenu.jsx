import { useState } from 'react';
import {
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  RadioGroup,
  FormControlLabel,
  Radio,
  Typography,
  Box,
  CircularProgress,
} from '@mui/material';
import {
  PictureAsPdf,
  TableChart,
  GridOn,
  Download,
  Close,
} from '@mui/icons-material';
import { exportToPDF, exportToExcel, exportToCSV, exportKanbanToPDF } from '../../services/exportService';
import toast from 'react-hot-toast';

const ExportMenu = ({ tasks, columns, projectName, isLoading = false }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [exportType, setExportType] = useState('pdf');
  const [exporting, setExporting] = useState(false);

  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleExportClick = (type) => {
    setExportType(type);
    setOpenDialog(true);
    handleClose();
  };

  const handleExport = async () => {
    if (!tasks || tasks.length === 0) {
      toast.error('No tasks to export');
      setOpenDialog(false);
      return;
    }

    setExporting(true);
    try {
      switch (exportType) {
        case 'pdf':
          exportToPDF(tasks, projectName);
          toast.success('PDF exported successfully!');
          break;
        case 'kanban':
          exportKanbanToPDF(columns, projectName);
          toast.success('Kanban board exported as PDF!');
          break;
        case 'excel':
          exportToExcel(tasks, projectName);
          toast.success('Excel file exported successfully!');
          break;
        case 'csv':
          exportToCSV(tasks, projectName);
          toast.success('CSV file exported successfully!');
          break;
        default:
          break;
      }
      setOpenDialog(false);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export: ' + error.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<Download />}
        onClick={handleOpen}
        disabled={isLoading || tasks.length === 0}
        size="small"
      >
        Export
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={() => handleExportClick('pdf')}>
          <ListItemIcon>
            <PictureAsPdf color="error" />
          </ListItemIcon>
          <ListItemText primary="Export as PDF" secondary="Task list report" />
        </MenuItem>
        
        <MenuItem onClick={() => handleExportClick('kanban')}>
          <ListItemIcon>
            <PictureAsPdf color="primary" />
          </ListItemIcon>
          <ListItemText primary="Export Kanban Board" secondary="Visual board layout" />
        </MenuItem>
        
        <MenuItem onClick={() => handleExportClick('excel')}>
          <ListItemIcon>
            <TableChart color="success" />
          </ListItemIcon>
          <ListItemText primary="Export as Excel" secondary="Spreadsheet format" />
        </MenuItem>
        
        <MenuItem onClick={() => handleExportClick('csv')}>
          <ListItemIcon>
            <GridOn color="warning" />
          </ListItemIcon>
          <ListItemText primary="Export as CSV" secondary="Comma separated values" />
        </MenuItem>
      </Menu>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Export Options</Typography>
            <Close sx={{ cursor: 'pointer' }} onClick={() => setOpenDialog(false)} />
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            You are about to export {tasks.length} task{tasks.length !== 1 ? 's' : ''}
          </Typography>
          
          <RadioGroup value={exportType} onChange={(e) => setExportType(e.target.value)}>
            <FormControlLabel 
              value="pdf" 
              control={<Radio />} 
              label={
                <Box>
                  <Typography variant="body1">PDF Document</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Detailed report with summary and task list
                  </Typography>
                </Box>
              }
            />
            <FormControlLabel 
              value="kanban" 
              control={<Radio />} 
              label={
                <Box>
                  <Typography variant="body1">Kanban Board PDF</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Visual board layout with all columns
                  </Typography>
                </Box>
              }
            />
            <FormControlLabel 
              value="excel" 
              control={<Radio />} 
              label={
                <Box>
                  <Typography variant="body1">Excel Spreadsheet</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Editable format with all task details
                  </Typography>
                </Box>
              }
            />
            <FormControlLabel 
              value="csv" 
              control={<Radio />} 
              label={
                <Box>
                  <Typography variant="body1">CSV File</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Compatible with Excel, Google Sheets, etc.
                  </Typography>
                </Box>
              }
            />
          </RadioGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleExport} 
            variant="contained" 
            disabled={exporting}
            startIcon={exporting ? <CircularProgress size={16} /> : <Download />}
          >
            {exporting ? 'Exporting...' : 'Export'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ExportMenu;