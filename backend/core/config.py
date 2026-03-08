from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # API Settings
    API_V1_STR: str = "/api"
    PROJECT_NAME: str = "FlowMind"
    
    # AI Rules Engine Thresholds
    RISK_CRITICAL_THRESHOLD: float = 0.90
    RISK_HIGH_THRESHOLD: float = 0.85
    CARRIER_FAIL_THRESHOLD: float = 0.70
    RISK_WARNING_THRESHOLD: float = 0.65
    
    # Path settings
    DATA_DIR: str = "data"
    DB_PATH: str = "data/agent_memory.db"
    MODEL_PATH: str = "data/delay_model.pkl"
    STATE_PATH: str = "data/system_state.json"
    SHIPMENTS_PATH: str = "data/shipments.csv"
    NETWORK_JSON_PATH: str = "data/logistics_network.json"
    
    # DB
    DATABASE_URL: str = "sqlite:///./data/agent_memory.db"

    model_config = SettingsConfigDict(env_file=".env", env_ignore_empty=True, extra="ignore")

settings = Settings()
