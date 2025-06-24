# import os

# MODEL_CONFIG = {
#     'num_labels': 1,  # Changed to 1 since the saved model has 1 output
#     'huggingface_model_name': 'epsilon2op/senti-analysis-flask-model',  # Replace with your actual model name
#     'threshold': 0.5,  # Threshold for binary classification
#     # SECURITY: Use environment variable for API token - see .env.example
    
#     # Local model configuration for development
#     'local_model_path': r'C:\Users\yashg\Downloads\email_fraud_detector',
#     'use_local_model': os.getenv('USE_LOCAL_MODEL', 'true').lower() == 'true',  # Default to local for development
#     'local_tokenizer_name': 'distilbert-base-uncased'  # Fallback tokenizer for local model
# }



import os

MODEL_CONFIG = {
    'num_labels': 1,
    # Use environment variable for model path with fallback
    'model_path': os.getenv('LOCAL_MODEL_PATH', './models/pytorch_model.bin'),
    'threshold': 0.5,
    'huggingface_model_name': 'epsilon2op/senti-analysis-flask-model',
    # SECURITY FIX: Use environment variable for API token
    'use_auth_token': os.getenv('HUGGINGFACE_API_TOKEN'),
    # Use environment variable for local model path with fallback
    'local_model_path': os.getenv('LOCAL_MODEL_PATH', './models'),
    'use_local_model': not (os.getenv('RENDER') or os.getenv('RAILWAY_ENVIRONMENT')),
    'local_tokenizer_name': 'distilbert-base-uncased'
}