import os
import json
import logging
from datetime import datetime, timezone
import numpy as np
import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    classification_report
)

try:
    from xgboost import XGBClassifier
    HAS_XGBOOST = True
except ImportError:
    HAS_XGBOOST = False

from backend.app.core.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ml_pipeline")

NUMERICAL_FEATURES = [
    "age",
    "academic_pressure",
    "study_satisfaction",
    "study_hours",
    "financial_stress",
    "attendance"
]

CATEGORICAL_FEATURES = [
    "gender",
    "sleep_duration",
    "social_support",
    "family_history"
]

TARGET_COLUMN = "depression"

def build_preprocessor() -> ColumnTransformer:
    """Builds a scikit-learn ColumnTransformer for numerical and categorical preprocessing."""
    num_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler())
    ])

    cat_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("encoder", OneHotEncoder(handle_unknown="ignore", sparse_output=False))
    ])

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", num_pipeline, NUMERICAL_FEATURES),
            ("cat", cat_pipeline, CATEGORICAL_FEATURES)
        ]
    )
    return preprocessor

def evaluate_predictions(y_true, y_pred, y_prob=None) -> dict:
    """Computes comprehensive evaluation metrics."""
    cm = confusion_matrix(y_true, y_pred).tolist()
    report = classification_report(y_true, y_pred, output_dict=True, zero_division=0)
    
    metrics = {
        "accuracy": float(accuracy_score(y_true, y_pred)),
        "precision_macro": float(precision_score(y_true, y_pred, average="macro", zero_division=0)),
        "recall_macro": float(recall_score(y_true, y_pred, average="macro", zero_division=0)),
        "f1_macro": float(f1_score(y_true, y_pred, average="macro", zero_division=0)),
        "precision_class_1": float(precision_score(y_true, y_pred, pos_label=1, zero_division=0)),
        "recall_class_1": float(recall_score(y_true, y_pred, pos_label=1, zero_division=0)),
        "f1_class_1": float(f1_score(y_true, y_pred, pos_label=1, zero_division=0)),
        "confusion_matrix": cm,
        "classification_report": report
    }
    
    if y_prob is not None:
        try:
            metrics["roc_auc"] = float(roc_auc_score(y_true, y_prob))
        except Exception:
            metrics["roc_auc"] = None
    else:
        metrics["roc_auc"] = None

    return metrics

def train_and_evaluate(dataset_path: str = None, save_artifacts: bool = True) -> dict:
    """
    Complete ML training and evaluation pipeline.
    Loads dataset, preprocesses without leakage, trains RF and XGBoost,
    evaluates, compares, and saves artifacts.
    """
    if not dataset_path:
        dataset_path = os.path.join(settings.DATA_DIR, settings.DATASET_FILENAME)

    if not os.path.exists(dataset_path):
        raise FileNotFoundError(f"Dataset not found at {dataset_path}")

    logger.info(f"Loading dataset from: {dataset_path}")
    df = pd.read_csv(dataset_path)

    # Validate required columns
    required_cols = NUMERICAL_FEATURES + CATEGORICAL_FEATURES + [TARGET_COLUMN]
    for col in required_cols:
        if col not in df.columns:
            raise ValueError(f"Required column '{col}' is missing from the dataset.")

    X = df[NUMERICAL_FEATURES + CATEGORICAL_FEATURES].copy()
    y = df[TARGET_COLUMN].copy()

    # Stratified Train/Test Split (80/20)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    logger.info(f"Training samples: {len(X_train)}, Testing samples: {len(X_test)}")
    logger.info(f"Class distribution in test set:\n{y_test.value_counts().to_dict()}")

    # 1. Random Forest Pipeline
    preprocessor_rf = build_preprocessor()
    rf_classifier = RandomForestClassifier(
        n_estimators=100,
        max_depth=6,
        min_samples_split=4,
        random_state=42,
        class_weight="balanced"
    )
    rf_pipeline = Pipeline([
        ("preprocessor", preprocessor_rf),
        ("classifier", rf_classifier)
    ])

    rf_pipeline.fit(X_train, y_train)
    rf_preds = rf_pipeline.predict(X_test)
    rf_probs = rf_pipeline.predict_proba(X_test)[:, 1]
    rf_metrics = evaluate_predictions(y_test, rf_preds, rf_probs)
    rf_metrics["model_name"] = "Random Forest"
    logger.info(f"Random Forest - Accuracy: {rf_metrics['accuracy']:.4f}, Macro F1: {rf_metrics['f1_macro']:.4f}")

    # 2. XGBoost Pipeline
    xgb_metrics = None
    xgb_pipeline = None
    if HAS_XGBOOST:
        try:
            preprocessor_xgb = build_preprocessor()
            xgb_classifier = XGBClassifier(
                n_estimators=80,
                max_depth=4,
                learning_rate=0.08,
                random_state=42,
                eval_metric="logloss"
            )
            xgb_pipeline = Pipeline([
                ("preprocessor", preprocessor_xgb),
                ("classifier", xgb_classifier)
            ])
            xgb_pipeline.fit(X_train, y_train)
            xgb_preds = xgb_pipeline.predict(X_test)
            xgb_probs = xgb_pipeline.predict_proba(X_test)[:, 1]
            xgb_metrics = evaluate_predictions(y_test, xgb_preds, xgb_probs)
            xgb_metrics["model_name"] = "XGBoost"
            logger.info(f"XGBoost - Accuracy: {xgb_metrics['accuracy']:.4f}, Macro F1: {xgb_metrics['f1_macro']:.4f}")
        except Exception as e:
            logger.warning(f"XGBoost training encountered an issue: {e}")

    # Model comparison based on macro F1
    best_pipeline = rf_pipeline
    best_model_name = "Random Forest"
    best_metrics = rf_metrics

    if xgb_metrics and xgb_metrics["f1_macro"] > rf_metrics["f1_macro"]:
        best_pipeline = xgb_pipeline
        best_model_name = "XGBoost"
        best_metrics = xgb_metrics

    # Extract feature importances
    feature_importances = {}
    try:
        classifier = best_pipeline.named_steps["classifier"]
        preprocessor = best_pipeline.named_steps["preprocessor"]
        cat_encoder = preprocessor.named_transformers_["cat"].named_steps["encoder"]
        cat_feature_names = list(cat_encoder.get_feature_names_out(CATEGORICAL_FEATURES))
        all_feature_names = NUMERICAL_FEATURES + cat_feature_names
        
        importances = classifier.feature_importances_
        for name, imp in zip(all_feature_names, importances):
            feature_importances[name] = float(imp)
        # Sort descending
        feature_importances = dict(sorted(feature_importances.items(), key=lambda item: item[1], reverse=True))
    except Exception as ex:
        logger.warning(f"Could not extract feature importances: {ex}")

    results = {
        "model_version": settings.MODEL_VERSION,
        "best_model_name": best_model_name,
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "training_samples_count": len(X_train),
        "test_samples_count": len(X_test),
        "total_dataset_records": len(df),
        "random_forest": rf_metrics,
        "xgboost": xgb_metrics,
        "best_metrics": best_metrics,
        "feature_importances": feature_importances,
        "features": {
            "numerical": NUMERICAL_FEATURES,
            "categorical": CATEGORICAL_FEATURES,
            "target": TARGET_COLUMN
        }
    }

    if save_artifacts:
        os.makedirs(settings.MODEL_DIR, exist_ok=True)
        # Save best model
        best_model_path = os.path.join(settings.MODEL_DIR, "best_model.joblib")
        joblib.dump(best_pipeline, best_model_path)
        logger.info(f"Saved best model ({best_model_name}) to: {best_model_path}")

        # Save individual models
        joblib.dump(rf_pipeline, os.path.join(settings.MODEL_DIR, "rf_model.joblib"))
        if xgb_pipeline:
            joblib.dump(xgb_pipeline, os.path.join(settings.MODEL_DIR, "xgb_model.joblib"))

        # Save metrics & evaluation report
        eval_path = os.path.join(settings.MODEL_DIR, "evaluation_report.json")
        with open(eval_path, "w", encoding="utf-8") as f:
            json.dump(results, f, indent=2)
        logger.info(f"Saved evaluation report to: {eval_path}")

        # Persist to database if models table is available
        try:
            from backend.app.db.database import SessionLocal, init_db
            from backend.app.db.models import ModelMetric
            init_db()
            db = SessionLocal()
            
            # Deactivate previous active models
            db.query(ModelMetric).filter(ModelMetric.is_active == True).update({"is_active": False})
            
            # Add RF metrics
            rf_record = ModelMetric(
                model_name="Random Forest",
                model_version=settings.MODEL_VERSION,
                accuracy=rf_metrics["accuracy"],
                precision_score=rf_metrics["precision_macro"],
                recall_score=rf_metrics["recall_macro"],
                f1_macro=rf_metrics["f1_macro"],
                roc_auc=rf_metrics["roc_auc"],
                confusion_matrix=rf_metrics["confusion_matrix"],
                class_report=rf_metrics["classification_report"],
                is_active=(best_model_name == "Random Forest"),
                training_samples_count=len(X_train),
                parameters={"n_estimators": 100, "max_depth": 6}
            )
            db.add(rf_record)

            if xgb_metrics:
                xgb_record = ModelMetric(
                    model_name="XGBoost",
                    model_version=settings.MODEL_VERSION,
                    accuracy=xgb_metrics["accuracy"],
                    precision_score=xgb_metrics["precision_macro"],
                    recall_score=xgb_metrics["recall_macro"],
                    f1_macro=xgb_metrics["f1_macro"],
                    roc_auc=xgb_metrics["roc_auc"],
                    confusion_matrix=xgb_metrics["confusion_matrix"],
                    class_report=xgb_metrics["classification_report"],
                    is_active=(best_model_name == "XGBoost"),
                    training_samples_count=len(X_train),
                    parameters={"n_estimators": 80, "max_depth": 4}
                )
                db.add(xgb_record)
            
            db.commit()
            db.close()
            logger.info("Persisted model metrics to database.")
        except Exception as dbe:
            logger.warning(f"Could not persist metrics to database: {dbe}")

    return results

if __name__ == "__main__":
    train_and_evaluate()
