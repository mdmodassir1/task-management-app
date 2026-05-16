import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Box } from '@mui/material';
import TaskCard from './TaskCard.jsx';

const Column = ({ tasks, columnId }) => {
  const { setNodeRef } = useDroppable({
    id: columnId,
  });

  return (
    <SortableContext
      id={columnId}
      items={tasks.map(task => task.id)}
      strategy={verticalListSortingStrategy}
    >
      <Box ref={setNodeRef} sx={{ minHeight: 200 }}>
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
        {tasks.length === 0 && (
          <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
            No tasks
          </Box>
        )}
      </Box>
    </SortableContext>
  );
};

export default Column;