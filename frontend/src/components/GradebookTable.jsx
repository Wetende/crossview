/**
 * GradebookTable Component
 * Adaptive gradebook that renders differently based on grading mode
 * Requirements: FR-4.1, FR-4.2, FR-4.3
 */

import { useState, useCallback } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Checkbox,
  FormControlLabel,
  Chip,
  Typography,
  Stack,
  Rating,
} from '@mui/material';

const statusColors = {
  Pass: 'success',
  Fail: 'error',
  Competent: 'success',
  'Not Yet Competent': 'warning',
};

/**
 * Summative Mode - CAT, Exam, Total with weighted calculation
 */
function SummativeGradebook({ students, components, passMark, onChange }) {
  const handleScoreChange = (enrollmentId, componentKey, value) => {
    const numValue = parseFloat(value) || 0;
    onChange(enrollmentId, componentKey, Math.min(100, Math.max(0, numValue)));
  };

  const calculateTotal = (grades) => {
    if (!grades?.components) return 0;
    let total = 0;
    components.forEach(comp => {
      const score = parseFloat(grades.components[comp.key] || 0);
      const weight = comp.weight || 0;
      total += score * weight;
    });
    return Math.round(total * 100) / 100;
  };

  const getStatus = (total) => {
    return total >= passMark ? 'Pass' : 'Fail';
  };

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Student</TableCell>
            {components.map(comp => (
              <TableCell key={comp.key} align="center">
                {comp.label || comp.key}
                <Typography variant="caption" display="block" color="text.secondary">
                  ({(comp.weight * 100).toFixed(0)}%)
                </Typography>
              </TableCell>
            ))}
            <TableCell align="center">Total</TableCell>
            <TableCell align="center">Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {students.map((student) => {
            const total = calculateTotal(student.grades);
            const status = getStatus(total);
            
            return (
              <TableRow key={student.enrollmentId}>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {student.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {student.email}
                  </Typography>
                </TableCell>
                {components.map(comp => (
                  <TableCell key={comp.key} align="center">
                    <TextField
                      type="number"
                      size="small"
                      value={student.grades?.components?.[comp.key] || ''}
                      onChange={(e) => handleScoreChange(student.enrollmentId, comp.key, e.target.value)}
                      inputProps={{ min: 0, max: 100, step: 0.5 }}
                      sx={{ width: 80 }}
                    />
                  </TableCell>
                ))}
                <TableCell align="center">
                  <Typography variant="body2" fontWeight="bold">
                    {total}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Chip 
                    label={status} 
                    size="small" 
                    color={statusColors[status]}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

/**
 * CBET Mode - Competent/Not Yet Competent checkboxes
 */
function CBETGradebook({ students, components, onChange }) {
  const handleCompetencyChange = (enrollmentId, componentKey, isCompetent) => {
    onChange(enrollmentId, componentKey, isCompetent ? 'Competent' : 'Not Yet Competent');
  };

  const getOverallStatus = (grades) => {
    if (!grades?.components) return 'Not Yet Competent';
    const values = Object.values(grades.components);
    if (values.length === 0) return 'Not Yet Competent';
    return values.every(v => v === 'Competent') ? 'Competent' : 'Not Yet Competent';
  };

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Student</TableCell>
            {components.map(comp => (
              <TableCell key={comp.key || comp} align="center">
                {comp.label || comp.key || comp}
              </TableCell>
            ))}
            <TableCell align="center">Overall Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {students.map((student) => {
            const overallStatus = getOverallStatus(student.grades);
            
            return (
              <TableRow key={student.enrollmentId}>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {student.name}
                  </Typography>
                </TableCell>
                {components.map(comp => {
                  const key = comp.key || comp;
                  const isCompetent = student.grades?.components?.[key] === 'Competent';
                  
                  return (
                    <TableCell key={key} align="center">
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={isCompetent}
                            onChange={(e) => handleCompetencyChange(student.enrollmentId, key, e.target.checked)}
                            color="success"
                          />
                        }
                        label={isCompetent ? 'C' : 'NYC'}
                      />
                    </TableCell>
                  );
                })}
                <TableCell align="center">
                  <Chip 
                    label={overallStatus} 
                    size="small" 
                    color={statusColors[overallStatus]}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

/**
 * Rubric Mode - 4-point scale (CBC style)
 */
function RubricGradebook({ students, levels, competencies, onChange }) {
  const handleLevelChange = (enrollmentId, competency, level) => {
    onChange(enrollmentId, competency, level);
  };

  const getAverageLevel = (grades) => {
    if (!grades?.components) return 0;
    const values = Object.values(grades.components).filter(v => v > 0);
    if (values.length === 0) return 0;
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length * 10) / 10;
  };

  const getLevelLabel = (level) => {
    const levelObj = levels?.find(l => l.score === level);
    return levelObj?.label || `Level ${level}`;
  };

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Student</TableCell>
            {(competencies || []).map(comp => (
              <TableCell key={comp} align="center">
                {comp}
              </TableCell>
            ))}
            <TableCell align="center">Average</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {students.map((student) => {
            const avgLevel = getAverageLevel(student.grades);
            
            return (
              <TableRow key={student.enrollmentId}>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {student.name}
                  </Typography>
                </TableCell>
                {(competencies || []).map(comp => {
                  const currentLevel = student.grades?.components?.[comp] || 0;
                  
                  return (
                    <TableCell key={comp} align="center">
                      <Rating
                        value={currentLevel}
                        max={4}
                        onChange={(e, newValue) => handleLevelChange(student.enrollmentId, comp, newValue)}
                      />
                      <Typography variant="caption" display="block">
                        {currentLevel > 0 ? getLevelLabel(currentLevel) : '-'}
                      </Typography>
                    </TableCell>
                  );
                })}
                <TableCell align="center">
                  <Typography variant="body2" fontWeight="bold">
                    {avgLevel > 0 ? avgLevel.toFixed(1) : '-'}
                  </Typography>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

/**
 * Main GradebookTable Component
 */
export default function GradebookTable({ 
  gradingConfig, 
  students, 
  onGradeChange,
}) {
  const [localStudents, setLocalStudents] = useState(students);

  const handleChange = useCallback((enrollmentId, componentKey, value) => {
    setLocalStudents(prev => prev.map(student => {
      if (student.enrollmentId === enrollmentId) {
        return {
          ...student,
          grades: {
            ...student.grades,
            components: {
              ...(student.grades?.components || {}),
              [componentKey]: value,
            },
          },
        };
      }
      return student;
    }));
    
    if (onGradeChange) {
      onGradeChange(enrollmentId, componentKey, value);
    }
  }, [onGradeChange]);

  const mode = gradingConfig?.mode || 'summative';
  const components = gradingConfig?.components || [];
  const passMark = gradingConfig?.pass_mark || 40;
  const levels = gradingConfig?.levels || [];
  const competencies = gradingConfig?.competencies_tracking || [];

  if (mode === 'cbet') {
    return (
      <CBETGradebook
        students={localStudents}
        components={components}
        onChange={handleChange}
      />
    );
  }

  if (mode === 'rubric') {
    return (
      <RubricGradebook
        students={localStudents}
        levels={levels}
        competencies={competencies}
        onChange={handleChange}
      />
    );
  }

  // Default: summative mode
  return (
    <SummativeGradebook
      students={localStudents}
      components={components}
      passMark={passMark}
      onChange={handleChange}
    />
  );
}

// Export individual modes for direct use
GradebookTable.Summative = SummativeGradebook;
GradebookTable.CBET = CBETGradebook;
GradebookTable.Rubric = RubricGradebook;
