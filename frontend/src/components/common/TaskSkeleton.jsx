import { Skeleton, Card, CardContent, Box } from '@mui/material';

const TaskSkeleton = () => {
  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Skeleton variant="circular" width={24} height={24} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="80%" height={24} />
            <Skeleton variant="text" width="60%" height={20} />
            <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
              <Skeleton variant="rounded" width={50} height={24} />
            </Box>
          </Box>
          <Skeleton variant="rounded" width={70} height={32} />
        </Box>
      </CardContent>
    </Card>
  );
};

export default TaskSkeleton;