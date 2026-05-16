import { useState } from 'react';

const useDragDrop = () => {
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverItem, setDragOverItem] = useState(null);

  const handleDragStart = (item) => {
    setDraggedItem(item);
  };

  const handleDragOver = (item) => {
    setDragOverItem(item);
  };

  const handleDrop = () => {
    if (draggedItem && dragOverItem) {
      // Handle drop logic
      console.log('Dropped:', draggedItem, 'onto:', dragOverItem);
    }
    setDraggedItem(null);
    setDragOverItem(null);
  };

  return {
    draggedItem,
    dragOverItem,
    handleDragStart,
    handleDragOver,
    handleDrop,
  };
};

export default useDragDrop;