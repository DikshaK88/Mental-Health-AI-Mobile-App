import os
import logging
import joblib
import pandas as pd
from typing import Dict, Any, Tuple
from backend.app.core.config import settings
from backend.app.schemas.assessment import AssessmentCreate

logger = logging.getLogger("prediction_service")

class PredictionService:
    def __init__(self):
        self.model = None
        self.model_version = settings.MODEL_VERSION
        self.model_type = "Random Forest"
        self._load_model()

    def _load_model(self):
        model_path = os.path.join(settings.MODEL_DIR, "best_model.joblib")
        if not os.path.exists(model_path):
            logger.warning(f"Trained model not found at {model_path}. Training now...")
            from backend.app.ml.train_model import train_and_evaluate
            results = train_and_evaluate(save_artifacts=True)
            self.model_type = results.get("best_model_name", "Random Forest")

        try:
            self.model = joblib.load(model_path)
            logger.info(f"Loaded prediction model from: {model_path}")
            
            # Check model type from evaluation report
            eval_path = os.path.join(settings.MODEL_DIR, "evaluation_report.json")
            if os.path.exists(eval_path):
                import json
                with open(eval_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self.model_type = data.get("best_model_name", "Random Forest")
                    self.model_version = data.get("model_version", settings.MODEL_VERSION)
        except Exception as e:
            logger.error(f"Error loading model from {model_path}: {e}")
            self.model = None

    def predict(self, assessment: AssessmentCreate) -> Dict[str, Any]:
        """
        Runs machine learning inference on assessment data.
        Returns prediction code, label, calibrated probability, risk level,
        and lifestyle factor contributions.
        """
        if self.model is None:
            self._load_model()
            if self.model is None:
                raise RuntimeError("Machine learning model is currently unavailable.")

        # Create single-row DataFrame matching training feature schema
        input_data = pd.DataFrame([{
            "age": assessment.age,
            "academic_pressure": assessment.academic_pressure,
            "study_satisfaction": assessment.study_satisfaction,
            "study_hours": assessment.study_hours,
            "financial_stress": assessment.financial_stress,
            "attendance": assessment.attendance,
            "gender": assessment.gender,
            "sleep_duration": assessment.sleep_duration,
            "social_support": assessment.social_support,
            "family_history": assessment.family_history
        }])

        try:
            raw_pred = int(self.model.predict(input_data)[0])
            prob_array = self.model.predict_proba(input_data)[0]
            # Class 1 is depression risk
            risk_prob = float(prob_array[1]) if len(prob_array) > 1 else float(raw_pred)
        except Exception as ex:
            logger.error(f"Prediction inference failure: {ex}")
            raise RuntimeError(f"Model prediction failed: {str(ex)}")

        # Transparent documented mapping:
        # Binary target is Depression (0 or 1)
        # Probability thresholding for risk screening support:
        # < 0.35: Low Risk
        # 0.35 - 0.65: Moderate Risk
        # >= 0.65: High Risk
        if risk_prob < 0.35:
            risk_level = "Low"
            prediction_label = "No Depression Detected"
        elif risk_prob < 0.65:
            risk_level = "Moderate"
            prediction_label = "Moderate Risk / Monitoring Advised"
        else:
            risk_level = "High"
            prediction_label = "Depression Risk Detected"

        # Lifestyle factor evaluation for educational feedback
        contributing_factors = []
        if assessment.sleep_duration in ["Less than 5 hours", "5-6 hours"]:
            contributing_factors.append({
                "factor": "Sleep Deficiency",
                "impact": "High Negative Impact",
                "detail": f"Reported sleep duration of '{assessment.sleep_duration}' is associated with cognitive fatigue and elevated emotional vulnerability."
            })
        if assessment.academic_pressure >= 4:
            contributing_factors.append({
                "factor": "High Academic Pressure",
                "impact": "High Negative Impact",
                "detail": f"Rating of {assessment.academic_pressure}/5 indicates elevated chronic academic distress."
            })
        if assessment.financial_stress >= 4:
            contributing_factors.append({
                "factor": "Financial Pressure",
                "impact": "Moderate Negative Impact",
                "detail": f"Rating of {assessment.financial_stress}/5 indicates significant non-academic pressure."
            })
        if assessment.social_support == "Low":
            contributing_factors.append({
                "factor": "Low Social Support",
                "impact": "Moderate Negative Impact",
                "detail": "Limited interpersonal support networks can reduce resilience against prolonged stress."
            })
        if assessment.attendance < 75:
            contributing_factors.append({
                "factor": "Attendance Decline",
                "impact": "Behavioral Marker",
                "detail": f"Attendance at {assessment.attendance}% may reflect disengagement or stress-related avoidance."
            })

        if not contributing_factors:
            contributing_factors.append({
                "factor": "Balanced Routine",
                "impact": "Protective Factor",
                "detail": "Responses indicate healthy sleep patterns, manageable stress levels, and positive social engagement."
            })

        return {
            "prediction_code": raw_pred,
            "prediction_label": prediction_label,
            "probability": round(risk_prob, 4),
            "risk_level": risk_level,
            "model_version": self.model_version,
            "model_type": self.model_type,
            "feature_importance_snapshot": {
                "contributing_factors": contributing_factors,
                "input_summary": {
                    "sleep": assessment.sleep_duration,
                    "academic_pressure": assessment.academic_pressure,
                    "financial_stress": assessment.financial_stress,
                    "social_support": assessment.social_support
                }
            }
        }

prediction_service = PredictionService()
