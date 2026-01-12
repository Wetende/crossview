import { Box, Typography, TextField } from '@mui/material';
import { useState, useEffect } from 'react';

export default function FillBlankQuestion({ question, onChange, value = {} }) {
  // value: { "0": "Paris", "1": "Blue" } where keys are gap indices (stringified)
  
  const [inputs, setInputs] = useState(value || {});

  const handleInputChange = (index, text) => {
      const newInputs = { ...inputs, [index]: text };
      setInputs(newInputs);
      onChange(newInputs);
  };

  // Parse text to replace {{blank}} with input fields
  const renderContent = () => {
     const parts = question.text.split('{{blank}}');
     return (
         <Box sx={{ lineHeight: 3 }}>
             {parts.map((part, idx) => (
                 <span key={idx}>
                     <Typography component="span" variant="body1">{part}</Typography>
                     {idx < parts.length - 1 && (
                         <TextField 
                            variant="standard" 
                            size="small"
                            sx={{ width: 120, mx: 1, display: 'inline-block' }}
                            value={inputs[idx] || ''}
                            onChange={(e) => handleInputChange(idx, e.target.value)}
                         />
                     )}
                 </span>
             ))}
         </Box>
     );
  };

  return (
    <Box>
      <Typography fontWeight="medium" gutterBottom sx={{ mb: 2 }}>Fill in the blanks:</Typography>
      {renderContent()}
    </Box>
  );
}
