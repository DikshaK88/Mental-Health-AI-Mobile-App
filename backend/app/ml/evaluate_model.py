import os
import json
import logging
from backend.app.core.config import settings

logger = logging.getLogger("ml_evaluation")

def get_latest_evaluation() -> dict:
    """Reads the saved evaluation report artifact."""
    eval_path = os.path.join(settings.MODEL_DIR, "evaluation_report.json")
    if not os.path.exists(eval_path):
        from backend.app.ml.train_model import train_and_evaluate
        logger.info("Evaluation report not found. Triggering training pipeline...")
        return train_and_evaluate()
    
    with open(eval_path, "r", encoding="utf-8") as f:
        return json.load(f)

if __name__ == "__main__":
    report = get_latest_evaluation()
    print(f"Best Model: {report.get('best_model_name')}")
    print(f"Accuracy: {report.get('best_metrics', {}).get('accuracy')}")
    print(f"Macro F1: {report.get('best_metrics', {}).get('f1_macro')}")
