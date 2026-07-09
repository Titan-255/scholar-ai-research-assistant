from typing import Optional
from pydantic import BaseModel, Field

class SettingsResponse(BaseModel):
    theme: str
    language: str
    notification_enabled: bool
    timezone: str
    storage_provider: str = "LOCAL"

    model_config = {"from_attributes": True}

class SettingsUpdate(BaseModel):
    theme: Optional[str] = Field(None, description="Theme option: light or dark")
    language: Optional[str] = Field(None, description="Active interface localization language")
    notification_enabled: Optional[bool] = Field(None, description="Enable notifications")
    timezone: Optional[str] = Field(None, description="Timezone representation")
