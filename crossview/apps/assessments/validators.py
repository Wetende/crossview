"""
Grading configuration validators.
"""
from typing import Dict, Any, List
from apps.assessments.exceptions import InvalidGradingConfigException


class GradingConfigValidator:
    """
    Validates grading configuration from blueprints.
    Ensures required fields are present for each grading type.
    """

    def validate(self, grading_logic: Dict[str, Any]) -> bool:
        """
        Validate grading logic configuration.
        
        Args:
            grading_logic: The grading_logic dict from a blueprint
            
        Returns:
            True if valid
            
        Raises:
            InvalidGradingConfigException: If validation fails
        """
        if not grading_logic:
            raise InvalidGradingConfigException("grading_logic cannot be empty")
        
        grading_type = grading_logic.get('type')
        if not grading_type:
            raise InvalidGradingConfigException("grading_logic must have a 'type' field")
        
        if grading_type == 'weighted':
            return self._validate_weighted(grading_logic)
        elif grading_type == 'competency':
            return self._validate_competency(grading_logic)
        elif grading_type == 'pass_fail':
            return self._validate_pass_fail(grading_logic)
        else:
            raise InvalidGradingConfigException(f"Unknown grading type: {grading_type}")

    def _validate_weighted(self, config: Dict[str, Any]) -> bool:
        """
        Validate weighted grading config.
        
        Required:
        - components: list of {name, weight} objects
        - weights must sum to 1.0 (with tolerance)
        """
        components = config.get('components')
        
        if components is None:
            raise InvalidGradingConfigException(
                "Weighted grading requires 'components' field"
            )
        
        if not isinstance(components, list):
            raise InvalidGradingConfigException(
                "'components' must be a list"
            )
        
        if len(components) == 0:
            raise InvalidGradingConfigException(
                "'components' list cannot be empty"
            )
        

        
        total_weight = 0.0
        for i, comp in enumerate(components):
            if not isinstance(comp, dict):
                raise InvalidGradingConfigException(
                    f"Component {i} must be a dictionary"
                )
            
            if 'name' not in comp:
                raise InvalidGradingConfigException(
                    f"Component {i} missing 'name' field"
                )
            
            if 'weight' not in comp:
                raise InvalidGradingConfigException(
                    f"Component {i} missing 'weight' field"
                )
            
            weight = comp['weight']
            if not isinstance(weight, (int, float)):
                raise InvalidGradingConfigException(
                    f"Component {i} weight must be a number"
                )
            
            if weight < 0 or weight > 1:
                raise InvalidGradingConfigException(
                    f"Component {i} weight must be between 0 and 1"
                )
            
            total_weight += weight
        
        # Check weights sum to 1.0 (with tolerance for floating point)
        if abs(total_weight - 1.0) > 0.001:
            raise InvalidGradingConfigException(
                f"Component weights must sum to 1.0, got {total_weight}"
            )
        
        return True

    def _validate_competency(self, config: Dict[str, Any]) -> bool:
        """
        Validate competency grading config.
        
        Optional:
        - required_evidences: list of evidence names
        - competency_labels: {pass, fail} labels
        """
        # Competency config is more flexible - just validate structure if present
        required_evidences = config.get('required_evidences')
        if required_evidences is not None:
            if not isinstance(required_evidences, list):
                raise InvalidGradingConfigException(
                    "'required_evidences' must be a list"
                )
        
        competency_labels = config.get('competency_labels')
        if competency_labels is not None:
            if not isinstance(competency_labels, dict):
                raise InvalidGradingConfigException(
                    "'competency_labels' must be a dictionary"
                )
            
            if 'pass' not in competency_labels or 'fail' not in competency_labels:
                raise InvalidGradingConfigException(
                    "'competency_labels' must have 'pass' and 'fail' keys"
                )
        
        return True

    def _validate_pass_fail(self, config: Dict[str, Any]) -> bool:
        """
        Validate pass/fail grading config.
        
        Required:
        - threshold OR pass_mark: the passing score
        """
        threshold = config.get('threshold', config.get('pass_mark'))
        
        if threshold is None:
            raise InvalidGradingConfigException(
                "Pass/fail grading requires 'threshold' or 'pass_mark' field"
            )
        
        if not isinstance(threshold, (int, float)):
            raise InvalidGradingConfigException(
                "'threshold' must be a number"
            )
        
        return True
