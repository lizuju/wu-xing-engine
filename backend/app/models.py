from enum import StrEnum

from pydantic import BaseModel


class InputMode(StrEnum):
    VOICE = "voice"
    FACE = "face"
    QUIZ = "quiz"


class MoodResult(BaseModel):
    id: str
    mode: InputMode
    moodKey: str
    title: str
    subtitle: str
    description: str
    wuxing: str
    radar: dict[str, int]
    mascotId: str
    tips: list[str]


class QuizOption(BaseModel):
    id: str
    name: str
    caption: str
    wuxing: str
    accent: str
    assetKey: str


class QuizSubmission(BaseModel):
    optionId: str
