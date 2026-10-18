import argparse
import sys
from datetime import datetime, timezone
from backend.app.db.database import init_db, SessionLocal
from backend.app.db.models import User, AuditLog
from backend.app.core.security import get_password_hash
from backend.app.ml.train_model import train_and_evaluate
from backend.app.core.config import settings

def main():
    parser = argparse.ArgumentParser(description="AI Mental Health System CLI Management Tool")
    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # Command: init-db
    subparsers.add_parser("init-db", help="Initialize database schema and bootstrap default admin")

    # Command: create-admin
    admin_parser = subparsers.add_parser("create-admin", help="Create or promote an administrator account")
    admin_parser.add_argument("--email", required=True, help="Admin email address")
    admin_parser.add_argument("--password", required=True, help="Admin secure password (min 8 chars)")
    admin_parser.add_argument("--name", default="System Administrator", help="Admin full name")

    # Command: train-model
    subparsers.add_parser("train-model", help="Train and compare Random Forest & XGBoost ML pipelines")

    args = parser.parse_args()

    if args.command == "init-db":
        print("Initializing database tables...")
        init_db()
        print("Database initialized successfully.")
    
    elif args.command == "create-admin":
        if len(args.password) < 8:
            print("Error: Password must be at least 8 characters long.", file=sys.stderr)
            sys.exit(1)
        
        init_db()
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.email == args.email.lower()).first()
            if user:
                user.role = "ADMIN"
                user.hashed_password = get_password_hash(args.password)
                user.full_name = args.name
                user.is_active = True
                user.updated_at = datetime.now(timezone.utc)
                print(f"Updated existing user '{args.email}' to ADMIN.")
            else:
                user = User(
                    email=args.email.lower(),
                    hashed_password=get_password_hash(args.password),
                    full_name=args.name,
                    role="ADMIN",
                    is_active=True
                )
                db.add(user)
                print(f"Created new ADMIN user '{args.email}'.")

            log = AuditLog(
                user_id=user.id if user.id else None,
                event_type="ADMIN_CREATED_CLI",
                description=f"Admin account created or updated via CLI: {args.email}"
            )
            db.add(log)
            db.commit()
            print("Admin credentials persisted securely.")
        finally:
            db.close()

    elif args.command == "train-model":
        print("Executing reproducible ML training and evaluation pipeline...")
        results = train_and_evaluate(save_artifacts=True)
        print(f"Training completed successfully!")
        print(f"Best Model Selected: {results.get('best_model_name')}")
        print(f"Accuracy: {results.get('best_metrics', {}).get('accuracy'):.4f}")
        print(f"Macro F1-Score: {results.get('best_metrics', {}).get('f1_macro'):.4f}")
        print(f"Saved artifacts under: {settings.MODEL_DIR}")

    else:
        parser.print_help()

if __name__ == "__main__":
    main()
