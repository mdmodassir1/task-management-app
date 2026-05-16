import { Box, Button, Typography, Pagination as MuiPagination, useMediaQuery, useTheme } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';

const Pagination = ({ page, totalPages, onPageChange, totalItems, limit }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (totalPages <= 1) return null;

  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      mt: 3,
      pt: 2,
      borderTop: '1px solid #e0e0e0',
      flexDirection: { xs: 'column', sm: 'row' },
      gap: { xs: 2, sm: 0 }
    }}>
      <Typography variant="body2" color="text.secondary">
        Showing {((page - 1) * limit) + 1} - {Math.min(page * limit, totalItems)} of {totalItems} tasks
      </Typography>
      
      {!isMobile ? (
        <MuiPagination
          count={totalPages}
          page={page}
          onChange={(e, value) => onPageChange(value)}
          color="primary"
          size="medium"
          showFirstButton
          showLastButton
        />
      ) : (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            disabled={page === 1}
            onClick={() => onPageChange(page - 1)}
            startIcon={<ChevronLeft />}
          >
            Previous
          </Button>
          <Typography variant="body2" sx={{ alignSelf: 'center', px: 2 }}>
            Page {page} of {totalPages}
          </Typography>
          <Button
            variant="outlined"
            size="small"
            disabled={page === totalPages}
            onClick={() => onPageChange(page + 1)}
            endIcon={<ChevronRight />}
          >
            Next
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default Pagination;